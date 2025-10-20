#!/bin/bash

# 使用 PM2 启动应用

echo "使用 PM2 启动实验室管理系统..."

# 停止旧的进程（如果存在）
pm2 delete robotlab-manage 2>/dev/null || true

# 启动后端
pm2 start backend/dist/server.js --name robotlab-manage

# 保存 PM2 进程列表
pm2 save

# 设置 PM2 开机自启
pm2 startup

echo ""
echo "应用已启动！"
echo "查看日志: pm2 logs robotlab-manage"
echo "查看状态: pm2 status"
echo "停止应用: pm2 stop robotlab-manage"
echo "重启应用: pm2 restart robotlab-manage"

