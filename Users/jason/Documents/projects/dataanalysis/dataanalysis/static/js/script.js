function displayAnalysisResults(data) {
    // 清空之前的图表和报告内容
    document.getElementById('chart-container').innerHTML = '';
    document.getElementById('analysis-report').innerHTML = '';

    // 检查数据是否为空或格式不正确
    if (!data || !data.labels || !data.values) {
        console.error("数据为空或格式不正确");
        return;
    }

    // 创建 canvas 元素并添加到容器中
    const ctx = document.createElement('canvas');
    ctx.id = 'trend-chart';
    document.getElementById('chart-container').appendChild(ctx);

    // 配置图表数据
    const chartData = {
        labels: data.labels,
        datasets: [{
            label: '趋势',
            data: data.values,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    // 初始化 Chart.js 图表
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 显示趋势分析报告
    const reportElement = document.getElementById('analysis-report');
    if (data.report) {
        reportElement.innerHTML = '<p>' + data.report + '</p>';
    } else {
        reportElement.innerHTML = '<p>暂无分析报告</p>';
    }
}
