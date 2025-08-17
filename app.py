from flask import Flask, render_template, request, redirect, jsonify
import pandas as pd
import numpy as np
import os
import io, base64
import matplotlib
# use non-interactive backend for server-side image generation
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image
import json

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv', 'xlsx'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/health')
def health_check():
    """健康检查端点，用于Docker健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': pd.Timestamp.now().isoformat(),
        'version': '1.0.0'
    })


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Check file
        if 'file' not in request.files:
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = file.filename
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Read file into DataFrame
            try:
                if filename.lower().endswith('.csv'):
                    df = pd.read_csv(filepath)
                else:
                    try:
                        df = pd.read_excel(filepath)
                    except ImportError:
                        return jsonify({'error': "读取 Excel 失败：缺少可选依赖 'openpyxl'。请运行 'pip install openpyxl' 或安装 requirements.txt 中的依赖。"}), 400
            except Exception as e:
                return jsonify({'error': f'读取文件失败: {str(e)}'}), 400

            data = {
                'columns': df.columns.tolist(),
                'data': df.head(10).to_dict(orient='records')
            }

            return jsonify(data)

    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        print('ANALYZE: content_type=', request.content_type, 'files=', list(request.files.keys()))
        
        # Prefer file uploads when present
        has_file = 'file' in request.files
        
        if has_file:
            file = request.files['file']
            filename = file.filename
            if filename.lower().endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
        else:
            payload = request.get_json(silent=True)
            if not payload or 'data' not in payload:
                return jsonify({'error': '请求体缺少 data 字段 或 未上传文件'}), 400
            df = pd.DataFrame(payload['data'])

        # normalize column names to strings
        df.columns = df.columns.astype(str)

        # Try to auto-detect date column
        date_col = None
        candidates = [c for c in df.columns if any(k in c.lower() for k in ('date', 'ds', 'time', 'timestamp', '日期', '时间'))]
        if candidates:
            date_col = candidates[0]
        else:
            for c in df.columns:
                try:
                    _ = pd.to_datetime(df[c], errors='coerce')
                    if _.notna().sum() >= max(1, len(df) // 3):
                        date_col = c
                        break
                except Exception:
                    continue

        if date_col is None:
            return jsonify({'error': '日期列未找到，请确保包含可解析的日期列（例如: date/Date/日期/时间/ts）。'}), 400

        # Convert to datetime and sort
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])  # Remove rows with invalid dates
        df = df.sort_values(date_col).reset_index(drop=True)
        
        if df.empty:
            return jsonify({'error': '没有有效的日期数据'}), 400

        # prepare date labels for plots
        dates = df[date_col].dt.strftime('%Y-%m-%d').tolist()
        forecast_dates = pd.date_range(
            start=df[date_col].iloc[-1] + pd.Timedelta(days=1),
            periods=3
        ).strftime('%Y-%m-%d').tolist()

        results = {}
        for col in df.columns:
            if col == date_col:
                continue
            # Try to coerce to numeric
            series = pd.to_numeric(df[col], errors='coerce')
            if series.isna().all():
                continue

            # fill NaNs and ensure we have valid data
            series = series.ffill().bfill()
            if len(series.dropna()) < 2:
                continue

            # additional simple indicators
            try:
                ma7 = series.rolling(window=7, min_periods=1).mean()
            except Exception:
                ma7 = None

            # Use numpy.polyfit for simple linear regression
            x = np.arange(len(series))
            y = series.values
            try:
                coeffs = np.polyfit(x, y, 1)
            except Exception:
                continue
            slope = float(coeffs[0])
            intercept = float(coeffs[1])

            trend = (slope * x + intercept).tolist()

            # forecast next 3 points
            future_x = np.arange(len(series), len(series) + 3)
            future_y = (slope * future_x + intercept).tolist()

            # generate chart
            try:
                fig, ax = plt.subplots(figsize=(8, 3.5))
                x_vals = np.arange(len(series))
                ax.plot(x_vals, series.values, label='actual', marker='o')
                if ma7 is not None:
                    try:
                        ax.plot(x_vals, ma7.values, label='MA7', linestyle='-.', color='orange')
                    except Exception:
                        pass
                ax.plot(x_vals, trend, label='trend', linestyle='--')
                ax.plot(future_x, future_y, label='forecast', marker='x')
                all_x = np.concatenate([x_vals, future_x])
                all_labels = dates + forecast_dates
                ax.set_xticks(all_x)
                ax.set_xticklabels(all_labels, rotation=45, fontsize=8)
                ax.set_title(f'{col} 趋势')
                ax.legend()
                plt.tight_layout()
                buf = io.BytesIO()
                fig.savefig(buf, format='png')
                plt.close(fig)
                buf.seek(0)
                try:
                    pil_img = Image.open(buf).convert('RGBA')
                    out_buf = io.BytesIO()
                    pil_img.save(out_buf, format='WEBP', quality=80, method=6)
                    out_buf.seek(0)
                    img_b64 = base64.b64encode(out_buf.read()).decode('ascii')
                    data_uri = 'data:image/webp;base64,' + img_b64
                except Exception:
                    buf.seek(0)
                    img_b64 = base64.b64encode(buf.read()).decode('ascii')
                    data_uri = 'data:image/png;base64,' + img_b64
            except Exception as e:
                data_uri = None

            # generate report
            try:
                last_val = float(series.iloc[-1])
            except Exception:
                last_val = None
            direction = '上升' if slope > 0 else ('下降' if slope < 0 else '平稳')
            report_lines = []
            report_lines.append(f'趋势方向: {direction}')
            report_lines.append(f'斜率: {slope:.4f}')
            if last_val is not None:
                report_lines.append(f'当前值: {last_val}')
            if ma7 is not None:
                try:
                    report_lines.append(f'MA7 (最后值): {ma7.iloc[-1]:.2f}')
                except Exception:
                    pass
            report_lines.append('未来预测: ' + ', '.join([f'{d}:{v:.2f}' for d, v in zip(forecast_dates, future_y)]))
            report = '; '.join(report_lines)

            results[col] = {
                'current': series.tolist(),
                'trend': trend,
                'forecast': future_y,
                'slope': slope,
                'intercept': intercept,
                'chart': data_uri,
                'report': report
            }

        # Build top-level fields for MVP MVP: labels, values, report
        numeric_columns = list(results.keys())
        if numeric_columns:
            labels = dates
            values = []
            for i in range(len(dates)):
                row_vals = []
                for col in numeric_columns:
                    cur = results[col]['current']
                    row_vals.append(cur[i] if i < len(cur) else None)
                values.append(row_vals)
            top_reports = []
            for col in numeric_columns:
                rep = results[col].get('report', '')
                top_reports.append(f'{col}: {rep}')
            report = ' | '.join(top_reports)
        else:
            labels = []
            values = []
            report = '未找到可分析的数值列，请检查数据格式或列名。'

        if not results:
            # Maintain compatibility: provide a clear empty-state response instead of error
            return jsonify({
                'dates': dates,
                'forecast_dates': forecast_dates,
                'results': results,
                'labels': labels,
                'values': values,
                'report': report
            })

        return jsonify({
            'dates': dates,
            'forecast_dates': forecast_dates,
            'results': results,
            'labels': labels,
            'values': values,
            'report': report
        })
    except Exception as e:
        print('ERROR in analyze route:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'分析过程中发生错误: {str(e)}'}), 500


if __name__ == '__main__':
    # Docker环境配置
    import os
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host=host, port=port, debug=debug, use_reloader=False)