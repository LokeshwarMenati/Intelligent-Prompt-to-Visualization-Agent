import React, { useState, useMemo } from 'react';
import {
  Filter,
  X,
  Plus,
  Maximize2,
  Code2,
  Trash2,
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  Database,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { InteractiveChart } from './InteractiveChart';
import { CodeModal } from './CodeModal';

export function PowerBIDashboard({
  schema,
  summary,
  rawData,
  visuals,
  setVisuals,
  darkMode,
  onOpenBuilder,
}) {
  const [activeFilterCol, setActiveFilterCol] = useState('');
  const [activeFilterVal, setActiveFilterVal] = useState('');
  const [codeModalVis, setCodeModalVis] = useState(null);
  const [fullscreenVis, setFullscreenVis] = useState(null);

  const columns = schema?.columns || [];
  const catColumns = columns.filter((c) => c.dtype === 'category' || c.dtype === 'datetime').map((c) => c.name);

  // Available unique values for the active filter column
  const filterColOptions = useMemo(() => {
    if (!activeFilterCol || !rawData) return [];
    const set = new Set();
    rawData.forEach((r) => {
      if (r[activeFilterCol] !== undefined && r[activeFilterCol] !== null) {
        set.add(String(r[activeFilterCol]));
      }
    });
    return Array.from(set).slice(0, 40);
  }, [activeFilterCol, rawData]);

  // Filtered dataset based on global slicer
  const filteredData = useMemo(() => {
    if (!activeFilterCol || !activeFilterVal || !rawData) return rawData || [];
    return rawData.filter((r) => String(r[activeFilterCol]) === String(activeFilterVal));
  }, [rawData, activeFilterCol, activeFilterVal]);

  // Compute live KPI values based on filtered data
  const kpis = useMemo(() => {
    const totalCount = filteredData.length;
    const numericCols = columns.filter((c) => c.dtype === 'numeric').map((c) => c.name);
    
    if (numericCols.length === 0) {
      return [
        { label: 'Total Records', value: totalCount.toLocaleString(), icon: Database, color: 'text-indigo-500' },
        { label: 'Dimensions', value: catColumns.length, icon: Layers, color: 'text-cyan-500' },
      ];
    }

    const primaryCol = numericCols[0];
    const sum = filteredData.reduce((acc, r) => acc + (parseFloat(r[primaryCol]) || 0), 0);
    const avg = totalCount > 0 ? sum / totalCount : 0;
    const max = filteredData.reduce((acc, r) => Math.max(acc, parseFloat(r[primaryCol]) || 0), 0);

    return [
      {
        label: `Total ${primaryCol}`,
        value: sum >= 1000 ? `${sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : sum.toFixed(2),
        sub: 'Aggregated Sum',
        icon: DollarSign,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      },
      {
        label: `Average ${primaryCol}`,
        value: avg.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        sub: 'Mean per entry',
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      },
      {
        label: `Peak ${primaryCol}`,
        value: max.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        sub: 'Maximum record',
        icon: Sparkles,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
      },
      {
        label: 'Filtered Volume',
        value: `${totalCount} / ${rawData?.length || 0}`,
        sub: activeFilterVal ? `Filtered: ${activeFilterVal}` : 'Full Dataset',
        icon: Database,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-500/10',
      },
    ];
  }, [filteredData, rawData, columns, catColumns, activeFilterVal]);

  // Recalculate visuals data reactively when filters change
  const computedVisuals = useMemo(() => {
    return visuals.map((vis) => {
      const { xAxis, yAxis, aggregation = 'sum', type } = vis;
      if (!filteredData || filteredData.length === 0 || !xAxis || !yAxis) return vis;

      const groups = {};
      filteredData.forEach((row) => {
        const key = String(row[xAxis] ?? 'Other');
        const val = parseFloat(row[yAxis]) || 0;
        if (!groups[key]) {
          groups[key] = { count: 0, sum: 0, min: val, max: val };
        }
        groups[key].count += 1;
        groups[key].sum += val;
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
        return Number(g.sum.toFixed(2));
      });

      return {
        ...vis,
        chartData: {
          ...vis.chartData,
          labels,
          values,
        },
      };
    });
  }, [visuals, filteredData]);

  // Handle cross-filtering when user clicks a chart slice/bar
  const handleSliceClick = (dimensionName, sliceValue) => {
    setActiveFilterCol(dimensionName);
    setActiveFilterVal(sliceValue);
  };

  const handleClearFilter = () => {
    setActiveFilterCol('');
    setActiveFilterVal('');
  };

  const handleRemoveVisual = (id) => {
    setVisuals((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSwitchType = (id, newType) => {
    setVisuals((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            type: newType,
            chartData: { ...v.chartData, chart_type: newType },
          };
        }
        return v;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Slicer / Global Filter Bar */}
      <div className="glass-panel px-5 py-3.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Power BI Slicers:</span>
          </div>

          {/* Dimension selector */}
          <select
            value={activeFilterCol}
            onChange={(e) => {
              setActiveFilterCol(e.target.value);
              setActiveFilterVal('');
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select Slicer Dimension...</option>
            {catColumns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Slicer values dropdown */}
          {activeFilterCol && (
            <select
              value={activeFilterVal}
              onChange={(e) => setActiveFilterVal(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-600/50 bg-indigo-50/50 dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Categories ({filterColOptions.length})</option>
              {filterColOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {activeFilterVal && (
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 transition"
            >
              <X className="w-3 h-3" />
              Clear Slicer
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBuilder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Visual
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-card p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
                    {kpi.value}
                  </h4>
                  {kpi.sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{kpi.sub}</p>}
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Chart Visuals Grid */}
      {computedVisuals.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Canvas is Ready</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Create custom Power BI charts using the Visual Builder, or ask the AI Copilot to generate and pin charts directly here.
          </p>
          <button
            onClick={onOpenBuilder}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
          >
            Open Visual Builder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {computedVisuals.map((vis) => (
            <div
              key={vis.id}
              className="glass-card rounded-2xl p-5 flex flex-col min-h-[380px] relative transition-all"
            >
              {/* Visual Card Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-slate-800">
                <div className="truncate pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                    {vis.type?.replace('_', ' ')} · {vis.aggregation || 'SUM'}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {vis.title || `${vis.yAxis} by ${vis.xAxis}`}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Quick Type Switcher */}
                  <select
                    value={vis.type}
                    onChange={(e) => handleSwitchType(vis.id, e.target.value)}
                    className="text-[11px] px-2 py-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none"
                    title="Change Visual Type"
                  >
                    <option value="column">Column</option>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="area">Area</option>
                    <option value="pie">Pie</option>
                    <option value="donut">Donut</option>
                    <option value="polarArea">Polar</option>
                    <option value="radar">Radar</option>
                    <option value="scatter">Scatter</option>
                  </select>

                  {/* Code Button */}
                  <button
                    onClick={() => setCodeModalVis(vis)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    title="Inspect Visual Code"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveVisual(vis.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    title="Remove Visual"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chart Body */}
              <div className="flex-1 w-full relative min-h-[280px]">
                <InteractiveChart
                  chartData={vis.chartData}
                  darkMode={darkMode}
                  palette={vis.palette || 'powerbi'}
                  onSliceClick={handleSliceClick}
                  height="280px"
                />
              </div>

              {/* Cross filter tooltip tip */}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-gray-400">
                <span>💡 Click any bar/slice to cross-filter dashboard</span>
                <span>{vis.xAxis} → {vis.yAxis}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Modal */}
      {codeModalVis && (
        <CodeModal
          isOpen={!!codeModalVis}
          onClose={() => setCodeModalVis(null)}
          codeBundle={codeModalVis.codeBundle}
          title={`Code: ${codeModalVis.title}`}
        />
      )}
    </div>
  );
}
