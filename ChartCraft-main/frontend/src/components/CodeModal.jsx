import React, { useState } from 'react';
import { Copy, Check, Download, X, Code2, Terminal, Database } from 'lucide-react';

export function CodeModal({ isOpen, onClose, codeBundle, title = 'Visual Code Export' }) {
  const [activeTab, setActiveTab] = useState('python_mpl');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !codeBundle) return null;

  const tabs = [
    { id: 'python_mpl', label: 'Python (Matplotlib/Seaborn)', icon: Terminal, code: codeBundle.python_matplotlib, ext: 'py' },
    { id: 'python_plotly', label: 'Python (Plotly)', icon: Terminal, code: codeBundle.python_plotly, ext: 'py' },
    { id: 'javascript', label: 'JavaScript (Chart.js)', icon: Code2, code: codeBundle.javascript_chartjs, ext: 'js' },
    { id: 'sql_pandas', label: 'SQL / DAX / Pandas', icon: Database, code: codeBundle.sql_pandas, ext: 'sql' },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTab.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([currentTab.code || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `chartcraft_visual.${currentTab.ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Production-ready code generation across platforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="relative flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="overflow-x-auto whitespace-pre">
            <code>{currentTab.code || '// No code available for this configuration'}</code>
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Export format: <span className="font-semibold uppercase text-indigo-500">{currentTab.ext}</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
