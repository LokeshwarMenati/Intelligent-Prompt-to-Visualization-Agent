/**
 * Core chart logic extracted for unit testing.
 * Mirrors logic in script.js: groupData, aggregateGrouped, preparePieData, buildChartReason
 */

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

function preparePieData(config) {
    const labels = [];
    const values = [];
    const labelCol = config.labelColumn || config.columns?.[0];
    const valueCol = config.yColumn || config.columns?.[1] || config.columns?.[0];
    const agg = (config.aggregation || 'sum').toLowerCase();
    const grouped = groupData(config.data, labelCol, valueCol, agg);
    let entries = Object.keys(grouped).map(k => ({
        key: k,
        value: aggregateGrouped(grouped[k], agg)
    }));
    entries.sort((a, b) => b.value - a.value);
    let topN = config.pieTopN;
    if (topN === undefined || topN === null) topN = 8;
    if (typeof topN === 'number' && topN > 0 && entries.length > topN) {
        const kept = entries.slice(0, topN);
        const rest = entries.slice(topN);
        const otherSum = rest.reduce((s, e) => s + e.value, 0);
        kept.forEach(e => { labels.push(e.key); values.push(e.value); });
        labels.push('Other');
        values.push(otherSum);
    } else {
        entries.forEach(e => { labels.push(e.key); values.push(e.value); });
    }
    return { labels, datasets: [{ data: values }] };
}

function buildChartReason(config) {
    const type = config.type || 'bar';
    const xCol = config.xColumn || config.labelColumn || (config.columns && config.columns[0]);
    const yCol = config.yColumn || (config.columns && config.columns[1]) || (config.columns && config.columns[0]);
    const agg = (config.aggregation || 'sum').toLowerCase();
    const aggLabel = agg === 'avg' ? 'average' : agg === 'count' ? 'count' : agg;
    const prompt = (config.prompt || '').trim();
    if (type === 'pie' || type === 'doughnut') {
        return 'Chosen chart: ' + type + ' (group by ' + xCol + ', ' + aggLabel + ' of ' + yCol + '). Reason: ' + xCol + ' is categorical, ' + yCol + ' is numeric' + (prompt ? '; user asked "' + prompt + '"' : '.');
    }
    if (type === 'scatter') {
        return 'Chosen chart: scatter (X=' + xCol + ', Y=' + yCol + '). Reason: both columns are numeric; comparison of continuous values' + (prompt ? '; user asked "' + prompt + '"' : '.');
    }
    return 'Chosen chart: ' + type + ' (group by ' + xCol + ', ' + aggLabel + ' of ' + yCol + '). Reason: ' + xCol + ' is categorical, ' + yCol + ' is numeric' + (prompt ? '; user asked "' + prompt + '"' : '.');
}

module.exports = { groupData, aggregateGrouped, preparePieData, buildChartReason };
