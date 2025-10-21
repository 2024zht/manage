# Windows 开发指南

本指南专为 Windows 用户准备，帮助您在 Windows 环境下快速搭建和运行实验室管理系统。

## 前置要求

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或更高）
3. 运行安装程序
4. 安装完成后，打开命令提示符（CMD）或 PowerShell，验证安装：

```bash
node --version
npm --version
```

### 2. 安装 Git（可选）

如果您需要从 Git 仓库克隆项目：

1. 访问 [Git 官网](https://git-scm.com/)
2. 下载 Windows 版本
3. 安装并使用默认选项

## 快速开始

### 方法 1: 使用批处理脚本（推荐）

1. **安装依赖和初始化**

双击运行 `install-windows.bat`，或在命令提示符中运行：

```bash
install-windows.bat
```

这个脚本会自动：
- 检查 Node.js 安装
- 安装所有依赖
- 创建环境变量文件
- 初始化数据库

2. **启动开发服务器**

双击运行 `dev.bat`，或在命令提示符中运行：

```bash
dev.bat
```

3. **访问应用**

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000/api

### 方法 2: 手动安装

#### 步骤 1: 安装依赖

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

#### 步骤 2: 配置环境变量

```bash
cd backend
copy .env.example .env
notepad .env
```

编辑 `.env` 文件，确保以下配置正确：

```
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

**重要**: 请修改 `JWT_SECRET` 为一个强随机字符串。

#### 步骤 3: 初始化数据库

```bash
cd backend
npm run init-db
cd ..
```

#### 步骤 4: 启动项目

**同时启动前后端** (需要安装 concurrently)：

```bash
npm run dev
```

**或分别启动**：

终端 1 - 后端：
```bash
cd backend
npm run dev
```

终端 2 - 前端：
```bash
cd frontend
npm run dev
```

## 生产环境构建

### 构建项目

双击运行 `build.bat`，或：

```bash
build.bat
```

或手动构建：

```bash
# 构建后端
cd backend
npm run build
cd ..

# 构建前端
cd frontend
npm run build
cd ..
```

### 启动生产服务器

```bash
cd backend
npm start
```

## 常见问题

### 问题 1: PowerShell 执行策略错误

**错误信息**: "无法加载文件，因为在此系统上禁止运行脚本"

**解决方法**:

以管理员身份运行 PowerShell：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题 2: 端口被占用

**错误信息**: "Error: listen EADDRINUSE: address already in use :::3000"

**解决方法**:

查找并关闭占用端口的进程：

```bash
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 关闭进程（将 PID 替换为实际的进程 ID）
taskkill /PID <PID> /F
```

或修改端口：
- 后端: 编辑 `backend\.env` 中的 `PORT`
- 前端: 编辑 `frontend\vite.config.ts` 中的 `server.port`

### 问题 3: npm install 失败

**解决方法**:

1. 清除 npm 缓存：
```bash
npm cache clean --force
```

2. 删除 node_modules 和 lock 文件：
```bash
rmdir /s /q node_modules
rmdir /s /q backend\node_modules
rmdir /s /q frontend\node_modules
del package-lock.json
del backend\package-lock.json
del frontend\package-lock.json
```

3. 重新安装：
```bash
npm run install:all
```

### 问题 4: 中文乱码

**解决方法**:

在命令提示符中运行：
```bash
chcp 65001
```

或使用 PowerShell 代替 CMD。

### 问题 5: SQLite 安装失败

某些 Windows 系统可能需要安装构建工具：

```bash
npm install --global windows-build-tools
```

或手动安装：
1. 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. 选择 "C++ 生成工具" 工作负载

## 开发工具推荐

### 代码编辑器

- **VS Code** (推荐)
  - 下载: https://code.visualstudio.com/
  - 推荐插件:
    - ESLint
    - Prettier
    - Tailwind CSS IntelliSense
    - TypeScript Vue Plugin (Volar)

### 数据库工具

- **DB Browser for SQLite**
  - 下载: https://sqlitebrowser.org/
  - 用于查看和编辑 SQLite 数据库

### API 测试工具

- **Postman**
  - 下载: https://www.postman.com/
  - 用于测试 API 接口

## Windows 特定注意事项

### 路径分隔符

Windows 使用反斜杠 `\`，而 Unix/Linux 使用正斜杠 `/`。代码中已处理此差异，但在手动操作时请注意。

### 脚本执行

- `.bat` 文件: 可以双击运行或在 CMD 中运行
- `.sh` 文件: 需要在 Git Bash 或 WSL 中运行

### 文件权限

Windows 没有 Unix/Linux 的文件权限概念，因此 `chmod` 命令无法使用。部署脚本主要为 Linux 设计。

### 换行符

Windows 使用 CRLF (`\r\n`)，Linux 使用 LF (`\n`)。Git 会自动处理，但如果遇到问题，可以配置：

```bash
git config --global core.autocrlf true
```

## 使用 WSL (Windows Subsystem for Linux)

如果您想在 Windows 上获得更接近 Linux 的开发体验：

### 1. 启用 WSL

以管理员身份运行 PowerShell：

```powershell
wsl --install
```

### 2. 安装 Ubuntu

```powershell
wsl --install -d Ubuntu
```

### 3. 在 WSL 中开发

```bash
# 进入 WSL
wsl

# 导航到项目目录
cd /mnt/d/robotlab/manage

# 按照 Linux 说明进行操作
```

## 部署到生产环境

如果您的生产服务器是 Ubuntu：

1. 将项目上传到服务器
2. 参考 [DEPLOYMENT.md](DEPLOYMENT.md) 进行部署
3. 使用提供的 Linux 部署脚本

如果生产环境也是 Windows Server：

1. 安装 Node.js
2. 使用批处理脚本安装和构建
3. 使用 [PM2 for Windows](https://pm2.keymetrics.io/docs/usage/pm2-windows/) 或 Windows Service 运行

## 获取帮助

遇到问题？

1. 查看 [README.md](README.md)
2. 查看 [QUICKSTART.md](QUICKSTART.md)
3. 检查控制台错误信息
4. 搜索错误信息

---

祝您开发愉快！ 🎉

