@echo off
echo ========================================
echo 构建实验室管理系统
echo ========================================
echo.

echo [1/2] 构建后端...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo 后端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [2/2] 构建前端...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo 构建完成！
echo ========================================
echo.
echo 后端构建输出: backend\dist\
echo 前端构建输出: frontend\dist\
echo.
pause

