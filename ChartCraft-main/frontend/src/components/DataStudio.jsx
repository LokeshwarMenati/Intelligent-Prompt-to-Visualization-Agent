import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Search,
  ArrowUpDown,
  Hash,
  Type,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export function DataStudio({ schema, summary, rawData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const columns = schema?.columns || [];

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    if (!rawData) return [];
    let rows = [...rawData];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(term))
      );
    }

    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [rawData, searchTerm, sortCol, sortOrder]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = processedRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (colName) => {
    if (sortCol === colName) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colName);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Column Statistical Profiling Strip */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          Power BI Column Profiler ({columns.length} Columns)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {columns.map((col) => {
            const stat = summary?.columns?.find((c) => c.name === col.name);
            const isNum = col.dtype === 'numeric';
            return (
              <div
                key={col.name}
                className="glass-card p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">{col.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      isNum
                        ? 'bg-blue-500/10 text-blue-500'
                        : col.dtype === 'datetime'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {col.dtype}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                  <div>Unique: <span className="font-medium text-gray-700 dark:text-gray-200">{stat?.unique_count ?? col.unique_count ?? '-'}</span></div>
                  {isNum && stat && (
                    <>
                      <div>Mean: <span className="font-medium text-gray-700 dark:text-gray-200">{stat.mean ?? '-'}</span></div>
                      <div>Range: <span className="font-medium text-gray-700 dark:text-gray-200">{stat.min} - {stat.max}</span></div>
                    </>
                  )}
                  {!isNum && stat?.top_values && stat.top_values[0] && (
                    <div>Top: <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{stat.top_values[0].value}</span></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabular Grid Viewer */}
      <div className="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Search and Metadata Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Tabular Data Grid ({processedRows.length} rows)
            </h3>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search table values..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
            <thead className="sticky top-0 bg-gray-100/90 dark:bg-slate-900/90 backdrop-blur-sm text-gray-900 dark:text-white uppercase font-bold tracking-wider text-[11px] border-b border-gray-200 dark:border-slate-800 z-10">
              <tr>
                <th className="px-4 py-3 w-12 text-center text-gray-400">#</th>
                {columns.map((c) => (
                  <th
                    key={c.name}
                    onClick={() => handleSort(c.name)}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-slate-800 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-gray-400">
                    No matching records found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-center text-gray-400 font-mono text-[10px]">
                      {(page - 1) * pageSize + rIdx + 1}
                    </td>
                    {columns.map((c) => (
                      <td key={c.name} className="px-4 py-2.5 truncate max-w-[200px]">
                        {row[c.name] !== undefined && row[c.name] !== null ? String(row[c.name]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, processedRows.length)} of {processedRows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
