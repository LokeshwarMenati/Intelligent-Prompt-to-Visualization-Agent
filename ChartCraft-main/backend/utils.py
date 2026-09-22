"""
Utility functions: file parsing, column type detection, statistical profiling, and validation.
"""
import io
import re
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import pandas as pd


def parse_uploaded_file(content: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV, XLSX, or JSON into a clean DataFrame."""
    name = filename.lower()
    if name.endswith(".csv"):
        return pd.read_csv(io.BytesIO(content))
    if name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(io.BytesIO(content))
    if name.endswith(".json"):
        return pd.read_json(io.BytesIO(content))
    return pd.read_csv(io.BytesIO(content))


def detect_column_type(series: pd.Series) -> str:
    """Classify column as numeric, datetime, or category."""
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    # Check if string parses cleanly as date
    if series.dtype == 'object':
        sample_non_null = series.dropna().head(10)
        if len(sample_non_null) > 0 and all(is_likely_date(str(x)) for x in sample_non_null):
            return "datetime"
    return "category"


def is_likely_date(val: str) -> bool:
    """Heuristic check for common date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)."""
    val = val.strip()
    return bool(re.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}$", val) or re.match(r"^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$", val))


def get_schema(df: pd.DataFrame) -> dict:
    """Return schema: columns with names, dtypes, sample values, and basic metrics."""
    columns = []
    for col in df.columns:
        dtype = detect_column_type(df[col])
        clean_s = df[col].dropna()
        sample = str(clean_s.iloc[0]) if len(clean_s) > 0 else None
        
        col_info: Dict[str, Any] = {
            "name": str(col),
            "dtype": dtype,
            "sample": sample,
            "unique_count": int(df[col].nunique()),
        }
        if dtype == "numeric":
            col_info["min"] = float(clean_s.min()) if len(clean_s) > 0 else None
            col_info["max"] = float(clean_s.max()) if len(clean_s) > 0 else None
            col_info["mean"] = round(float(clean_s.mean()), 2) if len(clean_s) > 0 else None
        columns.append(col_info)
    
    # Generate preview rows (first 15 rows)
    preview = df.head(15).replace({np.nan: None}).to_dict(orient="records")
    return {
        "columns": columns,
        "row_count": len(df),
        "preview_rows": preview
    }


def get_detailed_summary(df: pd.DataFrame, session_id: str) -> dict:
    """Calculate deep descriptive statistics and correlation matrix for Power BI Data View."""
    columns_stats = []
    numeric_cols = []
    cat_cols = []
    dt_cols = []

    for col in df.columns:
        dtype = detect_column_type(df[col])
        s = df[col]
        clean_s = s.dropna()
        null_count = int(s.isna().sum())
        non_null_count = int(len(clean_s))
        unique_cnt = int(s.nunique())

        stat: Dict[str, Any] = {
            "name": str(col),
            "dtype": dtype,
            "null_count": null_count,
            "non_null_count": non_null_count,
            "unique_count": unique_cnt,
        }

        if dtype == "numeric":
            numeric_cols.append(str(col))
            if len(clean_s) > 0:
                stat["min"] = round(float(clean_s.min()), 2)
                stat["max"] = round(float(clean_s.max()), 2)
                stat["mean"] = round(float(clean_s.mean()), 2)
                stat["median"] = round(float(clean_s.median()), 2)
                stat["std"] = round(float(clean_s.std()), 2) if len(clean_s) > 1 else 0.0
        elif dtype == "category":
            cat_cols.append(str(col))
            # Top 5 most frequent values
            top_vc = clean_s.value_counts().head(5).to_dict()
            stat["top_values"] = [{"value": str(k), "count": int(v)} for k, v in top_vc.items()]
        else:
            dt_cols.append(str(col))

        columns_stats.append(stat)

    # Compute correlation matrix for numeric columns (if at least 2)
    correlations = {}
    if len(numeric_cols) >= 2:
        try:
            corr_df = df[numeric_cols].corr().fillna(0).round(2)
            correlations = corr_df.to_dict()
        except Exception:
            correlations = {}

    # Calculate headline KPIs for dashboard
    kpis = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
    }
    if numeric_cols:
        primary_num = numeric_cols[0]
        kpis["primary_metric"] = primary_num
        kpis["primary_sum"] = round(float(df[primary_num].sum()), 2)
        kpis["primary_avg"] = round(float(df[primary_num].mean()), 2)
        kpis["primary_max"] = round(float(df[primary_num].max()), 2)

    return {
        "session_id": session_id,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns_stats,
        "numeric_columns": numeric_cols,
        "categorical_columns": cat_cols,
        "datetime_columns": dt_cols,
        "correlations": correlations,
        "kpi_highlights": kpis,
    }


def find_closest_columns(user_input: str, column_names: List[str]) -> List[str]:
    """Suggest closest column names when user prompt doesn't match exactly."""
    user_lower = user_input.lower().strip()
    if not column_names:
        return []
    scored = []
    for c in column_names:
        c_lower = c.lower()
        score = 0
        if user_lower in c_lower or c_lower in user_lower:
            score += 2
        for word in re.split(r"\W+", user_lower):
            if word and word in c_lower:
                score += 1
        scored.append((score, c))
    scored.sort(key=lambda x: -x[0])
    return [c for _, c in scored if _ > 0][:5]


def validate_columns(
    intent_x: Optional[str],
    intent_y: Optional[str],
    df_columns: List[str],
) -> Tuple[bool, Optional[str], List[str]]:
    """Validate that intent x/y exist in dataframe. Return (ok, error_message, suggestions)."""
    missing = []
    suggestions = {}
    cols = [c for c in df_columns]
    if intent_x and intent_x not in cols:
        missing.append(intent_x)
        suggestions[intent_x] = find_closest_columns(intent_x, cols)
    if intent_y and intent_y not in cols:
        missing.append(intent_y)
        suggestions[intent_y] = find_closest_columns(intent_y, cols)
    if not missing:
        return True, None, []
    msg = f"Column(s) not found: {', '.join(missing)}."
    if any(suggestions.values()):
        msg += " Did you mean: " + ", ".join(
            f"{k} -> {v[0]}" for k, v in suggestions.items() if v
        )
    return False, msg, []
