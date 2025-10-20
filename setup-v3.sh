#!/bin/bash

# V3.0 功能配置脚本
# 用于快速配置请假审批和电子书管理模块

echo "============================================"
echo "   实验室管理系统 V3.0 配置向导"
echo "============================================"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "✓ 项目根目录确认"
echo ""

# 1. 安装后端依赖
echo "步骤 1/5: 安装后端依赖..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✓ 后端依赖安装成功"
else
    echo "❌ 后端依赖安装失败"
    exit 1
fi
echo ""

# 2. 配置环境变量
echo "步骤 2/5: 配置环境变量..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ 已创建 .env 文件"
    else
        echo "创建 .env 文件..."
        cat > .env << EOF
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# Backblaze B2 配置
B2_BUCKET_NAME=
B2_FOLDER=ebooks
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api
EOF
        echo "✓ 已创建 .env 文件（包含随机JWT密钥）"
    fi
else
    echo "⚠️  .env 文件已存在，跳过"
fi

echo ""
echo "请编辑 backend/.env 文件，填写以下配置："
echo "  - B2_BUCKET_NAME: 您的Backblaze B2存储桶名称"
echo "  - CF_WORKER_URL: 您的Cloudflare Worker URL"
echo ""
read -p "是否现在编辑 .env 文件？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} .env
fi
echo ""

# 3. 检查B2 CLI
echo "步骤 3/5: 检查Backblaze B2 CLI..."
if command -v b2 &> /dev/null; then
    echo "✓ B2 CLI 已安装"
    b2 version
else
    echo "⚠️  B2 CLI 未安装"
    echo ""
    echo "要使用电子书模块，需要安装B2 CLI："
    echo "  pip install --upgrade b2"
    echo "  b2 authorize-account <application_key_id> <application_key>"
    echo ""
    read -p "是否现在安装B2 CLI？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pip install --upgrade b2
        echo ""
        echo "B2 CLI已安装，请运行以下命令授权："
        echo "  b2 authorize-account <your_application_key_id> <your_application_key>"
    fi
fi
echo ""

# 4. 初始化数据库
echo "步骤 4/5: 初始化数据库..."
read -p "是否重新初始化数据库（这将创建新表）？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run init-db
    if [ $? -eq 0 ]; then
        echo "✓ 数据库初始化成功"
    else
        echo "❌ 数据库初始化失败"
        exit 1
    fi
else
    echo "⚠️  跳过数据库初始化"
fi
echo ""

# 5. 创建uploads目录
echo "步骤 5/5: 创建上传目录..."
mkdir -p uploads/ebooks
chmod 755 uploads/ebooks
echo "✓ uploads/ebooks 目录已创建"
echo ""

# 返回项目根目录
cd ..

echo "============================================"
echo "   配置完成！"
echo "============================================"
echo ""
echo "📋 接下来的步骤："
echo ""
echo "1. 创建前端组件（约30分钟）："
echo "   - frontend/src/components/LeaveRequest.tsx"
echo "   - frontend/src/components/LeaveApproval.tsx"
echo "   - frontend/src/components/Ebooks.tsx"
echo ""
echo "2. 更新路由配置："
echo "   - frontend/src/App.tsx"
echo "   - frontend/src/components/Layout.tsx"
echo ""
echo "3. 完整代码请查看："
echo "   - LEAVE_EBOOK_IMPLEMENTATION.md"
echo ""
echo "4. 启动项目："
echo "   npm run dev"
echo ""
echo "============================================"
echo ""
echo "📚 相关文档："
echo "  - V3_IMPLEMENTATION_SUMMARY.md - 实现总结"
echo "  - LEAVE_EBOOK_QUICK_GUIDE.md - 快速指南"
echo "  - LEAVE_EBOOK_IMPLEMENTATION.md - 详细实现"
echo ""
echo "✨ 祝您使用愉快！"
echo ""

