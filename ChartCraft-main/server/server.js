require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static files (index.html, script.js, styles.css, etc.)
app.use(express.static(ROOT));

app.get('/', (req, res) => {
  const index = path.join(ROOT, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(404).send('index.html not found');
  }
});

// AI chart config: interpret natural language + data schema -> chart config
app.post('/api/generate-chart', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ message: 'Missing API key. Set X-API-Key header or OPENAI_API_KEY env.' });
  }

  const { prompt, columns, columnDescriptions, sampleRows, rowCount } = req.body || {};
  if (!prompt || !columns || !Array.isArray(columns)) {
    return res.status(400).json({ message: 'Body must include prompt and columns array.' });
  }

  const systemPrompt = `You are a chart recommendation engine. Given a user's natural language description and a list of data columns, respond with a JSON object only (no markdown, no code block) with these exact keys:
- chartType: one of "bar", "line", "pie", "doughnut", "scatter", "area"
- xColumn: column name for x-axis (or categories). Use only from the columns list.
- yColumn: column name for y-axis (or values). Use only from the columns list.
- labelColumn: for pie/doughnut, the column for slice labels. Use only from the columns list.
- title: a short chart title string

Choose chartType and column mapping that best match the user's request. Column names are case-sensitive; use the exact names from the list.`;

  const userContent = `User request: "${prompt}"
Available columns: ${columnDescriptions || columns.join(', ')}
Sample row: ${JSON.stringify(sampleRows && sampleRows[0] || {})}
Total rows: ${rowCount || 'unknown'}

Respond with only a single JSON object.`;

  try {
    const endpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1';
    const url = `${endpoint.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let message = response.statusText;
      try {
        const errJson = JSON.parse(errText);
        message = errJson.error?.message || errText;
      } catch (_) {
        message = errText.slice(0, 200);
      }
      return res.status(response.status).json({ message });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    // Strip possible markdown code fence
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    const config = JSON.parse(raw);

    const chartType = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'area'].includes(config.chartType)
      ? config.chartType : 'bar';
    const xColumn = columns.includes(config.xColumn) ? config.xColumn : columns[0];
    const yColumn = columns.includes(config.yColumn) ? config.yColumn : (columns[1] || columns[0]);
    const labelColumn = columns.includes(config.labelColumn) ? config.labelColumn : columns[0];

    return res.json({
      chartType,
      xColumn,
      yColumn,
      labelColumn,
      title: typeof config.title === 'string' ? config.title : 'Chart',
    });
  } catch (e) {
    const message = e.message || String(e);
    const isParse = message.includes('JSON') || message.includes('parse');
    return res.status(isParse ? 502 : 500).json({
      message: isParse ? 'AI returned invalid JSON. Try rephrasing your prompt.' : message,
    });
  }
});

// Never log or expose API keys (X-API-Key, req.body.apiKey) — use only for upstream calls then discard.
// Optional: simple per-IP rate limit for analyze-chart to reduce abuse
const analyzeChartLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;
function rateLimitAnalyzeChart(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let list = analyzeChartLimit.get(ip) || [];
  list = list.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (list.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests. Try again later.' });
  }
  list.push(now);
  analyzeChartLimit.set(ip, list);
  next();
}

app.post('/api/analyze-chart', rateLimitAnalyzeChart, async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.GEMINI_API_KEY;
  const key = (typeof apiKey === 'string' && apiKey.trim()) ? apiKey.trim() : process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(400).json({ message: 'Missing Gemini API key. Set GEMINI_API_KEY in server .env or send X-API-Key.' });
  }

  const { prompt, columns, sampleRows, rowCount } = req.body || {};
  if (!columns || !Array.isArray(columns)) {
    return res.status(400).json({ message: 'Body must include columns array.' });
  }
  const sample = Array.isArray(sampleRows) ? sampleRows.slice(0, 3) : [];

  const systemInstruction = `You are a data analyst. Given sample tabular data (first 3 rows) and an optional user request, you must recommend a chart that shows MEANINGFUL grouped data, not one slice/bar per row.

Rules:
1. Choose a CATEGORICAL column for labels (x-axis or pie slices): e.g. subject, region, name, category. Do NOT use unique IDs or row numbers as the main label column if there are many distinct values.
2. Choose a NUMERIC column for values (y-axis or slice sizes): e.g. marks, sales, count. Never use a column that is not numeric (only numbers) for yColumn.
3. If the user only mentions a category (e.g. location or region), use that column for labels and set aggregation to "count"; do not use another text column for values.
4. Always set "aggregation" to one of: "sum", "avg", "count", "min", "max". Use "avg" for averages (e.g. marks by subject), "sum" for totals, "count" for number of items per category.
5. Chart type: one of "bar", "line", "pie", "scatter", "area", "doughnut". Prefer bar or pie when showing grouped categories.
6. Title: short, descriptive (e.g. "Average marks by subject").

Respond with ONLY a single JSON object, no markdown, with these exact keys: chartType, xColumn, yColumn, labelColumn, title, aggregation. Use exact column names from the provided list.`;

  const userText = `Columns: ${columns.join(', ')}
Total rows: ${rowCount != null ? rowCount : 'unknown'}
Sample data (first 3 rows):
${JSON.stringify(sample, null, 2)}
${prompt ? `User request: ${prompt}` : 'No specific request. Recommend the best visualization for this data.'}

Respond with only one JSON object.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let message = response.statusText;
      try {
        const errJson = JSON.parse(errText);
        message = errJson.error?.message || errText;
      } catch (_) {
        message = errText.slice(0, 200);
      }
      return res.status(response.status).json({ message });
    }

    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.[0];
    const content = (part?.text || '').trim();
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    const config = JSON.parse(raw);

    const chartType = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'area'].includes(config.chartType)
      ? config.chartType : 'bar';
    const xColumn = columns.includes(config.xColumn) ? config.xColumn : columns[0];
    const yColumn = columns.includes(config.yColumn) ? config.yColumn : (columns[1] || columns[0]);
    const labelColumn = columns.includes(config.labelColumn) ? config.labelColumn : columns[0];

    const out = {
      chartType,
      xColumn,
      yColumn,
      labelColumn,
      title: typeof config.title === 'string' ? config.title : 'Chart',
    };
    if (config.aggregation && ['avg', 'sum', 'count', 'min', 'max'].includes(config.aggregation)) {
      out.aggregation = config.aggregation;
    }
    return res.json(out);
  } catch (e) {
    const message = e.message || String(e);
    const isParse = message.includes('JSON') || message.includes('parse');
    return res.status(isParse ? 502 : 500).json({
      message: isParse ? 'Gemini returned invalid JSON.' : message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Intelligent Prompt-to-Visualization Agent running at http://localhost:${PORT}`);
});
