# Intelligent Prompt-to-Visualization Agent

Production-ready web app: **upload datasets** (CSV, XLSX, JSON), **describe charts in natural language**, get **visualization + source code + explanation**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Python 3.10+, FastAPI |
| **Data** | Pandas (parse CSV/XLSX/JSON) |
| **Charts** | Matplotlib, Plotly (optional interactive) |
| **NLP** | Prompt intent parser (chart type, x, y, aggregation) |

---

## Folder Structure

```
project/
├── frontend/          # React + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── UploadSection.jsx
│   │       ├── PromptSection.jsx
│   │       └── ResultSection.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/           # FastAPI
│   ├── main.py        # API routes: /upload, /generate
│   ├── parser.py      # NLP prompt → intent (chart, x, y, agg)
│   ├── chart_engine.py # Matplotlib / Plotly figure generation
│   ├── code_generator.py # Python code output
│   ├── utils.py       # File parse, schema, validation
│   ├── models/
│   │   └── schemas.py  # Pydantic models
│   └── requirements.txt
├── datasets/
│   └── sample_marks.csv
└── README-NEW-STACK.md (this file)
```

---

## Run Instructions

### 1. Backend (Python)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be at **http://localhost:8000** (docs: http://localhost:8000/docs).

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

App will be at **http://localhost:5173**. Vite proxy forwards `/api` to `http://localhost:8000`, so upload and generate work without CORS.

### 3. Try It

1. Open http://localhost:5173
2. Upload **datasets/sample_marks.csv** (or any CSV/XLSX/JSON)
3. Enter prompt: **"Show average marks by subject as bar chart"**
4. Click **Generate** → see chart, code, and explanation
5. Use **Voice** for speech input, **Interactive (Plotly)** for Plotly charts, **Dark** for dark mode

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload file (CSV/XLSX/JSON). Returns `schema` + `session_id`. |
| POST | `/generate` | Body: `prompt`, `session_id`, `use_plotly`. Returns `image_base64`, `code`, `explanation`, optional `error`. |

---

## Features

- Upload dataset (CSV, XLSX, JSON)
- Auto-detect column types (numeric, datetime, category)
- NLP prompt interpreter (chart type, x-axis, y-axis, aggregation)
- Chart recommendation when prompt is vague
- Validation with “closest column” suggestions if not found
- Matplotlib + Plotly (toggle) visualization
- Python code generator
- Voice command input (Web Speech API)
- Dark mode UI
- Loading states and error handling
- Download chart (PNG) and code (.py)

---

## Algorithm Flow

1. **Upload** → parse file, detect schema, store in session
2. **Detect schema** → columns, dtypes, row count
3. **Parse prompt** → chart type, x, y, aggregation
4. **Validate** → columns exist (or suggest closest)
5. **Select chart type** → bar, line, pie, scatter, area
6. **Generate visualization** → Matplotlib or Plotly
7. **Generate code** → Python script that reproduces chart
8. **Return** → image (base64), code, explanation

---

## Notes

- Backend stores datasets in memory by `session_id`; restart clears them (use Redis/DB for production).
- Voice input works in Chrome/Edge (Web Speech API).
- For production, set `VITE_API_URL` to your backend URL when building the frontend.
