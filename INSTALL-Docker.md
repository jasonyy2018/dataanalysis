# Docker 安装指南

## Windows 安装 Docker

### 方式一：Docker Desktop（推荐）

1. 访问 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. 下载并安装 Docker Desktop
3. 启动 Docker Desktop
4. 确认安装成功：
   ```cmd
   docker --version
   docker-compose --version
   ```

### 方式二：使用 Chocolatey

```powershell
# 以管理员身份运行 PowerShell
choco install docker-desktop
```

### 方式三：使用 winget

```powershell
winget install Docker.DockerDesktop
```

## Linux 安装 Docker

### Ubuntu/Debian

```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

### CentOS/RHEL

```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## macOS 安装 Docker

### 方式一：Docker Desktop

1. 访问 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. 下载并安装 Docker Desktop
3. 启动 Docker Desktop

### 方式二：使用 Homebrew

```bash
brew install --cask docker
```

## 验证安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version

# 运行测试容器
docker run hello-world
```

## 启动数据趋势分析应用

安装完成后，在项目目录运行：

```bash
# 使用 docker-compose
docker-compose up --build -d

# 或使用脚本
# Windows: docker-run.bat
# Linux/Mac: ./docker-run.sh
```

## 常见问题

### Windows 问题

1. **WSL2 未启用**
   - 启用 Windows 功能中的 "适用于 Linux 的 Windows 子系统"
   - 安装 WSL2 内核更新包

2. **Hyper-V 冲突**
   - 确保启用 Hyper-V 功能
   - 或使用 Docker Desktop 的 WSL2 后端

### Linux 问题

1. **权限问题**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **防火墙问题**
   ```bash
   sudo ufw allow 2376/tcp
   sudo ufw allow 2377/tcp
   ```

### 通用问题

1. **端口占用**
   - 检查 5000 端口是否被占用
   - 修改 docker-compose.yml 中的端口映射

2. **内存不足**
   - 增加 Docker Desktop 的内存限制
   - 或使用生产配置 docker-compose.prod.yml