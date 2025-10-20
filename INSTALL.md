# 安装指南

根据您的操作系统选择对应的安装方式：

## 🪟 Windows

请查看 **[Windows 开发指南](WINDOWS_GUIDE.md)**

**快速安装**:
1. 确保已安装 [Node.js](https://nodejs.org/)
2. 双击运行 `install-windows.bat`
3. 双击运行 `dev.bat` 启动开发服务器

## 🐧 Linux (Ubuntu/Debian)

### 开发环境

```bash
# 1. 安装依赖
npm run install:all

# 2. 配置环境
cd backend
cp .env.example .env
# 编辑 .env 文件设置 JWT_SECRET
cd ..

# 3. 初始化数据库
cd backend
npm run init-db
cd ..

# 4. 启动开发服务器
npm run dev
```

### 生产环境

请查看 **[部署文档](DEPLOYMENT.md)**

**快速部署**:
```bash
sudo chmod +x deploy.sh
sudo ./deploy.sh
./start-pm2.sh
```

## 🍎 macOS

### 开发环境

```bash
# 1. 安装 Homebrew (如未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js
brew install node

# 3. 安装项目依赖
npm run install:all

# 4. 配置环境
cd backend
cp .env.example .env
# 编辑 .env 文件
cd ..

# 5. 初始化数据库
cd backend
npm run init-db
cd ..

# 6. 启动开发服务器
npm run dev
```

## 详细文档

- **[快速开始指南](QUICKSTART.md)** - 5分钟快速上手
- **[Windows 开发指南](WINDOWS_GUIDE.md)** - Windows 详细说明
- **[部署文档](DEPLOYMENT.md)** - 生产环境部署
- **[用户手册](USER_GUIDE.md)** - 功能使用说明
- **[项目总结](PROJECT_SUMMARY.md)** - 技术架构和设计

## 验证安装

安装完成后，访问：

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:3000/api/health

默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 遇到问题？

1. 查看对应系统的详细指南
2. 检查 Node.js 版本是否 >= 18.x
3. 确保端口 3000 和 5173 未被占用
4. 查看控制台错误信息

## 下一步

安装完成后，建议：

1. 阅读 [用户手册](USER_GUIDE.md) 了解功能
2. 修改默认管理员密码（通过删除用户重建或数据库修改）
3. 根据需求自定义积分规则
4. 如需部署到生产环境，参考 [部署文档](DEPLOYMENT.md)

---

祝您使用愉快！ 🚀

