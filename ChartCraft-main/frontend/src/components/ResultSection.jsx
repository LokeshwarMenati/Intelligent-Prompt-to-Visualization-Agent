import { useState } from 'react';

export function ResultSection({ result, loading }) {
  const [activeTab, setActiveTab] = useState('chart');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating visualization…</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Upload data, enter a prompt, and click Generate.
        </p>
      </div>
    );
  }

  const hasImage = result.image_base64;
  const hasError = result.error;

  return (
    <div className="space-y-4">
      {/* Explanation / Error */}
      <div
        className={`p-4 rounded-lg text-sm ${
          hasError
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
        }`}
      >
        {hasError ? result.error : result.explanation}
      </div>

      {/* Tabs: Chart | Code */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'chart'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'code'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Code
          </button>
        </div>

        <div className="p-4 min-h-[280px]">
          {activeTab === 'chart' && (
            <div className="flex flex-col items-center gap-4">
              {hasImage ? (
                <>
                  <img
                    src={`data:image/png;base64,${result.image_base64}`}
                    alt="Generated chart"
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <a
                    href={`data:image/png;base64,${result.image_base64}`}
                    download="chart.png"
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                  >
                    Download chart
                  </a>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No image generated.</p>
              )}
            </div>
          )}
          {activeTab === 'code' && (
            <div className="relative">
              <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-sm overflow-x-auto overflow-y-auto max-h-[400px]">
                <code>{result.code || '# No code generated'}</code>
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.code || '');
                }}
                className="absolute top-2 right-2 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
              >
                Copy
              </button>
              {result.code && (
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(result.code)}`}
                  download="visualization.py"
                  className="mt-2 inline-block px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                >
                  Download .py
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
