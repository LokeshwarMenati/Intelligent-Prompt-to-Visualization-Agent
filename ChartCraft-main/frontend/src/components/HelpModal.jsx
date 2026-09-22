export function HelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">How to Use ChartCraft</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 text-gray-600 dark:text-gray-400">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Upload Your Data</h3>
            <p>Supports CSV, JSON, and Excel. Drag and drop or click to browse.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Describe Your Visualization</h3>
            <p>Use natural language. Be specific about chart types and columns, e.g. “average marks by subject as a bar chart”.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Generate</h3>
            <p>Click Generate. Download the chart PNG or copy/export the Python code.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Examples</h3>
            <p>Use the menu → Examples to load sample marks data and try a prompt immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
