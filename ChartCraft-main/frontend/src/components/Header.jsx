import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  Table as TableIcon,
  Sun,
  Moon,
  Upload,
  FolderOpen,
  FileDown,
  Maximize2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const SAMPLE_DATASETS = [
  { id: 'sales_superstore.csv', name: 'Global Superstore (Sales & Profit)', icon: '🛒' },
  { id: 'tech_stocks.csv', name: 'Tech Giants Financials (Equity Analytics)', icon: '📈' },
  { id: 'sample_marks.csv', name: 'Student Academic Performance', icon: '🎓' },
  { id: 'hr_workforce.csv', name: 'HR Workforce & Retention', icon: '👥' },
];

export function Header({
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  currentDatasetName,
  onSelectSample,
  onOpenUpload,
  onExportReport,
}) {
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);

  const views = [
    { id: 'agent', label: 'Prompt Agent', icon: Bot, badge: 'AI Agent' },
    { id: 'dashboard', label: 'Report Canvas', icon: LayoutDashboard },
    { id: 'builder', label: 'Visual Builder', icon: BarChart3 },
    { id: 'data', label: 'Data Studio', icon: TableIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4 h-16 max-w-7xl flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                Prompt-to-Visualization Agent
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                AI Powered
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
              {currentDatasetName || 'No Dataset Selected'}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Power BI View Modes) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/60">
          {views.map((v) => {
            const Icon = v.icon;
            const active = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{v.label}</span>
                {v.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 font-bold animate-pulse">
                    {v.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & Dataset Selector */}
        <div className="flex items-center gap-2">
          {/* Sample Datasets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSampleDropdownOpen(!sampleDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Datasets</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {sampleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setSampleDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-gray-200 dark:border-slate-800 p-2 z-30 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-gray-400">
                    Pre-Loaded Industry Datasets
                  </div>
                  {SAMPLE_DATASETS.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => {
                        onSelectSample(ds.id);
                        setSampleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <span className="text-base">{ds.icon}</span>
                      <span className="truncate font-medium">{ds.name}</span>
                    </button>
                  ))}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        onOpenUpload();
                        setSampleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Custom Dataset (CSV/XLSX)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Report Button */}
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
            title="Export Dashboard Report"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex border-t border-gray-200 dark:border-slate-800 px-4 py-2 bg-gray-50/70 dark:bg-slate-900/70 overflow-x-auto gap-2">
        {views.map((v) => {
          const Icon = v.icon;
          const active = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
