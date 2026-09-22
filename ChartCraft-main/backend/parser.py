"""
NLP prompt parser: extract 16+ chart types, x-axis, y-axis, series grouping, aggregation, and filters.
"""
import re
from typing import List, Optional, Tuple, Dict, Any
from models.schemas import PromptIntent


# Keywords mapping to Power BI chart types
CHART_KEYWORDS = {
    "column": ["column", "columns", "vertical bar", "vertical bars"],
    "bar": ["bar", "bars", "horizontal bar", "horizontal bars", "ranking", "rank"],
    "stacked_column": ["stacked column", "stacked columns", "stacked vertical"],
    "stacked_bar": ["stacked bar", "stacked bars", "stacked horizontal"],
    "line": ["line", "trend", "trends", "over time", "timeseries", "time series", "progression", "growth"],
    "area": ["area", "filled line", "shaded area"],
    "stacked_area": ["stacked area", "cumulative area"],
    "pie": ["pie", "share", "percentage", "portion", "breakdown", "composition"],
    "donut": ["donut", "doughnut", "ring", "ring chart"],
    "scatter": ["scatter", "correlation", "relationship", "vs", "versus", "against"],
    "bubble": ["bubble", "3d scatter", "bubble size"],
    "radar": ["radar", "spider", "web chart", "skill polygon"],
    "polarArea": ["polar", "polar area", "rose chart", "coxcomb"],
    "treemap": ["treemap", "tree map", "hierarchical", "tiles", "nested rectangles"],
    "heatmap": ["heatmap", "heat map", "intensity matrix", "density map", "matrix"],
    "waterfall": ["waterfall", "bridge", "variance", "net increase", "net change"],
    "funnel": ["funnel", "pipeline", "conversion", "stages", "drop-off"],
    "gauge": ["gauge", "speedometer", "dial", "target meter", "completion rate"],
    "boxplot": ["box plot", "boxplot", "quartile", "distribution spread", "whiskers"],
    "kpi": ["kpi", "card", "metric card", "headline", "single number", "summary stat"],
}

# Aggregation keywords
AGG_KEYWORDS = {
    "sum": ["sum", "total", "totals", "revenue", "aggregate", "combined"],
    "avg": ["average", "avg", "mean", "mean of", "per cap"],
    "count": ["count", "number of", "how many", "frequency", "occurrences", "volume of"],
    "min": ["minimum", "min", "lowest", "bottom"],
    "max": ["maximum", "max", "highest", "peak", "top"],
}


def _normalize(s: str) -> str:
    return (s or "").strip().lower()


def parse_prompt(
    prompt: str,
    column_names: List[str],
    numeric_columns: Optional[List[str]] = None,
    categorical_columns: Optional[List[str]] = None,
) -> PromptIntent:
    """
    Parse user prompt and return structured intent for 16+ chart types.
    """
    text = _normalize(prompt)
    intent = PromptIntent(chart="bar", x=None, y=None, series=None, aggregation=None)
    numeric_set = set(numeric_columns or [])
    cat_set = set(categorical_columns or [c for c in column_names if c not in numeric_set])

    # 1. Chart type detection
    detected_chart = None
    for chart_type, keywords in CHART_KEYWORDS.items():
        if any(re.search(r"\b" + re.escape(kw) + r"\b", text) for kw in keywords):
            detected_chart = chart_type
            break
    
    if detected_chart:
        intent.chart = detected_chart

    # 2. Aggregation detection
    for agg, keywords in AGG_KEYWORDS.items():
        if any(re.search(r"\b" + re.escape(kw) + r"\b", text) for kw in keywords):
            intent.aggregation = agg
            break

    # 3. Detect column mentions
    mentioned = []
    lower_col_map = {c.lower(): c for c in column_names}
    
    # Sort columns by length descending to match longer names first
    sorted_cols = sorted(column_names, key=lambda c: len(c), reverse=True)
    for col in sorted_cols:
        col_l = col.lower()
        if re.search(r"\b" + re.escape(col_l) + r"\b", text):
            if col not in mentioned:
                mentioned.append(col)

    # 4. Map columns to x, y, and series
    if mentioned:
        # Separate mentioned into categorical and numeric
        cats = [c for c in mentioned if c in cat_set]
        nums = [c for c in mentioned if c in numeric_set]

        if intent.chart in ("pie", "donut", "polarArea", "funnel", "treemap"):
            intent.x = cats[0] if cats else mentioned[0]
            intent.y = nums[0] if nums else (mentioned[1] if len(mentioned) > 1 else intent.x)
            if not intent.aggregation and (not nums or intent.x == intent.y):
                intent.aggregation = "count"
        elif intent.chart in ("scatter", "bubble"):
            if len(nums) >= 2:
                intent.x = nums[0]
                intent.y = nums[1]
            elif len(mentioned) >= 2:
                intent.x = mentioned[0]
                intent.y = mentioned[1]
            if len(cats) >= 1:
                intent.series = cats[0]
        elif intent.chart in ("stacked_bar", "stacked_column", "stacked_area"):
            if cats:
                intent.x = cats[0]
                if len(cats) > 1:
                    intent.series = cats[1]
            if nums:
                intent.y = nums[0]
        elif intent.chart in ("gauge", "kpi"):
            intent.y = nums[0] if nums else (mentioned[0] if mentioned else None)
            if not intent.aggregation:
                intent.aggregation = "avg" if "rate" in text or "average" in text else "sum"
        else:
            # Bar / Line / Area
            if cats and nums:
                intent.x = cats[0]
                intent.y = nums[0]
                if len(cats) > 1:
                    intent.series = cats[1]
            elif nums and len(nums) >= 2:
                intent.x = nums[0]
                intent.y = nums[1]
            elif cats and len(cats) >= 1:
                intent.x = cats[0]
                intent.y = cats[0]
                intent.aggregation = "count"
            else:
                intent.x = mentioned[0]
                if len(mentioned) > 1:
                    intent.y = mentioned[1]

    # 5. Smart Fallbacks if not detected
    if not intent.x:
        if cat_set:
            intent.x = list(cat_set)[0]
        elif column_names:
            intent.x = column_names[0]

    if not intent.y:
        if numeric_set:
            # Pick a numeric column different from x
            remaining_nums = [c for c in numeric_set if c != intent.x]
            intent.y = remaining_nums[0] if remaining_nums else list(numeric_set)[0]
            if not intent.aggregation:
                intent.aggregation = "avg" if intent.chart in ("line", "area") else "sum"
        else:
            intent.y = intent.x
            intent.aggregation = "count"

    # Default aggregation for categorical + numeric
    if not intent.aggregation:
        if intent.y in numeric_set:
            intent.aggregation = "sum" if any(w in text for w in ["total", "sum", "sales", "revenue"]) else "avg"
        else:
            intent.aggregation = "count"

    # 6. Title extraction
    title_match = re.search(r"^(.*?)(?:\.|$)", prompt.strip())
    if title_match:
        intent.title = title_match.group(1).strip()[:80]
    else:
        intent.title = f"{intent.chart.replace('_', ' ').title()}: {intent.y} by {intent.x}"

    return intent


def suggest_chart_type(column_names: List[str], numeric_count: int, categorical_count: int) -> str:
    """Auto-suggest modern chart type when prompt is vague."""
    if numeric_count >= 2 and categorical_count == 0:
        return "scatter"
    if categorical_count >= 1 and numeric_count >= 1:
        return "column"
    if categorical_count >= 1 and numeric_count == 0:
        return "donut"
    return "bar"
