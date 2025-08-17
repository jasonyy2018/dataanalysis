document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewHeader = document.getElementById('previewHeader');
    const previewBody = document.getElementById('previewBody');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    const chartsContainer = document.getElementById('chartsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // 文件上传处理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        loadingSpinner.classList.remove('d-none');
        console.log('Uploading file to / for preview:', file.name, file.size, file.type);

        fetch('/', {
            method: 'POST',
            body: formData
        })
        .then(async response => {
            loadingSpinner.classList.add('d-none');
            console.log('/ preview response status:', response.status, 'content-type:', response.headers.get('content-type'));
            let data;
            try {
                data = await response.json();
                console.log('Preview JSON:', data);
            } catch (e) {
                console.error('非 JSON 响应', e);
                const txt = await response.text();
                console.error('Preview response text:', txt);
                alert('文件处理失败：服务端返回非 JSON 响应，请检查后端日志。');
                return;
            }

            if (data.error) {
                console.error('后端错误 (preview):', data.error);
                alert('文件处理失败（后端）：' + data.error);
                return;
            }

            // 显示预览区域
            previewSection.classList.remove('d-none');

            // 清空之前的预览
            previewHeader.innerHTML = '';
            previewBody.innerHTML = '';

            // 添加表头
            if (!data.columns || !data.data) {
                alert('文件处理失败：返回的数据结构不正确，请检查文件格式或后端错误。');
                console.error('返回数据:', data);
                return;
            }

            data.columns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                previewHeader.appendChild(th);
            });

            // 添加数据行
            data.data.forEach(row => {
                const tr = document.createElement('tr');
                data.columns.forEach(col => {
                    const td = document.createElement('td');
                    td.textContent = row[col];
                    tr.appendChild(td);
                });
                previewBody.appendChild(tr);
            });
        })
        .catch(error => {
            loadingSpinner.classList.add('d-none');
            console.error('前端 fetch 错误:', error);
            alert('文件处理失败：网络或前端错误，请查看控制台日志。');
        });
    });

    // 分析按钮点击事件
    analyzeBtn.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (!file) return;

        loadingSpinner.classList.remove('d-none');
        resultsSection.classList.add('d-none');
        // upload file directly to /analyze (multipart/form-data)
        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading file to /analyze:', file.name, file.size, file.type);
        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(async response => {
            loadingSpinner.classList.add('d-none');
            console.log('/analyze response status:', response.status, 'content-type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let analysis;
            try {
                const responseText = await response.text();
                console.log('Raw response:', responseText.substring(0, 500) + '...');
                analysis = JSON.parse(responseText);
                console.log('Analysis JSON keys:', Object.keys(analysis));
                // expose for debugger / automated tests
                try { window.lastAnalysis = analysis; } catch(e) {}
            } catch (e) {
                console.error('JSON解析错误:', e);
                alert('分析失败：服务端响应格式错误，请查看浏览器控制台。');
                return;
            }

            if (analysis.error) {
                console.error('后端分析错误:', analysis.error);
                alert('分析失败（后端）： ' + analysis.error);
                return;
            }

            if (!analysis.results || Object.keys(analysis.results).length === 0) {
                console.warn('分析成功但结果为空', analysis);
                alert('分析完成，但未检测到可分析的数值列。请确保数据包含日期列和数值列。');
                resultsSection.classList.add('d-none');
                return;
            }

            console.log('显示分析结果，包含', Object.keys(analysis.results).length, '个指标');
            resultsSection.classList.remove('d-none');
            displayAnalysisResults(analysis);
            // render evaluation panel
            renderEvaluationPanel(analysis);
        })
        .catch(error => {
            loadingSpinner.classList.add('d-none');
            console.error('网络请求错误:', error);
            console.error('错误类型:', error.name);
            console.error('错误消息:', error.message);
            if (error.name === 'TypeError') {
                alert('网络连接失败，请检查服务器是否运行。');
            } else {
                alert(`分析过程中出错: ${error.message}`);
            }
        });
    });

    // 显示分析结果
    function displayAnalysisResults(analysis) {
        console.log('开始显示分析结果', analysis);
        chartsContainer.innerHTML = '';
        
        if (!analysis.results) {
            console.error('分析结果为空');
            return;
        }

        for (const [metric, result] of Object.entries(analysis.results)) {
            console.log('处理指标:', metric, '图表数据长度:', result.chart ? result.chart.length : 0);
            const chartCol = document.createElement('div');
            chartCol.className = 'col-md-6';

            const chartCard = document.createElement('div');
            chartCard.className = 'card trend-card';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header bg-light';
            cardHeader.innerHTML = `<h5 class="mb-0">${metric} 趋势分析</h5>`;

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            // create a fixed-height wrapper so Chart.js can size the canvas reliably
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'chart-wrapper';
            chartWrapper.style.height = '300px';
            chartWrapper.style.width = '100%';
            chartWrapper.style.position = 'relative';

            const chartCanvas = document.createElement('canvas');
            chartCanvas.id = `chart-${metric}`;
            chartCanvas.style.width = '100%';
            chartCanvas.style.height = '100%';

            const chartImg = document.createElement('img');
            chartImg.id = `img-${metric}`;
            chartImg.style.maxWidth = '100%';
            chartImg.style.width = '100%';
            chartImg.style.height = '100%';

            const trendInfo = document.createElement('div');
            trendInfo.className = 'mt-3';

            const trendDirection = result.slope > 0 ?
                `<span class="positive-trend">上升趋势</span>` :
                `<span class="negative-trend">下降趋势</span>`;

            trendInfo.innerHTML = `
                <p>趋势方向: ${trendDirection}</p>
                <p>斜率: ${result.slope.toFixed(4)}</p>
                <p>未来预测值:</p>
                <ul>
                    <li>${analysis.forecast_dates[0]}: ${result.forecast[0].toFixed(2)}</li>
                    <li>${analysis.forecast_dates[1]}: ${result.forecast[1].toFixed(2)}</li>
                    <li>${analysis.forecast_dates[2]}: ${result.forecast[2].toFixed(2)}</li>
                </ul>
            `;

            if (result.chart) {
                chartImg.src = result.chart;
                chartImg.alt = metric + ' 趋势图';
                chartImg.className = 'img-fluid';
                chartImg.style.display = 'block';
                chartImg.style.maxWidth = '100%';
                chartImg.style.height = 'auto';
                chartImg.onload = () => console.log(metric + ' chart loaded, size:', chartImg.naturalWidth, chartImg.naturalHeight);
                chartImg.onerror = () => console.error('Failed to load chart for', metric);
                chartWrapper.appendChild(chartImg);
            } else {
                chartWrapper.appendChild(chartCanvas);
            }

            cardBody.appendChild(chartWrapper);
            cardBody.appendChild(trendInfo);
            chartCard.appendChild(cardHeader);
            chartCard.appendChild(cardBody);
            chartCol.appendChild(chartCard);
            chartsContainer.appendChild(chartCol);

            // render Chart.js when server didn't return an image
            if (!result.chart && typeof Chart !== 'undefined') {
                // ensure canvas has computed size before rendering
                setTimeout(() => renderChart(chartCanvas, metric, analysis.dates, result, analysis.forecast_dates), 100);
            } else if (!result.chart) {
                chartWrapper.innerHTML = '<p class="text-muted">图表渲染失败</p>';
            }

            if (result.report) {
                const reportDiv = document.createElement('div');
                reportDiv.className = 'mt-3 alert alert-info';
                reportDiv.innerHTML = `<strong>分析报告:</strong><br>${result.report}`;
                cardBody.appendChild(reportDiv);
            }

            try {
                resultsSection.classList.remove('d-none');
                chartCol.scrollIntoView({behavior: 'smooth', block: 'start'});
            } catch (e) {
                console.warn('scrollIntoView failed', e);
            }
        }
    }

    // 渲染图表
    function renderChart(canvas, metric, dates, result, forecastDates) {
        if (!result.current || !result.trend || !result.forecast) {
            console.error('缺少必要的数据字段', result);
            return;
        }
        
        const allDates = [...dates, ...forecastDates];
        const currentData = [...result.current, ...Array(forecastDates.length).fill(null)];
        const trendData = [...result.trend, ...result.forecast];
        const forecastData = [...Array(dates.length).fill(null), ...result.forecast];
        
        // set explicit pixel size on canvas to match wrapper computed size and devicePixelRatio
        const wrapper = canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        const DPR = window.devicePixelRatio || 1;
        const pixelW = Math.max(300, Math.floor(rect.width));
        const pixelH = Math.max(200, Math.floor(rect.height));
        // set style size (CSS pixels)
        canvas.style.width = pixelW + 'px';
        canvas.style.height = pixelH + 'px';
        // set backing store size (device pixels)
        canvas.width = Math.floor(pixelW * DPR);
        canvas.height = Math.floor(pixelH * DPR);

        const ctx = canvas.getContext('2d');
        // scale context so drawing commands map correctly to CSS pixels
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // destroy prior Chart instance if present
        if (canvas._chartInstance) {
            try { canvas._chartInstance.destroy(); } catch(e){}
            canvas._chartInstance = null;
        }

        const config = {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [
                    {
                        label: `实际 ${metric}`,
                        data: currentData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 3,
                        spanGaps: false
                    },
                    {
                        label: `趋势线`,
                        data: trendData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: `预测值`,
                        data: forecastData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 4,
                        pointStyle: 'triangle'
                    }
                ]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        title: { display: true, text: '日期' },
                        ticks: { maxRotation: 45 }
                    },
                    y: { 
                        title: { display: true, text: metric },
                        beginAtZero: false
                    }
                },
                plugins: {
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${value !== null ? value.toFixed(2) : 'N/A'}`;
                            }
                        }
                    },
                    legend: { position: 'top' }
                }
            }
        };

        const chart = new Chart(ctx, config);
        canvas._chartInstance = chart;
    }
});

// 评估逻辑与维度面板
function renderEvaluationPanel(analysis) {
    const evaluationSection = document.getElementById('evaluationSection');
    const evaluationContainer = document.getElementById('evaluationContainer');
    const dimensionSelect = document.getElementById('dimensionSelect');

    evaluationSection.classList.remove('d-none');

    function buildCardsForDimension(dim) {
        evaluationContainer.innerHTML = '';

        // Map some generic rules for demo purposes
        if (dim === 'technical') {
            // technical: look for high slopes or high recent changes
            Object.entries(analysis.results).forEach(([metric, result]) => {
                const slope = result.slope;
                const recent = result.current[result.current.length - 1];
                const card = document.createElement('div');
                card.className = 'col-md-6';
                card.innerHTML = `
                    <div class="card p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6>${metric} (技术)</h6>
                            <div>${slope > 0 ? '<span class="badge bg-success">上升</span>' : '<span class="badge bg-danger">下降</span>'}</div>
                        </div>
                        <p class="mb-1">当前值: <strong>${recent}</strong></p>
                        <p class="mb-1">斜率: <strong>${slope.toFixed(4)}</strong></p>
                        <p class="mb-1">风险建议: ${getTechnicalAdvice(metric, slope)}</p>
                    </div>
                `;
                evaluationContainer.appendChild(card);
            });
        } else if (dim === 'business') {
            Object.entries(analysis.results).forEach(([metric, result]) => {
                const slope = result.slope;
                const card = document.createElement('div');
                card.className = 'col-md-6';
                card.innerHTML = `
                    <div class="card p-3 mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6>${metric} (业务)</h6>
                            <div>${Math.abs(slope) > 1 ? '<span class="badge bg-warning">关注</span>' : '<span class="badge bg-secondary">正常</span>'}</div>
                        </div>
                        <p class="mb-1">最近趋势斜率: <strong>${slope.toFixed(4)}</strong></p>
                        <p class="mb-1">商业建议: ${getBusinessAdvice(metric, slope)}</p>
                    </div>
                `;
                evaluationContainer.appendChild(card);
            });
        } else if (dim === 'management') {
            // management: show summary cards (mocked)
            const summaryCard = document.createElement('div');
            summaryCard.className = 'col-12';
            summaryCard.innerHTML = `
                <div class="card p-3 mb-3">
                    <h6>管理维度总览</h6>
                    <p class="mb-1">进度风险: <span class="text-danger">中等</span></p>
                    <p class="mb-1">资源饱和度: <span class="text-warning">78%</span></p>
                    <p class="mb-1">建议: 启动关键路径评审，回收低 ROI 任务</p>
                </div>
            `;
            evaluationContainer.appendChild(summaryCard);
        }
    }

    dimensionSelect.addEventListener('change', () => buildCardsForDimension(dimensionSelect.value));
    buildCardsForDimension(dimensionSelect.value);
}

function getTechnicalAdvice(metric, slope) {
    if (Math.abs(slope) > 10) return '异常大幅波动，建议立即排查数据源与服务端日志。';
    if (slope > 0.5) return '持续上升，建议评估容量与报警门限。';
    if (slope < -0.5) return '下降趋势明显，检查近期发布与依赖变更。';
    return '无显著异常，保持监控。';
}

function getBusinessAdvice(metric, slope) {
    if (slope < -1) return '关键业务指标下降，建议优先恢复核心体验。';
    if (slope > 1) return '业务快速增长，评估扩展与供应链能力。';
    return '波动小，常规优化即可。';
}
