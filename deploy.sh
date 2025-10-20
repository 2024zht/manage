#!/bin/bash

# 实验室管理系统部署脚本 (Ubuntu)

echo "======================================"
echo "实验室管理系统 - Ubuntu 部署脚本"
echo "======================================"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo "请使用 sudo 运行此脚本"
  exit 1
fi

# 1. 安装 Node.js 和 npm (如果未安装)
echo "[1/7] 检查并安装 Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js 已安装: $(node --version)"
fi

# 2. 安装 PM2 (进程管理器)
echo "[2/7] 安装 PM2..."
npm install -g pm2

# 3. 安装项目依赖
echo "[3/7] 安装项目依赖..."
npm run install:all

# 4. 创建环境变量文件
echo "[4/7] 配置环境变量..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    # 生成随机的JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-secret-key-change-this-in-production/$JWT_SECRET/" backend/.env
    echo "已创建 backend/.env 文件"
else
    echo "backend/.env 已存在"
fi

# 5. 初始化数据库
echo "[5/7] 初始化数据库..."
cd backend
npm run init-db
cd ..

# 6. 构建前端
echo "[6/7] 构建前端..."
cd frontend
npm run build
cd ..

# 7. 构建后端
echo "[7/7] 构建后端..."
cd backend
npm run build
cd ..

echo ""
echo "======================================"
echo "部署完成！"
echo "======================================"
echo ""
echo "默认管理员账户："
echo "  用户名: admin"
echo "  密码: admin123"
echo "  请登录后立即修改密码！"
echo ""
echo "启动服务器："
echo "  开发模式: npm run dev"
echo "  生产模式: npm start"
echo "  使用 PM2: pm2 start backend/dist/server.js --name robotlab-manage"
echo ""
echo "访问地址："
echo "  前端开发服务器: http://localhost:5173"
echo "  后端API: http://localhost:3000/api"
echo ""

