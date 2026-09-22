# Demo & Run Instructions

## Quick demo (30–60 seconds)

1. **Start the Node server** (frontend + Gemini proxy):
   ```bash
   cd server && npm install && npm start
   ```
   Open http://localhost:3000

2. **Upload** the example CSV:
   - Use `datasets/example_data.csv` (No., Name, Location, Calculation, Total Weight, Phone Number).

3. **Prompt:** type `location` and leave chart type as **Bar Chart**. Click **Generate**.

4. **Expected:** Bar chart with **Location** on X and **Count** on Y (not zeros). Description includes: "Reason: Detected categorical column 'Location' and no numeric column mentioned — using counts."

5. **Copy** the generated JavaScript code and paste into a minimal HTML page with Chart.js to confirm it reproduces the chart. **Download** the chart as PNG.

---

## Frontend (smart column selector)

- **Test with example CSV and prompt "location":**
  1. Open the app (Node server or static `index.html`).
  2. Upload `datasets/example_data.csv`.
  3. Select **Bar Chart**, prompt: `location`, click Generate.
  4. Chart should show: X = Location, Y = Count (bars per location). No zeros.

- **API keys:** Not required in the UI. Set `GEMINI_API_KEY` in `server/.env` for the analyze-chart endpoint.

---

## Backend (FastAPI)

- **Run:**
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
  Docs: http://localhost:8000/docs

- **Test with curl:**
  ```bash
  # Upload
  curl -X POST http://localhost:8000/upload -F "file=@datasets/example_data.csv"
  # Use session_id from response, then:
  curl -X POST http://localhost:8000/generate -F "prompt=location" -F "session_id=YOUR_SESSION_ID" -F "use_plotly=false"
  ```
  Response must include non-empty `image_base64`, `code`, `explanation`, and `intent` with `aggregation: "count"` when prompt is "location".

- **Python requests snippet:**
  ```python
  import requests
  with open("datasets/example_data.csv", "rb") as f:
      r = requests.post("http://localhost:8000/upload", files={"file": ("example_data.csv", f, "text/csv")})
  sid = r.json()["session_id"]
  r2 = requests.post("http://localhost:8000/generate", data={"prompt": "location", "session_id": sid, "use_plotly": False})
  assert r2.json().get("image_base64")
  assert "count" in r2.json().get("explanation", "").lower()
  ```

---

## Tests

From **project root**:

```bash
# All tests (parser, grouping, integration)
python -m pytest tests/ -v

# Or from backend (integration needs path to datasets)
cd backend && python -m pytest ../tests/ -v
```

- **test_parser.py:** `parse_prompt("sales by region")`, `parse_prompt("location")` (count fallback), `parse_prompt("price vs rating")`.
- **test_grouping.py:** `_aggregate` for sum, avg, count.
- **integration_generate.py:** Upload `example_data.csv`, POST /generate with prompt "location", assert non-empty `image_base64` and explanation.

---

## Example CSV

Included as `datasets/example_data.csv`:

```csv
No.,Name,Location,Calculation,Total Weight,Phone Number
1,John Doe,Chagalamarri,,12.5,9876543210
2,Jane Smith,Simhadripuram,,10.0,9876543211
...
```

For prompt **"location"**: chart = Location (X) vs Count (Y), aggregation = count.
