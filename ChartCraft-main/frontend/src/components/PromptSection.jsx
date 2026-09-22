import { useState, useRef, useCallback } from 'react';

export function PromptSection({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  disabled,
  usePlotly,
  setUsePlotly,
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startVoice = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) setPrompt((p) => (p ? p + ' ' + transcript : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span>💬</span> Describe Your Visualization
      </h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Show average marks by subject as bar chart"
        className="w-full h-28 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 resize-none"
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Quick examples:</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {[
          'Average marks by subject as a bar chart',
          'Sales by region this year',
          'Price vs rating as a scatter plot',
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => setPrompt(chip)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={listening ? stopVoice : startVoice}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            listening
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Voice input"
        >
          🎤 {listening ? 'Stop' : 'Voice'}
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePlotly}
            onChange={(e) => setUsePlotly(e.target.checked)}
            className="rounded text-indigo-600"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Interactive (Plotly)
          </span>
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || loading}
          className="ml-auto px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
    </div>
  );
}
