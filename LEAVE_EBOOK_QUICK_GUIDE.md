# 请假与电子书模块 - 快速开始

## 🎯 已完成的工作

### ✅ 后端（100%完成）
- 数据库表：`leaves`, `ebooks`
- API路由：`/api/leaves`, `/api/ebooks`
- 类型定义：`Leave`, `Ebook`
- 文件上传：集成multer
- B2同步：自动同步到Backblaze B2

### 📝 需要完成的工作

#### 1. 创建3个前端组件
- `frontend/src/components/LeaveRequest.tsx` - 请假申请
- `frontend/src/components/LeaveApproval.tsx` - 请假审批（管理员）
- `frontend/src/components/Ebooks.tsx` - 电子书库

#### 2. 更新路由
在 `frontend/src/App.tsx` 添加：
```typescript
<Route path="leaves" element={<LeaveRequest />} />
<Route path="ebooks" element={<Ebooks />} />
<Route path="admin/leave-approval" element={<AdminRoute><LeaveApproval /></AdminRoute>} />
```

#### 3. 更新导航菜单
在 `frontend/src/components/Layout.tsx` 添加链接

## 🚀 快速部署步骤

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量
编辑 `backend/.env`：
```bash
B2_BUCKET_NAME=your-bucket-name
B2_FOLDER=ebooks
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api
```

### 3. 安装B2 CLI（Ubuntu）
```bash
pip install --upgrade b2
b2 authorize-account <key_id> <app_key>
```

### 4. 初始化数据库
```bash
cd backend
npm run init-db
```

### 5. 创建前端组件
按照 `LEAVE_EBOOK_IMPLEMENTATION.md` 中的完整代码创建3个组件文件

### 6. 启动项目
```bash
# 开发环境
npm run dev

# 或生产环境
npm run build
npm start
```

## 📋 功能测试清单

### 请假功能
- [ ] 用户可以提交请假申请
- [ ] 时长自动计算
- [ ] 用户可以查看自己的请假记录
- [ ] 管理员可以看到待审批列表
- [ ] 管理员可以批准/拒绝申请

### 电子书功能
- [ ] 管理员可以上传电子书
- [ ] 文件自动同步到B2
- [ ] 所有用户可以浏览电子书列表
- [ ] 用户可以下载电子书
- [ ] 文件名URL编码正确处理

## 🎨 界面预览

### 请假申请页面
```
┌─────────────────┬─────────────────┐
│ 发起请假申请    │ 我的请假记录    │
├─────────────────┼─────────────────┤
│ 请假类型: [事假] │ 📅 病假 - 待审批 │
│ 开始时间: [选择] │ 2天, 2025-01-15 │
│ 结束时间: [选择] │                 │
│ 时长: 2天        │ 📅 年假 - 已批准 │
│ 事由: [文本框]   │ 5天, 2025-01-10 │
│ [提交申请]      │                 │
└─────────────────┴─────────────────┘
```

### 请假审批页面（管理员）
```
┌────────────────────────────────────┐
│ 待审批 (3)                         │
├────────────────────────────────────┤
│ 👤 张三 (2021001) - 1班            │
│ 类型: 事假 | 时长: 2天              │
│ 时间: 2025-01-20 - 2025-01-22      │
│ 事由: 家中有事                      │
│         [✓ 批准] [✗ 拒绝]          │
└────────────────────────────────────┘
```

### 电子书库页面
```
┌────────────────────────────────────┐
│ 电子书库     [📤 上传电子书]       │
├────────────────────────────────────┤
│ ┌────────┬────────┬────────┐      │
│ │ 📖     │ 📖     │ 📖     │      │
│ │C++ Pr  │Python  │算法导论│      │
│ │15.2 MB │8.5 MB  │25.6 MB │      │
│ │[下载]  │[下载]  │[下载]  │      │
│ └────────┴────────┴────────┘      │
└────────────────────────────────────┘
```

## 🔧 故障排查

### 问题1：B2 sync失败
```bash
# 检查B2 CLI是否正确安装
b2 version

# 检查凭证
b2 list-buckets

# 检查环境变量
echo $B2_BUCKET_NAME
```

### 问题2：文件上传失败
- 检查文件大小（<100MB）
- 检查文件格式是否支持
- 检查 `uploads/ebooks` 目录权限

### 问题3：下载链接404
- 确认文件已同步到B2（b2Synced=1）
- 检查Cloudflare Worker配置
- 确认文件名URL编码正确

## 📞 API端点列表

### 请假相关
- `POST /api/leaves` - 提交请假申请
- `GET /api/leaves/my-leaves` - 获取我的请假记录
- `GET /api/leaves` - 获取所有请假记录（管理员）
- `PATCH /api/leaves/:id` - 审批请假（管理员）

### 电子书相关
- `GET /api/ebooks` - 获取电子书列表
- `POST /api/ebooks/upload` - 上传电子书（管理员）
- `DELETE /api/ebooks/:id` - 删除电子书（管理员）
- `GET /api/ebooks/:id/download-url` - 获取下载链接

## 📚 完整代码位置

所有前端组件的完整代码在：
**LEAVE_EBOOK_IMPLEMENTATION.md**

包含：
- LeaveRequest.tsx（350+行）
- LeaveApproval.tsx（250+行）
- Ebooks.tsx（300+行）

直接复制粘贴即可使用！

## ✨ 功能亮点

1. **请假时长自动计算** - React useEffect实时计算
2. **B2自动同步** - 上传后自动同步并清理本地文件
3. **URL编码处理** - 正确处理特殊字符
4. **响应式设计** - 移动端友好
5. **权限分离** - 用户和管理员功能明确区分

---

**完整文档**: LEAVE_EBOOK_IMPLEMENTATION.md
**技术栈**: React + TypeScript + Express + SQLite + Backblaze B2
**部署时间**: 约30分钟

