# 实验室管理系统 - 部署文档

## 目录
- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [生产环境配置](#生产环境配置)
- [维护和管理](#维护和管理)
- [故障排除](#故障排除)

## 系统要求

### 硬件要求
- CPU: 1核心以上
- 内存: 1GB 以上
- 磁盘: 2GB 以上可用空间

### 软件要求
- 操作系统: Ubuntu 20.04 LTS 或更高版本
- Node.js: 18.x 或更高版本
- npm: 9.x 或更高版本

## 快速部署

### 1. 克隆或上传项目到服务器

```bash
cd /path/to/your/directory
git clone <repository-url> robotlab-manage
cd robotlab-manage
```

### 2. 运行部署脚本

```bash
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

部署脚本会自动完成以下操作：
- 安装 Node.js（如果未安装）
- 安装 PM2 进程管理器
- 安装项目依赖
- 创建环境变量文件
- 初始化数据库
- 构建前端和后端

### 3. 启动应用

#### 开发模式
```bash
npm run dev
```

#### 生产模式（使用 PM2）
```bash
chmod +x start-pm2.sh
./start-pm2.sh
```

## 手动部署

### 1. 安装 Node.js

```bash
# 添加 NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装项目依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 配置环境变量

```bash
cd backend
cp .env.example .env
nano .env
```

编辑 `.env` 文件：
```
PORT=3000
JWT_SECRET=your-very-secure-random-secret-key-here
NODE_ENV=production
DATABASE_PATH=./database.sqlite
```

**重要**: 请生成一个强随机密钥替换 `JWT_SECRET`

```bash
# 生成随机密钥
openssl rand -base64 32
```

### 4. 初始化数据库

```bash
cd backend
npm run init-db
cd ..
```

### 5. 构建项目

```bash
# 构建前端
cd frontend
npm run build
cd ..

# 构建后端
cd backend
npm run build
cd ..
```

### 6. 启动服务

```bash
# 使用 PM2 (推荐)
npm install -g pm2
pm2 start backend/dist/server.js --name robotlab-manage
pm2 save
pm2 startup

# 或直接运行
cd backend
npm start
```

## 生产环境配置

### 使用 Nginx 反向代理

1. 安装 Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. 配置 Nginx:
```bash
sudo nano /etc/nginx/sites-available/robotlab-manage
```

复制 `nginx.conf` 文件内容，并修改以下内容：
- `server_name`: 替换为您的域名
- `root` 路径: 替换为实际的前端构建目录路径

3. 启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/robotlab-manage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. 配置防火墙:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 配置 SSL (HTTPS)

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置 Nginx
sudo certbot --nginx -d your-domain.com

# 证书会自动续期，可以测试续期命令
sudo certbot renew --dry-run
```

### 环境变量优化

生产环境建议配置：

```bash
# backend/.env
PORT=3000
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
DATABASE_PATH=/var/lib/robotlab/database.sqlite
```

创建数据库目录并设置权限：
```bash
sudo mkdir -p /var/lib/robotlab
sudo chown $USER:$USER /var/lib/robotlab
```

## 维护和管理

### PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs robotlab-manage

# 重启应用
pm2 restart robotlab-manage

# 停止应用
pm2 stop robotlab-manage

# 删除应用
pm2 delete robotlab-manage

# 监控
pm2 monit
```

### 数据库备份

```bash
# 备份数据库
cp /var/lib/robotlab/database.sqlite /backup/database-$(date +%Y%m%d).sqlite

# 创建定时备份 (每天凌晨2点)
crontab -e
# 添加以下行：
0 2 * * * cp /var/lib/robotlab/database.sqlite /backup/database-$(date +\%Y\%m\%d).sqlite
```

### 更新应用

```bash
# 停止应用
pm2 stop robotlab-manage

# 拉取最新代码
git pull

# 安装依赖
npm run install:all

# 重新构建
npm run build

# 重启应用
pm2 restart robotlab-manage
```

## 故障排除

### 常见问题

#### 1. 端口已被占用
```bash
# 查看占用端口的进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

#### 2. 数据库锁定
```bash
# 检查是否有多个实例运行
pm2 status

# 停止所有实例
pm2 stop all

# 重启
pm2 restart robotlab-manage
```

#### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER /path/to/robotlab/manage

# 修复数据库权限
sudo chown $USER:$USER /var/lib/robotlab/database.sqlite
sudo chmod 644 /var/lib/robotlab/database.sqlite
```

#### 4. 内存不足
```bash
# 检查内存使用
free -h

# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 日志位置

- PM2 日志: `~/.pm2/logs/`
- Nginx 日志: `/var/log/nginx/`
- 应用日志: 查看 PM2 日志

### 性能优化

1. **启用 Nginx 缓存**
2. **配置 PM2 集群模式**:
```bash
pm2 start backend/dist/server.js -i max --name robotlab-manage
```
3. **定期清理日志**:
```bash
pm2 flush
```

## 默认账户

首次部署后，系统会创建默认管理员账户：

- **用户名**: admin
- **密码**: admin123
- **邮箱**: admin@robotlab.com

**重要**: 请在首次登录后立即修改密码！

## 技术支持

如遇到问题，请检查：
1. 应用日志 (`pm2 logs`)
2. Nginx 错误日志 (`/var/log/nginx/error.log`)
3. 数据库文件是否存在且有正确权限
4. 环境变量配置是否正确

---

更多信息请参考 [README.md](README.md)

