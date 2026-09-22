# Intelligent Prompt-to-Visualization Agent

A web application that transforms raw data into visualizations using natural language. Users upload datasets (CSV, JSON) and describe the desired chart in plain language; the system generates the chart and downloadable source code (JavaScript and Python), bridging the gap between raw data and actionable insights for non-technical users.

**Full project document** (abstract, problem statement, objectives, architecture, methodology): see **[PROJECT.md](PROJECT.md)**.

## Features

- **Natural language chart generation** — Describe the chart in plain English
- **Multiple chart types** — Bar, line, pie, scatter, doughnut, area
- **Multi-file upload** — CSV, JSON, .txt; multiple files merged into one dataset
- **Data preview** — Inspect columns and rows before generating
- **Code generation** — JavaScript (Chart.js) and Python (Matplotlib), editable and exportable
- **Export options** — Download chart as PNG; export .js / .py files
- **Optional AI mode** — Use OpenAI or Google Gemini. With Gemini, the app sends the first 3 rows of your data plus your optional prompt so the AI can recommend the best chart and columns.
- **Responsive design** — Works on desktop and mobile
- **Example data** — Load sample dataset with one click

## Live Demo

Try the app online: **[Live Demo](https://your-demo-url.vercel.app)** (replace with your deployed URL, e.g. Vercel, Netlify, or GitHub Pages).

## Quick Start

### Option A: Static (no server)
1. Open `index.html` in your web browser (or use any static file server).
2. Upload a CSV or JSON file using the drag-and-drop interface.
3. Describe your visualization in natural language (e.g., "Create a bar chart showing sales by region").
4. Click **Generate** to create your visualization (rule-based; no API key needed).
5. Download the chart or copy the generated JavaScript/Python code.

### Option B: With AI (recommended for best results)
1. Install and start the backend:  
   `cd server && npm install && npm start`  
   Then open **http://localhost:3000** in your browser.
2. In the header, check **Use AI**, choose **OpenAI** or **Gemini**, and enter the matching API key (OpenAI key or [Gemini API key from Google AI Studio](https://aistudio.google.com/apikey)).
3. Upload data and enter a natural language description (optional with Gemini), then click **Generate**.
4. With **Gemini**, the app sends the first 3 rows of your file plus your prompt so the AI can analyze the data and recommend chart type and columns. With **OpenAI**, the AI uses your prompt and column list. You get the full visualization and source code either way.

## Example Prompts

- "Create a bar chart showing sales by product category"
- "Plot temperature trends over the last 12 months as a line chart"
- "Show market share distribution as a pie chart with percentages"
- "Create a scatter plot comparing price vs. rating"
- "Display revenue growth as an area chart"

## File Structure

```
├── index.html          # Main application interface
├── styles.css          # Custom styles and animations
├── script.js           # Core application logic (upload, prompt, Chart.js, code gen)
├── datasets/           # Sample datasets
│   ├── sample_marks.csv
│   └── example_data.csv
├── tests/              # Unit tests
│   ├── chart-core.js
│   └── chart-core.test.js
├── server/
│   ├── server.js       # Express server: static files, /api/generate-chart (OpenAI), /api/analyze-chart (Gemini)
│   ├── .env.example    # Example env (GEMINI_API_KEY, PORT)
│   └── package.json    # Dependencies (express, cors, dotenv)
└── README.md           # This documentation
```

## Technologies Used

- **HTML5**: Semantic markup and structure
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Chart.js**: Powerful charting library for visualizations
- **Papa Parse**: CSV parsing library
- **Font Awesome**: Icon library
- **Vanilla JavaScript**: Application logic and interactions

## Key Components

### Data Processing
- Automatic CSV and JSON parsing
- Data type detection (numeric vs. categorical)
- Data aggregation for chart optimization
- Error handling for invalid data formats

### Natural Language Processing
- **Rule-based fallback**: Chart type and column inference from keywords (no API key required).
- **Optional AI mode**: When using the backend, choose **OpenAI** or **Gemini**. With **Gemini**, the app sends the first 3 rows of your data plus your prompt to `/api/analyze-chart`; the AI analyzes the data and returns chart type, columns, and optional aggregation. With **OpenAI**, the app sends your prompt and column list to `/api/generate-chart`. You can set `GEMINI_API_KEY` or `OPENAI_API_KEY` in `server/.env` so the client does not need to send a key.
- Title extraction from descriptions and template-based prompt suggestions.

### Visualization Engine
- Dynamic chart generation with Chart.js
- Responsive chart sizing
- Color palette management
- Interactive tooltips and legends

### Code Generation
- **JavaScript (Chart.js)**: Full runnable code with your data structure and options.
- **Python (Matplotlib)**: Real Matplotlib code (bar, line, pie, scatter) generated from the current chart config, not a template.
- Syntax highlighting, copy-to-clipboard, and export as `.js` / `.py` files.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Usage Tips

1. **Be Specific**: Mention exact column names when possible
2. **Chart Types**: Use keywords like "bar", "line", "pie", "scatter"
3. **Data Relationships**: Describe correlations or comparisons
4. **Aggregations**: Request sums, averages, or counts
5. **Styling**: Ask for specific colors or themes

## Example Data Format

### CSV Example
```csv
month,sales,expenses,profit
January,12000,8000,4000
February,15000,9000,6000
March,18000,10000,8000
```

### JSON Example
```json
[
  {"product": "Laptop", "price": 999, "rating": 4.5},
  {"product": "Phone", "price": 699, "rating": 4.2},
  {"product": "Tablet", "price": 399, "rating": 4.0}
]
```

## Sample Datasets

The `datasets/` folder includes sample data for testing:

- `datasets/sample_marks.csv` — Subject, student, marks (for bar/pie: average marks by subject)
- `datasets/example_data.csv` — Name, location, total weight (for bar/pie by location)

When running from the server, use the "Sample datasets..." dropdown to load these files.

## Running Tests

Unit tests for chart logic (groupData, aggregateGrouped, preparePieData, buildChartReason):

```bash
node --test tests/chart-core.test.js
```

## Environment (server)

When running `server/server.js`, you can set:

- `PORT` – Port (default `3000`).
- `OPENAI_API_KEY` – Default API key for `/api/generate-chart` if the client does not send `X-API-Key`.
- `OPENAI_ENDPOINT` – API base URL (default `https://api.openai.com/v1`).
- `OPENAI_MODEL` – Model name (default `gpt-4o-mini`).
- `GEMINI_API_KEY` – Gemini API key for chart analysis (recommended: set in a `.env` file in the `server` folder so you don’t need to enter it in the UI). Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Copy `server/.env.example` to `server/.env` and add your key.

## Future Enhancements

- [x] Optional AI-backed chart config (OpenAI-compatible API)
- [ ] More chart types (heatmap, radar, etc.)
- [ ] Real-time data streaming
- [ ] Custom theme builder
- [ ] Collaboration features
- [ ] Advanced statistical analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue on the project repository.

---

**Transform your data into insights with the power of natural language!** 🚀📊
