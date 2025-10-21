@echo off
echo ========================================
echo 实验室管理系统 - Windows 安装脚本
echo ========================================
echo.

echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js
    echo 请访问 https://nodejs.org/ 下载并安装 Node.js
    pause
    exit /b 1
)
node --version
echo.

echo [2/4] 安装项目依赖...
call npm run install:all
if %errorlevel% neq 0 (
    echo 依赖安装失败
    pause
    exit /b 1
)
echo.

echo [3/4] 配置环境变量...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo 已创建 backend\.env 文件
    echo 请编辑此文件设置 JWT_SECRET
) else (
    echo backend\.env 已存在
)
echo.

echo [4/4] 初始化数据库...
cd backend
call npm run init-db
if %errorlevel% neq 0 (
    echo 数据库初始化失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 默认管理员账户：
echo   用户名: admin
echo   密码: admin123
echo.
echo 启动开发服务器：
echo   npm run dev
echo.
echo 访问地址：
echo   前端: http://localhost:5173
echo   后端: http://localhost:3000/api
echo.
pause

