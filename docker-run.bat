@echo off
echo 构建并启动数据趋势分析Docker容器...

REM 停止并删除现有容器
docker-compose down

REM 构建并启动容器
docker-compose up --build -d

REM 显示容器状态
docker-compose ps

echo.
echo 应用已启动！
echo 访问地址: http://localhost:5000
echo.
echo 查看日志: docker-compose logs -f
echo 停止应用: docker-compose down
pause