"""
ChartCraft - Enterprise Power BI Analytics Backend (FastAPI).

Endpoints:
  POST /upload   - Upload dataset (CSV, XLSX, JSON), returns schema + session_id + preview
  GET  /summary  - Detailed descriptive statistics, correlations & KPIs
  POST /generate - Natural language prompt -> visualization + multi-language code + explanation
  POST /copilot  - Interactive conversational analytics assistant with insights + live visual + code
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pandas.api.types import is_numeric_dtype
import pandas as pd
import numpy as np

from models.schemas import (
    DatasetSchema,
    SchemaColumn,
    PromptIntent,
    GenerateResponse,
    DatasetSummary,
    VisualCodeBundle,
    CopilotChatRequest,
    CopilotChatResponse,
)
from utils import (
    parse_uploaded_file,
    get_schema,
    validate_columns,
    get_detailed_summary,
    detect_column_type,
)
from parser import parse_prompt, suggest_chart_type
from chart_engine import (
    generate_matplotlib_figure,
    generate_plotly_figure,
    figure_to_base64,
    extract_chart_data,
)
from code_generator import generate_code_bundle, generate_python_code

app = FastAPI(
    title="Intelligent Prompt-to-Visualization Agent API",
    description="Transforms natural language prompts and uploaded datasets into accurate visualizations and multi-language reproducible code.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25MB
SESSION_TTL = timedelta(hours=6)

# Session store: session_id -> (DataFrame, created_at, filename)
datasets: dict[str, tuple[pd.DataFrame, datetime, str]] = {}


def _cleanup_expired_sessions() -> None:
    now = datetime.utcnow()
    expired = [sid for sid, (_, ts, _) in datasets.items() if now - ts > SESSION_TTL]
    for sid in expired:
        try:
            del datasets[sid]
        except KeyError:
            pass


def _get_dataset_for_session(session_id: str) -> pd.DataFrame:
    _cleanup_expired_sessions()
    if not session_id or session_id not in datasets:
        raise HTTPException(
            status_code=400,
            detail="Session not found or expired. Please upload or select a dataset.",
        )
    df, _, _ = datasets[session_id]
    return df


@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Intelligent Prompt-to-Visualization Agent API",
        "version": "2.0.0",
        "endpoints": ["/upload", "/summary", "/generate", "/copilot"],
    }


@app.post("/upload", response_model=DatasetSchema)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload dataset (CSV, XLSX, JSON). Returns schema, preview rows, and session_id."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded file exceeds {MAX_UPLOAD_BYTES // (1024*1024)}MB limit.",
        )
    try:
        filename = file.filename or "dataset.csv"
        df = parse_uploaded_file(content, filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    if df is None or df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="Dataset is empty or has no readable columns.")

    session_id = str(uuid.uuid4())
    datasets[session_id] = (df, datetime.utcnow(), filename)
    schema_dict = get_schema(df)

    return DatasetSchema(
        columns=[SchemaColumn(**c) for c in schema_dict["columns"]],
        row_count=schema_dict["row_count"],
        session_id=session_id,
        dataset_name=filename,
        preview_rows=schema_dict.get("preview_rows", []),
    )


@app.get("/summary", response_model=DatasetSummary)
def get_summary(session_id: str = Query(...)):
    """Get deep statistical profiling, column distributions, correlations, and KPIs."""
    df = _get_dataset_for_session(session_id)
    summary = get_detailed_summary(df, session_id)
    return DatasetSummary(**summary)


@app.post("/generate", response_model=GenerateResponse)
async def generate(
    prompt: str = Form(...),
    session_id: Optional[str] = Form(None),
    use_plotly: bool = Form(False),
):
    """Generate visualization, multi-language code bundle, and explanation from natural language."""
    if not prompt or not prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required.")
    
    df = _get_dataset_for_session(session_id)
    column_names = [str(c) for c in df.columns]
    numeric_cols = [str(c) for c in df.columns if is_numeric_dtype(df[c])]
    cat_cols = [str(c) for c in df.columns if c not in numeric_cols]

    # 1. Parse prompt
    intent = parse_prompt(
        prompt.strip(),
        column_names,
        numeric_columns=numeric_cols,
        categorical_columns=cat_cols
    )

    # 2. Suggest chart if ambiguous
    if not intent.chart or (intent.chart == "bar" and "chart" not in prompt.lower() and "bar" not in prompt.lower()):
        intent.chart = suggest_chart_type(column_names, len(numeric_cols), len(cat_cols))

    # 3. Validate columns
    ok, err_msg, _ = validate_columns(intent.x, intent.y, column_names)
    if not ok:
        bundle = generate_code_bundle(intent, column_names)
        return GenerateResponse(
            image_base64="",
            code=bundle.python_matplotlib,
            code_bundle=bundle,
            explanation=err_msg or "Validation error.",
            intent=intent,
            error=err_msg,
        )

    try:
        # 4. Generate figure
        if use_plotly:
            try:
                img_bytes = generate_plotly_figure(df, intent)
            except Exception:
                img_bytes = generate_matplotlib_figure(df, intent)
        else:
            img_bytes = generate_matplotlib_figure(df, intent)
        image_base64 = figure_to_base64(img_bytes)

        # 5. Extract client-side chart data
        client_data = extract_chart_data(df, intent)

        # 6. Generate multi-language code bundle
        code_bundle = generate_code_bundle(intent, column_names)
        default_code = code_bundle.python_matplotlib

        # 7. Rich analytical explanation
        agg_label = f" with {intent.aggregation.upper()} aggregation" if intent.aggregation else ""
        explanation = (
            f"Crafted a high-clarity **{intent.chart.replace('_', ' ').title()}** visual "
            f"mapping **{intent.x}** on dimension and **{intent.y}** on values{agg_label}."
        )

        return GenerateResponse(
            image_base64=image_base64,
            code=default_code,
            code_bundle=code_bundle,
            explanation=explanation,
            intent=intent,
            chart_data=client_data,
        )
    except Exception as e:
        return GenerateResponse(
            image_base64="",
            code="",
            explanation=f"Error generating visual: {str(e)}",
            intent=intent,
            error=str(e),
        )


@app.post("/copilot", response_model=CopilotChatResponse)
async def copilot_chat(req: CopilotChatRequest):
    """
    Conversational AI Copilot for data analytics.
    Answers queries, highlights key statistical findings, outputs live visual spec, and multi-language code.
    """
    df = _get_dataset_for_session(req.session_id)
    msg = req.message.strip()
    column_names = [str(c) for c in df.columns]
    numeric_cols = [str(c) for c in df.columns if is_numeric_dtype(df[c])]
    cat_cols = [str(c) for c in df.columns if c not in numeric_cols]

    # Parse intent
    intent = parse_prompt(msg, column_names, numeric_cols, cat_cols)
    code_bundle = generate_code_bundle(intent, column_names)
    chart_data = extract_chart_data(df, intent)

    # Compute key statistical findings
    findings = []
    x_col = intent.x or (column_names[0] if column_names else "dimension")
    y_col = intent.y or (column_names[1] if len(column_names) > 1 else x_col)

    try:
        if y_col in df.columns and is_numeric_dtype(df[y_col]):
            total_val = df[y_col].sum()
            avg_val = df[y_col].mean()
            max_val = df[y_col].max()
            min_val = df[y_col].min()

            findings.append(f"Aggregate {intent.aggregation or 'total'} of **{y_col}** stands at **{total_val:,.2f}** (Mean: **{avg_val:,.2f}**).")
            
            if x_col in df.columns and x_col != y_col:
                top_group = df.groupby(x_col)[y_col].sum().sort_values(ascending=False)
                if not top_group.empty:
                    top_name = top_group.index[0]
                    top_score = top_group.iloc[0]
                    share_pct = (top_score / total_val * 100) if total_val != 0 else 0
                    findings.append(f"Top leading performer is **{top_name}** with **{top_score:,.2f}** ({share_pct:.1f}% of overall).")
            
            findings.append(f"Value range spans from **{min_val:,.2f}** up to a maximum peak of **{max_val:,.2f}**.")
        elif x_col in df.columns:
            top_counts = df[x_col].value_counts()
            if not top_counts.empty:
                findings.append(f"Most frequent entity in **{x_col}** is **{top_counts.index[0]}** with **{top_counts.iloc[0]}** occurrences.")
                findings.append(f"Detected **{len(top_counts)}** unique categorical segments across {len(df)} total records.")
    except Exception as e:
        findings.append(f"Analyzed {len(df)} rows across columns {x_col} and {y_col}.")

    # Generate image fallback
    try:
        img_bytes = generate_matplotlib_figure(df, intent)
        img_b64 = figure_to_base64(img_bytes)
    except Exception:
        img_b64 = None

    reply = (
        f"I analyzed your dataset for **\"{msg}\"**. Based on the distribution of **{x_col}** and **{y_col}**, "
        f"I recommend a **{intent.chart.replace('_', ' ').title()}** visual to clearly observe patterns, disparities, and metrics."
    )

    follow_ups = [
        f"Show top 5 {x_col} by {y_col}",
        f"What is the average {y_col} distribution?",
        f"Compare {y_col} as a donut breakdown",
    ]

    return CopilotChatResponse(
        reply=reply,
        key_findings=findings,
        suggested_intent=intent,
        chart_data=chart_data,
        image_base64=img_b64,
        code_bundle=code_bundle,
        follow_up_suggestions=follow_ups,
    )
