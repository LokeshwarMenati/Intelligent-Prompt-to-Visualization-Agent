/**
 * Unit tests for chart core logic.
 * Run with: node --test tests/chart-core.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { groupData, aggregateGrouped, preparePieData, buildChartReason } = require('./chart-core.js');

const sampleData = [
    { subject: 'Math', student: 'Alice', marks: 85 },
    { subject: 'Math', student: 'Bob', marks: 72 },
    { subject: 'Science', student: 'Alice', marks: 88 },
    { subject: 'Science', student: 'Bob', marks: 76 },
];

describe('groupData', () => {
    it('groups by key column and sums value column', () => {
        const grouped = groupData(sampleData, 'subject', 'marks', 'sum');
        assert.strictEqual(Object.keys(grouped).length, 2);
        assert.strictEqual(grouped.Math.sum, 85 + 72);
        assert.strictEqual(grouped.Science.sum, 88 + 76);
    });
    it('groups with count aggregation', () => {
        const grouped = groupData(sampleData, 'subject', 'marks', 'count');
        assert.strictEqual(grouped.Math.count, 2);
        assert.strictEqual(grouped.Science.count, 2);
    });
    it('groups with avg aggregation', () => {
        const grouped = groupData(sampleData, 'subject', 'marks', 'avg');
        assert.strictEqual(grouped.Math.sum, 157);
        assert.strictEqual(grouped.Math.count, 2);
    });
});

describe('aggregateGrouped', () => {
    it('returns sum by default', () => {
        const g = { sum: 100, count: 5, min: 10, max: 30 };
        assert.strictEqual(aggregateGrouped(g, 'sum'), 100);
    });
    it('returns avg', () => {
        const g = { sum: 100, count: 4, min: 10, max: 40 };
        assert.strictEqual(aggregateGrouped(g, 'avg'), 25);
    });
    it('returns count', () => {
        const g = { sum: 100, count: 5, min: 10, max: 30 };
        assert.strictEqual(aggregateGrouped(g, 'count'), 5);
    });
});

describe('preparePieData', () => {
    it('produces labels and values', () => {
        const config = {
            labelColumn: 'subject',
            yColumn: 'marks',
            data: sampleData,
            columns: ['subject', 'student', 'marks'],
            aggregation: 'sum'
        };
        const result = preparePieData(config);
        assert.ok(Array.isArray(result.labels));
        assert.ok(result.datasets[0].data.length === result.labels.length);
        assert.ok(result.labels.includes('Math') || result.labels.includes('Science'));
    });
    it('applies Top-N / Others grouping when pieTopN is set', () => {
        const manyRows = Array.from({ length: 15 }, (_, i) => ({ cat: 'C' + i, val: 1 }));
        const config = {
            labelColumn: 'cat',
            yColumn: 'val',
            data: manyRows,
            columns: ['cat', 'val'],
            aggregation: 'sum',
            pieTopN: 5
        };
        const result = preparePieData(config);
        assert.strictEqual(result.labels.length, 6); // 5 + Other
        assert.strictEqual(result.labels[result.labels.length - 1], 'Other');
    });
});

describe('buildChartReason', () => {
    it('returns reason for bar chart', () => {
        const config = {
            type: 'bar',
            xColumn: 'region',
            yColumn: 'sales',
            aggregation: 'sum',
            prompt: 'sales by region'
        };
        const reason = buildChartReason(config);
        assert.ok(reason.includes('bar'));
        assert.ok(reason.includes('region'));
        assert.ok(reason.includes('sales'));
        assert.ok(reason.includes('sales by region'));
    });
    it('returns reason for pie chart', () => {
        const config = {
            type: 'pie',
            labelColumn: 'category',
            yColumn: 'value',
            aggregation: 'sum'
        };
        const reason = buildChartReason(config);
        assert.ok(reason.includes('pie'));
        assert.ok(reason.includes('category'));
    });
});
