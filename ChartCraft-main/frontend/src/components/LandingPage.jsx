export function LandingPage({ onTryNow, onSample }) {
  return (
    <div>
      <section className="min-h-[70vh] flex flex-col lg:flex-row items-center justify-center gap-12 px-4 py-16 lg:py-24">
        <div className="max-w-2xl text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
            Turn Data Into Clear Visual Stories — Instantly.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Upload your dataset, say what you want to see, and ChartCraft will render a polished
            visualization and provide the exact code to reproduce it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              type="button"
              onClick={onTryNow}
              className="px-8 py-4 text-lg font-medium rounded-lg bg-gray-900 text-white hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              Try It Now — Upload Data
            </button>
            <button
              type="button"
              onClick={onSample}
              className="px-8 py-4 text-lg font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Try with sample data
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 w-64 h-64 lg:w-80 lg:h-80 opacity-30">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
            <rect x="40" y="120" width="25" height="60" fill="currentColor" />
            <rect x="75" y="80" width="25" height="100" fill="currentColor" />
            <rect x="110" y="100" width="25" height="80" fill="currentColor" />
            <rect x="145" y="60" width="25" height="120" fill="currentColor" />
            <line x1="30" y1="180" x2="180" y2="180" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-100 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">How it Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Upload — CSV, JSON, or Excel', body: 'Drag and drop your file or click to browse. Supports standard tabular formats.' },
              { title: 'Describe — Natural language', body: 'e.g. "sales by region" or "average marks by subject". Plain English works.' },
              { title: 'Generate — Chart + code', body: 'Get a polished chart, Python code, and an explanation you can download.' },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 text-center"
              >
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">Why It Works</h2>
          <ul className="space-y-4 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-3">✓ Natural-language chart mapping with reliable fallbacks</li>
            <li className="flex items-start gap-3">✓ Reproducible Python (Matplotlib) code</li>
            <li className="flex items-start gap-3">✓ Built for non-developers and analysts</li>
            <li className="flex items-start gap-3">✓ Privacy-friendly: data stays in your session</li>
          </ul>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-100 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">Feature Highlights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ['Explainability', 'Know why a chart was chosen'],
              ['Export', 'Download PNG and Python code'],
              ['Interactive', 'Optional Plotly charts'],
              ['Voice prompt', 'Speak your chart request'],
            ].map(([title, body]) => (
              <div
                key={title}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700"
              >
                <h4 className="font-semibold mb-2">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <div>
            <span className="font-bold text-gray-800 dark:text-gray-200">ChartCraft</span>
            <p>Turn data into clear visual stories</p>
          </div>
          <p className="text-xs">© 2026 ChartCraft — Demo Build • Privacy-first • v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}
