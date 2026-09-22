# Intelligent Prompt-to-Visualization Agent — Project Document

## Abstract

Data interpretation becomes challenging when users lack technical expertise in visualization libraries such as Matplotlib or D3.js. This project proposes an intelligent agent that transforms natural language prompts and uploaded datasets into accurate, meaningful visualizations along with automatically generated source code. By integrating natural language processing, data analysis, and visualization engines, the system simplifies chart creation, improves insight extraction, and enhances storytelling in technical and business reports. The solution bridges the gap between raw data and actionable insights, enabling users with minimal programming knowledge to produce professional-grade visual outputs.

---

## Problem Statement

Data analysis requires converting raw numerical datasets into visual formats such as charts or graphs to detect patterns and trends. However, many users lack proficiency in specialized visualization tools and libraries. This limitation results in difficulty interpreting data, misrepresentation of results, and reduced effectiveness in communication. Therefore, there is a need for an intelligent system that allows users to upload datasets and describe their visualization requirements in natural language, automatically generating both the visualization and its underlying code.

---

## Objectives

| Objective | Status |
|----------|--------|
| Allow users to upload datasets (CSV, Excel, JSON, etc.) | ✅ CSV, JSON, .txt; ⏳ Excel planned |
| Accept natural language prompts describing desired visualization | ✅ |
| Automatically analyze data structure and relationships | ✅ (rule-based + optional AI) |
| Generate accurate charts and graphs | ✅ |
| Provide downloadable source code for reproducibility | ✅ JS + Python |
| Support multiple visualization styles | ✅ Bar, line, pie, scatter, area, doughnut |
| Ensure accessibility for non-technical users | ✅ Simple UI, no coding required |

---

## Proposed Solution Architecture

### Input Layer
- **Dataset uploader** — Multi-file CSV/JSON support, drag-and-drop
- **Voice/Text prompt interface** — Text prompt; voice (Web Speech API) planned

### Processing Layer
- **NLP engine** — Interprets user prompt (rule-based + optional OpenAI)
- **Data parser** — Analyzes dataset structure, columns, types
- **Visualization selector** — Chooses chart type from prompt and data

### Execution Layer
- **Chart generator** — Chart.js (browser); Matplotlib/Plotly code export
- **Code generator** — JavaScript (Chart.js) and Python (Matplotlib) output

### Output Layer
- **Rendered visualization** — Interactive chart in browser
- **Editable source code** — Displayed with copy/export
- **Download/export options** — PNG image, .js and .py files

---

## Methodology

1. User uploads dataset (one or more files).
2. System detects columns, types, and structure.
3. User gives prompt (e.g. *“Show sales trend by month as a line chart”*).
4. NLP extracts: variables, chart type, grouping (filters planned).
5. Visualization engine generates the chart.
6. Code generator outputs Python and/or JavaScript script.
7. Results (chart + code) are displayed and can be downloaded.

---

## Key Features

| Feature | Status |
|---------|--------|
| Natural language chart generation | ✅ |
| Voice command support | ⏳ Planned |
| Automatic chart recommendation | ✅ (AI or rule-based) |
| Code export option | ✅ JS + Python |
| Multi-format dataset support | ✅ CSV, JSON; ⏳ Excel planned |
| Error detection and correction suggestions | ✅ Basic validation & messages |
| Interactive visualizations | ✅ Chart.js tooltips, legends |

---

## Technology Stack

### Frontend (Current)
- **HTML5, CSS (Tailwind), Vanilla JavaScript**
- **Chart.js** — Rendering
- **Web Speech API** — Planned for voice input

### Backend (Current)
- **Node.js + Express** — Static serving, `/api/generate-chart`
- **OpenAI-compatible API** — Prompt → chart config (optional)

### AI / NLP
- **Rule-based parser** — Keywords, column inference
- **Transformer-based model** (optional) — Via OpenAI API for chart type and column mapping

### Visualization
- **Chart.js** — Primary rendering in browser
- **Matplotlib** — Generated Python code
- **Plotly / D3.js** — Optional future modes

---

## Novelty / Innovation

- Converts human language directly into visual analytics.
- Eliminates manual coding effort for common chart types.
- Combines NLP + auto-visualization + code generation in one system.
- Works as both a learning tool and productivity assistant.

---

## Applications

- Students preparing reports  
- Business analysts  
- Researchers  
- Non-technical professionals  
- Data journalism  
- Corporate dashboards  

---

## Future Enhancements

- [ ] **Auto-insight generation** — Trend summaries, key stats
- [ ] **Dashboard creation** from a single prompt
- [ ] **AI recommendations** for best visualization type
- [ ] **Collaborative sharing** of charts and prompts
- [ ] **Integration with cloud data sources**
- [ ] **Voice input** (Web Speech API)
- [ ] **Excel (.xlsx) support**
- [ ] **Vega-Lite / Plotly** for advanced chart types

---

## Implementation Reference

- **Quick start**: See [README.md](README.md).
- **Run**: `cd server && npm install && npm start` → http://localhost:3000
- **Static use**: Open `index.html` in a browser (no server; rule-based only).
