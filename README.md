# Intelligent Prompt-to-Visualization Agent

An intelligent AI-powered web platform that transforms natural language prompts and uploaded datasets into accurate, publication-grade visualizations along with automatically generated, reproducible source code.

---

## 🌟 Key Capabilities

- **Natural Language & Voice Prompts:** Describe your desired chart in plain English or speak using voice recognition (Web Speech API).
- **Direct Dataset Attachments:** Use the **Add Attachment** (📎) button to upload your datasets in **CSV**, **Excel (`.xlsx`, `.xls`)**, or **JSON** format.
- **Interactive Multi-Chart Studio:**
  - Column & Bar Charts
  - Line & Area Trends
  - Donut & Pie Compositions
  - Scatter & Radar Distributions
- **Instant Chart Switcher:** Interactive buttons to toggle chart types on the fly.
- **Automated Statistical Insights:** Deep extraction of key metrics, averages, min/max values, leading performers, and percentage distributions.
- **Full Reproducible Code Generation:** Generates complete, runnable source code across:
  - 🐍 **Python (Matplotlib & Seaborn)**
  - 📈 **Python (Plotly)**
  - 🌐 **JavaScript (Chart.js)**
  - 🗄️ **SQL / Pandas / DAX**
- **One-Click Exports:**
  - 📥 **Download PNG** chart image
  - 📥 **Download `.py`** Python script
  - 📥 **Download `.js`** Chart.js script
  - 📌 **Pin to Canvas** (Multi-visual report dashboard with PDF export)

---

## 🚀 Quick Start

### 1. Launch the Full Stack Application
Double-click `start.bat` or run in PowerShell:
```powershell
.\start.ps1
```

This will automatically:
1. Start the **FastAPI Backend Engine** at [http://127.0.0.1:8000](http://127.0.0.1:8000)
2. Start the **React + Vite Frontend** at [http://localhost:5173](http://localhost:5173)
3. Open your default web browser to the dashboard.

---

## 🏗️ Architecture

```
├── ChartCraft-main/
│   ├── backend/               # FastAPI Analytics & NLP Engine
│   │   ├── main.py            # API routing & endpoints (/upload, /copilot, /generate)
│   │   ├── chart_engine.py    # Matplotlib & Plotly generation
│   │   ├── code_generator.py  # Multi-language code synthesis
│   │   ├── parser.py          # Natural language prompt intent parser
│   │   └── utils.py           # Statistical profiling & dataset parsing
│   ├── frontend/              # Modern React + Vite Application
│   │   ├── src/components/
│   │   │   ├── AICopilotChat.jsx    # Prompt Agent Workspace (Flagship)
│   │   │   ├── InteractiveChart.jsx # Responsive Chart.js visualization engine
│   │   │   ├── PowerBIDashboard.jsx # Multi-visual report canvas
│   │   │   ├── VisualBuilder.jsx    # Manual dimension & metric builder
│   │   │   ├── DataStudio.jsx       # Table viewer & correlation profiling
│   │   │   └── Header.jsx           # Global navigation & dataset selector
│   │   └── package.json
│   └── datasets/              # Sample industry datasets
├── start.bat                  # One-click Windows launch script
├── start.ps1                  # PowerShell full-stack launch script
└── README.md
```

---

## 💡 Example Prompts

- *"Show sales by category as a bar chart"*
- *"Plot profit trend over time as an area chart"*
- *"Compare expenses across departments as a donut chart"*
- *"Show student performance distribution as a scatter plot"*
- *"Top 5 performers by revenue"*

---

## 📄 License
This project is open-source under the MIT License.
