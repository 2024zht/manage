#!/bin/bash

# 服务器部署脚本 - 实验室管理系统

echo "🚀 开始部署实验室管理系统到服务器..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "❌ 请使用 sudo 运行此脚本"
  exit 1
fi

# 获取服务器IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "📋 服务器IP: $SERVER_IP"
echo ""

# 1. 安装Node.js (如果未安装)
echo "[1/8] 检查Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js已安装: $(node --version)"
fi

# 2. 安装PM2
echo "[2/8] 安装PM2..."
npm install -g pm2

# 3. 安装项目依赖
echo "[3/8] 安装项目依赖..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. 创建环境变量文件
echo "[4/8] 配置环境变量..."
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
PORT=3000
JWT_SECRET=9YAdzuhzaUTCL/5Xxwx6gHoV8SPF4pC1LlCkHXXpL2I=
NODE_ENV=production
DATABASE_PATH=./database.sqlite

# Backblaze B2配置
B2_BUCKET_NAME=robotlib

# Cloudflare Worker配置
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api
EOF
    echo "✅ 已创建环境变量文件"
else
    echo "✅ 环境变量文件已存在"
fi

# 5. 初始化数据库
echo "[5/8] 初始化数据库..."
cd backend
npm run init-db
cd ..

# 6. 构建前端
echo "[6/8] 构建前端..."
cd frontend
npm run build
cd ..

# 7. 构建后端
echo "[7/8] 构建后端..."
cd backend
npm run build
cd ..

# 8. 启动服务
echo "[8/8] 启动服务..."
pm2 delete robotlab-manage 2>/dev/null || true
pm2 start backend/dist/server.js --name robotlab-manage
pm2 save
pm2 startup

# 9. 配置防火墙
echo "🔒 配置防火墙..."
ufw allow 3000
ufw allow 5173
ufw --force enable

echo ""
echo "🎉 部署完成！"
echo "=================================="
echo "📱 访问地址："
echo "   前端: http://$SERVER_IP:5173"
echo "   后端API: http://$SERVER_IP:3000/api"
echo "   管理员登录: http://$SERVER_IP:5173/admin/login"
echo ""
echo "👤 默认管理员账户："
echo "   用户名: admin"
echo "   密码: admin123"
echo "   ⚠️  请登录后立即修改密码！"
echo ""
echo "🛠️  管理命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs robotlab-manage"
echo "   重启服务: pm2 restart robotlab-manage"
echo "   停止服务: pm2 stop robotlab-manage"
echo ""
echo "=================================="
