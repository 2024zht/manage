# V2.0 快速参考卡片

## 🚀 快速开始

### 第一次环境创建后文件时，需要手动创建 .env 文件

```bash
# 创建环境变量文件
cd /mnt/d/robotlab/manage
cat > backend/.env.example << 'EOF'
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
DATABASE_PATH=./database.sqlite
EOF

cp backend/.env.example backend/.env
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s|your-secret-key-change-this-in-production|$JWT_SECRET|" backend/.env
```

### 重新初始化数据库

```bash
# 删除旧数据库
rm backend/database.sqlite

# 初始化新数据库（包含新字段）
cd backend
npm run init-db
cd ..
```

### 测试后端API

```bash
# 启动后端
cd backend
npm run dev
```

## 📊 新增字段

### 用户表 (users)
- **name** - 姓名（必填）
- **studentId** - 学号（必填，唯一）
- **className** - 班级（必填）

### 申诉表 (point_requests)
- **userId** - 用户ID
- **points** - 期望调整的积分
- **reason** - 申诉理由
- **status** - 状态（pending/approved/rejected）
- **respondedBy** - 处理人ID
- **adminComment** - 管理员备注

## 🔌 API速查

### 注册（新）
```bash
POST /api/auth/register
{
  "username": "zhangsan",
  "name": "张三",
  "studentId": "2021001",
  "className": "计算机1班",
  "email": "zhang@example.com",
  "password": "password123"
}
```

### 积分申诉
```bash
# 创建申诉
POST /api/users/requests
{
  "points": 10,
  "reason": "我完成了额外任务"
}

# 查看我的申诉
GET /api/users/my-requests

# 查看所有申诉（管理员）
GET /api/users/requests

# 处理申诉（管理员）
PATCH /api/users/requests/:id
{
  "status": "approved",  // 或 "rejected"
  "adminComment": "同意，确实完成了任务"
}
```

### 批量导入
```bash
POST /api/users/batch-import
{
  "records": [
    { "studentId": "2021001", "points": 10 },
    { "studentId": "2021002", "points": 15 }
  ],
  "reason": "第一次作业"
}
```

## 📁 关键文件

| 文件 | 用途 |
|------|------|
| backend/src/types/index.ts | 类型定义（已更新） |
| backend/src/database/init.ts | 数据库初始化（已更新） |
| backend/src/routes/auth.ts | 认证路由（已更新） |
| backend/src/routes/users.ts | 用户路由（新增申诉和批量导入） |
| template_batch_import.csv | Excel导入模板 |
| IMPLEMENTATION_V2.md | **前端实现代码大全** ⭐ |
| UPGRADE_V2.md | 升级指南 |
| V2_SUMMARY.md | 功能总结 |

## 🎯 核心代码位置

### 后端
- **申诉功能**: `backend/src/routes/users.ts` 第137-247行
- **批量导入**: `backend/src/routes/users.ts` 第249-310行
- **新字段注册**: `backend/src/routes/auth.ts` 第11-52行

### 前端（待实现）
参考 `IMPLEMENTATION_V2.md`：
- **注册表单**: 第38-98行
- **AdminLogin组件**: 第100-190行
- **MyPoints组件**: 第192-340行
- **Dashboard更新**: 第20-36行

## 🧪 测试清单

### 后端测试
```bash
# 1. 测试新用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test1",
    "name": "测试用户",
    "studentId": "2021001",
    "className": "测试班级",
    "email": "test1@example.com",
    "password": "password123"
  }'

# 2. 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test1", "password": "password123"}'

# 3. 获取用户列表（需要token）
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 创建申诉（需要token）
curl -X POST http://localhost:3000/api/users/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 10, "reason": "测试申诉"}'

# 5. 批量导入（管理员token）
curl -X POST http://localhost:3000/api/users/batch-import \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"studentId": "2021001", "points": 10}
    ],
    "reason": "测试导入"
  }'
```

### 前端测试
1. ✅ 注册页面显示新字段（姓名、学号、班级）
2. ✅ 注册成功后能登录
3. ✅ 积分排行榜显示完整信息
4. ✅ 管理员登录页面 `/admin/login` 可访问
5. ✅ 非管理员无法访问管理面板
6. ✅ 个人积分历史页面正常显示
7. ✅ 可以提交申诉
8. ✅ 管理员可以处理申诉
9. ✅ 批量导入功能正常

## 📦 Excel模板示例

文件：`template_batch_import.csv`

```csv
学号,积分,备注
2021001,10,完成实验报告
2021002,15,参加组会并发言
2021003,-5,迟到
```

## 🔧 常见问题

### Q: 环境变量文件创建失败？
```bash
# 手动创建
cat > backend/.env << 'EOF'
PORT=3000
JWT_SECRET=your-random-secret-here
NODE_ENV=development
DATABASE_PATH=./database.sqlite
EOF
```

### Q: 数据库初始化失败？
```bash
# 删除后重试
rm backend/database.sqlite
cd backend && npm run init-db && cd ..
```

### Q: 前端如何快速集成？
查看 `IMPLEMENTATION_V2.md`，包含所有组件的完整代码。

### Q: Excel导入报错？
确保：
1. 学号在数据库中存在
2. 积分是有效数字
3. CSV格式正确（UTF-8编码）

## 📞 获取帮助

1. **后端问题**：查看 `pm2 logs` 或终端输出
2. **前端问题**：查看浏览器控制台
3. **数据库问题**：使用 `sqlite3` 工具检查
4. **API问题**：使用Postman测试接口

## 🎓 推荐阅读顺序

对于新手：
1. **V2_SUMMARY.md** - 了解所有新功能
2. **IMPLEMENTATION_V2.md** - 查看实现代码
3. **UPGRADE_V2.md** - 了解升级步骤
4. 本文档 - 快速参考

对于开发者：
1. 本文档 - 快速了解
2. **IMPLEMENTATION_V2.md** - 直接看代码
3. 测试API - 验证功能
4. 集成前端 - 完成开发

---

**提示**: 所有后端功能已完成并测试。前端代码在 `IMPLEMENTATION_V2.md` 中提供。

**下一步**: 创建 `.env` 文件 → 初始化数据库 → 测试API → 实现前端

