@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 数据趋势分析 - Docker 部署脚本
echo ========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker 未安装或未启动
    echo 请参考 INSTALL-Docker.md 安装 Docker
    echo.
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否可用
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker Compose 未安装
    echo 请安装 Docker Desktop 或单独安装 Docker Compose
    echo.
    pause
    exit /b 1
)

echo [信息] Docker 环境检查通过
echo.

REM 选择部署模式
echo 请选择部署模式:
echo 1. 开发模式 (默认)
echo 2. 生产模式 (包含 Nginx)
echo.
set /p mode="请输入选择 (1-2): "

if "%mode%"=="" set mode=1
if "%mode%"=="2" (
    set compose_file=docker-compose.prod.yml
    echo [信息] 使用生产模式部署
) else (
    set compose_file=docker-compose.yml
    echo [信息] 使用开发模式部署
)
echo.

REM 停止现有容器
echo [步骤 1/4] 停止现有容器...
docker-compose -f %compose_file% down >nul 2>&1

REM 构建镜像
echo [步骤 2/4] 构建 Docker 镜像...
docker-compose -f %compose_file% build
if %errorlevel% neq 0 (
    echo [错误] 镜像构建失败
    pause
    exit /b 1
)

REM 启动容器
echo [步骤 3/4] 启动容器...
docker-compose -f %compose_file% up -d
if %errorlevel% neq 0 (
    echo [错误] 容器启动失败
    pause
    exit /b 1
)

REM 等待服务启动
echo [步骤 4/4] 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查容器状态
echo.
echo [信息] 容器状态:
docker-compose -f %compose_file% ps

echo.
echo ========================================
echo 部署完成！
echo ========================================

if "%mode%"=="2" (
    echo 访问地址: http://localhost
    echo Nginx 代理: http://localhost:80
    echo 应用直连: http://localhost:5000
) else (
    echo 访问地址: http://localhost:5000
)

echo.
echo 常用命令:
echo 查看日志: docker-compose -f %compose_file% logs -f
echo 停止服务: docker-compose -f %compose_file% down
echo 重启服务: docker-compose -f %compose_file% restart
echo.

REM 询问是否打开浏览器
set /p open="是否打开浏览器? (y/n): "
if /i "%open%"=="y" (
    if "%mode%"=="2" (
        start http://localhost
    ) else (
        start http://localhost:5000
    )
)

pause