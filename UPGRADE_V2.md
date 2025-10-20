# 实验室管理系统 V2.0 升级指南

本文档说明如何将系统升级到 V2.0 版本，包含您请求的所有新功能。

## 新功能概述

### 1. 用户信息扩展
- ✅ 添加姓名字段
- ✅ 添加学号字段  
- ✅ 添加班级字段
- ✅ 积分排行榜显示完整信息

### 2. 管理员功能分离
- ✅ 独立的管理员登录页面 (`/admin/login`)
- ✅ 普通用户登录页面 (`/login`)
- ✅ 验证管理员权限

### 3. 积分管理增强
- ✅ 个人积分变更历史查看
- ✅ 积分修改申诉功能
- ✅ 管理员处理申诉

### 4. 批量导入功能
- ✅ Excel批量导入积分
- ✅ 提供Excel模板下载
- ✅ 导入结果反馈

## 数据库变更

### users表新增字段
```sql
ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN studentId TEXT UNIQUE NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN className TEXT NOT NULL DEFAULT '';
```

### 新建point_requests表
```sql
CREATE TABLE point_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  respondedAt DATETIME,
  respondedBy INTEGER,
  adminComment TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (respondedBy) REFERENCES users(id)
);
```

## 升级步骤

### 步骤 1: 备份数据

```bash
# 备份当前数据库
cp backend/database.sqlite backend/database.sqlite.backup.$(date +%Y%m%d)
```

### 步骤 2: 删除旧数据库并重新初始化

由于表结构变更较大，建议删除旧数据库重新初始化：

```bash
# 停止服务
pm2 stop robotlab-manage

# 删除旧数据库
rm backend/database.sqlite

# 拉取最新代码
git pull

# 清理并重新安装依赖
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# 初始化新数据库
cd backend
npm run init-db
cd ..

# 重新构建
npm run build

# 重启服务
pm2 restart robotlab-manage
```

### 步骤 3: 迁移现有用户（可选）

如果需要保留现有用户数据，可以手动迁移：

```bash
# 使用SQLite工具导出用户数据
sqlite3 backend/database.sqlite.backup.YYYYMMDD "SELECT username, email FROM users" > users.csv

# 然后手动添加姓名、学号、班级后重新导入
```

## 新API端点

### 用户相关

```
POST   /api/users/requests          # 创建积分申诉
GET    /api/users/my-requests       # 获取我的申诉记录  
GET    /api/users/requests          # 获取所有申诉（管理员）
PATCH  /api/users/requests/:id      # 处理申诉（管理员）
POST   /api/users/batch-import      # 批量导入积分（管理员）
```

### 注册新增字段

```json
POST /api/auth/register
{
  "username": "string",
  "name": "string",           // 新增：姓名
  "studentId": "string",      // 新增：学号
  "className": "string",      // 新增：班级
  "email": "string",
  "password": "string"
}
```

## Excel批量导入格式

### 模板文件结构

| 学号 | 积分 |
|------|------|
| 2021001 | 10 |
| 2021002 | 15 |
| 2021003 | -5 |

### API调用示例

```javascript
const records = [
  { studentId: '2021001', points: 10 },
  { studentId: '2021002', points: 15 },
  { studentId: '2021003', points: -5 }
];

fetch('/api/users/batch-import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    records,
    reason: '第一次作业成绩'
  })
});
```

## 前端组件变更

### 新增组件

1. **AdminLogin.tsx** - 管理员登录页面
2. **MyPoints.tsx** - 个人积分历史
3. **PointRequests.tsx** - 积分申诉管理
4. **BatchImport.tsx** - 批量导入组件

### 修改的组件

1. **Register.tsx** - 添加姓名、学号、班级字段
2. **Dashboard.tsx** - 添加排名、姓名、学号、班级列
3. **Admin.tsx** - 添加批量导入和申诉处理标签

## 使用说明

### 用户端

#### 1. 注册账户

现在注册需要填写：
- 用户名
- 姓名
- 学号
- 班级
- 邮箱
- 密码

#### 2. 查看积分历史

登录后，点击"我的积分"查看详细的积分变更历史。

#### 3. 提交积分申诉

如果对积分有异议：
1. 进入"我的积分"页面
2. 点击"提交申诉"
3. 填写期望的积分调整和理由
4. 等待管理员处理

### 管理员端

#### 1. 管理员登录

访问 `/admin/login` 使用管理员账户登录。

#### 2. 处理申诉

1. 进入管理面板
2. 切换到"申诉管理"标签
3. 查看待处理的申诉
4. 批准或拒绝，可添加备注

#### 3. 批量导入积分

1. 下载Excel模板
2. 按格式填写：学号、积分
3. 上传文件或粘贴数据
4. 填写导入原因（如"第一次作业"）
5. 确认导入

## 常见问题

### Q1: 升级后原有用户无法登录？

A: 由于添加了必填字段（姓名、学号、班级），建议重新初始化数据库，让用户重新注册。

### Q2: 如何批量注册用户？

A: 管理员可以：
1. 准备用户数据Excel
2. 使用SQLite工具批量导入到users表
3. 密码使用bcrypt加密

### Q3: Excel导入失败怎么办？

A: 检查：
1. 学号是否正确
2. 学号对应的用户是否存在
3. 积分是否为有效数字
4. Excel格式是否正确

### Q4: 如何区分管理员和普通用户登录？

A: 
- 普通用户: `/login`
- 管理员: `/admin/login`

系统会验证登录用户是否有管理员权限。

## 降级方案

如果需要回退到旧版本：

```bash
# 停止服务
pm2 stop robotlab-manage

# 恢复数据库备份
cp backend/database.sqlite.backup.YYYYMMDD backend/database.sqlite

# 切换到旧代码
git checkout v1.0.0

# 重新安装依赖
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# 重新构建
npm run build

# 重启服务
pm2 restart robotlab-manage
```

## 技术支持

遇到问题请：
1. 查看日志：`pm2 logs robotlab-manage`
2. 检查数据库：使用SQLite工具查看
3. 查看API响应：浏览器开发者工具

---

**版本**: 2.0.0  
**更新日期**: 2025-01-20  
**兼容性**: 不兼容 V1.0（需要重新初始化数据库）

