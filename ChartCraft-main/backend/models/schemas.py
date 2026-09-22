"""
Pydantic schemas for ChartCraft API request/response.
"""
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class SchemaColumn(BaseModel):
    """Detected column metadata."""
    name: str
    dtype: str  # 'numeric', 'datetime', 'category'
    sample: Optional[str] = None
    unique_count: Optional[int] = None
    min: Optional[Union[float, int, str]] = None
    max: Optional[Union[float, int, str]] = None
    mean: Optional[float] = None


class DatasetSchema(BaseModel):
    """Detected dataset schema."""
    columns: List[SchemaColumn]
    row_count: int
    session_id: Optional[str] = None
    dataset_name: Optional[str] = None
    preview_rows: Optional[List[Dict[str, Any]]] = None


class ColumnStats(BaseModel):
    name: str
    dtype: str
    non_null_count: int
    null_count: int
    unique_count: int
    min: Optional[Union[float, int, str]] = None
    max: Optional[Union[float, int, str]] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    top_values: Optional[List[Dict[str, Any]]] = None


class DatasetSummary(BaseModel):
    session_id: str
    row_count: int
    column_count: int
    columns: List[ColumnStats]
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    correlations: Optional[Dict[str, Dict[str, float]]] = None
    kpi_highlights: Optional[Dict[str, Any]] = None


class PromptIntent(BaseModel):
    """Parsed intent from user prompt."""
    chart: str = Field(..., description="Chart type: bar, column, line, area, pie, donut, scatter, bubble, radar, polarArea, treemap, heatmap, waterfall, funnel, gauge, boxplot")
    x: Optional[str] = None
    y: Optional[str] = None
    series: Optional[str] = None  # Grouping or legend series
    aggregation: Optional[str] = None  # sum, avg, count, min, max
    filters: Optional[Dict[str, Any]] = None
    title: Optional[str] = None
    color_palette: Optional[str] = "powerbi"


class GenerateRequest(BaseModel):
    """Request body for /generate."""
    prompt: str
    session_id: Optional[str] = None
    use_plotly: bool = False


class VisualCodeBundle(BaseModel):
    """Complete code implementations across languages."""
    python_matplotlib: str
    python_plotly: str
    python_seaborn: str
    javascript_chartjs: str
    sql_pandas: str


class GenerateResponse(BaseModel):
    """Response with visualization, code bundle, and explanation."""
    image_base64: str
    code: str  # default Python code
    code_bundle: Optional[VisualCodeBundle] = None
    explanation: str
    intent: Optional[PromptIntent] = None
    error: Optional[str] = None
    chart_data: Optional[Dict[str, Any]] = None


class CopilotChatRequest(BaseModel):
    session_id: str
    message: str
    active_filters: Optional[Dict[str, Any]] = None


class CopilotChatResponse(BaseModel):
    reply: str
    key_findings: List[str]
    suggested_intent: Optional[PromptIntent] = None
    chart_data: Optional[Dict[str, Any]] = None
    image_base64: Optional[str] = None
    code_bundle: Optional[VisualCodeBundle] = None
    follow_up_suggestions: List[str]
    recommended_visuals: Optional[List[Dict[str, Any]]] = None
    is_dashboard_recommendation: Optional[bool] = False
