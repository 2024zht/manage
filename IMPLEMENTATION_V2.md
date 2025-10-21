# V2.0 功能实现指南

由于改动较大，这里提供关键代码的实现指南。完整代码已在后端完成，前端需要您根据以下指南更新组件。

## 已完成的后端改动 ✅

### 1. 数据库结构
- ✅ users表添加：name, studentId, className
- ✅ 新建point_requests表（积分申诉）
- ✅ 初始化脚本已更新

### 2. API端点
- ✅ 注册API添加新字段验证
- ✅ 积分申诉CRUD接口
- ✅ 批量导入接口
- ✅ 所有用户查询返回新字段

## 需要更新的前端组件

### 1. 注册表单 (Register.tsx)

在现有的注册表单中添加三个新字段：

```tsx
// 添加状态
const [name, setName] = useState('');
const [studentId, setStudentId] = useState('');
const [className, setClassName] = useState('');

// 在表单中添加输入框（username和email之间）
<div>
  <label>姓名</label>
  <input
    type="text"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="请输入真实姓名"
  />
</div>

<div>
  <label>学号</label>
  <input
    type="text"
    required
    value={studentId}
    onChange={(e) => setStudentId(e.target.value)}
    placeholder="请输入学号"
  />
</div>

<div>
  <label>班级</label>
  <input
    type="text"
    required
    value={className}
    onChange={(e) => setClassName(e.target.value)}
    placeholder="请输入班级"
  />
</div>

// 修改注册API调用
await register(username, name, studentId, className, email, password);
```

### 2. 更新AuthContext (AuthContext.tsx)

```tsx
// 修改register函数签名
const register = async (
  username: string, 
  name: string,
  studentId: string,
  className: string,
  email: string, 
  password: string
) => {
  await authAPI.register(username, name, studentId, className, email, password);
};
```

### 3. 更新API服务 (api.ts)

```tsx
export const authAPI = {
  register: (
    username: string, 
    name: string,
    studentId: string,
    className: string,
    email: string, 
    password: string
  ) =>
    api.post('/auth/register', { 
      username, 
      name, 
      studentId, 
      className, 
      email, 
      password 
    }),
  
  // login保持不变
};

// 添加新的API
export const requestAPI = {
  // 创建申诉
  create: (points: number, reason: string) =>
    api.post('/users/requests', { points, reason }),
  
  // 获取我的申诉
  getMy: () => api.get<PointRequest[]>('/users/my-requests'),
  
  // 获取所有申诉（管理员）
  getAll: () => api.get<PointRequest[]>('/users/requests'),
  
  // 处理申诉（管理员）
  handle: (id: number, status: 'approved' | 'rejected', adminComment?: string) =>
    api.patch(`/users/requests/${id}`, { status, adminComment }),
};

export const batchAPI = {
  // 批量导入
  import: (records: Array<{studentId: string, points: number}>, reason: string) =>
    api.post('/users/batch-import', { records, reason }),
};
```

### 4. 修改积分看板 (Dashboard.tsx)

关键改动：

```tsx
// 表格表头
<thead className="bg-gray-50">
  <tr>
    <th>排名</th>
    <th>姓名</th>
    <th>学号</th>
    <th>班级</th>
    <th>积分</th>
    <th className="hidden md:table-cell">角色</th>
  </tr>
</thead>

// 表格内容
<tbody>
  {users.map((user, index) => (
    <tr key={user.id}>
      <td>
        {index < 3 ? getRankIcon(index) : <span>{index + 1}</span>}
      </td>
      <td>{user.name}</td>
      <td>{user.studentId}</td>
      <td>{user.className}</td>
      <td>
        <span className={getPointsClass(user.points)}>
          {user.points}
        </span>
      </td>
      <td className="hidden md:table-cell">
        {user.isAdmin && <span className="badge">管理员</span>}
      </td>
    </tr>
  ))}
</tbody>
```

### 5. 创建管理员登录页 (AdminLogin.tsx)

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.isAdmin) {
        setError('您没有管理员权限');
        logout();
        return;
      }
      
      navigate('/admin');
    } catch (err: any) {
      setError('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full">
            <Shield className="h-10 w-10 text-purple-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          管理员登录
        </h2>
        <p className="text-center text-gray-600 mb-6">
          仅限管理员访问
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="请输入管理员用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="请输入密码"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
```

### 6. 创建个人积分历史页 (MyPoints.tsx)

```tsx
import React, { useState, useEffect } from 'react';
import { userAPI, requestAPI } from '../services/api';
import { PointLog, PointRequest } from '../types';
import { History, AlertCircle, Plus } from 'lucide-react';

const MyPoints: React.FC = () => {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestPoints, setRequestPoints] = useState('');
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const [logsRes, requestsRes] = await Promise.all([
        userAPI.getLogs(user.id),
        requestAPI.getMy()
      ]);
      setLogs(logsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestAPI.create(parseInt(requestPoints), requestReason);
      alert('申诉已提交');
      setShowRequestForm(false);
      setRequestPoints('');
      setRequestReason('');
      fetchData();
    } catch (error) {
      alert('提交失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 积分历史 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <History className="mr-2" />
            积分变更历史
          </h2>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            提交申诉
          </button>
        </div>
        
        {/* 积分历史列表 */}
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between">
                <span className={log.points > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {log.points > 0 ? '+' : ''}{log.points}
                </span>
                <span className="text-gray-500 text-sm">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{log.reason}</p>
              <p className="text-gray-500 text-sm">操作者: {log.createdByUsername}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 申诉记录 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold flex items-center mb-4">
          <AlertCircle className="mr-2" />
          我的申诉
        </h2>
        
        {requests.map((req) => (
          <div key={req.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-1 rounded text-sm ${
                  req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  req.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status === 'pending' ? '待处理' : 
                   req.status === 'approved' ? '已批准' : '已拒绝'}
                </span>
                <p className="mt-2 font-bold">期望调整: {req.points > 0 ? '+' : ''}{req.points}</p>
                <p className="text-gray-700">理由: {req.reason}</p>
                {req.adminComment && (
                  <p className="text-gray-600 text-sm mt-2">管理员备注: {req.adminComment}</p>
                )}
              </div>
              <span className="text-gray-500 text-sm">
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 申诉表单弹窗 */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">提交积分申诉</h3>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">期望调整积分</label>
                <input
                  type="number"
                  required
                  value={requestPoints}
                  onChange={(e) => setRequestPoints(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="正数为加分，负数为扣分"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">申诉理由</label>
                <textarea
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="请详细说明理由"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  提交
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPoints;
```

## 路由配置更新

在 `App.tsx` 中添加新路由：

```tsx
import AdminLogin from './components/AdminLogin';
import MyPoints from './components/MyPoints';

// 路由配置
<Routes>
  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
  <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
  
  <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
    <Route index element={<Dashboard />} />
    <Route path="rules" element={<Rules />} />
    <Route path="my-points" element={<MyPoints />} />
    <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
  </Route>
</Routes>
```

## Excel模板文件

已创建 `template_batch_import.csv`，格式为：

```
学号,积分,备注
2021001,10,完成实验报告
2021002,15,参加组会并发言
```

## 下一步操作

1. **更新前端组件**：按照上述指南修改组件
2. **重新初始化数据库**：`cd backend && npm run init-db`
3. **重新构建**：`npm run build`
4. **测试功能**：逐个测试新功能

## 提示

- 所有后端API已经实现并测试
- 前端组件代码提供了关键部分，您可以根据现有样式调整
- 建议先在开发环境测试，确认无误后再部署到生产环境

---

如有问题，请参考 `UPGRADE_V2.md` 文档。

