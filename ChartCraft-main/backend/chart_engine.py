"""
Visualization engine: generate high-fidelity charts with Matplotlib or Plotly from parsed intent.
Supports 16+ visual types with modern aesthetic styling.
"""
import io
import base64
import numpy as np
from typing import Optional, Dict, Any
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from models.schemas import PromptIntent


PALETTES = {
    "powerbi": ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"],
    "cyber": ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#3B82F6"],
    "emerald": ["#059669", "#10B981", "#34D399", "#6EE7B7", "#047857", "#065F46", "#064E3B", "#A7F3D0"],
    "sunset": ["#F43F5E", "#FB7185", "#FDA4AF", "#F97316", "#FB923C", "#FBBF24", "#FDE047", "#E11D48"],
}


def _aggregate(df: pd.DataFrame, x: str, y: str, agg: Optional[str], series: Optional[str] = None) -> pd.DataFrame:
    """Apply aggregation based on requested dimension and metrics."""
    if not agg or y not in df.columns:
        return df
    agg_map = {"avg": "mean", "sum": "sum", "count": "count", "min": "min", "max": "max"}
    agg_func = agg_map.get(agg, "sum")
    
    if series and series in df.columns and x in df.columns:
        return df.groupby([x, series], as_index=False).agg({y: agg_func})
    elif x in df.columns:
        return df.groupby(x, as_index=False).agg({y: agg_func})
    return df


def extract_chart_data(df: pd.DataFrame, intent: PromptIntent) -> Dict[str, Any]:
    """Extract clean serialized JSON data for client-side Chart.js rendering."""
    x = intent.x or df.columns[0]
    y = intent.y or (df.columns[1] if len(df.columns) > 1 else df.columns[0])
    series = intent.series
    
    try:
        df_plot = _aggregate(df, x, y, intent.aggregation, series)
    except Exception:
        df_plot = df.head(30)

    # Limit categories for clean presentation
    if len(df_plot) > 50 and not series:
        df_plot = df_plot.head(50)

    labels = [str(val) for val in df_plot[x].tolist()]
    values = []
    for v in df_plot[y].tolist():
        try:
            values.append(round(float(v), 2) if not pd.isna(v) else 0.0)
        except (ValueError, TypeError):
            values.append(0.0)

    return {
        "x_label": x,
        "y_label": y,
        "labels": labels,
        "values": values,
        "chart_type": intent.chart,
        "title": intent.title or f"{intent.chart.title()} of {y} by {x}",
        "aggregation": intent.aggregation,
        "series": series
    }


def generate_matplotlib_figure(
    df: pd.DataFrame,
    intent: PromptIntent,
) -> bytes:
    """Generate modern, high-res chart as PNG bytes using Matplotlib."""
    x = intent.x or df.columns[0]
    y = intent.y or (df.columns[1] if len(df.columns) > 1 else df.columns[0])
    chart_type = intent.chart or "column"
    colors = PALETTES.get(intent.color_palette or "powerbi", PALETTES["powerbi"])

    try:
        df_plot = _aggregate(df, x, y, intent.aggregation, intent.series)
    except Exception:
        df_plot = df.copy()

    if x not in df_plot.columns:
        x = df_plot.columns[0]
    if y not in df_plot.columns:
        y = df_plot.columns[-1]

    # Clean styling
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=130)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')

    # Gridlines and spine colors for dark mode
    ax.grid(True, linestyle='--', alpha=0.25, color='#94a3b8')
    for spine in ax.spines.values():
        spine.set_color('#334155')
    ax.tick_params(colors='#cbd5e1', labelsize=9)

    title = (intent.title or f"{chart_type.replace('_', ' ').title()}: {y} by {x}").strip()[:80]
    ax.set_title(title, color='#f8fafc', fontsize=13, fontweight='bold', pad=14)
    ax.set_xlabel(x.title(), color='#94a3b8', fontsize=10, labelpad=8)
    ax.set_ylabel(f"{y.title()} ({intent.aggregation or 'VAL'})", color='#94a3b8', fontsize=10, labelpad=8)

    labels = df_plot[x].astype(str)
    vals = pd.to_numeric(df_plot[y], errors='coerce').fillna(0)

    if chart_type in ("column", "stacked_column"):
        bars = ax.bar(labels, vals, color=colors[0], edgecolor=colors[1], linewidth=1.2, alpha=0.9, width=0.6)
        plt.xticks(rotation=35, ha="right")
    elif chart_type in ("bar", "stacked_bar"):
        bars = ax.barh(labels, vals, color=colors[0], edgecolor=colors[1], linewidth=1.2, alpha=0.9, height=0.6)
        ax.set_ylabel(x.title(), color='#94a3b8')
        ax.set_xlabel(y.title(), color='#94a3b8')
    elif chart_type in ("line", "area", "stacked_area"):
        ax.plot(labels, vals, marker="o", color=colors[0], linewidth=2.5, markersize=5)
        if "area" in chart_type:
            ax.fill_between(range(len(labels)), vals, color=colors[0], alpha=0.25)
        plt.xticks(rotation=35, ha="right")
    elif chart_type in ("pie", "donut"):
        ax.clear()
        wedgeprops = dict(width=0.45, edgecolor='#0f172a', linewidth=2) if chart_type == "donut" else dict(edgecolor='#0f172a', linewidth=2)
        top_plot = df_plot.head(8)
        wedges, texts, autotexts = ax.pie(
            pd.to_numeric(top_plot[y], errors='coerce').fillna(0),
            labels=top_plot[x].astype(str),
            autopct="%1.1f%%",
            startangle=130,
            colors=colors[:len(top_plot)],
            wedgeprops=wedgeprops,
            textprops=dict(color="#f8fafc", fontsize=9)
        )
        for autotext in autotexts:
            autotext.set_color('#ffffff')
            autotext.set_fontweight('bold')
        ax.set_title(title, color='#f8fafc', fontsize=13, fontweight='bold', pad=14)
    elif chart_type in ("scatter", "bubble"):
        ax.scatter(df[x], df[y], alpha=0.7, c=colors[0], edgecolors='#f8fafc', s=60)
    elif chart_type == "boxplot":
        ax.boxplot(vals, patch_artist=True, boxprops=dict(facecolor=colors[0], color='#cbd5e1'), medianprops=dict(color='#f8fafc', linewidth=2))
        ax.set_xticklabels([y.title()])
    else:
        # Default bar
        ax.bar(labels, vals, color=colors[0], alpha=0.85)
        plt.xticks(rotation=35, ha="right")

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def generate_plotly_figure(
    df: pd.DataFrame,
    intent: PromptIntent,
) -> bytes:
    """Generate interactive Plotly chart, exported to static PNG."""
    try:
        import plotly.express as px
        import plotly.io as pio
    except ImportError:
        return generate_matplotlib_figure(df, intent)

    x = intent.x or df.columns[0]
    y = intent.y or (df.columns[1] if len(df.columns) > 1 else df.columns[0])
    df_plot = _aggregate(df, x, y, intent.aggregation, intent.series)
    chart_type = intent.chart or "column"
    title = (intent.title or f"{chart_type.title()}: {y} by {x}").strip()[:80]

    try:
        if chart_type in ("column", "bar"):
            orientation = "h" if chart_type == "bar" else "v"
            fig = px.bar(df_plot, x=y if orientation == "h" else x, y=x if orientation == "h" else y, orientation=orientation, title=title, template="plotly_dark")
        elif chart_type in ("line", "area"):
            fn = px.area if chart_type == "area" else px.line
            fig = fn(df_plot, x=x, y=y, title=title, markers=True, template="plotly_dark")
        elif chart_type in ("pie", "donut"):
            fig = px.pie(df_plot, names=x, values=y, hole=0.4 if chart_type == "donut" else 0.0, title=title, template="plotly_dark")
        elif chart_type in ("scatter", "bubble"):
            fig = px.scatter(df, x=x, y=y, title=title, template="plotly_dark")
        else:
            fig = px.bar(df_plot, x=x, y=y, title=title, template="plotly_dark")

        fig.update_layout(
            paper_bgcolor="#0f172a",
            plot_bgcolor="#1e293b",
            font_color="#f8fafc",
            height=420
        )
        return pio.to_image(fig, format="png", scale=1.5)
    except Exception:
        return generate_matplotlib_figure(df, intent)


def figure_to_base64(img_bytes: bytes) -> str:
    return base64.b64encode(img_bytes).decode("utf-8")
