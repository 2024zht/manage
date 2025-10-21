#!/bin/bash

echo "🚀 开始安装点名和邮件模块..."

# 进入后端目录
cd backend

echo "📦 安装依赖..."
npm install nodemailer @types/nodemailer node-cron @types/node-cron

echo "🗄️ 初始化数据库（添加点名表）..."
npm run init-db

echo "🔨 构建后端..."
npm run build

cd ..

echo "🎨 构建前端..."
cd frontend
npm run build

echo "✅ 完成！现在可以使用点名和邮件功能了。"
echo ""
echo "访问："
echo "  - 学生端点名签到: /attendance"
echo "  - 管理员点名管理: /admin/attendance"
echo ""
echo "请重启开发服务器或部署到生产环境。"

