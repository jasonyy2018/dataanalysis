let trendChart = null;

function loadChartJSIfNeeded() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Chart.js load error'));
    document.head.appendChild(script);
  });
}

function displayAnalysisResults(data) {
  if (!data) data = {};

  // Normalize and align incoming data
  const labelsRaw = Array.isArray(data.labels) ? data.labels : [];
  const valuesRaw = Array.isArray(data.values) ? data.values : [];

  let labels = labelsRaw.slice();

  let values = [];
  if (Array.isArray(valuesRaw) && valuesRaw.length > 0) {
    // If multi-column (nested arrays), take the first column by default
    if (Array.isArray(valuesRaw[0])) {
      values = valuesRaw.map(row => Array.isArray(row) ? row[0] : row);
    } else {
      values = valuesRaw.slice();
    }
  }

  const minLen = Math.min(labels.length, values.length);
  const hasData = minLen > 0;

  const chartContainer = document.getElementById('chart-container');
  const reportElement = document.getElementById('analysis-report');
  if (!chartContainer || !reportElement) {
    // degrade gracefully
    if (reportElement) reportElement.innerHTML = data.report ? ('<p>' + data.report + '</p>') : '';
    return;
  }

  const renderOrUpdateChart = () => {
    let canvas = document.getElementById('trend-chart');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'trend-chart';
      chartContainer.appendChild(canvas);
    }
    if (!trendChart) {
      trendChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: hasData ? labels.slice(0, minLen) : [],
          datasets: [{
            label: '趋势',
            data: hasData ? values.slice(0, minLen) : [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } else {
      trendChart.data.labels = hasData ? labels.slice(0, minLen) : [];
      trendChart.data.datasets[0].data = hasData ? values.slice(0, minLen) : [];
      trendChart.update();
    }

    if (!hasData) {
      chartContainer.innerHTML = '<div class="placeholder">No data available</div>';
    }
  };

  loadChartJSIfNeeded().then(() => {
    renderOrUpdateChart();
  }).catch(() => {
    chartContainer.innerHTML = '<div class="placeholder">Chart failed to load</div>';
  });

  // Update trend report area
  reportElement.innerHTML = data.report ? ('<p>' + data.report + '</p>') : '';
}