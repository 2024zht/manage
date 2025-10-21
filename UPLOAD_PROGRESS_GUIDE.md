# 电子书上传功能升级指南

## 🎯 升级内容

### 1. 文件大小限制提升
- **之前**: 最大 1MB（Nginx 默认）
- **现在**: 最大 500MB

### 2. 新增上传进度条
- **实时进度显示**: 百分比进度
- **悬浮窗设计**: 右下角固定位置
- **文件名显示**: 显示正在上传的文件名
- **动画效果**: 流畅的进度条动画

## 📦 修改的文件

### 前端文件
1. **frontend/src/components/Ebooks.tsx**
   - 添加 `uploadProgress` 和 `uploadFileName` 状态
   - 实现进度条悬浮窗 UI
   - 更新上传逻辑以跟踪进度

2. **frontend/src/services/api.ts**
   - 添加 `onUploadProgress` 回调支持
   - 配置 axios 上传进度监听

### 后端文件
1. **backend/src/routes/ebooks.ts**
   - 更新 multer 配置：`fileSize: 500MB`
   - 增加 B2 同步超时：从 60 秒到 600 秒

### 服务器配置
1. **Nginx 配置**
   - `client_max_body_size: 500M`
   - 超时设置：300 秒

## 🚀 部署步骤

### 方法1：使用自动化脚本（推荐）

在服务器上执行：

```bash
# 1. 上传新代码到服务器
cd ~/manage
git pull  # 或 scp 上传

# 2. 给脚本执行权限
chmod +x update-upload-limit.sh

# 3. 运行更新脚本
./update-upload-limit.sh
```

### 方法2：手动部署

#### 步骤1：更新 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/robotlab-manage
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name _;

    # 文件大小限制
    client_max_body_size 500M;
    
    # 超时设置
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # ... 其他配置 ...
}
```

```bash
# 测试并重启
sudo nginx -t
sudo systemctl restart nginx
```

#### 步骤2：重新构建前端

```bash
cd ~/manage/frontend
npm run build
```

#### 步骤3：重新构建后端

```bash
cd ~/manage/backend
npm run build
```

#### 步骤4：重启服务

```bash
pm2 restart robotlab-manage
pm2 save
```

## 🎨 进度条 UI 预览

上传时，右下角会显示：

```
┌─────────────────────────────────────┐
│  📤 上传中...              75%      │
│  example-book.pdf                   │
│  ███████████████░░░░░               │
│  正在上传文件...                    │
└─────────────────────────────────────┘
```

### UI 特性
- **位置**: 固定在右下角（`fixed bottom-6 right-6`）
- **层级**: 最高层级（`z-50`）
- **样式**: 白色背景，阴影效果
- **动画**: 
  - 上传图标脉冲动画
  - 进度条平滑过渡
  - 蓝色渐变进度条

## 📊 技术实现

### 前端进度监听

```typescript
// api.ts
upload: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) =>
  api.post('/ebooks/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })

// Ebooks.tsx
await ebookAPI.upload(formData, (progressEvent) => {
  if (progressEvent.total) {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(percentCompleted);
  }
});
```

### 后端文件大小限制

```typescript
// ebooks.ts
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  // ...
});
```

### Nginx 代理配置

```nginx
# 增加文件上传限制
client_max_body_size 500M;

# 增加超时时间（支持慢速上传）
client_body_timeout 300s;
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
```

## 🧪 测试步骤

### 1. 测试小文件（< 10MB）
```bash
# 应该很快完成，进度条闪现
```

### 2. 测试中等文件（10-50MB）
```bash
# 应该能看到进度条从 0% 到 100%
```

### 3. 测试大文件（50-500MB）
```bash
# 应该能清楚看到上传进度变化
# 注意观察：
# - 进度百分比更新
# - 进度条动画
# - 文件名显示
```

### 4. 测试超大文件（> 500MB）
```bash
# 应该返回错误："文件太大"
```

## ❓ 常见问题

### Q: 上传仍然失败，显示 413 错误？
**A**: 检查 Nginx 配置是否正确更新并重启：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Q: 进度条不显示？
**A**: 
1. 确保前端已重新构建
2. 清除浏览器缓存（Ctrl + Shift + R）
3. 检查浏览器控制台是否有错误

### Q: 上传速度很慢？
**A**: 
1. 检查服务器网络带宽
2. 检查 B2 同步是否正常
3. 考虑优化文件大小或使用压缩

### Q: B2 同步超时？
**A**: 已将超时时间增加到 600 秒（10 分钟），如果仍超时：
```typescript
// 在 ebooks.ts 中修改
{ timeout: 1200000 } // 改为 20 分钟
```

## 📈 性能优化建议

### 1. 使用 CDN
将静态文件部署到 CDN 可以提升下载速度

### 2. 启用压缩
对于文本格式（TXT, DOC）启用压缩

### 3. 分片上传
对于超大文件（> 500MB），考虑实现分片上传：
- 将文件分成多个小块
- 逐个上传
- 服务器端合并

### 4. 断点续传
保存上传进度，支持失败后继续上传

## 🔐 安全建议

1. **文件类型验证**: 已实现，只允许特定格式
2. **病毒扫描**: 建议添加 ClamAV 扫描
3. **访问控制**: 已实现，只有管理员可以上传
4. **存储配额**: 考虑添加用户或系统存储配额限制

## 📝 版本历史

### v2.0 - 2025-10-21
- ✅ 增加文件上传限制到 500MB
- ✅ 添加实时上传进度条
- ✅ 优化上传超时设置
- ✅ 改进 UI/UX 体验

### v1.0 - 初始版本
- 基础电子书上传功能
- B2 云存储同步
- 文件列表展示

## 🎯 未来计划

- [ ] 支持拖拽上传
- [ ] 批量上传多个文件
- [ ] 上传队列管理
- [ ] 分片上传支持
- [ ] 断点续传
- [ ] 上传历史记录
- [ ] 文件预览功能

---

**文档版本**: 1.0  
**更新日期**: 2025-10-21  
**维护者**: 实验室管理系统团队

