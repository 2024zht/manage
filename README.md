# 实验室管理系统

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个功能完善的实验室成员积分管理系统，支持用户注册登录、积分排行榜、规则管理和管理员功能。

## 📚 文档导航

### 快速入门
- **[安装指南](INSTALL.md)** - 各平台安装说明
- **[快速开始](QUICKSTART.md)** - 5分钟上手
- **[Windows 指南](WINDOWS_GUIDE.md)** - Windows 开发环境

### 使用文档
- **[用户手册](USER_GUIDE.md)** - 功能使用说明
- **[常见问题](FAQ.md)** - 疑难解答

### 开发文档
- **[部署文档](DEPLOYMENT.md)** - 生产环境部署
- **[项目总结](PROJECT_SUMMARY.md)** - 技术架构详解
- **[贡献指南](CONTRIBUTING.md)** - 如何贡献代码
- **[更新日志](CHANGELOG.md)** - 版本历史

## 功能特性

- ✅ **用户认证**: 完整的注册和登录功能，基于 JWT 的身份验证
- 📊 **积分看板**: 实时显示所有成员的积分排名和统计信息
- 📖 **规则展示**: 清晰展示加分和扣分规则
- 🔧 **管理员功能**: 
  - 添加/删除成员
  - 修改成员积分
  - 管理积分规则
  - 设置管理员权限
- 📱 **响应式设计**: 完美支持桌面和移动设备

## 技术栈

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **认证**: JWT + bcryptjs
- **验证**: express-validator

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **HTTP客户端**: Axios

## 快速开始

### 前置要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装

#### Windows 用户

双击运行 `install-windows.bat` 或查看 [Windows 开发指南](WINDOWS_GUIDE.md)

#### Linux/Mac 用户

```bash
# 克隆项目
git clone <repository-url>
cd manage

# 安装所有依赖（根目录、后端、前端）
npm run install:all
```

### 配置

1. 创建后端环境变量文件：
```bash
cd backend
cp .env.example .env
```

2. 编辑 `backend/.env` 文件，设置必要的环境变量：
```env
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### 初始化数据库

```bash
cd backend
npm run init-db
```

这将创建数据库表并初始化默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`
- 邮箱: `admin@robotlab.com`

### 运行项目

#### 开发模式

```bash
# 从根目录同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:backend  # 后端运行在 http://localhost:3000
npm run dev:frontend # 前端运行在 http://localhost:5173
```

#### 生产模式

```bash
# 构建项目
npm run build

# 启动后端服务器
npm start
```

## 生产环境部署

详细的部署文档请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### Ubuntu 快速部署

```bash
# 运行自动部署脚本
sudo chmod +x deploy.sh
sudo ./deploy.sh

# 使用 PM2 启动
chmod +x start-pm2.sh
./start-pm2.sh
```

## 项目结构

```
manage/
├── backend/                # 后端代码
│   ├── src/
│   │   ├── database/      # 数据库配置和初始化
│   │   ├── middleware/    # Express 中间件
│   │   ├── routes/        # API 路由
│   │   ├── types/         # TypeScript 类型定义
│   │   └── server.ts      # 服务器入口
│   ├── .env.example       # 环境变量示例
│   └── package.json
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── contexts/      # React Context
│   │   ├── services/      # API 服务
│   │   ├── types/         # TypeScript 类型定义
│   │   ├── App.tsx        # 应用主组件
│   │   └── main.tsx       # 应用入口
│   ├── index.html
│   └── package.json
├── deploy.sh              # Ubuntu 部署脚本
├── start-pm2.sh          # PM2 启动脚本
├── nginx.conf            # Nginx 配置示例
├── DEPLOYMENT.md         # 部署文档
└── package.json          # 根 package.json
```

## API 文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户接口

- `GET /api/users` - 获取所有用户（需要认证）
- `GET /api/users/me` - 获取当前用户信息
- `DELETE /api/users/:id` - 删除用户（需要管理员权限）
- `PATCH /api/users/:id/points` - 修改用户积分（需要管理员权限）
- `PATCH /api/users/:id/admin` - 设置管理员权限（需要管理员权限）
- `GET /api/users/:id/logs` - 获取积分变动日志

### 规则接口

- `GET /api/rules` - 获取所有规则
- `GET /api/rules/:id` - 获取单个规则
- `POST /api/rules` - 创建规则（需要管理员权限）
- `PUT /api/rules/:id` - 更新规则（需要管理员权限）
- `DELETE /api/rules/:id` - 删除规则（需要管理员权限）

## 使用指南

### 普通用户

1. **注册账户**: 访问注册页面创建账户
2. **登录系统**: 使用用户名和密码登录
3. **查看排行榜**: 在首页查看所有成员的积分排名
4. **查看规则**: 了解加分和扣分规则

### 管理员

1. **用户管理**: 
   - 在管理面板中查看所有用户
   - 删除不活跃的用户
   - 为用户添加或扣除积分
   - 设置其他用户为管理员

2. **规则管理**:
   - 添加新的积分规则
   - 编辑现有规则
   - 删除过时的规则

## 安全建议

1. **修改默认密码**: 首次部署后立即修改默认管理员密码
2. **强密码策略**: 使用强随机密钥作为 JWT_SECRET
3. **HTTPS**: 生产环境务必配置 HTTPS
4. **定期备份**: 定期备份 SQLite 数据库文件
5. **更新依赖**: 定期更新项目依赖以获取安全补丁

## 开发指南

### 添加新功能

1. 在 `backend/src/routes/` 中添加新的路由
2. 在 `backend/src/types/` 中定义类型
3. 在 `frontend/src/components/` 中创建 React 组件
4. 在 `frontend/src/services/api.ts` 中添加 API 调用

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 配置
- 使用有意义的变量和函数名
- 添加必要的注释

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 删除 `database.sqlite` 文件，重新运行 `npm run init-db` 初始化数据库。

### Q: 如何修改端口？
A: 编辑 `backend/.env` 文件中的 `PORT` 变量。

### Q: 如何添加更多管理员？
A: 使用现有管理员账户登录，在管理面板中设置其他用户为管理员。

### Q: 支持多实验室吗？
A: 当前版本是单实验室设计，如需多实验室支持需要进行架构调整。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

**注意**: 这是一个用于学习和实验室内部使用的项目，请根据实际需求进行调整和优化。