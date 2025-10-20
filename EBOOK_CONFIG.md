# 电子书配置说明

## 环境变量配置

请在 `backend/.env` 文件中设置以下环境变量：

```bash
# JWT密钥（用于用户认证）
JWT_SECRET=your-jwt-secret-key-here

# Backblaze B2配置
B2_BUCKET_NAME=robotlib

# Cloudflare Worker配置
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api

# 服务器配置
PORT=3000
NODE_ENV=production
```

## 更新内容

### ✅ 已完成的修改：

1. **取消文件大小限制**：
   - 后端：移除了multer的100MB文件大小限制
   - 前端：移除了文件上传前的100MB检查

2. **设置默认桶名**：
   - 将Backblaze B2的默认桶名设置为 `robotlib`
   - 如果环境变量 `B2_BUCKET_NAME` 未设置，将使用 `robotlib` 作为默认值

### 📋 配置要求：

1. **Backblaze B2设置**：
   - 桶名：`robotlib`
   - 存储路径：桶根目录（无子文件夹）
   - 需要安装并配置 `b2` CLI工具

2. **Cloudflare Worker**：
   - URL：`https://divine-glade-0efd.hengtangzhao.workers.dev/api`
   - 用于代理B2文件下载

### 🚀 使用方法：

1. 确保已配置Backblaze B2账户和CLI工具
2. 设置环境变量（特别是 `B2_BUCKET_NAME=robotlib`）
3. 重启后端服务
4. 管理员可以上传任意大小的电子书文件

### ⚠️ 注意事项：

- 取消大小限制后，请确保服务器有足够的存储空间和带宽
- 大文件上传可能需要较长时间，请耐心等待
- 建议监控服务器资源使用情况
