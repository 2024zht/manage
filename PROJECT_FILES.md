# 项目文件清单

本文档列出了项目中所有重要文件及其说明。

## 根目录文件

### 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 根 package.json，包含项目脚本和依赖 |
| `.gitignore` | Git 忽略文件配置 |

### 文档文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目主文档，项目概述和快速开始 |
| `INSTALL.md` | 安装指南，各平台安装说明 |
| `QUICKSTART.md` | 快速开始指南，5分钟上手 |
| `DEPLOYMENT.md` | 部署文档，生产环境部署详解 |
| `USER_GUIDE.md` | 用户手册，功能使用说明 |
| `WINDOWS_GUIDE.md` | Windows 开发指南 |
| `PROJECT_SUMMARY.md` | 项目总结，技术架构详解 |
| `CONTRIBUTING.md` | 贡献指南，如何参与开发 |
| `FAQ.md` | 常见问题解答 |
| `CHANGELOG.md` | 更新日志，版本历史 |
| `LICENSE` | MIT 许可证 |
| `PROJECT_FILES.md` | 本文件，项目文件清单 |

### 脚本文件

#### Linux/Mac 脚本

| 文件 | 说明 |
|------|------|
| `deploy.sh` | Ubuntu 自动部署脚本 |
| `start-pm2.sh` | PM2 启动脚本 |

#### Windows 脚本

| 文件 | 说明 |
|------|------|
| `install-windows.bat` | Windows 安装脚本 |
| `dev.bat` | Windows 开发服务器启动脚本 |
| `build.bat` | Windows 构建脚本 |

### 配置文件

| 文件 | 说明 |
|------|------|
| `nginx.conf` | Nginx 配置示例 |

## 后端文件 (backend/)

### 根目录

| 文件 | 说明 |
|------|------|
| `package.json` | 后端依赖和脚本配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `.env.example` | 环境变量模板 |

### 源代码 (src/)

#### 数据库 (database/)

| 文件 | 说明 |
|------|------|
| `db.ts` | 数据库连接和查询工具函数 |
| `init.ts` | 数据库初始化脚本 |

**功能**:
- SQLite 数据库连接
- Promise 封装的查询方法
- 数据库表创建
- 默认数据初始化

#### 中间件 (middleware/)

| 文件 | 说明 |
|------|------|
| `auth.ts` | 认证和授权中间件 |

**功能**:
- JWT 令牌验证
- 用户身份认证
- 管理员权限检查

#### 路由 (routes/)

| 文件 | 说明 |
|------|------|
| `auth.ts` | 认证相关路由（注册、登录） |
| `users.ts` | 用户管理路由 |
| `rules.ts` | 规则管理路由 |

**API 端点**:

auth.ts:
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

users.ts:
- `GET /api/users` - 获取所有用户
- `GET /api/users/me` - 获取当前用户
- `DELETE /api/users/:id` - 删除用户
- `PATCH /api/users/:id/points` - 修改积分
- `PATCH /api/users/:id/admin` - 设置管理员
- `GET /api/users/:id/logs` - 获取积分日志

rules.ts:
- `GET /api/rules` - 获取所有规则
- `GET /api/rules/:id` - 获取单个规则
- `POST /api/rules` - 创建规则
- `PUT /api/rules/:id` - 更新规则
- `DELETE /api/rules/:id` - 删除规则

#### 类型定义 (types/)

| 文件 | 说明 |
|------|------|
| `index.ts` | TypeScript 类型定义 |

**类型**:
- `User` - 用户类型
- `Rule` - 规则类型
- `PointLog` - 积分日志类型
- `JWTPayload` - JWT 载荷类型

#### 服务器入口

| 文件 | 说明 |
|------|------|
| `server.ts` | Express 服务器入口文件 |

**功能**:
- Express 应用配置
- 中间件加载
- 路由注册
- 错误处理

## 前端文件 (frontend/)

### 根目录

| 文件 | 说明 |
|------|------|
| `package.json` | 前端依赖和脚本配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `tsconfig.node.json` | Node 环境 TypeScript 配置 |
| `vite.config.ts` | Vite 构建工具配置 |
| `tailwind.config.js` | Tailwind CSS 配置 |
| `postcss.config.js` | PostCSS 配置 |
| `index.html` | HTML 入口文件 |

### 源代码 (src/)

#### 入口文件

| 文件 | 说明 |
|------|------|
| `main.tsx` | React 应用入口 |
| `App.tsx` | 应用主组件，路由配置 |
| `index.css` | 全局样式和 Tailwind 导入 |

#### 组件 (components/)

| 文件 | 说明 |
|------|------|
| `Login.tsx` | 登录页面组件 |
| `Register.tsx` | 注册页面组件 |
| `Dashboard.tsx` | 积分看板组件 |
| `Rules.tsx` | 规则展示组件 |
| `Admin.tsx` | 管理员面板组件 |
| `Layout.tsx` | 布局组件，导航栏 |

**功能详解**:

- **Login.tsx**: 
  - 用户登录表单
  - 表单验证
  - 错误提示
  - 响应式设计

- **Register.tsx**:
  - 用户注册表单
  - 密码确认
  - 表单验证
  - 成功后跳转

- **Dashboard.tsx**:
  - 积分排行榜
  - 前三名特殊显示
  - 统计信息
  - 实时更新

- **Rules.tsx**:
  - 规则列表展示
  - 加分/扣分分类
  - 卡片式布局
  - 响应式网格

- **Admin.tsx**:
  - 用户管理（查看、删除、修改积分）
  - 规则管理（CRUD）
  - 标签页切换
  - 表格和表单

- **Layout.tsx**:
  - 顶部导航栏
  - 移动端菜单
  - 用户信息显示
  - 登出功能

#### 上下文 (contexts/)

| 文件 | 说明 |
|------|------|
| `AuthContext.tsx` | 认证上下文，全局状态管理 |

**功能**:
- 用户登录状态管理
- 登录/注销方法
- 自动登录检查
- 用户信息刷新

#### 服务 (services/)

| 文件 | 说明 |
|------|------|
| `api.ts` | API 调用封装 |

**功能**:
- Axios 实例配置
- 请求/响应拦截器
- 自动添加 JWT 令牌
- 错误处理
- API 方法封装

#### 类型定义 (types/)

| 文件 | 说明 |
|------|------|
| `index.ts` | TypeScript 类型定义 |

**类型**:
- `User` - 用户类型
- `Rule` - 规则类型
- `PointLog` - 积分日志类型
- `AuthResponse` - 登录响应类型

## 数据库结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| email | TEXT | 邮箱，唯一 |
| password | TEXT | 密码（加密） |
| isAdmin | INTEGER | 是否管理员（0/1） |
| points | INTEGER | 积分 |
| createdAt | DATETIME | 创建时间 |

### rules 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 规则名称 |
| points | INTEGER | 积分值 |
| description | TEXT | 描述 |
| createdAt | DATETIME | 创建时间 |

### point_logs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| userId | INTEGER | 用户ID，外键 |
| points | INTEGER | 积分变化 |
| reason | TEXT | 原因 |
| createdBy | INTEGER | 操作者ID，外键 |
| createdAt | DATETIME | 创建时间 |

## 构建产物

### 后端构建 (backend/dist/)

构建后生成的 JavaScript 文件：
- `server.js` - 服务器入口
- `database/` - 数据库相关
- `middleware/` - 中间件
- `routes/` - 路由
- `types/` - 类型定义

### 前端构建 (frontend/dist/)

构建后生成的静态文件：
- `index.html` - 入口 HTML
- `assets/` - JS、CSS、字体等资源
- `vite.svg` - 图标

## 运行时文件

### 数据库

| 文件 | 说明 |
|------|------|
| `backend/database.sqlite` | SQLite 数据库文件（运行时生成） |

### 日志

使用 PM2 时：
- `~/.pm2/logs/robotlab-manage-out.log` - 标准输出日志
- `~/.pm2/logs/robotlab-manage-error.log` - 错误日志

## 文件统计

### 代码文件

- **后端**: 10 个 TypeScript 文件
- **前端**: 12 个 TypeScript/TSX 文件
- **配置**: 12 个配置文件
- **文档**: 12 个 Markdown 文件
- **脚本**: 6 个脚本文件

### 代码量估算

- **后端**: ~1500 行代码
- **前端**: ~2000 行代码
- **文档**: ~5000 行文档
- **总计**: ~8500+ 行

## 依赖包

### 后端主要依赖

- `express` - Web 框架
- `sqlite3` - 数据库
- `bcryptjs` - 密码加密
- `jsonwebtoken` - JWT 认证
- `cors` - 跨域支持
- `express-validator` - 数据验证

### 前端主要依赖

- `react` - UI 框架
- `react-router-dom` - 路由
- `axios` - HTTP 客户端
- `lucide-react` - 图标库
- `tailwindcss` - CSS 框架

## 文件大小估算

- **项目总大小** (不含 node_modules): ~500 KB
- **node_modules**: ~200 MB
- **构建后**: ~2 MB
- **数据库**: 根据数据量，通常 < 10 MB

---

**最后更新**: 2025-01-20  
**版本**: 1.0.0

