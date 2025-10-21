#!/bin/bash

# 更新电子书上传限制和添加进度条支持
# 在服务器上运行此脚本

echo "🚀 开始更新电子书上传功能..."
echo ""

# 1. 更新 Nginx 配置
echo "[1/4] 更新 Nginx 配置（支持 500MB 文件上传）..."
sudo tee /etc/nginx/sites-available/robotlab-manage > /dev/null << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # 增加文件上传大小限制到 500MB
    client_max_body_size 500M;
    
    # 增加超时时间
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # 前端静态文件
    location / {
        root /home/ubuntu/manage/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # API 超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX_CONF

# 测试 Nginx 配置
echo "测试 Nginx 配置..."
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败"
    exit 1
fi

# 重启 Nginx
echo "重启 Nginx..."
sudo systemctl restart nginx
echo "✅ Nginx 配置已更新"
echo ""

# 2. 重新构建前端
echo "[2/4] 重新构建前端（包含进度条功能）..."
cd ~/manage/frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi
echo "✅ 前端构建完成"
echo ""

# 3. 重新构建后端
echo "[3/4] 重新构建后端（更新文件大小限制）..."
cd ~/manage/backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 后端构建失败"
    exit 1
fi
echo "✅ 后端构建完成"
echo ""

# 4. 重启服务
echo "[4/4] 重启服务..."
pm2 restart robotlab-manage
pm2 save
echo "✅ 服务已重启"
echo ""

echo "=================================="
echo "🎉 更新完成！"
echo "=================================="
echo ""
echo "✨ 新功能："
echo "   ✅ 支持最大 500MB 文件上传"
echo "   ✅ 上传时显示进度条悬浮窗"
echo "   ✅ 实时显示上传百分比"
echo ""
echo "📋 测试步骤："
echo "   1. 访问: http://你的服务器IP/ebooks"
echo "   2. 以管理员身份登录"
echo "   3. 上传一个大文件（>10MB）"
echo "   4. 观察右下角的进度条悬浮窗"
echo ""
echo "=================================="

