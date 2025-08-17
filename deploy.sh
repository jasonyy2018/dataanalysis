#!/bin/bash

echo "========================================"
echo "数据趋势分析 - Docker 部署脚本"
echo "========================================"
echo

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "[错误] Docker 未安装"
    echo "请参考 INSTALL-Docker.md 安装 Docker"
    echo
    exit 1
fi

# 检查 Docker Compose 是否可用
if ! command -v docker-compose &> /dev/null; then
    echo "[错误] Docker Compose 未安装"
    echo "请安装 Docker Compose"
    echo
    exit 1
fi

echo "[信息] Docker 环境检查通过"
echo

# 选择部署模式
echo "请选择部署模式:"
echo "1. 开发模式 (默认)"
echo "2. 生产模式 (包含 Nginx)"
echo
read -p "请输入选择 (1-2): " mode

if [ "$mode" = "2" ]; then
    compose_file="docker-compose.prod.yml"
    echo "[信息] 使用生产模式部署"
else
    compose_file="docker-compose.yml"
    echo "[信息] 使用开发模式部署"
fi
echo

# 停止现有容器
echo "[步骤 1/4] 停止现有容器..."
docker-compose -f $compose_file down > /dev/null 2>&1

# 构建镜像
echo "[步骤 2/4] 构建 Docker 镜像..."
if ! docker-compose -f $compose_file build; then
    echo "[错误] 镜像构建失败"
    exit 1
fi

# 启动容器
echo "[步骤 3/4] 启动容器..."
if ! docker-compose -f $compose_file up -d; then
    echo "[错误] 容器启动失败"
    exit 1
fi

# 等待服务启动
echo "[步骤 4/4] 等待服务启动..."
sleep 5

# 检查容器状态
echo
echo "[信息] 容器状态:"
docker-compose -f $compose_file ps

echo
echo "========================================"
echo "部署完成！"
echo "========================================"

if [ "$mode" = "2" ]; then
    echo "访问地址: http://localhost"
    echo "Nginx 代理: http://localhost:80"
    echo "应用直连: http://localhost:5000"
else
    echo "访问地址: http://localhost:5000"
fi

echo
echo "常用命令:"
echo "查看日志: docker-compose -f $compose_file logs -f"
echo "停止服务: docker-compose -f $compose_file down"
echo "重启服务: docker-compose -f $compose_file restart"
echo

# 询问是否打开浏览器
read -p "是否打开浏览器? (y/n): " open
if [ "$open" = "y" ] || [ "$open" = "Y" ]; then
    if [ "$mode" = "2" ]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost
        elif command -v open &> /dev/null; then
            open http://localhost
        fi
    else
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:5000
        elif command -v open &> /dev/null; then
            open http://localhost:5000
        fi
    fi
fi