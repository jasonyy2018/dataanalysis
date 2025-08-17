# 数据趋势分析 (Flask + Chart.js)

这是一个简单的数据趋势分析网页应用，使用 Flask 作为后端，Pandas 进行数据处理，Chart.js 进行可视化，使用简单的线性回归做趋势预测。

文件结构

```
dataanalysis/
├── app.py
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── requirements.txt
```

快速开始（Windows PowerShell）

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

打开 http://127.0.0.1:5000 上传包含 `date` 列的 CSV / Excel 文件并运行分析。

注意事项

- 请确保文件包含名为 `date` 的列，且日期格式可被 pandas 识别（推荐 YYYY-MM-DD）。
- 预测使用简单线性回归，仅用于演示；实际生产场景需使用更稳健的模型与验证。

## 部署选项

### 1. Docker 部署（推荐）
- ✅ 环境一致性
- ✅ 一键部署
- ✅ 包含生产环境配置
- ✅ 支持 Nginx 反向代理

### 2. 本地 Python 环境
- 适合开发和测试
- 需要手动管理依赖

### 3. 可执行文件（Windows）
- 无需 Python 环境
- 单文件分发

## 下一步改进建议

- 添加单元测试和端到端测试
- 增加更多预测模型（ARIMA, Prophet, LSTM）
- 支持时间频率检测与缺失值更细致的处理
- 添加用户认证和权限管理
- 支持多种数据源（数据库、API等）

可移植打包（在 Windows 上生成“绿色版”单文件可执行）

1. 确保已安装 Python 并能联网安装依赖。
2. 在 PowerShell 中运行：

```powershell
cd c:\Users\jason\Documents\projects\dataanalysis
.\n+\make_portable.ps1
```

3. 成功后会生成 `portable\data_trend_analysis.exe` 和 `portable.zip`，解压后即可在没有 Python 的机器上直接运行 `run.bat` 或双击 exe。

注意：单文件 exe 初次启动时会解包到临时目录，启动可能稍慢；某些杀毒软件可能对单文件 exe 进行额外扫描。

## Docker 部署（推荐）

使用 Docker 可以避免环境依赖问题，实现一键部署。

### 快速开始

**自动部署脚本（推荐）：**
```bash
# Windows
deploy.bat

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

**手动部署：**
```bash
# 开发模式
docker-compose up --build -d

# 生产模式（包含 Nginx）
docker-compose -f docker-compose.prod.yml up --build -d
```

### 访问应用

- 开发模式: http://localhost:5000
- 生产模式: http://localhost (Nginx 代理)

### Docker 环境要求

如果系统未安装 Docker，请参考 [INSTALL-Docker.md](INSTALL-Docker.md) 进行安装。

### 详细文档

- [Docker 部署指南](README-Docker.md)
- [Docker 安装指南](INSTALL-Docker.md)
