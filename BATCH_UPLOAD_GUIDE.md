# 批量上传与双阶段进度功能指南

## 🎉 新功能概览

### ✨ 主要特性

1. **批量上传** - 一次选择多个文件同时上传
2. **上传队列管理** - 可视化队列，实时查看所有文件状态
3. **双阶段进度显示** - 分别显示：
   - 📤 上传到服务器进度（0-70%）
   - ☁️ 同步到云端进度（70-100%）
4. **独立进度跟踪** - 每个文件独立显示进度
5. **状态图标** - 直观的图标表示不同状态
6. **时间统计** - 显示每个文件的上传耗时

---

## 📸 UI 预览

### 上传队列悬浮窗

```
┌─────────────────────────────────────────────────────────┐
│  📤 上传队列 (2/5)                     [清除已完成]      │
├─────────────────────────────────────────────────────────┤
│  🕐 C++ Primer.pdf                                  ×   │
│  164.7 MB                                                │
│  等待上传...                                             │
├─────────────────────────────────────────────────────────┤
│  📊 Python教程.pdf                                   ×   │
│  85.3 MB · 用时 2分15秒                                  │
│  📤 上传到服务器... 45%                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  总进度                                          31%     │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░                │
│  📡 服务器: ██████████████████░░░░░░░░░░ 45%            │
│  ☁️  云端:   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%          │
├─────────────────────────────────────────────────────────┤
│  ☁️  算法导论.pdf                                    ×   │
│  125.2 MB                                                │
│  ☁️ 同步到云端... 80%                                    │
│  总进度                                          94%     │
│  ████████████████████████████████████████████            │
│  📡 服务器: ██████████████████████████████ 100%         │
│  ☁️  云端:   ████████████████████████░░░░░░ 80%         │
├─────────────────────────────────────────────────────────┤
│  ✓ 深度学习.pdf                                      ×   │
│  92.5 MB · 用时 1分45秒                                  │
│  ✓ 上传完成                                              │
├─────────────────────────────────────────────────────────┤
│  ❌ 文件过大.pdf                                      ×   │
│  550 MB                                                  │
│  文件大小超过限制                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 技术实现

### 前端架构

#### 1. 类型定义

```typescript
export interface UploadTask {
  id: string;                    // 唯一标识
  file: File;                    // 文件对象
  status: 'waiting' | 'uploading' | 'syncing' | 'completed' | 'error';
  progress: number;              // 总进度 0-100
  serverProgress: number;        // 服务器进度 0-100
  cloudProgress: number;         // 云端进度 0-100
  error?: string;                // 错误信息
  startTime?: number;            // 开始时间
  endTime?: number;              // 结束时间
}
```

#### 2. 状态管理

```typescript
const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
const [isUploading, setIsUploading] = useState(false);
```

#### 3. 上传流程

```
选择文件
  ↓
创建任务队列
  ↓
逐个处理任务
  ↓
┌─────────────────────┐
│  第一阶段：服务器    │
│  - 上传文件          │
│  - 进度：0-70%       │
│  - 实时更新          │
└─────────────────────┘
  ↓
┌─────────────────────┐
│  第二阶段：云端      │
│  - B2 同步           │
│  - 进度：70-100%     │
│  - 模拟显示          │
└─────────────────────┘
  ↓
完成 / 错误
```

### 后端响应

```typescript
// 上传响应
{
  message: '文件上传成功',
  id: 123,
  filename: '1761024093732-724374146-C.pdf',
  originalName: 'C++ Primer.pdf',
  fileSize: 172593152,
  b2Synced: false,
  b2Path: null,
  syncError: null,
  needsB2Sync: false  // 新增：指示是否需要B2同步
}
```

---

## 🎨 状态图标说明

| 图标 | 状态 | 说明 |
|------|------|------|
| 🕐 | waiting | 等待上传 |
| 📊 | uploading | 正在上传到服务器 |
| ☁️ | syncing | 正在同步到云端 |
| ✓ | completed | 上传完成 |
| ❌ | error | 上传失败 |

---

## 💡 使用方法

### 1. 选择多个文件

```jsx
<input
  type="file"
  accept=".pdf,.epub,.mobi,.azw3,.txt,.doc,.docx"
  onChange={handleFileSelect}
  multiple  // 关键：启用多文件选择
/>
```

### 2. 创建上传任务

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  
  // 为每个文件创建任务
  const newTasks: UploadTask[] = Array.from(files).map((file) => ({
    id: `${Date.now()}-${Math.random()}`,
    file,
    status: 'waiting',
    progress: 0,
    serverProgress: 0,
    cloudProgress: 0,
    startTime: Date.now(),
  }));

  setUploadTasks((prev) => [...prev, ...newTasks]);
  
  // 开始处理队列
  processUploadQueue([...uploadTasks, ...newTasks]);
};
```

### 3. 处理上传队列

```typescript
const processUploadQueue = async (tasks: UploadTask[]) => {
  setIsUploading(true);

  // 顺序上传每个文件
  for (const task of tasks) {
    if (task.status !== 'waiting') continue;
    await uploadSingleFile(task);
  }

  setIsUploading(false);
  fetchEbooks(); // 刷新列表
};
```

### 4. 上传单个文件（双阶段）

```typescript
const uploadSingleFile = async (task: UploadTask) => {
  updateTask(task.id, { status: 'uploading' });

  const formData = new FormData();
  formData.append('file', task.file);

  try {
    // 第一阶段：上传到服务器
    const response = await ebookAPI.upload(formData, (progressEvent) => {
      if (progressEvent.total) {
        const serverPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        const overallProgress = Math.round(serverPercent * 0.7); // 占70%
        
        updateTask(task.id, {
          serverProgress: serverPercent,
          progress: overallProgress,
        });
      }
    });

    // 第二阶段：同步到云端
    if (response.data.needsB2Sync) {
      updateTask(task.id, { status: 'syncing' });
      await simulateCloudSync(task.id);
    } else {
      updateTask(task.id, {
        status: 'completed',
        progress: 100,
        endTime: Date.now(),
      });
    }

  } catch (error: any) {
    updateTask(task.id, {
      status: 'error',
      error: error.response?.data?.error || '上传失败',
    });
  }
};
```

### 5. 模拟云端同步进度

```typescript
const simulateCloudSync = async (taskId: string) => {
  return new Promise<void>((resolve) => {
    let cloudProgress = 0;
    const interval = setInterval(() => {
      cloudProgress += 10;
      const overallProgress = 70 + Math.round(cloudProgress * 0.3); // 占30%

      updateTask(taskId, {
        cloudProgress,
        progress: overallProgress,
      });

      if (cloudProgress >= 100) {
        clearInterval(interval);
        updateTask(taskId, {
          status: 'completed',
          progress: 100,
          endTime: Date.now(),
        });
        resolve();
      }
    }, 200); // 每200ms更新一次
  });
};
```

---

## 📊 进度计算说明

### 总进度分配

- **服务器阶段**：0-70% （占总进度的70%）
- **云端阶段**：70-100% （占总进度的30%）

### 计算公式

```typescript
// 服务器进度贡献
const serverContribution = serverProgress * 0.7;

// 云端进度贡献
const cloudContribution = cloudProgress * 0.3;

// 总进度
const totalProgress = serverContribution + cloudContribution;
```

### 示例

| 服务器进度 | 云端进度 | 总进度 | 说明 |
|-----------|---------|-------|------|
| 0% | 0% | 0% | 开始 |
| 50% | 0% | 35% | 上传中 |
| 100% | 0% | 70% | 服务器完成 |
| 100% | 50% | 85% | 云端同步中 |
| 100% | 100% | 100% | 完成 |

---

## 🎛️ 队列管理功能

### 1. 移除单个任务

```typescript
const removeTask = (taskId: string) => {
  setUploadTasks((prev) => prev.filter((task) => task.id !== taskId));
};
```

### 2. 清除已完成任务

```typescript
const clearCompletedTasks = () => {
  setUploadTasks((prev) =>
    prev.filter((task) => 
      task.status !== 'completed' && task.status !== 'error'
    )
  );
};
```

### 3. 队列统计

```typescript
// 总任务数
const totalTasks = uploadTasks.length;

// 进行中的任务
const activeTasks = uploadTasks.filter(t => 
  t.status === 'uploading' || t.status === 'syncing'
).length;

// 已完成的任务
const completedTasks = uploadTasks.filter(t => 
  t.status === 'completed'
).length;
```

---

## 🚀 性能优化

### 1. 顺序上传 vs 并发上传

**当前实现：顺序上传**
```typescript
for (const task of tasks) {
  await uploadSingleFile(task); // 等待上一个完成
}
```

**优化方案：并发上传**（可选）
```typescript
// 同时上传3个文件
const CONCURRENT_UPLOADS = 3;

const uploadBatch = async (tasks: UploadTask[]) => {
  const batches = [];
  for (let i = 0; i < tasks.length; i += CONCURRENT_UPLOADS) {
    const batch = tasks.slice(i, i + CONCURRENT_UPLOADS);
    batches.push(
      Promise.all(batch.map(task => uploadSingleFile(task)))
    );
  }
  
  for (const batch of batches) {
    await batch;
  }
};
```

### 2. 大文件分片上传

```typescript
// 将文件分成多个块
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

const uploadFileInChunks = async (file: File) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    await uploadChunk(chunk, i, totalChunks);
    
    // 更新进度
    const progress = Math.round(((i + 1) / totalChunks) * 100);
    updateTask(taskId, { serverProgress: progress });
  }
};
```

---

## 🎨 UI 定制

### 颜色方案

```typescript
// 状态颜色
const statusColors = {
  waiting: 'text-gray-400',
  uploading: 'text-blue-500',
  syncing: 'text-purple-500',
  completed: 'text-green-500',
  error: 'text-red-500',
};

// 进度条颜色
const progressColors = {
  server: 'bg-blue-500',
  cloud: 'bg-purple-500',
  overall: 'bg-gradient-to-r from-blue-500 to-purple-500',
};
```

### 动画效果

```css
/* 脉冲动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 进度条过渡 */
.transition-all {
  transition: all 0.3s ease-out;
}

/* 淡入效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📱 响应式设计

### 移动端适配

```typescript
// 桌面端：宽度480px
// 移动端：全屏
<div className="fixed bottom-6 right-6 z-50 
                w-[480px] max-w-[90vw]
                sm:right-6 sm:w-[480px]
                ...">
```

### 滚动优化

```typescript
// 最大高度400px，超出滚动
<div className="max-h-[400px] overflow-y-auto">
  {uploadTasks.map(task => (
    // 任务卡片
  ))}
</div>
```

---

## 🧪 测试场景

### 1. 单文件上传

- 选择 1 个文件
- 观察双阶段进度
- 验证完成后状态

### 2. 批量上传（小文件）

- 选择 5 个文件（每个 <10MB）
- 观察队列顺序处理
- 验证所有文件成功

### 3. 批量上传（大文件）

- 选择 3 个文件（每个 >100MB）
- 观察长时间上传的进度更新
- 验证云端同步阶段

### 4. 错误处理

- 上传超大文件（>500MB）
- 验证错误提示
- 测试网络中断恢复

### 5. 队列管理

- 上传过程中移除任务
- 清除已完成任务
- 混合状态管理

---

## 🐛 故障排除

### 问题1：进度条不更新

**原因**：`onUploadProgress` 回调未触发

**解决**：
```typescript
// 确保 axios 配置正确
api.post('/ebooks/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    // 确保有 total 属性
    if (progressEvent.total) {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('Progress:', percent);
    }
  },
});
```

### 问题2：云端进度不显示

**原因**：后端未返回 `needsB2Sync`

**解决**：
```typescript
// 检查后端响应
console.log('Response:', response.data);

// 确保有 needsB2Sync 字段
if (response.data.needsB2Sync) {
  await simulateCloudSync(task.id);
}
```

### 问题3：批量上传文件顺序混乱

**原因**：并发上传导致

**解决**：使用顺序上传
```typescript
// 顺序处理
for (const task of tasks) {
  await uploadSingleFile(task);
}
```

### 问题4：任务无法删除

**原因**：正在上传的任务无法立即删除

**解决**：添加确认提示
```typescript
const removeTask = (taskId: string) => {
  const task = uploadTasks.find(t => t.id === taskId);
  
  if (task && task.status === 'uploading') {
    if (!confirm('文件正在上传，确定要取消吗？')) {
      return;
    }
  }
  
  setUploadTasks(prev => prev.filter(t => t.id !== taskId));
};
```

---

## 🎯 未来改进

### 1. 实时 B2 进度

使用 WebSocket 或 SSE 获取真实的 B2 上传进度：

```typescript
// 建立 WebSocket 连接
const ws = new WebSocket('ws://localhost:3010/upload-progress');

ws.onmessage = (event) => {
  const { taskId, cloudProgress } = JSON.parse(event.data);
  updateTask(taskId, { cloudProgress });
};
```

### 2. 断点续传

保存上传进度，支持中断后继续：

```typescript
// 保存进度到 localStorage
localStorage.setItem(`upload_${taskId}`, JSON.stringify({
  chunks: completedChunks,
  progress: currentProgress,
}));

// 恢复上传
const savedProgress = localStorage.getItem(`upload_${taskId}`);
if (savedProgress) {
  const { chunks, progress } = JSON.parse(savedProgress);
  resumeUpload(chunks, progress);
}
```

### 3. 拖拽上传

```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  handleFileSelect({ target: { files } } as any);
};

<div
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
  className="border-2 border-dashed border-gray-300 rounded-lg p-8"
>
  拖拽文件到这里上传
</div>
```

### 4. 上传历史

```typescript
interface UploadHistory {
  id: string;
  filename: string;
  fileSize: number;
  uploadedAt: string;
  duration: number;
  status: 'success' | 'failed';
}

// 保存到本地存储
const saveHistory = (task: UploadTask) => {
  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  history.push({
    id: task.id,
    filename: task.file.name,
    fileSize: task.file.size,
    uploadedAt: new Date().toISOString(),
    duration: task.endTime! - task.startTime!,
    status: task.status === 'completed' ? 'success' : 'failed',
  });
  localStorage.setItem('uploadHistory', JSON.stringify(history));
};
```

---

## 📚 参考资料

- [Axios Progress](https://axios-http.com/docs/req_config)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [React Hooks](https://reactjs.org/docs/hooks-reference.html)

---

**版本**: 3.0  
**更新日期**: 2025-10-21  
**作者**: 实验室管理系统团队

