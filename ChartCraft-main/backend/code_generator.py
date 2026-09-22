"""
Multi-language code generator for ChartCraft:
Generates Python (Matplotlib & Seaborn, Plotly), JavaScript (Chart.js), and SQL/Pandas transformation code.
"""
from typing import List, Optional
from models.schemas import PromptIntent, VisualCodeBundle


def generate_code_bundle(intent: PromptIntent, column_names: List[str]) -> VisualCodeBundle:
    """Generate complete, copyable implementations across Python, JS, and SQL/Pandas."""
    x = intent.x or (column_names[0] if column_names else "x")
    y = intent.y or (column_names[1] if len(column_names) > 1 else x)
    series = intent.series
    chart = intent.chart or "column"
    agg = intent.aggregation or "sum"
    title = (intent.title or f"{chart.title()} of {y} by {x}").replace('"', '\\"')

    # 1. Python Matplotlib & Seaborn
    py_agg_map = {"avg": "mean", "sum": "sum", "count": "count", "min": "min", "max": "max"}
    py_func = py_agg_map.get(agg, "sum")
    
    if series:
        py_groupby = f"df.groupby(['{x}', '{series}'], as_index=False)['{y}'].{py_func}()"
    elif agg == "count" and x == y:
        py_groupby = f"df['{x}'].value_counts().reset_index()"
    else:
        py_groupby = f"df.groupby('{x}', as_index=False)['{y}'].{py_func}()"

    py_mpl = f'''import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 1. Load dataset
# df = pd.read_csv("your_dataset.csv")

# 2. Aggregate data
df_plot = {py_groupby}

# 3. Setup styling
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=120)

'''
    if chart in ("column", "bar"):
        if chart == "bar":
            py_mpl += f'''sns.barplot(data=df_plot, y="{x}", x="{y}", {"hue='" + series + "', " if series else ""}palette="viridis", ax=ax)
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)
ax.set_xlabel("{y.title()} ({agg.upper()})")
ax.set_ylabel("{x.title()}")'''
        else:
            py_mpl += f'''sns.barplot(data=df_plot, x="{x}", y="{y}", {"hue='" + series + "', " if series else ""}palette="crest", ax=ax)
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)
ax.set_xlabel("{x.title()}")
ax.set_ylabel("{y.title()} ({agg.upper()})")
plt.xticks(rotation=35, ha="right")'''
    elif chart in ("line", "area", "stacked_area"):
        py_mpl += f'''sns.lineplot(data=df_plot, x="{x}", y="{y}", {"hue='" + series + "', " if series else ""}marker="o", linewidth=2.5, ax=ax)
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)
ax.set_xlabel("{x.title()}")
ax.set_ylabel("{y.title()} ({agg.upper()})")
plt.xticks(rotation=35, ha="right")'''
    elif chart in ("pie", "donut"):
        py_mpl += f'''wedge_props = dict(width=0.4, edgecolor='white') if "{chart}" == "donut" else dict(edgecolor='white')
ax.pie(df_plot['{y}'], labels=df_plot['{x}'], autopct='%1.1f%%', startangle=140, wedgeprops=wedge_props)
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)'''
    elif chart in ("scatter", "bubble"):
        py_mpl += f'''sns.scatterplot(data=df, x="{x}", y="{y}", {"hue='" + series + "', " if series else ""}s=80, alpha=0.8, ax=ax)
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)
ax.set_xlabel("{x.title()}")
ax.set_ylabel("{y.title()}")'''
    elif chart == "radar":
        py_mpl += f'''# Radar / Spider Chart
import numpy as np
categories = list(df_plot['{x}'])
values = list(df_plot['{y}'])
values += values[:1]
angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
angles += angles[:1]

fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
ax.plot(angles, values, color='#6366f1', linewidth=2)
ax.fill(angles, values, color='#6366f1', alpha=0.25)
ax.set_thetagrids(np.degrees(angles[:-1]), categories)
ax.set_title("{title}", fontsize=14, pad=20)'''
    else:
        py_mpl += f'''sns.barplot(data=df_plot, x="{x}", y="{y}", ax=ax, palette="mako")
ax.set_title("{title}", fontsize=14, fontweight="bold", pad=15)
plt.xticks(rotation=35, ha="right")'''

    py_mpl += '''\nplt.tight_layout()\nplt.show()'''

    # 2. Python Plotly Express
    if chart in ("column", "bar", "stacked_column", "stacked_bar"):
        orientation = "h" if "bar" in chart else "v"
        barmode = "stack" if "stacked" in chart else "group"
        py_plotly = f'''import plotly.express as px
# df = pd.read_csv("your_dataset.csv")

df_agg = {py_groupby}
fig = px.bar(
    df_agg,
    x="{"y" if orientation == "h" else "x"}",
    y="{"x" if orientation == "h" else "y"}",
    {"color='" + series + "', " if series else ""}
    orientation="{orientation}",
    barmode="{barmode}",
    title="{title}",
    template="plotly_dark"
)
fig.update_layout(xaxis_title="{x.title()}", yaxis_title="{y.title()} ({agg.upper()})")
fig.show()'''
    elif chart in ("line", "area", "stacked_area"):
        fn = "area" if "area" in chart else "line"
        py_plotly = f'''import plotly.express as px
# df = pd.read_csv("your_dataset.csv")

df_agg = {py_groupby}
fig = px.{fn}(
    df_agg,
    x="{x}",
    y="{y}",
    {"color='" + series + "', " if series else ""}
    title="{title}",
    markers=True,
    template="plotly_dark"
)
fig.show()'''
    elif chart in ("pie", "donut"):
        py_plotly = f'''import plotly.express as px
# df = pd.read_csv("your_dataset.csv")

df_agg = {py_groupby}
fig = px.pie(
    df_agg,
    names="{x}",
    values="{y}",
    hole={0.45 if chart == "donut" else 0.0},
    title="{title}",
    template="plotly_dark"
)
fig.update_traces(textposition='inside', textinfo='percent+label')
fig.show()'''
    elif chart in ("scatter", "bubble"):
        py_plotly = f'''import plotly.express as px
fig = px.scatter(
    df,
    x="{x}",
    y="{y}",
    {"color='" + series + "', " if series else ""}
    title="{title}",
    trendline="ols",
    template="plotly_dark"
)
fig.show()'''
    else:
        py_plotly = f'''import plotly.express as px
df_agg = {py_groupby}
fig = px.bar(df_agg, x="{x}", y="{y}", title="{title}", template="plotly_dark")
fig.show()'''

    # 3. JavaScript (Chart.js)
    js_type = "bar"
    index_axis = "'y'" if chart == "bar" else "'x'"
    is_stacked = "true" if "stacked" in chart else "false"
    
    if chart in ("line", "area", "stacked_area"):
        js_type = "line"
    elif chart == "pie":
        js_type = "pie"
    elif chart == "donut":
        js_type = "doughnut"
    elif chart == "radar":
        js_type = "radar"
    elif chart == "polarArea":
        js_type = "polarArea"
    elif chart == "scatter":
        js_type = "scatter"

    js_chartjs = f'''// Chart.js Modern PowerBI Visual Configuration
import {{ Chart }} from 'chart.js/auto';

const ctx = document.getElementById('chartCanvas').getContext('2d');
const myChart = new Chart(ctx, {{
  type: '{js_type}',
  data: {{
    labels: dataLabels, // Categories from column "{x}"
    datasets: [{{
      label: '{y.title()} ({agg.upper()})',
      data: dataValues, // Values from column "{y}"
      backgroundColor: [
        'rgba(99, 102, 241, 0.85)',
        'rgba(14, 165, 233, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(239, 68, 68, 0.85)',
        'rgba(168, 85, 247, 0.85)'
      ],
      borderColor: '#6366f1',
      borderWidth: 1.5,
      fill: {("true" if "area" in chart else "false")},
      tension: 0.35,
    }}]
  }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: {index_axis},
    plugins: {{
      title: {{
        display: true,
        text: '{title}',
        font: {{ size: 16, weight: '600' }}
      }},
      legend: {{
        position: 'top',
        labels: {{ boxWidth: 12, padding: 16 }}
      }},
      tooltip: {{
        mode: 'index',
        intersect: false
      }}
    }},
    scales: {{
      x: {{ stacked: {is_stacked}, grid: {{ color: 'rgba(255,255,255,0.06)' }} }},
      y: {{ stacked: {is_stacked}, grid: {{ color: 'rgba(255,255,255,0.06)' }} }}
    }}
  }}
}});'''

    # 4. SQL / Pandas & DAX
    sql_agg = {"avg": "AVG", "sum": "SUM", "count": "COUNT", "min": "MIN", "max": "MAX"}.get(agg, "SUM")
    sql_pandas = f'''-- SQL Aggregation Query (Power BI / PostgreSQL / BigQuery)
SELECT 
    "{x}" AS Dimension,
    {sql_agg}("{y}") AS MetricValue
FROM 
    dataset_table
GROUP BY 
    "{x}"
ORDER BY 
    MetricValue DESC;

-----------------------------------------------------------
-- Power BI DAX Measure Formula
-- Measure Name: [{y}_{agg.upper()}]
{y}_{agg.upper()} = {sql_agg}(dataset_table[{y}])

-- Visual Calculation with Dimension filter:
CALCULATE(
    [{y}_{agg.upper()}],
    ALLEXCEPT(dataset_table, dataset_table[{x}])
)

-----------------------------------------------------------
# Equivalent Python Pandas Transformation
df_result = (
    df.groupby("{x}", as_index=False)
      .agg({{"{y}": "{py_func}"}})
      .rename(columns={{"{y}": "{y}_{agg}"}})
      .sort_values(by="{y}_{agg}", ascending=False)
)'''

    return VisualCodeBundle(
        python_matplotlib=py_mpl,
        python_plotly=py_plotly,
        python_seaborn=py_mpl,
        javascript_chartjs=js_chartjs,
        sql_pandas=sql_pandas
    )


def generate_python_code(intent: PromptIntent, column_names: List[str]) -> str:
    """Backward compatibility helper returning default Python code."""
    bundle = generate_code_bundle(intent, column_names)
    return bundle.python_plotly if (intent.chart in ["scatter", "bubble"]) else bundle.python_matplotlib
