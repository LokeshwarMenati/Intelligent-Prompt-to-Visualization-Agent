import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Maximize2,
  Plus,
  Code2,
  Sparkles,
  Sliders,
  Layers,
  Palette,
  Radar,
  CircleDot,
  BarChart2,
  Filter,
} from 'lucide-react';
import { InteractiveChart } from './InteractiveChart';
import { CodeModal } from './CodeModal';

const VISUAL_TYPES = [
  { id: 'column', name: 'Clustered Column', icon: BarChart3, desc: 'Compare categories with vertical bars' },
  { id: 'bar', name: 'Clustered Bar', icon: BarChart2, desc: 'Horizontal comparison for rankings' },
  { id: 'stacked_column', name: 'Stacked Column', icon: Layers, desc: 'Part-to-whole column distribution' },
  { id: 'stacked_bar', name: 'Stacked Bar', icon: Layers, desc: 'Horizontal stacked proportion' },
  { id: 'line', name: 'Line Chart', icon: TrendingUp, desc: 'Continuous trends over time or sequence' },
  { id: 'area', name: 'Area Chart', icon: Activity, desc: 'Trend volume with shaded area fill' },
  { id: 'pie', name: 'Pie Chart', icon: PieChart, desc: 'Proportional slice composition' },
  { id: 'donut', name: 'Donut Chart', icon: CircleDot, desc: 'Clean modern ring distribution' },
  { id: 'radar', name: 'Radar / Spider', icon: Radar, desc: 'Multi-variable performance comparison' },
  { id: 'polarArea', name: 'Polar Area', icon: CircleDot, desc: 'Cyclical proportional segments' },
  { id: 'scatter', name: 'Scatter Plot', icon: Activity, desc: 'Correlation between two numeric values' },
];

export function VisualBuilder({
  schema,
  rawData,
  darkMode,
  onAddToDashboard,
}) {
  const columns = schema?.columns || [];
  const numericCols = columns.filter((c) => c.dtype === 'numeric').map((c) => c.name);
  const catCols = columns.filter((c) => c.dtype === 'category' || c.dtype === 'datetime').map((c) => c.name);

  // Default selections
  const [selectedType, setSelectedType] = useState('column');
  const [xAxis, setXAxis] = useState(catCols[0] || columns[0]?.name || '');
  const [yAxis, setYAxis] = useState(numericCols[0] || columns[1]?.name || columns[0]?.name || '');
  const [aggregation, setAggregation] = useState('sum');
  const [palette, setPalette] = useState('powerbi');
  const [title, setTitle] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  // Compute live visual data locally from rawData
  const previewChartData = useMemo(() => {
    if (!rawData || rawData.length === 0 || !xAxis || !yAxis) return null;

    // Grouping and Aggregation logic
    const groups = {};
    rawData.forEach((row) => {
      const key = String(row[xAxis] ?? 'Other');
      const val = parseFloat(row[yAxis]) || 0;

      if (!groups[key]) {
        groups[key] = { count: 0, sum: 0, min: val, max: val, vals: [] };
      }
      groups[key].count += 1;
      groups[key].sum += val;
      groups[key].vals.push(val);
      if (val < groups[key].min) groups[key].min = val;
      if (val > groups[key].max) groups[key].max = val;
    });

    const labels = Object.keys(groups).slice(0, 30);
    const values = labels.map((key) => {
      const g = groups[key];
      if (aggregation === 'avg') return Number((g.sum / (g.count || 1)).toFixed(2));
      if (aggregation === 'count') return g.count;
      if (aggregation === 'min') return Number(g.min.toFixed(2));
      if (aggregation === 'max') return Number(g.max.toFixed(2));
      return Number(g.sum.toFixed(2)); // default sum
    });

    const displayTitle = title || `${selectedType.replace('_', ' ').toUpperCase()}: ${yAxis} by ${xAxis} (${aggregation.toUpperCase()})`;

    return {
      chart_type: selectedType,
      labels,
      values,
      x_label: xAxis,
      y_label: `${yAxis} (${aggregation.toUpperCase()})`,
      title: displayTitle,
    };
  }, [rawData, xAxis, yAxis, aggregation, selectedType, title]);

  // Generate code bundle on the fly for CodeModal
  const codeBundle = useMemo(() => {
    if (!xAxis || !yAxis) return null;
    const aggFunc = aggregation === 'avg' ? 'mean' : aggregation;
    const t = title || `${yAxis} by ${xAxis}`;

    const pyMpl = `import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Aggregate dataset\ndf_plot = df.groupby("${xAxis}", as_index=False)["${yAxis}"].${aggFunc}()\n\nfig, ax = plt.subplots(figsize=(10, 5))\nsns.barplot(data=df_plot, x="${xAxis}", y="${yAxis}", palette="crest", ax=ax)\nax.set_title("${t}")\nplt.xticks(rotation=45)\nplt.tight_layout()\nplt.show()`;
    
    const pyPlotly = `import plotly.express as px\n\ndf_plot = df.groupby("${xAxis}", as_index=False)["${yAxis}"].${aggFunc}()\nfig = px.bar(df_plot, x="${xAxis}", y="${yAxis}", title="${t}", template="plotly_dark")\nfig.show()`;

    const jsChart = `// Chart.js Configuration\nnew Chart(ctx, {\n  type: '${selectedType === 'bar' ? 'bar' : selectedType === 'line' ? 'line' : selectedType === 'pie' ? 'pie' : 'bar'}',\n  data: { labels: labelsArray, datasets: [{ label: '${yAxis}', data: valuesArray }] }\n});`;

    const sqlPandas = `-- Power BI DAX & SQL\nSELECT "${xAxis}", ${aggregation.toUpperCase()}("${yAxis}") AS MetricValue\nFROM DatasetTable\nGROUP BY "${xAxis}";\n\n-- DAX Measure:\n${yAxis}_${aggregation.toUpperCase()} = ${aggregation.toUpperCase()}(DatasetTable[${yAxis}])`;

    return {
      python_matplotlib: pyMpl,
      python_plotly: pyPlotly,
      python_seaborn: pyMpl,
      javascript_chartjs: jsChart,
      sql_pandas: sqlPandas,
    };
  }, [xAxis, yAxis, aggregation, selectedType, title]);

  const handleAddVisual = () => {
    if (!previewChartData) return;
    const newVisual = {
      id: 'vis_' + Date.now(),
      title: previewChartData.title,
      type: selectedType,
      xAxis,
      yAxis,
      aggregation,
      palette,
      chartData: previewChartData,
      codeBundle,
    };
    onAddToDashboard(newVisual);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
      {/* Visual Configuration Panel (Left) */}
      <div className="lg:col-span-4 space-y-5">
        {/* Visual Type Selector */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-gray-900 dark:text-white font-semibold text-sm">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Select Visual Type</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {VISUAL_TYPES.map((vt) => {
              const Icon = vt.icon;
              const isSelected = selectedType === vt.id;
              return (
                <button
                  key={vt.id}
                  onClick={() => setSelectedType(vt.id)}
                  title={vt.desc}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'border-gray-200 dark:border-slate-700/60 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                  <span className="text-[10px] leading-tight truncate w-full">{vt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Field Wells (Power BI Data Mapping) */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between text-gray-900 dark:text-white font-semibold text-sm">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Field Wells & Encoding</span>
            </div>
            <span className="text-[11px] text-gray-400">Power BI Model</span>
          </div>

          {/* X Axis (Dimension) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Category / Dimension (X-Axis)
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.dtype})
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis (Metric) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Values / Metric (Y-Axis)
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.dtype})
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation Function */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Metric Aggregation
            </label>
            <div className="grid grid-cols-5 gap-1">
              {['sum', 'avg', 'count', 'min', 'max'].map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAggregation(ag)}
                  className={`py-1.5 text-xs font-medium rounded-md uppercase transition ${
                    aggregation === ag
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>Color Palette Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'powerbi', name: 'Power BI Classic', colors: ['#118DFF', '#E66C37'] },
                { id: 'cyber', name: 'Cyber Neon', colors: ['#6366F1', '#06B6D4'] },
                { id: 'emerald', name: 'Fintech Emerald', colors: ['#059669', '#10B981'] },
                { id: 'sunset', name: 'Amber Sunset', colors: ['#F43F5E', '#FBBF24'] },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition ${
                    palette === p.id
                      ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <div className="flex gap-1 ml-1.5">
                    {p.colors.map((c, i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Visual Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-generated title..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Visual Canvas Preview (Right) */}
      <div className="lg:col-span-8 space-y-5">
        <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Live Interactive Canvas Preview
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {previewChartData?.title || 'Visual Title'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCodeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                View Code
              </button>
              <button
                onClick={handleAddVisual}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Dashboard
              </button>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="flex-1 w-full min-h-[380px] relative flex items-center justify-center">
            {previewChartData ? (
              <InteractiveChart
                chartData={previewChartData}
                darkMode={darkMode}
                palette={palette}
                height="380px"
              />
            ) : (
              <div className="text-center text-gray-400 py-16">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 animate-bounce" />
                <p className="text-sm">Select dimensions and metrics to preview visual</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Inspector Modal */}
      <CodeModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        codeBundle={codeBundle}
        title={`Code: ${previewChartData?.title || 'Visual'}`}
      />
    </div>
  );
}
