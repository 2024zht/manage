# 🚀 服务器部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 18.04+ (推荐 Ubuntu 20.04/22.04)
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 公网IP或内网可访问

### 2. 必需软件
- Node.js 18.x+
- npm
- PM2 (进程管理器)
- Nginx (反向代理，可选)

## 🔧 部署步骤

### 第一步：上传代码到服务器

```bash
# 方法1: 使用 git clone
git clone <your-repository-url> /opt/robotlab-manage
cd /opt/robotlab-manage

# 方法2: 使用 scp 上传
scp -r /path/to/your/project user@server-ip:/opt/robotlab-manage
```

### 第二步：安装依赖和配置

```bash
# 进入项目目录
cd /opt/robotlab-manage

# 给脚本执行权限
chmod +x deploy.sh start-pm2.sh

# 运行部署脚本
sudo ./deploy.sh
```

### 第三步：配置环境变量

编辑 `backend/.env` 文件：

```bash
nano backend/.env
```

添加以下内容：

```bash
PORT=3000
JWT_SECRET=9YAdzuhzaUTCL/5Xxwx6gHoV8SPF4pC1LlCkHXXpL2I=
NODE_ENV=production
DATABASE_PATH=./database.sqlite

# Backblaze B2配置
B2_BUCKET_NAME=robotlib

# Cloudflare Worker配置
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api
```

### 第四步：启动服务

```bash
# 使用 PM2 启动（推荐）
./start-pm2.sh

# 或者手动启动
pm2 start backend/dist/server.js --name robotlab-manage
pm2 save
pm2 startup
```

## 🌐 配置网络访问

### 方法1: 直接通过IP+端口访问

```bash
# 开放防火墙端口
sudo ufw allow 3010
sudo ufw allow 2111

# 访问地址
# 前端: http://129.226.147.57:2111
# 后端API: http://129.226.147.57:3010/api
```

### 方法2: 使用Nginx反向代理（推荐）

1. **安装Nginx**:
```bash
sudo apt update
sudo apt install nginx
```

2. **创建Nginx配置**:
```bash
sudo nano /etc/nginx/sites-available/robotlab-manage
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name 129.226.147.57;  # 您的服务器IP

    # 前端静态文件
    location / {
        root /opt/robotlab-manage/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **启用配置**:
```bash
sudo ln -s /etc/nginx/sites-available/robotlab-manage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **访问地址**:
```
http://129.226.147.57
```

## 🔍 测试部署

### 1. 检查服务状态
```bash
# 查看PM2进程
pm2 status

# 查看日志
pm2 logs robotlab-manage

# 查看端口占用
sudo netstat -tlnp | grep :3010
```

### 2. 测试API
```bash
# 测试后端API
curl http://129.226.147.57:3010/api/users

# 测试前端
curl http://129.226.147.57:2111
```

### 3. 浏览器访问
- 前端: `http://129.226.147.57:2111` 或 `http://129.226.147.57`
- 管理员登录: `http://129.226.147.57:2111/admin/login`

## 🛠️ 常用管理命令

### PM2 管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs robotlab-manage

# 重启服务
pm2 restart robotlab-manage

# 停止服务
pm2 stop robotlab-manage

# 删除服务
pm2 delete robotlab-manage
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建
cd frontend && npm run build
cd ../backend && npm run build

# 重启服务
pm2 restart robotlab-manage
```

## 🔒 安全配置

### 1. 防火墙设置
```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (如果使用SSL)
sudo ufw allow 3010  # 后端API
sudo ufw allow 2111  # 前端
sudo ufw enable
```

### 2. 修改默认密码
- 登录管理员账户
- 用户名: `admin`
- 密码: `admin123`
- **立即修改密码！**

## 🚨 故障排除

### 常见问题

1. **端口被占用**:
```bash
sudo lsof -i :3010
sudo kill -9 <PID>
```

2. **权限问题**:
```bash
sudo chown -R $USER:$USER /opt/robotlab-manage
```

3. **Node.js版本问题**:
```bash
node --version
npm --version
```

4. **PM2进程异常**:
```bash
pm2 logs robotlab-manage --lines 50
```

## 📞 访问地址总结

部署完成后，您可以通过以下地址访问：

- **前端界面**: `http://129.226.147.57:2111`
- **管理员登录**: `http://129.226.147.57:2111/admin/login`
- **后端API**: `http://129.226.147.57:3010/api`
- **使用Nginx**: `http://129.226.147.57`
