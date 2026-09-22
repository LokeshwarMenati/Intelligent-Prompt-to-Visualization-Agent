import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PowerBIDashboard } from './components/PowerBIDashboard';
import { VisualBuilder } from './components/VisualBuilder';
import { AICopilotChat } from './components/AICopilotChat';
import { DataStudio } from './components/DataStudio';
import { UploadSection } from './components/UploadSection';
import { parseCSV } from './utils/csvParser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [activeView, setActiveView] = useState('agent');
  const [darkMode, setDarkMode] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [currentDatasetName, setCurrentDatasetName] = useState('Global Superstore (Sales & Profit)');
  const [schema, setSchema] = useState(null);
  const [summary, setSummary] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [visuals, setVisuals] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Helper to compute chartData labels and values
  const computeVisualData = (dataRows, x, y, agg = 'sum', type = 'column') => {
    const groups = {};
    dataRows.forEach((r) => {
      const key = String(r[x] ?? 'Other');
      const val = parseFloat(r[y]) || 0;
      if (!groups[key]) groups[key] = { count: 0, sum: 0 };
      groups[key].count += 1;
      groups[key].sum += val;
    });
    const labels = Object.keys(groups).slice(0, 25);
    const values = labels.map((k) =>
      agg === 'avg'
        ? Number((groups[k].sum / (groups[k].count || 1)).toFixed(2))
        : agg === 'count'
        ? groups[k].count
        : Number(groups[k].sum.toFixed(2))
    );
    return {
      chart_type: type,
      labels,
      values,
      x_label: x,
      y_label: y,
      title: `${y} by ${x}`,
    };
  };

  // Helper to construct automatic Power BI visuals from detected columns
  const generatePresetVisuals = (dataRows, detectedCols) => {
    if (!dataRows || dataRows.length === 0) return [];
    const numCols = detectedCols.filter((c) => c.dtype === 'numeric').map((c) => c.name);
    const catCols = detectedCols.filter((c) => c.dtype === 'category' || c.dtype === 'datetime').map((c) => c.name);

    const newVis = [];

    // Visual 1: Clustered Column
    if (catCols.length > 0 && numCols.length > 0) {
      const x = catCols[0];
      const y = numCols[0];
      newVis.push({
        id: 'vis_preset_1',
        title: `${y} by ${x}`,
        type: 'column',
        xAxis: x,
        yAxis: y,
        aggregation: 'sum',
        palette: 'powerbi',
        chartData: computeVisualData(dataRows, x, y, 'sum', 'column'),
      });
    }

    // Visual 2: Donut / Composition
    if (catCols.length > 0) {
      const x = catCols.length > 1 ? catCols[1] : catCols[0];
      const y = numCols.length > 0 ? numCols[0] : x;
      newVis.push({
        id: 'vis_preset_2',
        title: `Proportion by ${x}`,
        type: 'donut',
        xAxis: x,
        yAxis: y,
        aggregation: numCols.length > 0 ? 'sum' : 'count',
        palette: 'cyber',
        chartData: computeVisualData(dataRows, x, y, numCols.length > 0 ? 'sum' : 'count', 'donut'),
      });
    }

    // Visual 3: Trend Line / Area
    if (numCols.length > 0) {
      const dateCol = catCols.find((c) => c.toLowerCase().includes('date') || c.toLowerCase().includes('month')) || (catCols[0] || numCols[0]);
      const y = numCols.length > 1 ? numCols[1] : numCols[0];
      newVis.push({
        id: 'vis_preset_3',
        title: `${y} Trend across ${dateCol}`,
        type: 'area',
        xAxis: dateCol,
        yAxis: y,
        aggregation: 'avg',
        palette: 'emerald',
        chartData: computeVisualData(dataRows, dateCol, y, 'avg', 'area'),
      });
    }

    // Visual 4: Ranking Bar or Second Metric Column
    if (numCols.length > 0 && catCols.length > 0) {
      const x = catCols[0];
      const y = numCols.length > 1 ? numCols[1] : numCols[0];
      newVis.push({
        id: 'vis_preset_4',
        title: `${y} Performance Ranking`,
        type: 'bar',
        xAxis: x,
        yAxis: y,
        aggregation: 'sum',
        palette: 'sunset',
        chartData: computeVisualData(dataRows, x, y, 'sum', 'bar'),
      });
    }

    return newVis;
  };

  // Load dataset into backend & state
  const loadDatasetFile = useCallback(async (filePath, displayName) => {
    setLoading(true);
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error('Could not fetch dataset');
      const text = await res.text();
      const parsedRows = parseCSV(text);
      setRawData(parsedRows);

      // Upload blob to backend
      const blob = new Blob([text], { type: 'text/csv' });
      const file = new File([blob], filePath.split('/').pop() || 'dataset.csv', { type: 'text/csv' });
      const form = new FormData();
      form.append('file', file);

      const upRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
      const schemaData = await upRes.json();
      if (!upRes.ok) throw new Error(schemaData.detail || 'Upload failed');

      setSessionId(schemaData.session_id);
      setSchema(schemaData);
      setCurrentDatasetName(displayName || file.name);

      // Fetch summary
      try {
        const sumRes = await fetch(`${API_BASE}/summary?session_id=${schemaData.session_id}`);
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }
      } catch (sumErr) {
        console.warn('Summary fetch optional failed', sumErr);
      }

      // Generate preset Power BI visuals
      const initialVisuals = generatePresetVisuals(parsedRows, schemaData.columns);
      setVisuals(initialVisuals);
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: Superstore dataset
  useEffect(() => {
    loadDatasetFile('/sales_superstore.csv', 'Global Superstore (Sales & Profit)');
  }, [loadDatasetFile]);

  // Handle custom upload success
  const handleCustomUploadSuccess = (schemaData, fileName) => {
    setSessionId(schemaData.session_id);
    setSchema(schemaData);
    setCurrentDatasetName(fileName);
    if (schemaData.preview_rows) {
      setRawData(schemaData.preview_rows);
    }
    const initialVisuals = generatePresetVisuals(schemaData.preview_rows || [], schemaData.columns);
    setVisuals(initialVisuals);

    // Fetch summary
    fetch(`${API_BASE}/summary?session_id=${schemaData.session_id}`)
      .then((r) => r.json())
      .then((s) => setSummary(s))
      .catch((e) => console.warn(e));
  };

  // Add visual to dashboard from Builder
  const handleAddVisualToDashboard = (visual) => {
    setVisuals((prev) => [visual, ...prev]);
    setActiveView('dashboard');
  };

  // Pin visual from Copilot
  const handlePinFromCopilot = (visual) => {
    setVisuals((prev) => [visual, ...prev]);
    setActiveView('dashboard');
  };

  // Export Dashboard to PDF / Image
  const handleExportReport = async () => {
    const dashboardElement = document.getElementById('dashboard-canvas');
    if (!dashboardElement) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ChartCraft_${currentDatasetName.replace(/\W+/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
        {/* Global Navigation Header */}
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currentDatasetName={currentDatasetName}
          onSelectSample={(sampleId) => {
            const nameMap = {
              'sales_superstore.csv': 'Global Superstore (Sales & Profit)',
              'tech_stocks.csv': 'Tech Giants Financials (Equity Analytics)',
              'sample_marks.csv': 'Student Academic Performance',
              'hr_workforce.csv': 'HR Workforce & Retention',
            };
            loadDatasetFile(`/${sampleId}`, nameMap[sampleId] || sampleId);
          }}
          onOpenUpload={() => setUploadModalOpen(true)}
          onExportReport={handleExportReport}
        />

        {/* Main Workspace Canvas */}
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Loading Intelligent Prompt-to-Visualization Agent...
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Analyzing data relationships, detecting columns, and configuring prompt engine
                </p>
              </div>
            </div>
          ) : (
            <div id="dashboard-canvas">
              {(activeView === 'agent' || activeView === 'copilot') && (
                <AICopilotChat
                  sessionId={sessionId}
                  schema={schema}
                  darkMode={darkMode}
                  onPinToDashboard={handlePinFromCopilot}
                  onDatasetUploaded={handleCustomUploadSuccess}
                  currentDatasetName={currentDatasetName}
                />
              )}

              {activeView === 'dashboard' && (
                <PowerBIDashboard
                  schema={schema}
                  summary={summary}
                  rawData={rawData}
                  visuals={visuals}
                  setVisuals={setVisuals}
                  darkMode={darkMode}
                  onOpenBuilder={() => setActiveView('builder')}
                />
              )}

              {activeView === 'builder' && (
                <VisualBuilder
                  schema={schema}
                  rawData={rawData}
                  darkMode={darkMode}
                  onAddToDashboard={handleAddVisualToDashboard}
                />
              )}

              {activeView === 'data' && (
                <DataStudio
                  schema={schema}
                  summary={summary}
                  rawData={rawData}
                />
              )}
            </div>
          )}
        </main>

        {/* Upload Custom Dataset Modal */}
        {uploadModalOpen && (
          <UploadSection
            isModal={true}
            onSuccess={handleCustomUploadSuccess}
            onClose={() => setUploadModalOpen(false)}
          />
        )}

        {/* Exporting Overlay Banner */}
        {exporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Generating high-resolution Power BI PDF Report...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
