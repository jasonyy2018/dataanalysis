# 数据趋势分析 - Docker版本

## 快速开始

### 方式一：使用docker-compose（推荐）

```bash
# 构建并启动
docker-compose up --build -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 方式二：使用脚本

**Windows:**
```cmd
docker-run.bat
```

**Linux/Mac:**
```bash
chmod +x docker-run.sh
./docker-run.sh
```

### 方式三：手动Docker命令

```bash
# 构建镜像
docker build -t data-trend-analysis .

# 运行容器
docker run -d -p 5000:5000 -v $(pwd)/uploads:/app/uploads --name data-analysis data-trend-analysis

# 查看日志
docker logs -f data-analysis

# 停止容器
docker stop data-analysis
docker rm data-analysis
```

## 访问应用

打开浏览器访问: http://localhost:5000

## 环境变量

- `FLASK_HOST`: 绑定主机地址（默认: 0.0.0.0）
- `FLASK_PORT`: 端口号（默认: 5000）
- `FLASK_ENV`: 环境模式（production/development）

## 数据持久化

上传的文件会保存在 `./uploads` 目录中，通过Docker卷映射实现持久化。

## 故障排除

### 查看容器状态
```bash
docker-compose ps
```

### 查看详细日志
```bash
docker-compose logs -f dataanalysis
```

### 进入容器调试
```bash
docker-compose exec dataanalysis bash
```

### 重新构建
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 生产部署建议

1. 使用反向代理（Nginx）
2. 配置HTTPS
3. 设置资源限制
4. 配置日志轮转
5. 使用Docker Swarm或Kubernetes进行集群部署