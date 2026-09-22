import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Sparkles,
  Pin,
  Code2,
  Mic,
  MicOff,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  ChevronDown,
  ChevronUp,
  Paperclip,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { InteractiveChart } from './InteractiveChart';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function AICopilotChat({
  sessionId,
  schema,
  darkMode,
  onPinToDashboard,
  onDatasetUploaded,
  currentDatasetName,
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your **Intelligent Prompt-to-Visualization Agent**.\n\n📎 **How to Start:**\n1. Click the **Add Attachment** (📎) button below to attach your dataset (CSV, Excel `.xlsx`, JSON), or pick from the top **Datasets** menu.\n2. Type or speak what you'd like to see (or simply click **Generate** for automatic visualization discovery).\n3. I will analyze your data structure, compute key statistical takeaways, and render an interactive visualization with full reproducible source code.\n\n🔘 **Interactive Buttons Available:**\n• **Add Attachment Button:** Attach any dataset directly to your prompt.\n• **Chart Type Switcher Buttons:** Click [Column], [Bar], [Line], [Donut], [Area], or [Scatter] on any chart to transform visualization styles on the fly.\n• **Export Buttons:** Click **[PNG]**, **[.py]**, or **[.js]** to download chart graphics and executable Python/JS scripts.\n• **Pin to Canvas:** Save any visual to your Report Dashboard.\n• **Follow-Up Ideas:** Click any prompt suggestion button for deep-dive analysis.",
      key_findings: [
        'Automatic dimension, metric, and aggregation mapping',
        'Direct multi-language code generation (Python Matplotlib/Plotly, JS Chart.js, SQL/Pandas)',
        'Instant chart type switching and one-click asset downloads',
      ],
      follow_ups: [
        'Show top performers by metric as a bar chart',
        'Compare values across categories as a donut',
        'Plot trend as an area chart',
      ],
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [expandedCodeIdx, setExpandedCodeIdx] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [selectedCodeTab, setSelectedCodeTab] = useState({}); // msgIdx -> tabId
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice recognition
  const startVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) setInputPrompt((p) => (p ? `${p} ${transcript}` : transcript));
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

  const handleSwitchChartType = (msgIdx, newType) => {
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[msgIdx]?.chart_data) {
        copy[msgIdx] = {
          ...copy[msgIdx],
          chart_data: {
            ...copy[msgIdx].chart_data,
            chart_type: newType,
          },
        };
      }
      return copy;
    });
  };

  const handleSendMessage = async (textToSend) => {
    const rawQuery = (textToSend || inputPrompt).trim();
    if ((!rawQuery && !attachedFile) || loading) return;

    setInputPrompt('');
    setLoading(true);

    try {
      let activeSessionId = sessionId;
      let uploadMeta = null;

      // Handle attached dataset upload
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const upRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });
        const schemaData = await upRes.json();
        if (!upRes.ok) throw new Error(schemaData.detail || 'Upload failed');
        activeSessionId = schemaData.session_id;
        uploadMeta = {
          name: attachedFile.name,
          rows: schemaData.row_count,
          cols: schemaData.columns?.length || 0,
        };
        if (onDatasetUploaded) {
          onDatasetUploaded(schemaData, attachedFile.name);
        }
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      if (!activeSessionId) {
        throw new Error('Please select or attach a dataset first.');
      }

      const query = rawQuery || (uploadMeta ? `Analyze uploaded dataset ${uploadMeta.name} and generate the primary recommended visualization` : 'Show primary metrics and distribution');
      
      const userMsg = {
        role: 'user',
        text: query,
        attachedFileName: uploadMeta?.name || null,
      };
      setMessages((prev) => [...prev, userMsg]);

      const res = await fetch(`${API_BASE}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: query,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Copilot query failed');

      let replyPrefix = '';
      if (uploadMeta) {
        replyPrefix = `📁 **Dataset Attached & Analyzed:** \`${uploadMeta.name}\` (${uploadMeta.rows.toLocaleString()} rows, ${uploadMeta.cols} attributes detected).\n\n`;
      }

      const buttonNotice = "\n\n🔘 **Interactive Buttons Available:**\n" +
        "• **Chart Switcher Buttons:** Use the [Column], [Bar], [Line], [Donut], [Area], [Scatter] buttons on the chart to instantly switch visualization styles.\n" +
        "• **Export Buttons:** Click **[PNG]**, **[.py]**, or **[.js]** to download chart graphics and reproducible source code.\n" +
        "• **Pin to Canvas:** Click **[Pin to Canvas]** to send this visual to your Report Dashboard.\n" +
        "• **One-Click Queries:** Click any suggestion button below to explore further.";

      const botMsg = {
        role: 'assistant',
        text: replyPrefix + data.reply + buttonNotice,
        key_findings: data.key_findings || [],
        chart_data: data.chart_data,
        suggested_intent: data.suggested_intent,
        code_bundle: data.code_bundle,
        follow_ups: data.follow_up_suggestions || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Error**: ${err.message || 'Could not process query. Please check your prompt or dataset.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code || '');
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const downloadTextFile = (filename, content) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadImageBase64 = (base64Data, filename) => {
    if (!base64Data) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate intelligent prompt recommendations based on active dataset columns
  const suggestedPrompts = React.useMemo(() => {
    if (!schema || !schema.columns) return [];
    const numCols = schema.columns.filter((c) => c.dtype === 'numeric').map((c) => c.name);
    const catCols = schema.columns.filter((c) => c.dtype === 'category' || c.dtype === 'datetime').map((c) => c.name);
    const list = [];
    if (numCols.length > 0 && catCols.length > 0) {
      list.push(`Show ${numCols[0]} by ${catCols[0]} as a bar chart`);
      list.push(`Compare ${numCols[0]} across ${catCols[0]} as a donut`);
      if (numCols.length > 1) {
        list.push(`Plot ${numCols[1]} trend across ${catCols[0]} as an area chart`);
        list.push(`Compare ${numCols[0]} vs ${numCols[1]} as a scatter plot`);
      } else {
        list.push(`Top 5 ${catCols[0]} by ${numCols[0]}`);
      }
    } else if (catCols.length > 0) {
      list.push(`Count of records by ${catCols[0]} as a pie chart`);
    } else if (numCols.length > 0) {
      list.push(`Distribution of ${numCols[0]} as a histogram`);
    }
    return list.slice(0, 5);
  }, [schema]);

  return (
    <div className="glass-panel rounded-2xl shadow-sm flex flex-col h-[750px] overflow-hidden animate-fadeIn">
      {/* Agent Workspace Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Intelligent Prompt-to-Visualization Agent
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                NLP & Code Engine Active
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Natural language & voice driven visualization with statistical insights and multi-language reproducible code
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const activeTab = selectedCodeTab[idx] || 'python_mpl';

          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                    : 'glass-card text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-slate-800'
                }`}
              >
                {/* Attached File Badge for User Message */}
                {msg.attachedFileName && (
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90 pb-1.5 mb-1.5 border-b border-indigo-400/40 font-semibold">
                    <Paperclip className="w-3 h-3" />
                    <span>Attached Dataset: {msg.attachedFileName}</span>
                  </div>
                )}

                {/* Text Content */}
                <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>

                {/* Key Findings Pills */}
                {msg.key_findings && msg.key_findings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Key Statistical Takeaways:
                    </span>
                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      {msg.key_findings.map((finding, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5">
                          <span className="text-indigo-500 mt-0.5">•</span>
                          <span dangerouslySetInnerHTML={{ __html: finding }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rendered Chart Visual */}
                {msg.chart_data && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800">
                    <div className="flex flex-col gap-2.5 mb-3 pb-2.5 border-b border-gray-200 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>📊</span>
                          <span>{msg.chart_data.title}</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {msg.image_base64 && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadImageBase64(
                                  msg.image_base64,
                                  `${(msg.chart_data.title || 'chart').replace(/\W+/g, '_')}.png`
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
                              title="Download PNG chart image"
                            >
                              <Download className="w-3 h-3 text-cyan-500" />
                              PNG
                            </button>
                          )}
                          {msg.code_bundle?.python_matplotlib && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadTextFile(
                                  `${(msg.chart_data.title || 'visualization').replace(/\W+/g, '_')}.py`,
                                  msg.code_bundle.python_matplotlib
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
                              title="Download Python Matplotlib script (.py)"
                            >
                              <Download className="w-3 h-3 text-amber-500" />
                              .py
                            </button>
                          )}
                          {msg.code_bundle?.javascript_chartjs && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadTextFile(
                                  `${(msg.chart_data.title || 'chart').replace(/\W+/g, '_')}.js`,
                                  msg.code_bundle.javascript_chartjs
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition"
                              title="Download JavaScript Chart.js script (.js)"
                            >
                              <Download className="w-3 h-3 text-yellow-500" />
                              .js
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onPinToDashboard({
                                id: 'copilot_' + Date.now(),
                                title: msg.chart_data.title,
                                type: msg.chart_data.chart_type,
                                xAxis: msg.chart_data.x_label,
                                yAxis: msg.chart_data.y_label,
                                aggregation: msg.chart_data.aggregation || 'sum',
                                chartData: msg.chart_data,
                                codeBundle: msg.code_bundle,
                              })
                            }
                            className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                            title="Pin this visual to the Report Canvas"
                          >
                            <Pin className="w-3 h-3" />
                            Pin to Canvas
                          </button>
                        </div>
                      </div>

                      {/* Chart Switcher Buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap mr-1">
                          Chart Type:
                        </span>
                        {[
                          { id: 'column', label: 'Column', icon: '📊' },
                          { id: 'bar', label: 'Bar', icon: '📊' },
                          { id: 'line', label: 'Line', icon: '📈' },
                          { id: 'area', label: 'Area', icon: '🏔️' },
                          { id: 'donut', label: 'Donut', icon: '🍩' },
                          { id: 'scatter', label: 'Scatter', icon: '📉' },
                          { id: 'radar', label: 'Radar', icon: '🕸️' },
                        ].map((tb) => (
                          <button
                            key={tb.id}
                            type="button"
                            onClick={() => handleSwitchChartType(idx, tb.id)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1 border ${
                              (msg.chart_data.chart_type === tb.id || (tb.id === 'column' && msg.chart_data.chart_type === 'bar' && !msg.chart_data.indexAxis))
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                          >
                            <span>{tb.icon}</span>
                            <span>{tb.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[260px] w-full">
                      <InteractiveChart chartData={msg.chart_data} darkMode={darkMode} height="260px" />
                    </div>
                  </div>
                )}

                {/* Multi-Language Code Accordion */}
                {msg.code_bundle && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/60">
                    <button
                      onClick={() =>
                        setExpandedCodeIdx(expandedCodeIdx === idx ? null : idx)
                      }
                      className="flex items-center justify-between w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Mention All Code (Python, Plotly, JS Chart.js, SQL/DAX)
                      </span>
                      {expandedCodeIdx === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedCodeIdx === idx && (
                      <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                        {/* Tab Headers */}
                        <div className="flex border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
                          {[
                            { id: 'python_mpl', label: 'Python (Matplotlib/Seaborn)', code: msg.code_bundle.python_matplotlib },
                            { id: 'python_plotly', label: 'Python (Plotly)', code: msg.code_bundle.python_plotly },
                            { id: 'javascript', label: 'JavaScript (Chart.js)', code: msg.code_bundle.javascript_chartjs },
                            { id: 'sql_pandas', label: 'SQL / DAX / Pandas', code: msg.code_bundle.sql_pandas },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() =>
                                setSelectedCodeTab((prev) => ({ ...prev, [idx]: t.id }))
                              }
                              className={`px-3.5 py-2 whitespace-nowrap text-[11px] font-medium border-b-2 transition ${
                                activeTab === t.id
                                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                                  : 'border-transparent text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 relative">
                          {(() => {
                            const codeMap = {
                              python_mpl: msg.code_bundle.python_matplotlib,
                              python_plotly: msg.code_bundle.python_plotly,
                              javascript: msg.code_bundle.javascript_chartjs,
                              sql_pandas: msg.code_bundle.sql_pandas,
                            };
                            const codeText = codeMap[activeTab] || codeMap.python_mpl;
                            const copyKey = `${idx}_${activeTab}`;
                            return (
                              <>
                                <button
                                  onClick={() => handleCopy(codeText, copyKey)}
                                  className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                                >
                                  {copiedCodeId === copyKey ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  {copiedCodeId === copyKey ? 'Copied' : 'Copy'}
                                </button>
                                <pre className="overflow-x-auto text-slate-300 font-mono leading-relaxed max-h-60 pt-4">
                                  <code>{codeText}</code>
                                </pre>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Follow-up suggestions */}
              {msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.follow_ups.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition"
                    >
                      💬 {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl glass-card w-80 animate-pulse">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Agent is analyzing data & generating visual code...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {suggestedPrompts && suggestedPrompts.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-gray-400 font-semibold whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Prompt Ideas:
          </span>
          {suggestedPrompts.map((pText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(pText)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 whitespace-nowrap transition text-left"
            >
              {pText}
            </button>
          ))}
        </div>
      )}

      {/* Attached File Preview Chip */}
      {attachedFile && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800 bg-indigo-50/80 dark:bg-indigo-950/50 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
            <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ready to analyze: <strong className="underline">{attachedFile.name}</strong></span>
            <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
              ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttachedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Hidden file input for Add Attachment */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAttachedFile(file);
            }}
            accept=".csv,.xlsx,.xls,.json,.txt"
            className="hidden"
          />

          {/* Add Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
              attachedFile
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
            }`}
            title="Add Attachment (Upload CSV, XLSX, JSON dataset)"
          >
            <Paperclip className={`w-4 h-4 ${attachedFile ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
            <span className="hidden sm:inline">Add Attachment</span>
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={listening ? stopVoice : startVoice}
            className={`p-2.5 rounded-xl border transition ${
              listening
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            title="Voice input (Speech to Text)"
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Prompt Text Input */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={
              attachedFile
                ? `Prompt for ${attachedFile.name} (optional - or click Generate for automatic visual discovery)...`
                : "Describe visualization (e.g. 'Show sales by category as a bar chart') or click Add Attachment..."
            }
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={loading}
          />

          {/* Submit / Generate Button */}
          <button
            type="submit"
            disabled={(!inputPrompt.trim() && !attachedFile) || loading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Generate
          </button>
        </form>
      </div>
    </div>
  );
}
