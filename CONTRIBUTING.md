# 贡献指南

感谢您考虑为实验室管理系统做出贡献！

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请创建一个 Issue 并包含以下信息：

1. **Bug 描述**: 清晰简洁地描述问题
2. **复现步骤**: 详细的复现步骤
3. **期望行为**: 您期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 操作系统
   - Node.js 版本
   - 浏览器版本
6. **截图**: 如果适用，添加截图帮助说明问题
7. **额外信息**: 任何其他有助于解决问题的信息

### 建议新功能

如果您有新功能的想法：

1. 创建一个 Issue 标记为 "Feature Request"
2. 描述功能的用途和价值
3. 如果可能，提供实现思路
4. 讨论功能的可行性

### 提交代码

#### 开发流程

1. **Fork 仓库**

2. **克隆到本地**
```bash
git clone https://github.com/your-username/manage.git
cd manage
```

3. **创建分支**
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

4. **安装依赖**
```bash
npm run install:all
```

5. **开发和测试**
- 编写代码
- 测试功能
- 确保没有破坏现有功能

6. **提交更改**
```bash
git add .
git commit -m "feat: add some feature"
```

提交信息格式参考：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

7. **推送到 GitHub**
```bash
git push origin feature/your-feature-name
```

8. **创建 Pull Request**
- 在 GitHub 上创建 Pull Request
- 描述您的更改
- 等待审核

## 代码规范

### TypeScript

- 使用 TypeScript 进行类型检查
- 避免使用 `any` 类型
- 为函数和变量提供类型注解

### 命名规范

- **文件名**: kebab-case (如: `user-service.ts`)
- **组件名**: PascalCase (如: `Dashboard.tsx`)
- **变量/函数**: camelCase (如: `getUserInfo`)
- **常量**: UPPER_SNAKE_CASE (如: `MAX_RETRIES`)
- **类型/接口**: PascalCase (如: `User`, `AuthResponse`)

### 代码风格

- 使用 2 空格缩进
- 使用单引号
- 语句末尾加分号
- 每个文件末尾留一个空行
- 函数和类之间空一行

### React 组件

```typescript
// ✅ 好的示例
import React from 'react';

interface Props {
  name: string;
  onClose: () => void;
}

const MyComponent: React.FC<Props> = ({ name, onClose }) => {
  return (
    <div>
      <h1>{name}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MyComponent;
```

### API 设计

- 遵循 RESTful 规范
- 使用合适的 HTTP 方法
- 返回标准的 HTTP 状态码
- 提供清晰的错误信息

```typescript
// ✅ 好的示例
router.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

## 项目结构

在添加新功能时，请遵循现有的项目结构：

```
backend/src/
├── database/     # 数据库相关
├── middleware/   # 中间件
├── routes/       # API 路由
└── types/        # 类型定义

frontend/src/
├── components/   # React 组件
├── contexts/     # Context API
├── services/     # API 服务
└── types/        # 类型定义
```

## 测试

虽然当前项目没有自动化测试，但在提交 PR 前请手动测试：

### 后端测试

1. 测试所有 API 端点
2. 验证错误处理
3. 检查权限控制
4. 测试边界情况

### 前端测试

1. 在不同浏览器中测试
2. 测试响应式设计（桌面/平板/手机）
3. 验证用户交互
4. 检查错误提示

## 文档

如果您的更改影响到用户使用或开发流程：

1. 更新相关的 Markdown 文档
2. 在 README.md 中添加说明（如果需要）
3. 更新 CHANGELOG.md
4. 添加代码注释

## Pull Request 检查清单

提交 PR 前请确认：

- [ ] 代码遵循项目的代码规范
- [ ] 功能已经过充分测试
- [ ] 没有破坏现有功能
- [ ] 更新了相关文档
- [ ] 提交信息清晰明了
- [ ] 代码没有不必要的调试语句
- [ ] 没有敏感信息（密码、密钥等）

## 社区准则

- 尊重所有贡献者
- 接受建设性的批评
- 专注于对项目最有利的事情
- 对新手友好和包容

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下授权。

## 问题？

如果您有任何问题，请：

1. 查看现有的 Issues
2. 阅读项目文档
3. 创建新的 Issue 询问

---

再次感谢您的贡献！ 🎉

