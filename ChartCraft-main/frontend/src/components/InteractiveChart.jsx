import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

// Register all Chart.js controllers, elements, scales, and plugins
ChartJS.register(...registerables);

const THEME_PALETTES = {
  powerbi: ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550'],
  cyber: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'],
  emerald: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#047857', '#065F46', '#064E3B', '#A7F3D0'],
  sunset: ['#F43F5E', '#FB7185', '#FDA4AF', '#F97316', '#FB923C', '#FBBF24', '#FDE047', '#E11D48'],
};

export function InteractiveChart({
  chartData,
  darkMode = true,
  palette = 'powerbi',
  onSliceClick,
  height = '100%',
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    // Safely check and destroy any existing chart bound to this canvas
    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const {
      chart_type = 'column',
      labels = [],
      values = [],
      x_label = 'Dimension',
      y_label = 'Metric',
      title = '',
    } = chartData;

    if (!labels || labels.length === 0) return;

    const colors = THEME_PALETTES[palette] || THEME_PALETTES.powerbi;
    const textColor = darkMode ? '#e2e8f0' : '#1e293b';
    const gridColor = darkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
    const ctx = canvasRef.current.getContext('2d');

    // Determine Chart.js type & indexAxis
    let jsType = 'bar';
    let indexAxis = 'x';
    let fill = false;
    let isStacked = false;

    if (chart_type === 'bar' || chart_type === 'stacked_bar') {
      jsType = 'bar';
      indexAxis = 'y';
      if (chart_type === 'stacked_bar') isStacked = true;
    } else if (chart_type === 'column' || chart_type === 'stacked_column') {
      jsType = 'bar';
      indexAxis = 'x';
      if (chart_type === 'stacked_column') isStacked = true;
    } else if (chart_type === 'line') {
      jsType = 'line';
    } else if (chart_type === 'area' || chart_type === 'stacked_area') {
      jsType = 'line';
      fill = true;
      if (chart_type === 'stacked_area') isStacked = true;
    } else if (chart_type === 'pie') {
      jsType = 'pie';
    } else if (chart_type === 'donut') {
      jsType = 'doughnut';
    } else if (chart_type === 'radar') {
      jsType = 'radar';
    } else if (chart_type === 'polarArea') {
      jsType = 'polarArea';
    } else if (chart_type === 'scatter') {
      jsType = 'scatter';
    }

    // Datasets
    let datasets = [];

    if (['pie', 'doughnut', 'polarArea'].includes(jsType)) {
      datasets = [
        {
          label: y_label,
          data: values,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderColor: darkMode ? '#0f172a' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ];
    } else if (jsType === 'radar') {
      datasets = [
        {
          label: y_label,
          data: values,
          backgroundColor: colors[0] + '33',
          borderColor: colors[0],
          pointBackgroundColor: colors[0],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors[0],
          borderWidth: 2.5,
        },
      ];
    } else if (jsType === 'scatter') {
      const scatterPoints = labels.map((l, i) => ({
        x: parseFloat(l) || i,
        y: values[i] || 0,
      }));
      datasets = [
        {
          label: `${y_label} vs ${x_label}`,
          data: scatterPoints,
          backgroundColor: colors[0],
          borderColor: colors[1] || colors[0],
          pointRadius: 6,
          pointHoverRadius: 9,
        },
      ];
    } else {
      const bgColors =
        jsType === 'line'
          ? fill
            ? colors[0] + '35'
            : colors[0]
          : labels.map((_, i) => colors[i % colors.length]);

      datasets = [
        {
          label: y_label,
          data: values,
          backgroundColor: bgColors,
          borderColor: colors[0],
          borderWidth: jsType === 'line' ? 2.5 : 1,
          borderRadius: jsType === 'bar' ? 4 : 0,
          fill: fill,
          tension: 0.35,
          pointRadius: jsType === 'line' ? 4 : 0,
          pointHoverRadius: 7,
        },
      ];
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: indexAxis,
      animation: {
        duration: 750,
        easing: 'easeOutQuart',
      },
      onClick: (event, elements) => {
        if (elements && elements.length > 0 && onSliceClick) {
          const clickedIndex = elements[0].index;
          const clickedLabel = labels[clickedIndex];
          onSliceClick(x_label, clickedLabel);
        }
      },
      plugins: {
        legend: {
          display: ['pie', 'doughnut', 'polarArea', 'radar'].includes(jsType),
          position: 'top',
          labels: {
            color: textColor,
            font: { size: 11, family: 'Inter, sans-serif' },
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: darkMode ? '#f8fafc' : '#0f172a',
          bodyColor: darkMode ? '#cbd5e1' : '#334155',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { weight: '600', size: 12 },
          bodyFont: { size: 12 },
          callbacks: {
            label: function (context) {
              const val = context.parsed?.y ?? context.parsed?.x ?? context.raw;
              const formatted = typeof val === 'number' ? val.toLocaleString() : val;
              return ` ${context.dataset.label || ''}: ${formatted}`;
            },
          },
        },
      },
    };

    if (!['pie', 'doughnut', 'polarArea', 'radar'].includes(jsType)) {
      options.scales = {
        x: {
          stacked: isStacked,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 10 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
        y: {
          stacked: isStacked,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: (v) => (typeof v === 'number' ? v.toLocaleString() : v),
          },
        },
      };
    } else if (jsType === 'radar' || jsType === 'polarArea') {
      options.scales = {
        r: {
          grid: { color: gridColor },
          ticks: { backdropColor: 'transparent', color: textColor, font: { size: 9 } },
          pointLabels: { color: textColor, font: { size: 10 } },
        },
      };
    }

    try {
      chartInstanceRef.current = new ChartJS(ctx, {
        type: jsType,
        data: { labels, datasets },
        options,
      });
    } catch (err) {
      console.error('Error instantiating Chart.js:', err);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, darkMode, palette, onSliceClick]);

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-10">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Configuring visual...</p>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
