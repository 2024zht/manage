# 请假审批与电子书管理模块实现指南

## 📋 概述

本文档详细说明如何在现有系统中实现两个新的核心模块：
1. **请假审批模块** - 完整的线上请假申请与审批流程
2. **电子书管理模块** - 电子书上传、同步到Backblaze B2、浏览和下载

## ✅ 已完成的后端工作

### 数据库表
- ✅ `leaves` - 请假记录表
- ✅ `ebooks` - 电子书记录表

### 后端API路由
- ✅ `/api/leaves` - 请假相关API
- ✅ `/api/ebooks` - 电子书相关API

### 后端类型定义
- ✅ `Leave` 接口
- ✅ `Ebook` 接口

### 依赖安装
- ✅ `multer` - 文件上传中间件
- ✅ `@types/multer` - TypeScript类型定义

## 🔧 环境配置

### backend/.env 文件添加

```bash
# Backblaze B2 配置
B2_BUCKET_NAME=your-bucket-name
B2_FOLDER=ebooks
CF_WORKER_URL=https://divine-glade-0efd.hengtangzhao.workers.dev/api
```

### 安装 Backblaze B2 CLI （Ubuntu服务器上）

```bash
# 安装 B2 CLI
pip install --upgrade b2

# 配置 B2 凭证
b2 authorize-account <your_application_key_id> <your_application_key>

# 测试连接
b2 list-buckets
```

## 📝 需要创建的前端组件

### 1. LeaveRequest.tsx - 用户请假申请组件

创建文件：`frontend/src/components/LeaveRequest.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import { Leave } from '../types';
import { Calendar, Clock, FileText, Send, History } from 'lucide-react';

const LeaveRequest: React.FC = () => {
  const [leaveType, setLeaveType] = useState('事假');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  useEffect(() => {
    // 自动计算时长
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diff = end.getTime() - start.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setDuration(`${days}天${hours}小时`);
      } else {
        setDuration('');
      }
    }
  }, [startTime, endTime]);

  const fetchMyLeaves = async () => {
    try {
      const { data } = await leaveAPI.getMyLeaves();
      setMyLeaves(data);
    } catch (error) {
      console.error('获取请假记录失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startTime || !endTime || !duration || !reason) {
      alert('请填写完整信息');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    setLoading(true);
    try {
      await leaveAPI.submit(leaveType, startTime, endTime, duration, reason);
      alert('请假申请已提交');
      // 清空表单
      setStartTime('');
      setEndTime('');
      setDuration('');
      setReason('');
      // 刷新列表
      fetchMyLeaves();
    } catch (error: any) {
      alert(error.response?.data?.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">待审批</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">已批准</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">已拒绝</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：提交请假申请 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Send className="h-6 w-6 mr-2 text-blue-600" />
            发起请假申请
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请假类型
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>事假</option>
                <option>病假</option>
                <option>年假</option>
                <option>调休</option>
                <option>其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                开始时间
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                结束时间
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-4 w-4 mr-1" />
                请假时长（自动计算）
              </label>
              <input
                type="text"
                value={duration}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="将根据起止时间自动计算"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                请假事由
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="请详细说明请假原因..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '提交中...' : '提交申请'}
            </button>
          </form>
        </div>

        {/* 右侧：我的请假记录 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <History className="h-6 w-6 mr-2 text-green-600" />
            我的请假记录
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {myLeaves.length > 0 ? (
              myLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-lg">{leave.leaveType}</span>
                      <span className="ml-2">{getStatusBadge(leave.status)}</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(leave.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <Clock className="inline h-4 w-4 mr-1" />
                      {new Date(leave.startTime).toLocaleString('zh-CN')} 至{' '}
                      {new Date(leave.endTime).toLocaleString('zh-CN')}
                    </p>
                    <p>时长: {leave.duration}</p>
                    <p>事由: {leave.reason}</p>
                    {leave.status !== 'pending' && leave.respondedByUsername && (
                      <p className="text-gray-500">
                        审批人: {leave.respondedByUsername} | 
                        时间: {new Date(leave.respondedAt!).toLocaleString('zh-CN')}
                      </p>
                    )}
                    {leave.rejectReason && (
                      <p className="text-red-600 bg-red-50 p-2 rounded">
                        拒绝理由: {leave.rejectReason}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无请假记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
```

### 2. LeaveApproval.tsx - 管理员审批组件

创建文件：`frontend/src/components/LeaveApproval.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import { Leave } from '../types';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';

const LeaveApproval: React.FC = () => {
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [processedLeaves, setProcessedLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await leaveAPI.getAll();
      setPendingLeaves(data.filter(l => l.status === 'pending'));
      setProcessedLeaves(data.filter(l => l.status !== 'pending'));
    } catch (error) {
      console.error('获取请假记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('确定批准此请假申请吗？')) return;

    try {
      await leaveAPI.approve(id);
      alert('已批准');
      fetchLeaves();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('请输入拒绝理由（必填）:');
    if (!reason) {
      alert('必须填写拒绝理由');
      return;
    }

    try {
      await leaveAPI.reject(id, reason);
      alert('已拒绝');
      fetchLeaves();
    } catch (error) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">请假审批管理</h2>

      {/* 待审批 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-orange-700 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          待审批 ({pendingLeaves.length})
        </h3>
        
        {pendingLeaves.length > 0 ? (
          <div className="space-y-4">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-lg">
                        {leave.name} ({leave.studentId})
                      </span>
                      <span className="text-sm text-gray-600">- {leave.className}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>类型:</strong> {leave.leaveType}</p>
                      <p>
                        <Calendar className="inline h-4 w-4 mr-1" />
                        <strong>时间:</strong> {new Date(leave.startTime).toLocaleString('zh-CN')} 
                        {' 至 '}
                        {new Date(leave.endTime).toLocaleString('zh-CN')}
                      </p>
                      <p><strong>时长:</strong> {leave.duration}</p>
                      <p><strong>事由:</strong> {leave.reason}</p>
                      <p className="text-gray-500">
                        提交时间: {new Date(leave.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      批准
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            暂无待审批的请假申请
          </div>
        )}
      </div>

      {/* 已处理 */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          已处理 ({processedLeaves.length})
        </h3>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {processedLeaves.map((leave) => (
            <div
              key={leave.id}
              className={`p-4 border rounded-lg ${
                leave.status === 'approved'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold">
                      {leave.name} ({leave.studentId})
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      leave.status === 'approved'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {leave.status === 'approved' ? '✓ 已批准' : '✗ 已拒绝'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{leave.leaveType} | {leave.duration}</p>
                    <p>{new Date(leave.startTime).toLocaleDateString('zh-CN')} - {new Date(leave.endTime).toLocaleDateString('zh-CN')}</p>
                    {leave.rejectReason && (
                      <p className="text-red-700">拒绝理由: {leave.rejectReason}</p>
                    )}
                    <p className="text-gray-500 text-xs">
                      审批人: {leave.respondedByUsername} | {new Date(leave.respondedAt!).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveApproval;
```

### 3. Ebooks.tsx - 电子书浏览下载组件

创建文件：`frontend/src/components/Ebooks.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ebookAPI } from '../services/api';
import { Ebook } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Book, Download, Upload, Trash2, HardDrive } from 'lucide-react';

const Ebooks: React.FC = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    try {
      const { data } = await ebookAPI.getAll();
      setEbooks(data);
    } catch (error) {
      console.error('获取电子书列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过100MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await ebookAPI.upload(formData);
      alert('上传成功！正在同步到云存储...');
      fetchEbooks();
      // 清空input
      e.target.value = '';
    } catch (error: any) {
      alert(error.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, filename: string) => {
    if (!window.confirm(`确定要删除 "${filename}" 吗？`)) return;

    try {
      await ebookAPI.delete(id);
      alert('删除成功');
      fetchEbooks();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDownload = async (ebook: Ebook) => {
    try {
      const { data } = await ebookAPI.getDownloadUrl(ebook.id);
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      alert('获取下载链接失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Book className="h-6 w-6 mr-2 text-blue-600" />
          电子书库
        </h2>
        
        {user?.isAdmin && (
          <div>
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.epub,.mobi,.azw3,.txt,.doc,.docx"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="fileInput"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="h-5 w-5 mr-2" />
              {uploading ? '上传中...' : '上传电子书'}
            </label>
          </div>
        )}
      </div>

      {user?.isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>管理员提示：</strong>
            上传文件后将自动同步到 Backblaze B2 云存储。
            支持的格式：PDF, EPUB, MOBI, AZW3, TXT, DOC, DOCX。
            最大文件大小：100MB。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ebooks.length > 0 ? (
          ebooks.map((ebook) => (
            <div
              key={ebook.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <Book className="h-8 w-8 text-blue-500 flex-shrink-0" />
                {ebook.b2Synced && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    已同步
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-2 line-clamp-2" title={ebook.originalName}>
                {ebook.originalName}
              </h3>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-1" />
                  {formatFileSize(ebook.fileSize)}
                </p>
                <p>上传者: {ebook.uploadedByUsername}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ebook.uploadedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(ebook)}
                  disabled={!ebook.b2Synced}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </button>
                
                {user?.isAdmin && (
                  <button
                    onClick={() => handleDelete(ebook.id, ebook.originalName)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无电子书，
            {user?.isAdmin && '点击上方"上传电子书"按钮添加资源'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ebooks;
```

## 🔗 更新路由配置

### 修改 `frontend/src/App.tsx`

在路由中添加新的页面：

```typescript
import LeaveRequest from './components/LeaveRequest';
import LeaveApproval from './components/LeaveApproval';
import Ebooks from './components/Ebooks';

// 在 Routes 中添加：
<Route path="leaves" element={<LeaveRequest />} />
<Route path="ebooks" element={<Ebooks />} />
<Route path="admin/leave-approval" element={<AdminRoute><LeaveApproval /></AdminRoute>} />
```

### 修改 `frontend/src/components/Layout.tsx`

在导航菜单中添加新的入口：

```typescript
// 在导航菜单中添加：
<NavLink to="/leaves" className={navLinkClass}>
  <Calendar className="inline h-5 w-5 mr-2" />
  请假申请
</NavLink>

<NavLink to="/ebooks" className={navLinkClass}>
  <Book className="inline h-5 w-5 mr-2" />
  电子书库
</NavLink>

// 管理员菜单中添加：
{user?.isAdmin && (
  <NavLink to="/admin/leave-approval" className={navLinkClass}>
    <CheckCircle className="inline h-5 w-5 mr-2" />
    请假审批
  </NavLink>
)}
```

## 📦 安装依赖

### 后端

```bash
cd backend
npm install
# 或者如果已经更新了package.json
npm install multer @types/multer
```

### 初始化数据库

```bash
cd backend
npm run init-db
```

## 🚀 测试流程

### 1. 测试请假功能

**用户操作**：
1. 登录普通用户账户
2. 访问"请假申请"页面
3. 填写请假信息并提交
4. 在右侧查看自己的请假记录

**管理员操作**：
1. 管理员登录
2. 访问"请假审批"页面
3. 查看待审批列表
4. 批准或拒绝申请

### 2. 测试电子书功能

**管理员操作**：
1. 管理员登录
2. 访问"电子书库"页面
3. 点击"上传电子书"
4. 选择一个PDF文件上传
5. 等待上传和B2同步完成

**用户操作**：
1. 访问"电子书库"页面
2. 浏览电子书列表
3. 点击"下载"按钮
4. 文件通过Cloudflare Worker下载

## ⚙️ 关键技术细节

### URL编码处理

电子书文件名可能包含特殊字符，必须进行URL编码：

```typescript
// 在 ebooks.ts 中
const encodedFilename = encodeURIComponent(row.originalName);
const downloadUrl = `${workerUrl}/${encodedFilename}`;
```

### B2 同步流程

1. 文件上传到服务器 `/uploads/ebooks/`
2. 调用 `b2 sync` 命令同步到B2
3. 同步成功后删除本地文件
4. 更新数据库 `b2Synced` 字段

### 时长自动计算

```typescript
useEffect(() => {
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setDuration(`${days}天${hours}小时`);
    }
  }
}, [startTime, endTime]);
```

## 🎯 管理员界面集成

在 `Admin.tsx` 中添加新的标签页：

```typescript
const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'import' | 'requests' | 'leaves'>('users');

// 添加请假审批标签
<button
  onClick={() => setActiveTab('leaves')}
  className={`... ${activeTab === 'leaves' ? '...' : '...'}`}
>
  <Calendar className="inline-block h-5 w-5 mr-2" />
  请假审批
</button>

// 添加内容区域
{activeTab === 'leaves' && <LeaveApproval />}
```

## 📊 数据库查询示例

### 获取待审批请假（管理员）

```sql
SELECT l.*, 
       u.username, u.name, u.studentId, u.className
FROM leaves l
JOIN users u ON l.userId = u.id
WHERE l.status = 'pending'
ORDER BY l.createdAt DESC
```

### 获取用户的请假记录

```sql
SELECT l.*, u.username as respondedByUsername
FROM leaves l
LEFT JOIN users u ON l.respondedBy = u.id
WHERE l.userId = ?
ORDER BY l.createdAt DESC
```

## 🔒 权限控制

所有API都使用JWT认证：

```typescript
router.post('/', authenticateToken, async (req, res) => { ... });
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => { ... });
```

## 📚 相关文档

- [Backend API文档](./API_DOCS.md)
- [Backblaze B2文档](https://www.backblaze.com/b2/docs/)
- [Multer文档](https://github.com/expressjs/multer)

## ✅ 检查清单

- [ ] 后端依赖已安装（multer）
- [ ] 数据库已重新初始化
- [ ] 环境变量已配置（B2_BUCKET_NAME等）
- [ ] B2 CLI已安装并配置
- [ ] 前端组件已创建
- [ ] 路由已更新
- [ ] 导航菜单已更新
- [ ] 测试请假流程
- [ ] 测试电子书上传和下载

---

**完成所有步骤后，您将拥有完整的请假审批和电子书管理功能！**

