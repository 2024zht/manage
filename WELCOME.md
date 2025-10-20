# 🎉 欢迎使用实验室管理系统！

感谢您选择实验室管理系统！本文档将帮助您快速了解项目并开始使用。

## ✨ 您已获得

一个功能完善的实验室积分管理平台，包括：

### 📦 完整的代码库

- ✅ 后端 API 服务（Node.js + Express + TypeScript）
- ✅ 前端界面（React + TypeScript + Tailwind CSS）
- ✅ 数据库设计（SQLite）
- ✅ 认证系统（JWT）
- ✅ 权限管理（RBAC）
- ✅ 响应式设计（支持移动端）

### 📚 详尽的文档

1. **[README.md](README.md)** - 项目概览和快速开始
2. **[INSTALL.md](INSTALL.md)** - 详细安装指南
3. **[QUICKSTART.md](QUICKSTART.md)** - 5分钟上手
4. **[DEPLOYMENT.md](DEPLOYMENT.md)** - 生产部署
5. **[USER_GUIDE.md](USER_GUIDE.md)** - 用户使用手册
6. **[WINDOWS_GUIDE.md](WINDOWS_GUIDE.md)** - Windows 开发指南
7. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - 技术架构详解
8. **[CONTRIBUTING.md](CONTRIBUTING.md)** - 贡献指南
9. **[FAQ.md](FAQ.md)** - 常见问题
10. **[CHANGELOG.md](CHANGELOG.md)** - 更新日志
11. **[PROJECT_FILES.md](PROJECT_FILES.md)** - 文件清单

### 🛠️ 便捷的脚本

#### Linux/Mac
- `deploy.sh` - 自动部署脚本
- `start-pm2.sh` - PM2 启动脚本

#### Windows
- `install-windows.bat` - 一键安装
- `dev.bat` - 启动开发服务器
- `build.bat` - 构建项目

### 🎁 额外赠送

- ✅ Nginx 配置示例
- ✅ PM2 进程管理配置
- ✅ 环境变量模板
- ✅ Git 忽略配置
- ✅ MIT 开源许可证

## 🚀 快速开始

### Windows 用户

1. **安装 Node.js** (如未安装)
   - 访问 https://nodejs.org/
   - 下载并安装 LTS 版本

2. **运行安装脚本**
   ```
   双击运行 install-windows.bat
   ```

3. **启动开发服务器**
   ```
   双击运行 dev.bat
   ```

4. **访问应用**
   - 打开浏览器访问 http://localhost:5173
   - 使用默认账户登录：
     - 用户名: `admin`
     - 密码: `admin123`

### Linux/Mac 用户

```bash
# 1. 安装依赖
npm run install:all

# 2. 配置环境
cd backend && cp .env.example .env && cd ..

# 3. 初始化数据库
cd backend && npm run init-db && cd ..

# 4. 启动开发服务器
npm run dev
```

## 📖 学习路径

### 第一步：熟悉功能

1. 阅读 **[用户手册](USER_GUIDE.md)**
2. 使用管理员账户登录
3. 浏览积分看板
4. 查看规则展示
5. 进入管理面板试用各项功能

### 第二步：自定义配置

1. 修改 JWT_SECRET（重要！）
2. 添加适合您实验室的积分规则
3. 邀请成员注册
4. 设置其他管理员

### 第三步：部署到生产环境

1. 准备 Ubuntu 服务器
2. 阅读 **[部署文档](DEPLOYMENT.md)**
3. 运行部署脚本
4. 配置域名和 HTTPS

## 🎯 核心功能

### 用户端

- ✅ 用户注册和登录
- ✅ 查看积分排行榜
- ✅ 查看积分规则
- ✅ 查看个人信息和积分

### 管理员端

- ✅ 管理用户（添加/删除/修改积分）
- ✅ 管理规则（创建/编辑/删除）
- ✅ 设置管理员权限
- ✅ 查看积分变动日志

## 💡 使用建议

### 初次使用

1. **修改默认密码**
   - 当前需要删除 admin 用户重新创建
   - 或直接在数据库中修改

2. **自定义规则**
   - 根据实验室实际情况设置规则
   - 合理设置加分和扣分标准

3. **培训成员**
   - 向成员介绍系统功能
   - 说明积分规则
   - 鼓励积极参与

### 日常管理

1. **及时更新积分**
   - 成员完成任务后及时加分
   - 记录清楚原因

2. **定期备份数据**
   - 每天或每周备份数据库文件
   - 保存多个备份版本

3. **公平公正**
   - 严格按规则执行
   - 保持透明度

## 📱 移动端使用

系统完美支持移动设备：

- 📱 手机浏览器直接访问
- 💻 平板浏览器
- 🖥️ 桌面浏览器

界面会自动适应屏幕大小，提供最佳体验。

## 🔒 安全提醒

### 必须做的事

1. ✅ 修改 JWT_SECRET 为强随机字符串
2. ✅ 修改默认管理员密码
3. ✅ 生产环境配置 HTTPS
4. ✅ 定期备份数据库
5. ✅ 定期更新依赖包

### 不要做的事

1. ❌ 不要在公网环境使用默认配置
2. ❌ 不要共享管理员账户
3. ❌ 不要忽略安全警告
4. ❌ 不要跳过数据备份

## 🆘 获取帮助

### 遇到问题？

1. **查看文档**
   - 大多数问题都能在文档中找到答案
   - 特别推荐查看 FAQ

2. **检查日志**
   - 浏览器控制台
   - 后端终端输出
   - PM2 日志

3. **搜索 Issues**
   - 可能有人遇到过相同问题

4. **创建新 Issue**
   - 详细描述问题
   - 提供错误信息
   - 说明您的环境

## 🌟 功能规划

未来版本计划添加：

- 用户密码修改
- 积分历史查看
- 数据导出（Excel）
- 统计图表
- 邮件通知
- 深色模式
- 移动 App

欢迎在 Issues 中提出您的建议！

## 🤝 参与贡献

这是一个开源项目，欢迎您的贡献！

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 💻 提交代码

查看 **[贡献指南](CONTRIBUTING.md)** 了解详情。

## 📄 许可证

本项目采用 MIT 许可证，您可以：

- ✅ 自由使用
- ✅ 修改代码
- ✅ 商业使用
- ✅ 分发

唯一要求是保留版权声明。

## 🎓 学习资源

### 如果您想深入了解

**后端技术**:
- [Node.js 官方文档](https://nodejs.org/docs/)
- [Express 框架](https://expressjs.com/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

**前端技术**:
- [React 官方文档](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)

**数据库**:
- [SQLite 文档](https://www.sqlite.org/docs.html)

## 📞 联系方式

- GitHub Issues: 技术问题和建议
- 项目文档: 所有文档均在项目中

## 🎉 开始使用吧！

一切准备就绪，现在就开始使用实验室管理系统吧！

1. 安装系统
2. 登录并探索
3. 自定义配置
4. 邀请成员加入
5. 开始积分管理

祝您使用愉快！如果系统对您有帮助，欢迎给项目一个 Star ⭐

---

**项目版本**: 1.0.0  
**最后更新**: 2025-01-20  
**制作者**: AI Assistant  
**许可证**: MIT

Happy Coding! 🚀

