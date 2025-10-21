# 本地存储模式说明

## 📦 概述

系统现在支持**本地存储模式**，无需配置 Backblaze B2 云存储即可正常使用。

## ✅ 已修复的问题

### 1. B2 命令错误
- **问题**: 使用 `b2 sync` 命令同步单个文件（sync 是用于目录的）
- **错误信息**: `ERROR: /path/to/file.pdf is not a directory`
- **解决方案**: 改用 `b2 upload-file` 命令

### 2. B2 存储桶不存在
- **问题**: 尝试上传到不存在的存储桶 `robotlib`
- **错误信息**: `Bucket not found: robotlib`
- **解决方案**: 只有明确配置了非默认值的 B2 存储桶时才尝试上传

### 3. 文件大小限制
- **问题**: 文件大小限制被撤销
- **解决方案**: 重新添加 500MB 限制

### 4. 文件列表获取
- **问题**: 总是尝试从 Cloudflare Worker 获取文件列表（即使没有配置）
- **解决方案**: 本地存储模式下从数据库获取

### 5. 文件下载
- **问题**: 总是尝试从 Worker 下载文件
- **解决方案**: 本地存储模式下提供本地文件下载

## 🔧 工作模式

### 本地存储模式（默认）

**触发条件**：
- `B2_BUCKET_NAME` 未设置
- 或 `B2_BUCKET_NAME=robotlib`（默认值）
- 或 `B2_BUCKET_NAME` 为空

**行为**：
1. ✅ 文件保存在 `backend/uploads/ebooks/`
2. ⏭️ 跳过 B2 云同步
3. ✅ 从本地数据库获取文件列表
4. ✅ 提供本地文件下载

**日志输出**：
```
B2_BUCKET_NAME not configured or set to default, skipping B2 upload. Files will be stored locally.
```

### 云存储模式

**触发条件**：
- `B2_BUCKET_NAME` 设置为真实的存储桶名称（非 `robotlib`）
- `CF_WORKER_URL` 已配置

**行为**：
1. ✅ 文件上传到 B2 云存储
2. ✅ 本地临时文件被删除
3. ✅ 从 Cloudflare Worker 获取文件列表
4. ✅ 通过 Worker 下载文件

## 📝 配置文件

### backend/.env

**本地存储模式（推荐开发环境）**：
```env
PORT=3010
JWT_SECRET=9YAdzuhzaUTCL/5Xxwx6gHoV8SPF4pC1LlCkHXXpL2I=
NODE_ENV=development
DATABASE_PATH=./database.sqlite

# 留空或设为 robotlib 则启用本地存储模式
B2_BUCKET_NAME=

# Worker 配置（可选）
CF_WORKER_URL=
```

**云存储模式（生产环境，需要配置 B2）**：
```env
PORT=3010
JWT_SECRET=your-secret-key
NODE_ENV=production
DATABASE_PATH=./database.sqlite

# 真实的 B2 存储桶名称
B2_BUCKET_NAME=your-real-bucket-name

# Cloudflare Worker URL
CF_WORKER_URL=https://your-worker.workers.dev/api
```

## 🚀 部署步骤

### 本地开发（本地存储模式）

```bash
# 1. 后端
cd backend

# 确保 .env 文件正确配置（B2_BUCKET_NAME 留空或为 robotlib）
cat .env

# 重新构建
npm run build

# 启动开发服务器
npm run dev

# 2. 前端（新终端）
cd frontend

# 重新构建
npm run build

# 启动开发服务器
npm run dev
```

### 服务器部署

```bash
# 1. 进入项目目录
cd ~/manage

# 2. 更新 .env 配置
nano backend/.env
# 确保 B2_BUCKET_NAME 为空或为 robotlib

# 3. 重新构建
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# 4. 重启服务
pm2 restart robotlab-manage
pm2 save
```

## 📊 API 端点变化

### 新增端点

#### `GET /api/ebooks/file/:id`
直接下载本地文件

**参数**：
- `id`: 电子书 ID

**响应**：
- 文件流（octet-stream）

**示例**：
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3010/api/ebooks/file/1 \
  --output file.pdf
```

### 修改端点

#### `GET /api/ebooks/`
现在根据配置返回本地或云端文件列表

**本地存储模式**：
- 从数据库查询：`SELECT * FROM ebooks`
- 包含上传者用户名

**云存储模式**：
- 从 Cloudflare Worker 获取

#### `GET /api/ebooks/download/:filename`
现在返回本地或云端下载链接

**本地存储模式**：
- 返回：`/api/ebooks/file/:id`

**云存储模式**：
- 返回：Worker URL

## 🗄️ 数据库结构

电子书表保持不变：

```sql
CREATE TABLE ebooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  originalName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  uploadedBy INTEGER NOT NULL,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  b2Synced INTEGER DEFAULT 0,
  b2Path TEXT,
  FOREIGN KEY (uploadedBy) REFERENCES users(id)
);
```

**字段说明**：
- `filename`: 服务器上的文件名（包含时间戳）
- `originalName`: 原始文件名
- `fileSize`: 文件大小（字节）
- `uploadedBy`: 上传者用户 ID
- `uploadedAt`: 上传时间
- `b2Synced`: 是否已同步到 B2（0=否，1=是）
- `b2Path`: B2 存储路径（仅云存储模式）

## 📂 文件存储位置

### 本地存储模式

```
backend/
  uploads/
    ebooks/
      1761024093732-724374146-C.pdf
      1761024382666-739389580-C++.pdf
```

### 云存储模式

- 本地：临时存储（上传成功后删除）
- 云端：Backblaze B2 存储桶

## 🧪 测试步骤

### 1. 测试上传（本地存储模式）

```bash
# 上传文件
curl -X POST http://localhost:3010/api/ebooks/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf"

# 检查文件是否保存
ls backend/uploads/ebooks/

# 检查数据库
sqlite3 backend/database.sqlite "SELECT * FROM ebooks;"
```

### 2. 测试文件列表

```bash
# 获取文件列表
curl http://localhost:3010/api/ebooks \
  -H "Authorization: Bearer <token>"

# 应该看到 JSON 数组，包含文件信息
```

### 3. 测试下载

```bash
# 获取下载链接
curl http://localhost:3010/api/ebooks/download/test.pdf \
  -H "Authorization: Bearer <token>"

# 应该返回：
# {
#   "downloadUrl": "/api/ebooks/file/1",
#   "filename": "test.pdf"
# }

# 实际下载文件
curl http://localhost:3010/api/ebooks/file/1 \
  -H "Authorization: Bearer <token>" \
  --output downloaded.pdf
```

## 🔍 日志输出

### 上传成功（本地存储模式）

```
B2_BUCKET_NAME not configured or set to default, skipping B2 upload. Files will be stored locally.
```

### 上传成功（云存储模式）

```
Uploading to B2: /path/to/file.pdf -> your-bucket/file.pdf
B2 upload stdout: ...
Local file deleted after successful B2 upload
```

### 上传失败（B2 错误）

```
B2 sync error: Error: Command failed: b2 upload-file ...
```

## ⚠️ 注意事项

### 1. 磁盘空间

本地存储模式下，所有文件保存在服务器硬盘上。请确保有足够的磁盘空间。

**检查磁盘空间**：
```bash
df -h
du -sh backend/uploads/ebooks/
```

### 2. 备份

本地存储模式下，建议定期备份 `backend/uploads/ebooks/` 目录：

```bash
# 手动备份
tar -czf ebooks-backup-$(date +%Y%m%d).tar.gz backend/uploads/ebooks/

# 自动备份（crontab）
0 2 * * * cd /path/to/manage && tar -czf backup/ebooks-$(date +\%Y\%m\%d).tar.gz backend/uploads/ebooks/
```

### 3. 文件权限

确保 Nginx 或应用程序有权限读取文件：

```bash
chmod -R 755 backend/uploads/
chown -R $USER:$USER backend/uploads/
```

### 4. 大文件上传

已支持最大 500MB 文件上传，确保：
- Nginx：`client_max_body_size 500M`
- 后端：`limits: { fileSize: 500MB }`
- 超时：至少 300 秒

## 📈 性能优化

### 1. 静态文件服务

对于大量下载，可以配置 Nginx 直接提供静态文件：

```nginx
location /uploads/ {
    alias /path/to/backend/uploads/;
    internal;  # 只允许通过 X-Accel-Redirect 访问
}
```

后端代码修改：
```typescript
// 使用 X-Accel-Redirect
res.setHeader('X-Accel-Redirect', `/uploads/ebooks/${ebook.filename}`);
res.setHeader('Content-Type', 'application/octet-stream');
res.setHeader('Content-Disposition', `attachment; filename="${ebook.originalName}"`);
res.end();
```

### 2. 缓存

添加下载缓存头：

```typescript
res.setHeader('Cache-Control', 'public, max-age=86400');
res.setHeader('ETag', generateETag(ebook));
```

## 🔄 迁移到云存储

如果以后想迁移到云存储模式：

```bash
# 1. 配置 B2 账号
b2 authorize-account <keyID> <applicationKey>

# 2. 创建存储桶
b2 create-bucket your-bucket-name allPrivate

# 3. 批量上传现有文件
cd backend/uploads/ebooks
for file in *; do
  b2 upload-file your-bucket-name "$file" "$file"
done

# 4. 更新 .env
B2_BUCKET_NAME=your-bucket-name
CF_WORKER_URL=https://your-worker.workers.dev/api

# 5. 重启服务
pm2 restart robotlab-manage
```

## 🆘 故障排除

### 问题：上传后看不到文件

**检查**：
```bash
# 1. 检查数据库
sqlite3 backend/database.sqlite "SELECT * FROM ebooks;"

# 2. 检查文件系统
ls -la backend/uploads/ebooks/

# 3. 检查后端日志
pm2 logs robotlab-manage
```

### 问题：下载失败 404

**检查**：
```bash
# 1. 确认文件存在
ls backend/uploads/ebooks/[filename]

# 2. 检查文件权限
ls -l backend/uploads/ebooks/[filename]

# 3. 检查路径配置
pwd  # 确保在正确的工作目录
```

### 问题：仍然尝试上传到 B2

**检查 .env**：
```bash
cat backend/.env | grep B2_BUCKET_NAME

# 应该是：
# B2_BUCKET_NAME=
# 或
# B2_BUCKET_NAME=robotlib
```

---

**版本**: 2.1  
**更新日期**: 2025-10-21  
**作者**: 实验室管理系统团队

