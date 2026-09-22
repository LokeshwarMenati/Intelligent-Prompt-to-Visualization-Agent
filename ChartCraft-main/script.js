// Global Variables
var currentData = null;
var selectedChartType = 'bar';
var currentChart = null;
var currentChartConfig = null;
var pendingAIConfig = null;
var currentFileName = '';
var lastGeneratedCode = { js: '', python: '' };
var currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('vizLang')) || 'en';
var isUpdatingColumnSelectors = false; // guard to prevent createChart -> populateColumnSelectors -> change -> applyColumnMapping -> createChart loop

// Chat assistant (context-limited, client-only; ready for future /api/chat)
var chatHistory = [];
var chatContextChartDataUrl = null;
var CHAT_REFUSAL_MESSAGE = 'I can only answer questions about the current uploaded dataset and the generated visualization. Please ask about the dataset, selected chart, or chart data.';

// Translations: en (English), es (Spanish), hi (Hindi)
var i18n = {
    en: {
        title: 'Intelligent Prompt-to-Visualization Agent',
        appTitle: 'DataViz Agent',
        appTagline: 'Transform your data into insights with natural language',
        useAi: 'Use AI',
        ruleBasedBadge: 'Rule-based mode',
        aiModeBadge: 'AI mode',
        apiKeyPlaceholder: 'OpenAI API Key (optional)',
        apiKeyOpenAIPlaceholder: 'OpenAI API key (optional if set on server)',
        apiKeyGeminiPlaceholder: 'Gemini API key (optional if set on server)',
        loadExample: 'Load Example',
        help: 'Help',
        uploadDataset: 'Upload Dataset',
        uploadDrag: 'Drag and drop your file here (CSV or JSON)',
        uploadOr: 'or click Browse — .csv, .json, .txt, or any file with table data',
        browseFiles: 'Browse Files',
        describeViz: 'Describe Your Visualization',
        selectChartType: 'Select chart type',
        yourPromptLabel: 'Your prompt (e.g. what to show: "sales by region", "average marks by subject")',
        promptPlaceholder: 'e.g. average marks by subject, sales by region',
        promptExamples: 'Quick examples:',
        barChart: 'Bar Chart',
        lineChart: 'Line Chart',
        pieChart: 'Pie Chart',
        scatterPlot: 'Scatter Plot',
        generate: 'Generate',
        dataPreview: 'Data Preview',
        generatedViz: 'Generated Visualization',
        download: 'Download',
        reset: 'Reset',
        generatedCode: 'Generated Code',
        copyCode: 'Copy Code',
        exportJs: 'Export JS',
        exportPython: 'Export Python',
        proTips: 'Pro Tips',
        tip1: 'Be specific about which columns to use for axes and grouping',
        tip2: 'Mention chart types: bar, line, pie, scatter, area, doughnut',
        tip3: 'Specify colors, titles, and styling preferences',
        tip4: 'Request aggregations: sum, average, count, min, max',
        helpTitle: 'How to Use DataViz Agent',
        helpStep1: '1. Upload Your Data',
        helpStep1Desc: 'Supports CSV and JSON files. Drag and drop or click to browse.',
        helpStep2: '2. Describe Your Visualization',
        helpStep2Desc: 'Use natural language to describe what you want to see. Be specific about chart types, data columns, and styling.',
        helpStep3: '3. (Optional) Use AI',
        helpStep3Desc: 'Run the app from the Node server and check Use AI. Choose OpenAI or Gemini, then enter the matching API key (optional if set in server .env). With Gemini, the app sends the first 3 rows of your data plus your prompt to analyze and recommend the best chart. Get a Gemini API key from Google AI Studio (https://aistudio.google.com/apikey).',
        helpStep4: '4. Generate & Customize',
        helpStep4Desc: 'Click Generate to create your visualization. Download the chart or copy/export the generated code.',
        examplePrompts: 'Example Prompts:',
        example1: '"Create a bar chart showing sales by product category"',
        example2: '"Plot temperature trends over the last 12 months as a line chart"',
        example3: '"Show market share distribution as a pie chart with percentages"',
        example4: '"Create a scatter plot comparing price vs. rating"'
    },
    es: {
        title: 'Agente de Visualización por Lenguaje Natural',
        appTitle: 'DataViz Agent',
        appTagline: 'Convierte tus datos en insights con lenguaje natural',
        useAi: 'Usar IA',
        ruleBasedBadge: 'Modo basado en reglas',
        aiModeBadge: 'Modo IA',
        apiKeyPlaceholder: 'Clave API OpenAI (opcional)',
        apiKeyOpenAIPlaceholder: 'Clave API OpenAI (opcional si está en servidor)',
        apiKeyGeminiPlaceholder: 'Clave API Gemini (opcional si está en servidor)',
        loadExample: 'Cargar ejemplo',
        help: 'Ayuda',
        uploadDataset: 'Subir datos',
        uploadDrag: 'Arrastra tu archivo aquí (CSV o JSON)',
        uploadOr: 'o haz clic en Examinar — .csv, .json, .txt',
        browseFiles: 'Examinar archivos',
        describeViz: 'Describe tu visualización',
        selectChartType: 'Elige el tipo de gráfico',
        yourPromptLabel: 'Tu indicación (ej. qué mostrar: "ventas por región", "notas medias por asignatura")',
        promptPlaceholder: 'ej. notas medias por asignatura, ventas por región',
        promptExamples: 'Ejemplos rápidos:',
        barChart: 'Barras',
        lineChart: 'Líneas',
        pieChart: 'Circular',
        scatterPlot: 'Dispersión',
        generate: 'Generar',
        dataPreview: 'Vista previa',
        generatedViz: 'Visualización generada',
        download: 'Descargar',
        reset: 'Reiniciar',
        generatedCode: 'Código generado',
        copyCode: 'Copiar código',
        exportJs: 'Exportar JS',
        exportPython: 'Exportar Python',
        proTips: 'Consejos',
        tip1: 'Sé específico con las columnas para ejes y agrupación',
        tip2: 'Menciona el tipo: barras, líneas, circular, dispersión, área',
        tip3: 'Indica colores, títulos y estilo si quieres',
        tip4: 'Pide agregaciones: suma, promedio, conteo, mínimo, máximo',
        helpTitle: 'Cómo usar DataViz Agent',
        helpStep1: '1. Sube tus datos',
        helpStep1Desc: 'Archivos CSV y JSON. Arrastra o haz clic para examinar.',
        helpStep2: '2. Describe tu visualización',
        helpStep2Desc: 'Usa lenguaje natural. Sé específico con tipo de gráfico y columnas.',
        helpStep3: '3. (Opcional) Usar IA',
        helpStep3Desc: 'Ejecuta el servidor Node y activa Usar IA. Elige OpenAI o Gemini e introduce la clave API (opcional si está en .env). Con Gemini, la app envía las primeras 3 filas y tu indicación para recomendar el mejor gráfico. Obtén una clave Gemini en Google AI Studio (https://aistudio.google.com/apikey).',
        helpStep4: '4. Generar y personalizar',
        helpStep4Desc: 'Haz clic en Generar. Descarga el gráfico o copia/exporta el código.',
        examplePrompts: 'Ejemplos de prompts:',
        example1: '"Gráfico de barras de ventas por categoría"',
        example2: '"Tendencias de temperatura por mes como gráfico de líneas"',
        example3: '"Participación de mercado como gráfico circular con porcentajes"',
        example4: '"Gráfico de dispersión precio vs. valoración"'
    },
    hi: {
        title: 'प्राकृतिक भाषा से विज़ुअलाइज़ेशन एजेंट',
        appTitle: 'DataViz Agent',
        appTagline: 'अपने डेटा को प्राकृतिक भाषा में इनसाइट्स में बदलें',
        useAi: 'AI इस्तेमाल करें',
        ruleBasedBadge: 'रूल-आधारित मोड',
        aiModeBadge: 'AI मोड',
        apiKeyPlaceholder: 'OpenAI API कुंजी (वैकल्पिक)',
        apiKeyOpenAIPlaceholder: 'OpenAI API कुंजी (सर्वर में हो तो वैकल्पिक)',
        apiKeyGeminiPlaceholder: 'Gemini API कुंजी (सर्वर में हो तो वैकल्पिक)',
        loadExample: 'उदाहरण लोड करें',
        help: 'मदद',
        uploadDataset: 'डेटासेट अपलोड करें',
        uploadDrag: 'अपनी फ़ाइल यहाँ खींचें (CSV या JSON)',
        uploadOr: 'या ब्राउज़ करें — .csv, .json, .txt',
        browseFiles: 'फ़ाइलें ब्राउज़ करें',
        describeViz: 'अपनी विज़ुअलाइज़ेशन बताएं',
        selectChartType: 'चार्ट प्रकार चुनें',
        yourPromptLabel: 'आपका प्रॉम्प्ट (जैसे: "क्षेत्र के हिसाब से बिक्री", "विषय के हिसाब से औसत अंक")',
        promptPlaceholder: 'जैसे विषय के हिसाब से औसत अंक, क्षेत्र के हिसाब से बिक्री',
        promptExamples: 'त्वरित उदाहरण:',
        barChart: 'बार चार्ट',
        lineChart: 'लाइन चार्ट',
        pieChart: 'पाई चार्ट',
        scatterPlot: 'स्कैटर प्लॉट',
        generate: 'जनरेट करें',
        dataPreview: 'डेटा पूर्वावलोकन',
        generatedViz: 'जनरेट की गई विज़ुअलाइज़ेशन',
        download: 'डाउनलोड',
        reset: 'रीसेट',
        generatedCode: 'जनरेट किया गया कोड',
        copyCode: 'कोड कॉपी करें',
        exportJs: 'JS एक्सपोर्ट',
        exportPython: 'Python एक्सपोर्ट',
        proTips: 'टिप्स',
        tip1: 'अक्षों और ग्रुपिंग के लिए कॉलम स्पष्ट बताएं',
        tip2: 'चार्ट प्रकार बताएं: bar, line, pie, scatter, area',
        tip3: 'रंग, शीर्षक और स्टाइल बता सकते हैं',
        tip4: 'योग, औसत, गिनती जैसी एग्रीगेशन माँग सकते हैं',
        helpTitle: 'DataViz Agent कैसे इस्तेमाल करें',
        helpStep1: '1. अपना डेटा अपलोड करें',
        helpStep1Desc: 'CSV और JSON फ़ाइलें। ड्रैग करें या ब्राउज़ करें।',
        helpStep2: '2. विज़ुअलाइज़ेशन बताएं',
        helpStep2Desc: 'प्राकृतिक भाषा में बताएं कि क्या चार्ट चाहिए।',
        helpStep3: '3. (वैकल्पिक) AI इस्तेमाल करें',
        helpStep3Desc: 'Node सर्वर चलाएं और Use AI चुनें। OpenAI या Gemini चुनें और API कुंजी डालें (सर्वर .env में हो तो वैकल्पिक)। Gemini के साथ ऐप आपके डेटा की पहली 3 पंक्तियाँ और प्रॉम्प्ट भेजता है। Gemini API कुंजी Google AI Studio (https://aistudio.google.com/apikey) से लें।',
        helpStep4: '4. जनरेट करें और एक्सपोर्ट करें',
        helpStep4Desc: 'Generate पर क्लिक करें। चार्ट डाउनलोड करें या कोड कॉपी करें।',
        examplePrompts: 'उदाहरण प्रॉम्प्ट:',
        example1: '"उत्पाद श्रेणी के हिसाब से बिक्री का बार चार्ट"',
        example2: '"महीनों में तापमान ट्रेंड लाइन चार्ट"',
        example3: '"मार्केट शेयर पाई चार्ट में प्रतिशत के साथ"',
        example4: '"कीमत बनाम रेटिंग स्कैटर प्लॉट"'
    }
};

function t(key) {
    var lang = i18n[currentLang];
    return (lang && lang[key]) || (i18n.en && i18n.en[key]) || key;
}

function setLanguage(lang) {
    currentLang = lang;
    try { localStorage.setItem('vizLang', lang); } catch (e) {}
    document.getElementById('htmlLang').setAttribute('lang', lang === 'hi' ? 'hi' : lang === 'es' ? 'es' : 'en');
    ['langEn', 'langEs', 'langHi'].forEach(function(id, i) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.className = 'px-2 py-1 rounded text-sm ' + (lang === ['en', 'es', 'hi'][i] ? 'font-medium bg-[#171717] text-white' : 'text-[#525252] hover:bg-[#fafafa]');
    });
    applyLanguage();
}

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (!key) return;
        if (key === 'title') {
            if (document.title !== undefined) document.title = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = t(key);
    });
    updateApiKeyPlaceholder();
    updateModeBadge();
}

// Landing / Generate page navigation
function showLanding() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('generatePage').classList.add('hidden');
}
function showGenerate() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('generatePage').classList.remove('hidden');
}
function scrollToGenerate() {
    showGenerate();
    setTimeout(function() { document.getElementById('generateBtn') && document.getElementById('generateBtn').scrollIntoView({ behavior: 'smooth' }); }, 100);
}

// Popup nav
function toggleNavPopup() {
    var backdrop = document.getElementById('navPopupBackdrop');
    var panel = document.getElementById('navPopupPanel');
    var toggle = document.getElementById('navToggle');
    if (!backdrop || !panel) return;
    backdrop.classList.toggle('open');
    panel.classList.toggle('open');
    backdrop.setAttribute('aria-hidden', backdrop.classList.contains('open') ? 'false' : 'true');
    if (toggle) toggle.setAttribute('aria-expanded', backdrop.classList.contains('open'));
}
function closeNavPopup() {
    document.getElementById('navPopupBackdrop').classList.remove('open');
    document.getElementById('navPopupPanel').classList.remove('open');
    document.getElementById('navPopupBackdrop').setAttribute('aria-hidden', 'true');
    var t = document.getElementById('navToggle');
    if (t) t.setAttribute('aria-expanded', 'false');
}
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var chatModal = document.getElementById('chatModal');
        if (chatModal && chatModal.classList.contains('open')) {
            closeChatModal();
            return;
        }
        closeNavPopup();
        closeHelp();
        closeDataPreviewModal();
        var ai = document.getElementById('aiSuggestionPanel');
        if (ai && !ai.classList.contains('hidden')) {
            ai.classList.add('hidden');
            ai.classList.remove('flex');
        }
    }
});

// Light mode only (dark mode removed)
function getColorMode() { return 'light'; }
function setColorMode(_mode) { /* light only */ }
function toggleColorMode() { /* no-op: light only */ }
function applyColorMode() {
    document.documentElement.removeAttribute('data-theme');
    updateChartColorsForTheme();
}
function updateChartColorsForTheme() {
    if (!currentChart || !currentChart.options) return;
    var fg = '#171717';
    var grid = '#e5e5e5';
    var opts = currentChart.options;
    if (opts.scales) {
        if (opts.scales.x) {
            opts.scales.x.ticks = opts.scales.x.ticks || {};
            opts.scales.x.ticks.color = fg;
            opts.scales.x.grid = opts.scales.x.grid || {};
            opts.scales.x.grid.color = grid;
        }
        if (opts.scales.y) {
            opts.scales.y.ticks = opts.scales.y.ticks || {};
            opts.scales.y.ticks.color = fg;
            opts.scales.y.grid = opts.scales.y.grid || {};
            opts.scales.y.grid.color = grid;
        }
    }
    if (opts.plugins && opts.plugins.legend && opts.plugins.legend.labels) {
        opts.plugins.legend.labels.color = fg;
    }
    currentChart.update('none');
}

// --- Chat Assistant (context-limited, frontend-only) ---
function escapeHtml(str) {
    if (str == null) return '';
    var s = String(str);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getChatContext() {
    var cols = currentData && currentData[0] ? Object.keys(currentData[0]) : [];
    var sampleRows = Array.isArray(currentData) ? currentData.slice(0, 5) : [];
    return {
        fileName: currentFileName || null,
        columns: cols,
        sampleRows: sampleRows,
        rowCount: currentData ? currentData.length : 0,
        chartConfig: currentChartConfig ? {
            type: currentChartConfig.type,
            xColumn: currentChartConfig.xColumn,
            yColumn: currentChartConfig.yColumn,
            labelColumn: currentChartConfig.labelColumn,
            aggregation: currentChartConfig.aggregation,
            title: currentChartConfig.title,
            chartReason: currentChartConfig.chartReason
        } : null,
        chartImageUrl: chatContextChartDataUrl || null
    };
}

function getAssistantReply(userMessage, context) {
    return Promise.resolve().then(function() {
        var msg = (userMessage || '').trim();
        var msgLower = msg.toLowerCase();
        if (!msg) return CHAT_REFUSAL_MESSAGE;
        var cols = context.columns || [];
        var rowCount = context.rowCount || 0;
        var cfg = context.chartConfig;
        var sampleRows = context.sampleRows || [];

        // Row count
        if (/how many rows?|number of rows|row count|total rows?|how many (data )?points?/i.test(msgLower)) {
            return 'The uploaded dataset has ' + rowCount + ' row' + (rowCount === 1 ? '' : 's') + '.';
        }

        // Column list — many phrasings; answer locally even when no data (friendly message)
        var askingColumns = /(what|which|list|show|name|tell me)\s*(are|is|the)?\s*(the\s+)?(column names?|columns?|headers?|fields?)|(column names?|columns?|headers?|fields?)\s*(in|of)\s*(the\s+)?(dataset|file|data)|(dataset|file)\s*(has\s+)?columns?|show\s*(me\s+)?(the\s+)?(columns?|headers?|fields?)/i.test(msgLower);
        if (askingColumns) {
            if (cols.length) {
                return 'The dataset has ' + cols.length + ' column' + (cols.length === 1 ? '' : 's') + ': ' + cols.join(', ') + '.';
            }
            return 'No dataset is loaded. Upload a CSV, JSON, or Excel file to see column names.';
        }

        // Sample rows (first 5)
        if (/show\s*(me\s+)?(the\s+)?(first\s+)?(5\s+)?(sample\s+)?rows?|(first\s+)?(5\s+)?rows?|sample\s*(of\s+)?(the\s+)?data|preview\s*(of\s+)?(the\s+)?data/i.test(msgLower) && sampleRows.length) {
            var lines = sampleRows.map(function(row, i) {
                var pairs = Object.keys(row).map(function(k) { return k + ': ' + String(row[k]); });
                return 'Row ' + (i + 1) + ': ' + pairs.join(', ');
            });
            return 'First ' + sampleRows.length + ' row(s):\n\n' + lines.join('\n\n');
        }
        if (/show\s*(me\s+)?(the\s+)?(first\s+)?(5\s+)?(sample\s+)?rows?|(first\s+)?(5\s+)?rows?|sample\s*(of\s+)?(the\s+)?data/i.test(msgLower) && !sampleRows.length && rowCount === 0) {
            return 'No dataset is loaded. Upload a file to see sample rows.';
        }

        // Chart type
        if (/what (is the )?chart type|(current )?chart type|type of chart/i.test(msgLower) && cfg) {
            return 'The current chart type is **' + (cfg.type || 'bar') + '**.';
        }
        // X/Y columns, aggregation
        if (/what (is the )?(x|y)(-axis )?column|(x|y) (axis )?column|aggregation/i.test(msgLower) && cfg) {
            var parts = [];
            if (cfg.xColumn) parts.push('X-axis / categories: ' + cfg.xColumn);
            if (cfg.yColumn) parts.push('Y-axis: ' + cfg.yColumn);
            if (cfg.aggregation) parts.push('Aggregation: ' + cfg.aggregation);
            return parts.length ? parts.join('. ') : CHAT_REFUSAL_MESSAGE;
        }
        // How many rows where col = val (case-insensitive column match)
        if (/how many rows (have|where)|rows? (have|where)\s+\w+\s*=/i.test(msgLower) && currentData && cols.length) {
            var match = msgLower.match(/(\w+)\s*=\s*["']?([^"'\s]+)["']?/);
            if (match) {
                var colKey = cols.find(function(c) { return c.toLowerCase() === match[1]; });
                var val = match[2];
                if (colKey) {
                    var count = currentData.filter(function(r) { return String(r[colKey]).toLowerCase() === val.toLowerCase(); }).length;
                    return 'There are ' + count + ' row(s) where ' + colKey + ' = "' + val + '".';
                }
            }
        }
        return CHAT_REFUSAL_MESSAGE;
    });
}

function validateAssistantReply(reply, context) {
    if (!reply || !context) return CHAT_REFUSAL_MESSAGE;
    var r = reply.toLowerCase();
    var cols = context.columns || [];
    var cfg = context.chartConfig;
    // Intent-based: accept our known local answer patterns
    var isColumnListReply = /the dataset has \d+ column/.test(r) && (r.indexOf(',') !== -1 || cols.length <= 1);
    var isNoDatasetReply = /no dataset (is )?loaded|upload.*(file|data)/i.test(r);
    var isRowCountReply = /\d+\s*row|row\s*count|data\s*point/i.test(r);
    var isSampleRowsReply = /first \d+ row|row \d+:/i.test(r);
    var isFilterCountReply = /there are \d+ row\(s\) where/i.test(r);
    if (isColumnListReply || isNoDatasetReply || isRowCountReply || isSampleRowsReply || isFilterCountReply) return reply;
    // Content-based: reply mentions column names, chart type, or aggregation
    var hasColumn = cols.some(function(c) { return r.indexOf(c.toLowerCase()) !== -1; });
    var hasChartType = cfg && (r.indexOf((cfg.type || '').toLowerCase()) !== -1 || r.indexOf('chart') !== -1);
    var hasAgg = cfg && cfg.aggregation && r.indexOf((cfg.aggregation || '').toLowerCase()) !== -1;
    if (hasColumn || hasChartType || hasAgg) return reply;
    return CHAT_REFUSAL_MESSAGE;
}

function toggleChatModal() {
    var backdrop = document.getElementById('chatModalBackdrop');
    var modal = document.getElementById('chatModal');
    if (!backdrop || !modal) return;
    if (modal.classList.contains('open')) {
        closeChatModal();
    } else {
        backdrop.classList.add('open');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        backdrop.setAttribute('aria-hidden', 'false');
        updateChatContextPanel();
        var inp = document.getElementById('chatInput');
        if (inp) setTimeout(function() { inp.focus(); }, 100);
    }
}

function closeChatModal() {
    var backdrop = document.getElementById('chatModalBackdrop');
    var modal = document.getElementById('chatModal');
    if (backdrop) backdrop.classList.remove('open');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
}

function openChatModal() {
    var backdrop = document.getElementById('chatModalBackdrop');
    var modal = document.getElementById('chatModal');
    if (backdrop && modal && !modal.classList.contains('open')) {
        backdrop.classList.add('open');
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        backdrop.setAttribute('aria-hidden', 'false');
        updateChatContextPanel();
    }
}

function toggleChatContext() {
    var content = document.getElementById('chatContextContent');
    var toggle = document.getElementById('chatContextToggle');
    if (!content || !toggle) return;
    content.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded', content.classList.contains('collapsed') ? 'false' : 'true');
}

function updateChatContextPanel() {
    var summary = document.getElementById('chatContextSummary');
    var chartWrap = document.getElementById('chatContextChartWrap');
    var chartImg = document.getElementById('chatContextChartImg');
    var toggle = document.getElementById('chatContextToggle');
    if (!summary) return;
    var ctx = getChatContext();
    if (!ctx.fileName && ctx.rowCount === 0) {
        summary.textContent = 'No dataset loaded. Upload data and generate a chart to see context.';
        if (chartWrap) chartWrap.classList.add('hidden');
        return;
    }
    var parts = [];
    if (ctx.fileName) parts.push('File: ' + ctx.fileName);
    parts.push('Rows: ' + ctx.rowCount + ', Columns: ' + (ctx.columns.length ? ctx.columns.join(', ') : '—'));
    if (ctx.chartConfig) {
        var c = ctx.chartConfig;
        parts.push('Chart: ' + (c.type || 'bar') + ', X=' + (c.xColumn || '—') + ', Y=' + (c.yColumn || '—') + (c.aggregation ? ' (' + c.aggregation + ')' : ''));
        if (c.chartReason) parts.push('Reason: ' + (c.chartReason.length > 80 ? c.chartReason.slice(0, 80) + '…' : c.chartReason));
    }
    summary.textContent = parts.join(' | ');
    if (chartImg && chartWrap) {
        if (ctx.chartImageUrl) {
            chartImg.src = ctx.chartImageUrl;
            chartWrap.classList.remove('hidden');
        } else {
            chartWrap.classList.add('hidden');
        }
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    var contentEl = document.getElementById('chatContextContent');
    if (contentEl) contentEl.classList.remove('collapsed');
}

function pushSystemChatMessage(text) {
    chatHistory.push({ role: 'system', content: text });
    renderChatMessages();
}

function clearChatHistory() {
    chatHistory = [];
    renderChatMessages();
    updateChatContextPanel();
}

function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '';
    chatHistory.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'chat-msg ' + (item.role === 'user' ? 'user' : item.role === 'system' ? 'system' : 'assistant');
        div.setAttribute('role', 'listitem');
        div.textContent = item.content;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    var inp = document.getElementById('chatInput');
    var btn = document.getElementById('chatSendBtn');
    if (!inp) return;
    var text = (inp.value || '').trim();
    if (!text) return;
    inp.value = '';
    if (btn) btn.disabled = true;
    var safeText = escapeHtml(text);
    chatHistory.push({ role: 'user', content: text });
    renderChatMessages();
    var context = getChatContext();
    getAssistantReply(text, context).then(function(reply) {
        var finalReply = validateAssistantReply(reply, context);
        chatHistory.push({ role: 'assistant', content: finalReply });
        renderChatMessages();
    }).catch(function() {
        chatHistory.push({ role: 'assistant', content: CHAT_REFUSAL_MESSAGE });
        renderChatMessages();
    }).finally(function() {
        if (btn) btn.disabled = false;
        if (inp) inp.focus();
    });
}

// Chart.js global defaults: neutral palette, no blue
function setChartJsGlobalDefaults() {
    if (typeof Chart === 'undefined') return;
    var primary = '#171717';
    var muted = '#525252';
    var gridColor = '#e5e5e5';
    Chart.defaults.color = primary;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font = { family: "'Inter', system-ui, sans-serif", size: 12 };
    if (Chart.defaults.plugins) {
        if (Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
            Chart.defaults.plugins.legend.labels.color = primary;
        }
        if (Chart.defaults.plugins.tooltip) {
            Chart.defaults.plugins.tooltip.titleColor = primary;
            Chart.defaults.plugins.tooltip.bodyColor = muted;
        }
    }
    if (Chart.defaults.scale) {
        Chart.defaults.scale.ticks = Chart.defaults.scale.ticks || {};
        Chart.defaults.scale.ticks.color = primary;
        Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
        Chart.defaults.scale.grid.color = gridColor;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Papa === 'undefined') {
        console.error('PapaParse (CSV parser) failed to load. Check your network or CDN.');
    }
    if (typeof Chart === 'undefined') {
        console.error('Chart.js failed to load. Check your network or CDN.');
    } else {
        setChartJsGlobalDefaults();
    }
    applyColorMode();
    applyLanguage();
    setLanguage(currentLang);
    toggleAIcontrols();
    updateApiKeyPlaceholder();
    updateModeBadge();
    setupEventListeners();
    setupDragAndDrop();
    setupTabListeners();
    if (window.location.hash) restoreFromShareLink();
    updateRestoreFromLinkButton();
    var chatInp = document.getElementById('chatInput');
    if (chatInp) {
        chatInp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

// Chart type selection (single button); state in JS so styling changes don't break detection
function getSelectedChartType() {
    return selectedChartType || null;
}

function selectChartType(type) {
    selectedChartType = type;
    document.querySelectorAll('.chart-type-btn').forEach(function(b) {
        if (b.getAttribute('data-chart-type') === type) {
            b.classList.remove('bg-white', 'bg-[#f5f5f5]');
            b.classList.add('bg-[#171717]', 'text-white', 'border-[#171717]');
        } else {
            b.classList.remove('bg-[#171717]', 'text-white', 'border-[#171717]');
            b.classList.add('bg-white', 'border-[#e5e5e5]');
        }
    });
    updateGenerateButtonState();
}

function updateGenerateButtonState() {
    var generateBtn = document.getElementById('generateBtn');
    if (!generateBtn) return;
    generateBtn.disabled = !currentData || !getSelectedChartType();
}

function toggleAIcontrols() {
    var checked = document.getElementById('useAIToggle') && document.getElementById('useAIToggle').checked;
    var el = document.getElementById('aiControls');
    if (el) {
        el.classList.toggle('hidden', !checked);
    }
}

function updateModeBadge() {
    var el = document.getElementById('modeBadge');
    var useAI = document.getElementById('useAIToggle') && document.getElementById('useAIToggle').checked;
    var provider = document.getElementById('aiProvider') && document.getElementById('aiProvider').value;
    if (!el) return;
    if (useAI) {
        el.textContent = t('aiModeBadge') || ('AI mode (' + (provider === 'gemini' ? 'Gemini' : 'OpenAI') + ')');
        el.className = 'block px-2 py-1 rounded text-xs font-medium bg-[#fafafa] text-[#171717]';
    } else {
        el.textContent = t('ruleBasedBadge') || 'Rule-based mode';
        el.className = 'block px-2 py-1 rounded text-xs font-medium bg-[#fafafa] text-[#171717]';
    }
}

function updateApiKeyPlaceholder() {
    var sel = document.getElementById('aiProvider');
    var inp = document.getElementById('apiKeyInput');
    if (!sel || !inp) return;
    inp.placeholder = sel.value === 'gemini'
        ? (t('apiKeyGeminiPlaceholder') || 'Gemini API key (optional if set on server)')
        : (t('apiKeyOpenAIPlaceholder') || 'OpenAI API key (optional if set on server)');
}

// Tab switching (Visualization / Code / Explanation)
function setupTabListeners() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tab = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(function(b) {
                b.setAttribute('aria-selected', b.getAttribute('data-tab') === tab ? 'true' : 'false');
                b.className = 'tab-btn px-4 py-2 rounded-lg font-medium ' + (b.getAttribute('data-tab') === tab ? 'bg-[#171717] text-white' : 'bg-[#fafafa] text-[#171717] hover:bg-[#e5e5e5]');
            });
            document.querySelectorAll('.tab-panel').forEach(function(p) {
                p.classList.toggle('active', p.id === 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
                p.classList.toggle('hidden', p.id !== 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            });
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    var promptInput = document.getElementById('promptInput');
    document.querySelectorAll('.chart-type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            selectChartType(this.getAttribute('data-chart-type'));
        });
    });
    if (promptInput) {
        promptInput.addEventListener('input', updateGenerateButtonState);
    }
    // Default: select Bar Chart on load
    setTimeout(function() { selectChartType('bar'); }, 0);
}

// Setup Drag and Drop
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(Array.from(files));
        }
    });
}

// File Upload Handler - supports multiple files
function handleFileUpload(event) {
    var files = event.target.files;
    if (files && files.length > 0) {
        handleFiles(Array.from(files));
    }
}

// Process one or more files and merge data (CSV, JSON, XLSX, .txt)
function handleFiles(files) {
    if (!files || files.length === 0) {
        showMessage('Please upload a CSV, JSON, or Excel file (.csv, .json, .xlsx, or .txt)', 'error');
        return;
    }
    var valid = Array.from(files).filter(function(f) {
        var n = (f.name || '').toLowerCase();
        return n.endsWith('.csv') || n.endsWith('.json') || n.endsWith('.txt') || n.endsWith('.xlsx') || n.endsWith('.xls');
    });
    if (valid.length === 0) {
        showMessage('Please upload CSV, JSON, or Excel (.csv, .json, .xlsx, .xls, .txt)', 'error');
        return;
    }
    currentFileName = valid.length === 1 ? valid[0].name : valid.length + ' files';
    readAndParseFiles(valid, 0, [], function(combined) {
        if (combined.length === 0) {
            showMessage('No data could be read. Please upload a CSV or JSON file (.csv, .json, or .txt with table data).', 'error');
            return;
        }
        currentData = combined;
        displayFileInfo(currentFileName);
        displayDataPreview(currentData);
        enableGenerateButton();
        showMessage('Loaded ' + combined.length + ' rows from ' + valid.length + ' file(s)', 'success');
        updateChatContextPanel();
    });
}

// Parse Excel (.xlsx, .xls) to array of row objects using SheetJS
function parseExcelContent(buffer) {
    if (typeof XLSX === 'undefined') {
        showMessage('Excel support not loaded. Save file as CSV or refresh the page.', 'error');
        return [];
    }
    try {
        var wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        var firstSheet = wb.SheetNames[0];
        if (!firstSheet) return [];
        var ws = wb.Sheets[firstSheet];
        var data = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
        return Array.isArray(data) ? data : [];
    } catch (err) {
        showMessage('Failed to parse Excel: ' + (err.message || 'invalid file'), 'error');
        return [];
    }
}

// Limits to avoid main-thread freeze on large files
var MAX_CSV_TEXT_BYTES = 2 * 1024 * 1024;   // 2MB for CSV/text
var MAX_XLSX_BYTES = 5 * 1024 * 1024;        // 5MB for Excel

// Read and parse files one by one, then merge
function readAndParseFiles(files, index, accumulated, done) {
    if (index >= files.length) {
        done(accumulated);
        return;
    }
    var file = files[index];
    var name = (file.name || '').toLowerCase();
    var isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

    if (isExcel) {
        if (file.size > MAX_XLSX_BYTES) {
            showMessage('File too large (max 5MB): ' + file.name, 'error');
            readAndParseFiles(files, index + 1, accumulated, done);
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var buffer = e.target.result;
            var parsed = parseExcelContent(buffer);
            var merged = mergeDataRows(accumulated, parsed);
            readAndParseFiles(files, index + 1, merged, done);
        };
        reader.onerror = function() {
            showMessage('Failed to read: ' + file.name, 'error');
            readAndParseFiles(files, index + 1, accumulated, done);
        };
        reader.readAsArrayBuffer(file);
        return;
    }

    // CSV: prefer PapaParse when available (robust quoted fields); fallback to FileReader + parseCSVContent
    if (name.endsWith('.csv') && typeof window.Papa !== 'undefined' && window.Papa.parse) {
        var maxRows = 50000;
        window.Papa.parse(file, {
            header: true,
            dynamicTyping: false,
            preview: maxRows,
            skipEmptyLines: true,
            complete: function(results) {
                var parsed = (results.data && results.data.length) ? results.data : [];
                if (results.errors && results.errors.length > 0 && parsed.length === 0) {
                    showMessage('CSV parse had errors; try uploading again or use a smaller file.', 'info');
                }
                var merged = mergeDataRows(accumulated, parsed);
                readAndParseFiles(files, index + 1, merged, done);
            }
        });
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var content = (e.target.result || '').trim();
        if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        if (content.length > MAX_CSV_TEXT_BYTES) {
            showMessage('File large; using first 2MB to avoid freezing. For bigger files use server upload.', 'info');
            content = content.slice(0, MAX_CSV_TEXT_BYTES);
        }
        var parsed = [];
        if (name.endsWith('.json') || (content.startsWith('{') || content.startsWith('['))) {
            parsed = parseJSONContent(content);
        }
        if (parsed.length === 0) {
            parsed = parseCSVContent(content);
        }
        var merged = mergeDataRows(accumulated, parsed);
        readAndParseFiles(files, index + 1, merged, done);
    };
    reader.onerror = function() {
        showMessage('Failed to read: ' + file.name, 'error');
        readAndParseFiles(files, index + 1, accumulated, done);
    };
    reader.readAsText(file, 'UTF-8');
}

// Merge two arrays of row objects: union of keys, fill missing with null
function mergeDataRows(a, b) {
    if (!b || b.length === 0) return a;
    if (!a || a.length === 0) return b;
    var allKeys = {};
    a.forEach(function(row) { Object.keys(row).forEach(function(k) { allKeys[k] = true; }); });
    b.forEach(function(row) { Object.keys(row).forEach(function(k) { allKeys[k] = true; }); });
    var keys = Object.keys(allKeys);
    var normalize = function(row) {
        var out = {};
        keys.forEach(function(k) { out[k] = row.hasOwnProperty(k) ? row[k] : null; });
        return out;
    };
    return a.map(normalize).concat(b.map(normalize));
}

// CSV line splitter: handles quoted fields and "" as escaped quote
function splitCSVLine(line, delim) {
    line = line == null ? '' : String(line);
    delim = delim == null ? ',' : delim;
    var out = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (!inQuotes && ch === delim) {
            out.push(trimCell(cur));
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(trimCell(cur));
    return out;
}

function trimCell(s) {
    try {
        s = String(s == null ? '' : s).replace(/^["\s]+|["\s]+$/g, '');
        return s.replace(/^"|"$/g, '').trim();
    } catch (e) {
        return '';
    }
}

// Auto-detect delimiter from first line
function detectDelimiter(line) {
    var counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (!inQuotes && counts.hasOwnProperty(line[i])) counts[line[i]]++;
    }
    var best = ',';
    var max = 0;
    if (counts[','] > max) { max = counts[',']; best = ','; }
    if (counts[';'] > max) { max = counts[';']; best = ';'; }
    if (counts['\t'] > max) { max = counts['\t']; best = '\t'; }
    if (counts['|'] > max) { max = counts['|']; best = '|'; }
    return best;
}

// Parse CSV content; try detected delimiter, then comma, semicolon, tab, pipe
function parseCSVContent(content) {
    try {
        if (!content || typeof content !== 'string') return [];
        content = content.trim();
        if (content.length === 0) return [];
        var lines = content.split(/\r\n|\r|\n/).filter(function(l) { return String(l).trim().length > 0; });
        if (lines.length === 0) return [];
        if (lines.length === 1) {
            var h = trimCell(lines[0]) || 'value';
            var single = {};
            single[h] = '';
            return [single];
        }
        var delimiters = [detectDelimiter(lines[0]), ',', ';', '\t', '|'];
        var seen = {};
        for (var d = 0; d < delimiters.length; d++) {
            var delim = delimiters[d];
            if (seen[delim]) continue;
            seen[delim] = true;
            var headers = splitCSVLine(lines[0], delim);
            if (!headers || headers.length < 1) continue;
            var rows = [];
            for (var i = 1; i < lines.length; i++) {
                var vals = splitCSVLine(lines[i], delim);
                var row = {};
                for (var j = 0; j < headers.length; j++) {
                    var key = (String(headers[j] || '').trim()) || ('col' + j);
                    row[key] = vals[j] !== undefined ? vals[j] : '';
                }
                rows.push(row);
            }
            if (rows.length > 0) return rows;
        }
        var singleHeader = (lines[0] || '').replace(/^["\s]+|["\s]+$/g, '').trim() || 'value';
        return lines.slice(1).map(function(line) {
            var o = {};
            o[singleHeader] = line.replace(/^["\s]+|["\s]+$/g, '').trim();
            return o;
        });
    } catch (err) {
        return [];
    }
}

// Parse CSV Data (single-file path: sets currentData and UI)
function parseCSV(content) {
    var parsed = parseCSVContent(content);
    if (!parsed || parsed.length === 0) {
        showMessage('Error parsing CSV file. Use a header row, then data rows. Separate columns with comma (,) or semicolon (;). Save as UTF-8.', 'error');
        return;
    }
    currentData = parsed;
    displayFileInfo(currentFileName);
    displayDataPreview(currentData);
    enableGenerateButton();
    showMessage('Data loaded: ' + currentData.length + ' rows', 'success');
}

// Parse JSON content and return array of row objects (no UI)
function parseJSONContent(content) {
    try {
        var jsonData = JSON.parse(content);
        var data = [];

        if (Array.isArray(jsonData)) {
            data = jsonData;
        } else if (jsonData && typeof jsonData === 'object') {
            var arrayKeys = ['data', 'rows', 'records', 'items', 'results', 'values', 'entries', 'dataset'];
            for (var i = 0; i < arrayKeys.length; i++) {
                var arr = jsonData[arrayKeys[i]];
                if (Array.isArray(arr) && arr.length > 0) {
                    data = arr;
                    break;
                }
            }
            if (data.length === 0) data = [jsonData];
        } else {
            return [];
        }

        if (data.length > 0 && Array.isArray(data[0])) {
            var first = data[0];
            var headers = first.map(function(v, i) { return String(v || 'col' + i); });
            data = data.slice(1).map(function(row) {
                var obj = {};
                headers.forEach(function(h, j) { obj[h] = row[j]; });
                return obj;
            });
        }

        return data.filter(function(row) {
            return row && typeof row === 'object' && !Array.isArray(row);
        });
    } catch (e) {
        return [];
    }
}

// Parse JSON Data (single-file path: sets currentData and UI)
function parseJSON(content) {
    var parsed = parseJSONContent(content);
    if (parsed.length === 0) {
        showMessage('Error parsing JSON: invalid structure or no data rows', 'error');
        return;
    }
    currentData = parsed;
    displayFileInfo(currentFileName);
    displayDataPreview(currentData);
    enableGenerateButton();
    showMessage('Data loaded: ' + currentData.length + ' rows', 'success');
}

// Display File Information
function displayFileInfo(fileName) {
    const fileInfo = document.getElementById('fileInfo');
    const fileNameElement = document.getElementById('fileName');
    
    fileNameElement.textContent = fileName;
    fileInfo.classList.remove('hidden');
}

// Display Data Preview
function displayDataPreview(data) {
    const previewContainer = document.getElementById('dataPreview');
    const table = document.getElementById('previewTable');
    const statsElement = document.getElementById('dataStats');
    
    if (!data || data.length === 0) {
        previewContainer.classList.add('hidden');
        return;
    }
    
    // Clear existing content
    table.querySelector('thead').innerHTML = '';
    table.querySelector('tbody').innerHTML = '';
    
    // Create table headers
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.querySelector('thead').appendChild(headerRow);
    
    // Create table rows (limit to first 8 rows)
    const previewData = data.slice(0, 8);
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        headers.forEach(header => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            td.textContent = row[header] !== null && row[header] !== undefined ? row[header] : '';
            tr.appendChild(td);
        });
        table.querySelector('tbody').appendChild(tr);
    });
    
    // Display statistics
    var stats = data.length + ' rows × ' + headers.length + ' columns';
    statsElement.textContent = stats;
    
    previewContainer.classList.remove('hidden');
}

// Data preview modal (full data)
function openDataPreviewModal() {
    if (!currentData || currentData.length === 0) return;
    var modal = document.getElementById('dataPreviewModal');
    var table = document.getElementById('dataPreviewModalTable');
    if (!modal || !table) return;
    table.innerHTML = '';
    var headers = Object.keys(currentData[0]);
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    headers.forEach(function(h) {
        var th = document.createElement('th');
        th.className = 'px-4 py-3 text-left text-xs font-medium text-[#525252] uppercase';
        th.textContent = h;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    currentData.forEach(function(row) {
        var tr = document.createElement('tr');
        tr.className = 'border-t border-[#e5e5e5]';
        headers.forEach(function(h) {
            var td = document.createElement('td');
            td.className = 'px-4 py-3 text-sm text-[#171717]';
            td.textContent = row[h] != null ? row[h] : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    modal.classList.add('open');
}

function closeDataPreviewModal() {
    var modal = document.getElementById('dataPreviewModal');
    if (modal) modal.classList.remove('open');
}

// Enable Generate Button (when data loaded and a chart type is selected)
function enableGenerateButton() {
    updateGenerateButtonState();
}

// Clear File
function clearFile() {
    currentData = null;
    currentFileName = '';
    chatContextChartDataUrl = null;
    
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('dataPreview').classList.add('hidden');
    document.getElementById('generateBtn').disabled = true;
    
    resetVisualization();
    updateChatContextPanel();
}

// Generate Visualization
function generateVisualization() {
    if (!currentData) {
        showMessage('Please upload data first', 'error');
        return;
    }
    var selectedType = getSelectedChartType();
    if (!selectedType) {
        showMessage('Please select a chart type', 'error');
        return;
    }
    var prompt = (document.getElementById('promptInput') && document.getElementById('promptInput').value) ? document.getElementById('promptInput').value.trim() : '';
    
    // Show loading state
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
    generateBtn.disabled = true;
    
    // Process the prompt and generate chart (optionally via Gemini; server uses GEMINI_API_KEY from env)
    const useAI = document.getElementById('useAIToggle')?.checked ?? false;

    const doGenerate = (chartConfig) => {
        chartConfig.type = selectedType;
        chartConfig.prompt = prompt || selectedType + ' chart';
        applyChartConfig(chartConfig);
    };

    if (useAI) {
        var provider = (document.getElementById('aiProvider') && document.getElementById('aiProvider').value) || 'gemini';
        var apiKey = (document.getElementById('apiKeyInput') && document.getElementById('apiKeyInput').value) || '';
        var aiPromise = provider === 'openai'
            ? generateWithAI(prompt, currentData, apiKey)
            : generateWithGemini(prompt, currentData, apiKey);
        aiPromise
            .then(function(config) {
                config.type = selectedType;
                config.prompt = prompt || selectedType + ' chart';
                return config;
            })
            .then(function(config) {
                pendingAIConfig = config;
                showAISuggestionPanel(config);
            })
            .catch(err => {
                showMessage('AI failed: ' + (err.message || 'using rule-based fallback'), 'info');
                doGenerate(processPromptWithType(prompt, currentData, selectedType));
            })
            .finally(() => {
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
            });
        return;
    }

    setTimeout(() => {
        try {
            const chartConfig = processPromptWithType(prompt, currentData, selectedType);
            chartConfig.prompt = prompt || selectedType + ' chart';
            createChart(chartConfig);
            generateCode(chartConfig);
            var viz = document.getElementById('visualizationContainer');
            if (viz) viz.classList.remove('hidden');
            showMessage('Visualization generated successfully!', 'success');
        } catch (error) {
            showMessage('Error generating visualization: ' + error.message, 'error');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }, 800);
}

// Call backend or OpenAI-compatible API to get chart config from natural language
async function generateWithAI(prompt, data, apiKey) {
    const columns = Object.keys(data[0]);
    const sampleRow = data[0];
    const columnDescriptions = columns.map(c => `${c} (${typeof sampleRow[c]})`).join(', ');
    const payload = {
        prompt,
        columns,
        columnDescriptions,
        sampleRows: data.slice(0, 5),
        rowCount: data.length
    };
    const backendUrl = window.VIZ_AGENT_API || '/api/generate-chart';
    const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
    }
    const config = await res.json();
    return {
        type: config.chartType || 'bar',
        data,
        xColumn: config.xColumn || columns[0],
        yColumn: config.yColumn || columns[1],
        labelColumn: config.labelColumn || columns[0],
        title: config.title || extractTitle(prompt) || 'Chart',
        columns
    };
}

// Call Gemini analyze-chart endpoint: first 3 rows + prompt -> chart config (server uses GEMINI_API_KEY from env)
async function generateWithGemini(prompt, data, apiKey) {
    const columns = Object.keys(data[0]);
    const payload = {
        prompt: prompt || undefined,
        columns,
        sampleRows: data.slice(0, 3),
        rowCount: data.length
    };
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey.trim()) headers['X-API-Key'] = apiKey.trim();
    const backendUrl = window.VIZ_AGENT_GEMINI_API || '/api/analyze-chart';
    const res = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
    }
    const config = await res.json();
    const result = {
        type: config.chartType || 'bar',
        data,
        xColumn: config.xColumn || columns[0],
        yColumn: config.yColumn || columns[1],
        labelColumn: config.labelColumn || columns[0],
        title: config.title || extractTitle(prompt) || 'Chart',
        columns
    };
    if (config.aggregation) result.aggregation = config.aggregation;
    return result;
}

// Rule-based config with explicit chart type (from button selection)
function processPromptWithType(prompt, data, chartType) {
    var config = processPrompt((prompt || '') + ' ' + chartType + ' chart', data);
    config.type = chartType;
    return config;
}

// Semantic column type detection: count numeric vs non-numeric per column over all rows
// CSV-parsed data is often all strings; parseFloat(v) valid and not NaN = numeric
function detectColumnTypes(data) {
    var cols = Object.keys(data[0] || {});
    var types = {};
    cols.forEach(function(col) {
        var numeric = 0, nonNumeric = 0;
        data.forEach(function(r) {
            var v = r[col];
            if (v === null || v === undefined || String(v).trim() === '') {
                nonNumeric++;
            } else {
                var n = parseFloat(String(v).replace(/,/g, ''));
                if (!isNaN(n)) numeric++; else nonNumeric++;
            }
        });
        types[col] = numeric > nonNumeric ? 'numeric' : 'categorical';
    });
    return types;
}

// Pick best numeric column by largest variance (or range) — avoids IDs or near-constant columns
function pickBestNumericColumn(data, numericCols) {
    if (!numericCols || numericCols.length === 0) return undefined;
    if (numericCols.length === 1) return numericCols[0];
    var best = numericCols[0], bestVar = -1;
    numericCols.forEach(function(col) {
        var nums = data.map(function(r) { return parseFloat(String(r[col]).replace(/,/g, '')); }).filter(function(v) { return !isNaN(v); });
        if (nums.length < 2) return;
        var mean = nums.reduce(function(a, b) { return a + b; }, 0) / nums.length;
        var variance = nums.reduce(function(a, b) { return a + (b - mean) * (b - mean); }, 0) / nums.length;
        if (variance > bestVar) { bestVar = variance; best = col; }
    });
    return best;
}

// Process Natural Language Prompt (rule-based fallback)
function processPrompt(prompt, data) {
    if (!data || data.length === 0 || !data[0]) {
        throw new Error('No data available');
    }
    var lowerPrompt = (prompt || '').toLowerCase();
    var columns = Object.keys(data[0]);
    if (columns.length === 0) {
        throw new Error('Data has no columns');
    }

    var types = detectColumnTypes(data);
    var numericColumns = columns.filter(function(c) { return types[c] === 'numeric'; });
    var categoricalColumns = columns.filter(function(c) { return types[c] === 'categorical'; });

    // Match column names mentioned in the prompt (tokens length > 2)
    var promptWords = lowerPrompt.replace(/[^\w\s]/g, ' ').split(/\s+/);
    var promptTokens = new Set(promptWords.filter(function(w) { return w.length > 2; }));
    var matchColumn = function(name) {
        var tokens = String(name).toLowerCase().split(/[\s_]+/);
        return tokens.some(function(tok) { return promptTokens.has(tok); });
    };

    var catMentioned = categoricalColumns.some(function(c) { return matchColumn(c); });
    var numMentioned = numericColumns.some(function(c) { return matchColumn(c); });

    var preferredCategorical = categoricalColumns.find(function(c) { return matchColumn(c); }) || categoricalColumns[0] || columns[0];
    var preferredNumeric = numericColumns.find(function(c) { return matchColumn(c); }) || pickBestNumericColumn(data, numericColumns) || numericColumns[0] || null;

    // Chart type from keywords (UI button overrides later)
    var chartType = 'bar';
    if (lowerPrompt.includes('scatter') || lowerPrompt.includes('correlation') || /\bvs\b/.test(lowerPrompt) || lowerPrompt.includes('versus')) {
        chartType = 'scatter';
    } else if (lowerPrompt.includes('pie') || lowerPrompt.includes('distribution') || lowerPrompt.includes('share') || lowerPrompt.includes('portion') || lowerPrompt.includes('breakdown') || lowerPrompt.includes('percentage of')) {
        chartType = 'pie';
    } else if (lowerPrompt.includes('doughnut') || lowerPrompt.includes('donut')) {
        chartType = 'doughnut';
    } else if (lowerPrompt.includes('area') || lowerPrompt.includes('filled') || lowerPrompt.includes('stacked area')) {
        chartType = 'area';
    } else if (lowerPrompt.includes('line') || lowerPrompt.includes('trend') || lowerPrompt.includes('over time') || lowerPrompt.includes('timeseries') || lowerPrompt.includes('time series')) {
        chartType = 'line';
    } else if (lowerPrompt.includes('bar') || lowerPrompt.includes('column') || lowerPrompt.includes('compare') || lowerPrompt.includes('comparison')) {
        chartType = 'bar';
    }

    var xColumn, yColumn, labelColumn, aggregation, chartReason;

    // Categorical-only prompt (e.g. "location") or no numeric columns -> count by category
    var supportsAggregation = chartType === 'bar' || chartType === 'pie' || chartType === 'line' || chartType === 'doughnut';
    if (supportsAggregation && ((catMentioned && !numMentioned) || numericColumns.length === 0)) {
        aggregation = 'count';
        xColumn = preferredCategorical;
        labelColumn = preferredCategorical;
        yColumn = preferredCategorical;
        chartReason = numericColumns.length === 0
            ? 'No numeric column in data — using counts per category.'
            : 'Detected categorical column "' + preferredCategorical + '" and no numeric column mentioned — using counts.';
    } else if (chartType === 'pie' || chartType === 'doughnut') {
        labelColumn = preferredCategorical || columns[0];
        yColumn = preferredNumeric || columns[1] || columns[0];
        xColumn = labelColumn;
        if (!aggregation) aggregation = preferredNumeric ? 'sum' : 'count';
        if (aggregation === 'count') chartReason = 'No numeric column chosen; showing count per category.';
    } else if (chartType === 'scatter') {
        xColumn = preferredNumeric || numericColumns[0] || columns[0];
        yColumn = numericColumns[1] || preferredNumeric || numericColumns[0] || columns[1] || columns[0];
    } else {
        xColumn = preferredCategorical || columns[0];
        yColumn = preferredNumeric || columns[1] || columns[0];
        if (!aggregation) aggregation = preferredNumeric ? 'sum' : 'count';
        if (aggregation === 'count') chartReason = 'Categorical-only; showing count per group.';
        else if (preferredNumeric) chartReason = chartType + ' chart: X = ' + xColumn + ' (categorical), Y = ' + preferredNumeric + ' (numeric, highest variance).';
    }

    var title = extractTitle(prompt) || (chartType.charAt(0).toUpperCase() + chartType.slice(1) + ' Chart');
    var col0 = columns[0];
    var col1 = columns[1] || columns[0];
    var out = {
        type: chartType,
        data: data,
        xColumn: xColumn || col0,
        yColumn: yColumn || col1,
        labelColumn: labelColumn || col0,
        title: title,
        columns: columns
    };
    if (aggregation) out.aggregation = aggregation;
    if (chartReason) out.chartReason = chartReason;
    return out;
}

// Extract Title from Prompt (fallback to trimmed prompt slice if no pattern matches)
function extractTitle(prompt) {
    if (!prompt || typeof prompt !== 'string') return null;
    var titlePatterns = [
        /show (.+) (?:as|in) a/i,
        /create (.+) (?:chart|graph)/i,
        /plot (.+)/i,
        /display (.+)/i
    ];
    for (var i = 0; i < titlePatterns.length; i++) {
        var match = prompt.match(titlePatterns[i]);
        if (match) {
            return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
    }
    var trimmed = prompt.trim();
    return trimmed ? trimmed.slice(0, 40) : null;
}

function applyChartConfig(chartConfig) {
    createChart(chartConfig);
    generateCode(chartConfig);
    var viz = document.getElementById('visualizationContainer');
    if (viz) viz.classList.remove('hidden');
    showMessage('Visualization generated successfully!', 'success');
}

function showAISuggestionPanel(config) {
    var panel = document.getElementById('aiSuggestionPanel');
    var text = document.getElementById('aiSuggestionText');
    if (!panel || !text) return;
    var agg = (config.aggregation || 'sum').toLowerCase();
    var aggLabel = agg === 'avg' ? 'average' : agg === 'count' ? 'count' : agg;
    var xOrLabel = config.xColumn || config.labelColumn || (config.columns && config.columns[0]) || '-';
    var summary = config.type + ' chart, ' + (config.type === 'pie' || config.type === 'doughnut' ? 'Label=' : 'X=') + xOrLabel + ', Y=' + (config.yColumn || '-') + ' (' + aggLabel + ')';
    text.textContent = 'AI suggests: ' + summary;
    panel.classList.remove('hidden');
    panel.classList.add('flex');
}

function acceptAISuggestion() {
    var panel = document.getElementById('aiSuggestionPanel');
    if (panel) panel.classList.add('hidden');
    if (pendingAIConfig) {
        applyChartConfig(pendingAIConfig);
        pendingAIConfig = null;
    }
}

function editAISuggestion() {
    var panel = document.getElementById('aiSuggestionPanel');
    if (panel) panel.classList.add('hidden');
    if (!pendingAIConfig) return;
    document.getElementById('visualizationContainer').classList.remove('hidden');
    populateColumnSelectors(pendingAIConfig);
    createChart(pendingAIConfig);
    generateCode(pendingAIConfig);
    currentChartConfig = pendingAIConfig;
    pendingAIConfig = null;
    showMessage('Adjust columns above and click Apply, or changes apply automatically.', 'info');
}

// Populate and show column mapping dropdowns
function populateColumnSelectors(config) {
    var cols = config.columns || (currentData && currentData[0] ? Object.keys(currentData[0]) : []);
    var section = document.getElementById('columnMappingSection');
    var colX = document.getElementById('columnX');
    var colY = document.getElementById('columnY');
    var colLabel = document.getElementById('columnLabel');
    var colAgg = document.getElementById('columnAgg');
    if (!section || !colX || !colY || !colLabel) return;
    isUpdatingColumnSelectors = true;
    try {
        colX.innerHTML = '';
        colY.innerHTML = '';
        colLabel.innerHTML = '';
        cols.forEach(function(c) {
            colX.innerHTML += '<option value="' + c + '">' + c + '</option>';
            colY.innerHTML += '<option value="' + c + '">' + c + '</option>';
            colLabel.innerHTML += '<option value="' + c + '">' + c + '</option>';
        });
        colX.value = config.xColumn || cols[0];
        colY.value = config.yColumn || (cols[1] || cols[0]);
        colLabel.value = config.labelColumn || cols[0];
        if (colAgg) colAgg.value = config.aggregation || 'sum';
        var xLabel = document.getElementById('xLabel');
        if (xLabel) xLabel.textContent = (config.type === 'pie' || config.type === 'doughnut') ? 'Label (pie)' : 'X-axis / categories';
        section.classList.remove('hidden');
    } finally {
        isUpdatingColumnSelectors = false;
    }
}

// Apply column mapping from dropdowns and re-render
function applyColumnMapping() {
    if (isUpdatingColumnSelectors || !currentChartConfig || !currentData) return;
    var colX = document.getElementById('columnX');
    var colY = document.getElementById('columnY');
    var colLabel = document.getElementById('columnLabel');
    var colAgg = document.getElementById('columnAgg');
    if (!colX || !colY) return;
    var cfg = Object.assign({}, currentChartConfig);
    cfg.data = currentData;
    cfg.columns = Object.keys(currentData[0] || {});
    if (cfg.type === 'pie' || cfg.type === 'doughnut') {
        cfg.labelColumn = colLabel ? colLabel.value : colX.value;
        cfg.xColumn = cfg.labelColumn;
    } else {
        cfg.xColumn = colX.value;
        cfg.labelColumn = colX.value;
    }
    cfg.yColumn = colY.value;
    if (colAgg) cfg.aggregation = colAgg.value;
    createChart(cfg);
    generateCode(cfg);
}

// Apply pie Top-N and re-render
function applyPieTopN(n) {
    if (!currentChartConfig || !currentData) return;
    if (currentChartConfig.type !== 'pie' && currentChartConfig.type !== 'doughnut') return;
    currentChartConfig.pieTopN = n;
    currentChartConfig.data = currentData;
    currentChartConfig.columns = Object.keys(currentData[0] || {});
    createChart(currentChartConfig);
    generateCode(currentChartConfig);
}

// Create Chart
function createChart(config) {
    currentChartConfig = config;
    const canvas = document.getElementById('chartCanvas');
    if (!canvas) return;
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    var chartType = config.type === 'area' ? 'line' : config.type;
    var chartData, chartOptions;
    if (config.type === 'pie' || config.type === 'doughnut') {
        chartData = preparePieData(config);
        chartOptions = preparePieOptions(config);
    } else if (config.type === 'scatter') {
        chartData = prepareScatterData(config);
        chartOptions = prepareScatterOptions(config);
    } else {
        chartData = prepareBarLineData(config);
        chartOptions = prepareBarLineOptions(config);
    }
    currentChart = new Chart(canvas, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
    var chartWrapper = document.getElementById('chartWrapper');
    if (chartWrapper) chartWrapper.classList.add('visible');
    updateChartDescription(config);
    populateColumnSelectors(config);
    var pieTopNEl = document.getElementById('pieTopNControl');
    var colAgg = document.getElementById('columnAgg');
    if (colAgg) colAgg.closest('div').style.display = (config.type === 'scatter' ? 'none' : '');
    if (pieTopNEl) {
        if (config.type === 'pie' || config.type === 'doughnut') {
            pieTopNEl.classList.remove('hidden');
            pieTopNEl.classList.add('flex');
        } else {
            pieTopNEl.classList.add('hidden');
            pieTopNEl.classList.remove('flex');
        }
    }
    updateChartColorsForTheme();
    try {
        var c = document.getElementById('chartCanvas');
        if (c) chatContextChartDataUrl = c.toDataURL('image/png');
    } catch (e) { chatContextChartDataUrl = null; }
    updateChatContextPanel();
}

// Apply aggregation (sum/avg/count/min/max) when building grouped values
function aggregateGrouped(grouped, agg) {
    if (agg === 'count') return grouped.count;
    if (agg === 'avg') return grouped.count > 0 ? grouped.sum / grouped.count : 0;
    if (agg === 'min') return grouped.min != null ? grouped.min : 0;
    if (agg === 'max') return grouped.max != null ? grouped.max : 0;
    return grouped.sum;
}

function groupData(data, keyCol, valueCol, aggregation) {
    const agg = (aggregation || 'sum').toLowerCase();
    const groups = {};
    data.forEach(row => {
        const key = String(row[keyCol] ?? '');
        const num = parseFloat(row[valueCol]);
        const isNum = typeof num === 'number' && !isNaN(num);
        const val = isNum ? num : 0;
        if (!groups[key]) {
            groups[key] = { sum: 0, count: 0, min: undefined, max: undefined };
        }
        if (agg === 'count') {
            groups[key].count += 1;
            groups[key].sum += 1;
        } else {
            groups[key].sum += val;
            groups[key].count += 1;
            if (isNum) {
                if (groups[key].min == null || num < groups[key].min) groups[key].min = num;
                if (groups[key].max == null || num > groups[key].max) groups[key].max = num;
            }
        }
    });
    return groups;
}

// Cycle through base colors for any number of segments
function generateColors(n) {
    var base = [
        'rgba(23, 23, 23, 0.9)',
        'rgba(64, 64, 64, 0.9)',
        'rgba(115, 115, 115, 0.9)',
        'rgba(163, 163, 163, 0.9)',
        'rgba(212, 212, 212, 0.9)',
        'rgba(230, 230, 230, 0.9)',
        'rgba(250, 250, 250, 0.9)',
        'rgba(82, 82, 82, 0.9)'
    ];
    var out = [];
    for (var i = 0; i < n; i++) out.push(base[i % base.length]);
    return out;
}

// Prepare Data for Bar/Line Charts (sorted by value descending for reproducible order)
function prepareBarLineData(config) {
    const labels = [];
    const values = [];
    const xCol = config.xColumn || config.columns?.[0];
    const yCol = config.yColumn || config.columns?.[1] || config.columns?.[0];
    const agg = (config.aggregation || 'sum').toLowerCase();
    const grouped = groupData(config.data, xCol, yCol, agg);

    var entries = Object.keys(grouped).map(function(k) {
        return { key: k, value: aggregateGrouped(grouped[k], agg) };
    });
    entries.sort(function(a, b) { return b.value - a.value; });
    entries.forEach(function(e) {
        labels.push(e.key);
        values.push(e.value);
    });
    
    var isLine = config.type === 'line' || config.type === 'area';
    return {
        labels: labels,
        datasets: [{
            label: config.yColumn || 'Value',
            data: values,
            backgroundColor: isLine ? (config.type === 'area' ? 'rgba(23, 23, 23, 0.2)' : 'rgba(23, 23, 23, 0.05)') : 'rgba(23, 23, 23, 0.8)',
            borderColor: 'rgba(23, 23, 23, 1)',
            borderWidth: isLine ? 2.5 : 1,
            fill: config.type === 'area',
            tension: 0.35,
            pointRadius: isLine ? 4 : 0,
            pointBackgroundColor: isLine ? 'rgba(23, 23, 23, 1)' : undefined
        }]
    };
}

// Prepare Data for Pie Charts (sorted by value descending; Top-N/Others grouping)
function preparePieData(config) {
    const labels = [];
    const values = [];
    const labelCol = config.labelColumn || config.columns?.[0];
    const valueCol = config.yColumn || config.columns?.[1] || config.columns?.[0];
    const agg = (config.aggregation || 'sum').toLowerCase();
    const grouped = groupData(config.data, labelCol, valueCol, agg);

    var entries = Object.keys(grouped).map(function(k) {
        return { key: k, value: aggregateGrouped(grouped[k], agg) };
    });
    entries.sort(function(a, b) { return b.value - a.value; });

    var topN = config.pieTopN;
    if (topN === undefined || topN === null) topN = 8;
    if (typeof topN === 'number' && topN > 0 && entries.length > topN) {
        var kept = entries.slice(0, topN);
        var rest = entries.slice(topN);
        var otherSum = rest.reduce(function(s, e) { return s + e.value; }, 0);
        kept.forEach(function(e) {
            labels.push(e.key);
            values.push(e.value);
        });
        labels.push('Other');
        values.push(otherSum);
    } else {
        entries.forEach(function(e) {
            labels.push(e.key);
            values.push(e.value);
        });
    }

    return {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: generateColors(labels.length),
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };
}

// Prepare Data for Scatter Plots
function prepareScatterData(config) {
    const dataPoints = [];
    const xCol = config.xColumn || config.columns?.[0];
    const yCol = config.yColumn || config.columns?.[1] || config.columns?.[0];
    config.data.forEach(row => {
        const x = parseFloat(row[xCol]);
        const y = parseFloat(row[yCol]);
        if (!isNaN(x) && !isNaN(y)) dataPoints.push({ x: x, y: y });
    });
    return {
        datasets: [{
            label: xCol + ' vs ' + yCol,
            data: dataPoints,
            backgroundColor: 'rgba(23, 23, 23, 0.5)',
            borderColor: 'rgba(23, 23, 23, 1)',
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };
}

// Prepare Options for Bar/Line Charts
function prepareBarLineOptions(config) {
    var isLine = config.type === 'line' || config.type === 'area';
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        plugins: {
            title: {
                display: true,
                text: config.title,
                font: { size: 16, weight: 'bold' }
            },
            legend: { display: isLine }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: config.yColumn }
            },
            x: {
                title: { display: true, text: config.xColumn }
            }
        }
    };
}

// Prepare Options for Pie Charts
function preparePieOptions(config) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        plugins: {
            title: {
                display: true,
                text: config.title,
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            legend: {
                position: 'right'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };
}

// Prepare Options for Scatter Plots
function prepareScatterOptions(config) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        plugins: {
            title: { display: true, text: config.title, font: { size: 16, weight: 'bold' } }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: config.xColumn }
            },
            y: {
                type: 'linear',
                beginAtZero: false,
                title: {
                    display: true,
                    text: config.yColumn
                }
            }
        }
    };
}

// Build explainability reason from config (for judges / human-in-the-loop)
function buildChartReason(config) {
    var type = config.type || 'bar';
    var xCol = config.xColumn || config.labelColumn || (config.columns && config.columns[0]);
    var yCol = config.yColumn || (config.columns && config.columns[1]) || (config.columns && config.columns[0]);
    var agg = (config.aggregation || 'sum').toLowerCase();
    var aggLabel = agg === 'avg' ? 'average' : agg === 'count' ? 'count' : agg;
    var prompt = (config.prompt || '').trim();
    if (type === 'pie' || type === 'doughnut') {
        return 'Chosen chart: ' + type + ' (group by ' + xCol + ', ' + aggLabel + ' of ' + yCol + '). Reason: ' + xCol + ' is categorical, ' + yCol + ' is numeric' + (prompt ? "; user asked \"" + prompt + "\"" : '.');
    }
    if (type === 'scatter') {
        return 'Chosen chart: scatter (X=' + xCol + ', Y=' + yCol + '). Reason: both columns are numeric; comparison of continuous values' + (prompt ? "; user asked \"" + prompt + "\"" : '.');
    }
    return 'Chosen chart: ' + type + ' (group by ' + xCol + ', ' + aggLabel + ' of ' + yCol + '). Reason: ' + xCol + ' is categorical, ' + yCol + ' is numeric' + (prompt ? "; user asked \"" + prompt + "\"" : '.');
}

// Update Chart Description (include explainability reason when present)
function updateChartDescription(config) {
    var descriptionElement = document.querySelector('#chartDescription p');
    if (descriptionElement) {
        var reason = config.chartReason || buildChartReason(config);
        var description = reason + ' The chart uses ' + (config.data ? config.data.length : 0) + ' data points from your uploaded dataset.';
        if (config.aggregation === 'count') {
            description += ' Count = number of rows per group.';
        }
        descriptionElement.textContent = description;
    }
    var explanationEl = document.getElementById('explanationContent');
    if (explanationEl) {
        var reason2 = config.chartReason || buildChartReason(config);
        var rows = config.data ? config.data.length : 0;
        var cols = config.columns ? config.columns.length : 0;
        explanationEl.innerHTML = '<p class="mb-4">' + reason2 + '</p><p class="text-sm theme-muted">Rows: ' + rows + ' • Columns: ' + cols + '</p>';
    }
}

// Generate Code
function generateCode(config) {
    const codeDisplay = document.getElementById('codeDisplay');
    if (!codeDisplay) return;
    const jsCode = generateJavaScriptCode(config);
    const pythonCode = convertToPython(config);
    lastGeneratedCode = { js: jsCode, python: pythonCode };
    codeDisplay.innerHTML = highlightSyntax(jsCode);
}

// Generate JavaScript Code
function generateJavaScriptCode(config) {
    const prompt = config.prompt || 'User prompt';
    const chartType = config.type === 'area' ? 'line' : config.type;
    const chartData = prepareChartDataForCode(config);
    const chartOptions = prepareChartOptionsForCode(config);
    const code = `// Generated Chart.js Visualization
// Based on prompt: "${prompt.replace(/"/g, '\\"')}"

const ctx = document.getElementById('chartCanvas').getContext('2d');

const chartData = ${JSON.stringify(chartData, null, 2)};

const chartOptions = ${JSON.stringify(chartOptions, null, 2)};

const myChart = new Chart(ctx, {
    type: '${chartType}',
    data: chartData,
    options: chartOptions
});

// Data: ${config.data.length} rows, columns: ${config.columns.join(', ')}`;
    return code;
}

// Prepare Chart Data for Code Generation
function prepareChartDataForCode(config) {
    if (config.type === 'pie' || config.type === 'doughnut') {
        return preparePieData(config);
    } else if (config.type === 'scatter') {
        return prepareScatterData(config);
    } else {
        return prepareBarLineData(config);
    }
}

// Prepare Chart Options for Code Generation
function prepareChartOptionsForCode(config) {
    if (config.type === 'pie' || config.type === 'doughnut') {
        return preparePieOptions(config);
    } else if (config.type === 'scatter') {
        return prepareScatterOptions(config);
    } else {
        return prepareBarLineOptions(config);
    }
}

// Escape HTML to prevent XSS when displaying generated code
function safeEscapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Syntax highlighting: escape first, then apply spans (safe for innerHTML)
function highlightSyntax(code) {
    var escaped = safeEscapeHtml(code);
    escaped = escaped.replace(/('(?:\\.|[^'])*'|"(?:\\.|[^"])*")/g, '<span class="string">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, '<span class="comment">$1</span>');
    escaped = escaped.replace(/\b(function|const|let|var|if|else|for|while|return|new|class|import|export)\b/g, '<span class="keyword">$1</span>');
    escaped = escaped.replace(/\b(true|false|null|undefined)\b/g, '<span class="keyword">$1</span>');
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>');
    return '<pre class="code-block">' + escaped + '</pre>';
}

// Copy Code to Clipboard
function copyCode() {
    const code = lastGeneratedCode.js || document.getElementById('codeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showMessage('Code copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('Failed to copy code', 'error');
    });
}

// Export Code
function exportCode(format) {
    let code, filename, mimeType;
    if (format === 'python') {
        code = lastGeneratedCode.python || convertToPython(currentChart?.config);
        filename = 'visualization.py';
        mimeType = 'text/x-python';
    } else {
        code = lastGeneratedCode.js || document.getElementById('codeDisplay').textContent;
        filename = 'visualization.js';
        mimeType = 'text/javascript';
    }
    
    // Create download link
    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`Code exported as ${filename}`, 'success');
}

// Convert to Python (Matplotlib) from current chart config
function convertToPython(config) {
    if (!config || !config.data || !config.columns) {
        return `# Generated Matplotlib Visualization
import matplotlib.pyplot as plt
import pandas as pd

# data = pd.read_csv('your_data.csv')
fig, ax = plt.subplots(figsize=(10, 6))
# ax.bar(data['x'], data['y'])
plt.tight_layout()
plt.show()`;
    }
    const type = config.type === 'area' ? 'line' : config.type;
    const xCol = config.xColumn || config.columns[0];
    const yCol = config.yColumn || config.columns[1];
    const labelCol = config.labelColumn || config.columns[0];
    const title = (config.title || 'Chart').replace(/'/g, "\\'");

    if (type === 'pie' || type === 'doughnut') {
        const pieData = preparePieData(config);
        const labels = pieData.labels.map(l => `'${String(l).replace(/'/g, "\\'")}'`);
        const sizes = pieData.datasets[0].data;
        return `# Generated Matplotlib Visualization (${type})
# Prompt: ${(config.prompt || '').replace(/'/g, "\\'")}

import matplotlib.pyplot as plt
import pandas as pd

# data = pd.read_csv('your_data.csv')
# For pie: aggregate by '${labelCol}', sum '${yCol}'
labels = [${labels.join(', ')}]
sizes = [${sizes.join(', ')}]
colors = ['#171717', '#404040', '#525252', '#737373', '#a3a3a3', '#262626', '#d4d4d4', '#000000'][:len(labels)]

fig, ax = plt.subplots(figsize=(8, 8))
ax.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=90)
ax.set_title('${title}')
plt.tight_layout()
plt.show()`;
    }

    if (type === 'scatter') {
        const scatterData = prepareScatterData(config);
        const xs = scatterData.datasets[0].data.map(d => d.x);
        const ys = scatterData.datasets[0].data.map(d => d.y);
        return `# Generated Matplotlib Visualization (scatter)
# Prompt: ${(config.prompt || '').replace(/'/g, "\\'")}

import matplotlib.pyplot as plt
import pandas as pd

# data = pd.read_csv('your_data.csv')
# x = data['${xCol}']; y = data['${yCol}']
x = [${xs.slice(0, 20).join(', ')}]  # first 20 points
y = [${ys.slice(0, 20).join(', ')}]

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(x, y, c='#171717', alpha=0.6, edgecolors='#171717')
ax.set_xlabel('${xCol}')
ax.set_ylabel('${yCol}')
ax.set_title('${title}')
plt.tight_layout()
plt.show()`;
    }

    // Bar / line / area
    const barLine = prepareBarLineData(config);
    const labels = barLine.labels.map(l => `'${String(l).replace(/'/g, "\\'")}'`);
    const values = barLine.datasets[0].data;
    const plotCmd = type === 'line' ? "ax.plot(labels, values, marker='o', color='#171717', linewidth=2)" : "ax.bar(labels, values, color='#171717')";
    return `# Generated Matplotlib Visualization (${type})
# Prompt: ${(config.prompt || '').replace(/'/g, "\\'")}

import matplotlib.pyplot as plt
import pandas as pd

# data = pd.read_csv('your_data.csv')
# Group by '${xCol}', aggregate '${yCol}'
labels = [${labels.join(', ')}]
values = [${values.join(', ')}]

fig, ax = plt.subplots(figsize=(10, 6))
${plotCmd}
ax.set_xlabel('${xCol}')
ax.set_ylabel('${yCol}')
ax.set_title('${title}')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()`;
}

// Download Chart as Image
function downloadChart() {
    if (!currentChart) {
        showMessage('No chart to download', 'error');
        return;
    }
    
    const canvas = document.getElementById('chartCanvas');
    const url = canvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showMessage('Chart downloaded successfully!', 'success');
}

function copyShareLink() {
    if (!currentChartConfig || !currentData) {
        showMessage('No chart to share', 'error');
        return;
    }
    var state = {
        prompt: (document.getElementById('promptInput') && document.getElementById('promptInput').value) || '',
        config: {
            type: currentChartConfig.type,
            xColumn: currentChartConfig.xColumn,
            yColumn: currentChartConfig.yColumn,
            labelColumn: currentChartConfig.labelColumn,
            aggregation: currentChartConfig.aggregation || 'sum',
            title: currentChartConfig.title,
            pieTopN: currentChartConfig.pieTopN
        }
    };
    try {
        var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
        var url = window.location.href.split('#')[0] + '#' + encoded;
        window.location.hash = encoded;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
                showMessage('Share link copied to clipboard!', 'success');
            }).catch(function() {
                showMessage('Link encoded in URL. Copy the address bar to share.', 'info');
            });
        } else {
            showMessage('Link encoded in URL. Copy the address bar to share.', 'info');
        }
    } catch (e) {
        showMessage('Could not create share link', 'error');
    }
}

function restoreFromShareLink() {
    var hash = window.location.hash.slice(1);
    if (!hash) {
        var btn = document.getElementById('restoreFromLinkBtn');
        if (btn) btn.classList.add('hidden');
        return;
    }
    try {
        var json = decodeURIComponent(escape(atob(hash)));
        var state = JSON.parse(json);
        var promptInput = document.getElementById('promptInput');
        if (promptInput && state.prompt) promptInput.value = state.prompt;
        var btn = document.getElementById('restoreFromLinkBtn');
        if (btn) btn.classList.remove('hidden');
        if (state.config && currentData) {
            var cols = Object.keys(currentData[0] || {});
            var cfg = {
                type: state.config.type || 'bar',
                xColumn: cols.includes(state.config.xColumn) ? state.config.xColumn : cols[0],
                yColumn: cols.includes(state.config.yColumn) ? state.config.yColumn : (cols[1] || cols[0]),
                labelColumn: cols.includes(state.config.labelColumn) ? state.config.labelColumn : cols[0],
                aggregation: state.config.aggregation || 'sum',
                title: state.config.title || 'Chart',
                pieTopN: state.config.pieTopN,
                data: currentData,
                columns: cols,
                prompt: state.prompt || ''
            };
            document.getElementById('visualizationContainer').classList.remove('hidden');
            applyChartConfig(cfg);
            showMessage('Chart restored from share link.', 'success');
        } else if (state.config) {
            showMessage('Prompt restored. Load your data and click "Restore from link" to apply the chart.', 'info');
        }
    } catch (e) {
        if (window.location.hash) window.location.hash = '';
    }
}

function updateRestoreFromLinkButton() {
    var btn = document.getElementById('restoreFromLinkBtn');
    if (!btn) return;
    btn.classList.toggle('hidden', !window.location.hash);
}

// Reset Visualization
function resetVisualization() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    currentChartConfig = null;
    var colMap = document.getElementById('columnMappingSection');
    var pieTopN = document.getElementById('pieTopNControl');
    if (colMap) colMap.classList.add('hidden');
    if (pieTopN) { pieTopN.classList.add('hidden'); pieTopN.classList.remove('flex'); }
    var viz = document.getElementById('visualizationContainer');
    if (viz) viz.classList.add('hidden');
}

// Add Prompt Template
function addPromptTemplate(template) {
    const promptInput = document.getElementById('promptInput');
    promptInput.value = template;
    enableGenerateButton();
}

// Load Example Data (hardcoded fallback when datasets/ not available)
function loadExample() {
    const exampleData = [
        { month: 'January', sales: 12000, expenses: 8000, profit: 4000 },
        { month: 'February', sales: 15000, expenses: 9000, profit: 6000 },
        { month: 'March', sales: 18000, expenses: 10000, profit: 8000 },
        { month: 'April', sales: 16000, expenses: 9500, profit: 6500 },
        { month: 'May', sales: 20000, expenses: 11000, profit: 9000 },
        { month: 'June', sales: 22000, expenses: 12000, profit: 10000 }
    ];
    
    currentData = exampleData;
    currentFileName = 'example_sales_data.csv';
    
    displayFileInfo(currentFileName);
    displayDataPreview(currentData);
    enableGenerateButton();
    updateChatContextPanel();
    
    document.getElementById('promptInput').value = 'Create a chart over location';
    
    showMessage('Example data loaded! Try generating a visualization.', 'success');
}

// Load example from datasets/ folder (when served from server)
function loadExampleFromFile(filename) {
    var base = window.VIZ_AGENT_DATASETS || '/datasets';
    var url = base + '/' + (filename || 'sample_marks.csv');
    fetch(url)
        .then(function(r) { return r.ok ? r.text() : Promise.reject(r.statusText); })
        .then(function(text) {
            var parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            if (parsed.errors && parsed.errors.length) throw new Error(parsed.errors[0].message);
            var rows = parsed.data.filter(function(r) { return Object.keys(r).some(function(k) { return r[k] != null && String(r[k]).trim() !== ''; }); });
            if (!rows.length) throw new Error('No data rows');
            currentData = rows;
            currentFileName = filename || 'sample_marks.csv';
            displayFileInfo(currentFileName);
            displayDataPreview(currentData);
            enableGenerateButton();
            updateChatContextPanel();
            document.getElementById('promptInput').value = filename && filename.indexOf('marks') >= 0 ? 'Average marks by subject' : 'Create a bar chart';
            showMessage('Sample dataset loaded from ' + filename, 'success');
        })
        .catch(function(err) {
            loadExample();
            showMessage('Could not load dataset file, using built-in example.', 'info');
        });
}

// Show Help Modal
function showHelp() {
    var el = document.getElementById('helpModal');
    if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
}

// Close Help Modal
function closeHelp() {
    var el = document.getElementById('helpModal');
    if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
}

// Show Message (toast - top right)
function showMessage(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    var safeMsg = (typeof message === 'string') ? safeEscapeHtml(message) : '';
    toast.innerHTML = '<i class="fas fa-' + icon + '"></i><span>' + safeMsg + '</span>';
    container.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, 5000);
}

// Close modal when clicking outside
var helpModalEl = document.getElementById('helpModal');
if (helpModalEl) {
    helpModalEl.addEventListener('click', function(e) {
        if (e.target === this) closeHelp();
    });
}

// Keyboard shortcuts (Ctrl/Cmd+Enter to generate; Escape handled in nav block)
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        var generateBtn = document.getElementById('generateBtn');
        if (generateBtn && !generateBtn.disabled) {
            generateVisualization();
        }
    }
});
