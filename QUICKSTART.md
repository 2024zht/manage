# 快速上手指南

本指南将帮助您在5分钟内启动实验室管理系统。

## 开发环境快速启动

### 步骤 1: 安装依赖

```bash
# 安装所有依赖
npm run install:all
```

### 步骤 2: 配置环境

```bash
# 创建环境变量文件
cd backend
cp .env.example .env
cd ..
```

**重要**: 打开 `backend/.env` 文件，确保配置正确。开发环境可以使用默认配置。

### 步骤 3: 初始化数据库

```bash
cd backend
npm run init-db
cd ..
```

这将创建数据库并添加默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

### 步骤 4: 启动项目

```bash
# 同时启动前后端
npm run dev
```

或分别启动：
```bash
# 终端 1 - 启动后端
npm run dev:backend

# 终端 2 - 启动前端
npm run dev:frontend
```

### 步骤 5: 访问应用

- 前端: http://localhost:5173
- 后端API: http://localhost:3000/api

## 生产环境快速部署 (Ubuntu)

### 一键部署

```bash
# 运行自动部署脚本
sudo chmod +x deploy.sh
sudo ./deploy.sh

# 使用 PM2 启动服务
chmod +x start-pm2.sh
./start-pm2.sh
```

### 验证部署

```bash
# 检查应用状态
pm2 status

# 查看日志
pm2 logs robotlab-manage
```

## 首次使用

### 1. 登录管理员账户

使用默认账户登录：
- 用户名: `admin`
- 密码: `admin123`

**立即修改密码**（当前版本需要通过删除用户重建或数据库修改）

### 2. 添加规则

1. 点击 "管理面板"
2. 切换到 "规则管理" 标签
3. 点击 "添加规则" 添加积分规则

### 3. 邀请成员注册

让实验室成员访问注册页面创建账户。

### 4. 管理积分

在管理面板的 "用户管理" 中：
- 点击编辑图标可以修改用户积分
- 点击设置图标可以设置管理员权限
- 点击删除图标可以删除用户

## 常用操作

### 查看所有用户和积分

访问首页即可看到积分排行榜。

### 添加/扣除积分

1. 进入管理面板
2. 点击用户旁边的编辑图标
3. 输入积分变化（正数加分，负数扣分）
4. 输入原因
5. 确认

### 管理规则

1. 进入管理面板
2. 切换到 "规则管理"
3. 可以添加、编辑或删除规则

### 设置管理员

1. 进入管理面板
2. 点击用户旁边的设置图标
3. 确认设置或取消管理员权限

## 故障排查

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 修改端口
# 编辑 backend/.env 修改 PORT
# 编辑 frontend/vite.config.ts 修改 server.port
```

### 数据库错误

```bash
# 删除并重建数据库
rm backend/database.sqlite
cd backend
npm run init-db
cd ..
```

### 依赖安装问题

```bash
# 清除缓存并重新安装
rm -rf node_modules backend/node_modules frontend/node_modules
rm package-lock.json backend/package-lock.json frontend/package-lock.json
npm run install:all
```

## 下一步

- 阅读 [README.md](README.md) 了解详细功能
- 阅读 [DEPLOYMENT.md](DEPLOYMENT.md) 了解生产部署
- 自定义规则以适应实验室需求
- 定期备份数据库文件

## 技术支持

遇到问题？
1. 检查控制台错误信息
2. 查看 PM2 日志: `pm2 logs`
3. 参考 [README.md](README.md) 的常见问题部分

---

祝您使用愉快！🎉

