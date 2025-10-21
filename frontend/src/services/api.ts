import axios from 'axios';
import { User, Rule, AuthResponse, PointLog, PointRequest, Leave, Ebook, Attendance } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  register: (username: string, name: string, studentId: string, className: string, email: string, password: string) =>
    api.post('/auth/register', { username, name, studentId, className, email, password }),
  
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),
};

// 用户API
export const userAPI = {
  getAll: () => api.get<User[]>('/users'),
  
  getMe: () => api.get<User>('/users/me'),
  
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  
  updatePoints: (id: number, points: number, reason: string) =>
    api.patch(`/users/${id}/points`, { points, reason }),
  
  setAdmin: (id: number, isAdmin: boolean) =>
    api.patch(`/users/${id}/admin`, { isAdmin }),
  
  updatePassword: (id: number, newPassword: string) =>
    api.patch(`/users/${id}/password`, { newPassword }),
  
  getLogs: (id: number) => api.get<PointLog[]>(`/users/${id}/logs`),
  
  // 撤销积分修改
  revertPointLog: (logId: number) => api.delete(`/users/point-logs/${logId}`),
  
  // 异议相关
  submitRequest: (points: number, reason: string) =>
    api.post('/users/requests', { points, reason }),
  
  getMyRequests: () => api.get<PointRequest[]>('/users/my-requests'),
  
  getAllRequests: () => api.get<PointRequest[]>('/users/requests'),
  
  handleRequest: (id: number, status: 'approved' | 'rejected', adminComment?: string) =>
    api.patch(`/users/requests/${id}`, { status, adminComment }),
};

// 规则API
export const ruleAPI = {
  getAll: () => api.get<Rule[]>('/rules'),
  
  getOne: (id: number) => api.get<Rule>(`/rules/${id}`),
  
  create: (name: string, points: number, description: string) =>
    api.post('/rules', { name, points, description }),
  
  update: (id: number, name: string, points: number, description: string) =>
    api.put(`/rules/${id}`, { name, points, description }),
  
  delete: (id: number) => api.delete(`/rules/${id}`),
};

// 请假API
export const leaveAPI = {
  submit: (leaveType: string, startTime: string, endTime: string, duration: string, reason: string) =>
    api.post('/leaves', { leaveType, startTime, endTime, duration, reason }),
  
  getMyLeaves: () => api.get<Leave[]>('/leaves/my-leaves'),
  
  getAll: (status?: string) => api.get<Leave[]>('/leaves', { params: { status } }),
  
  approve: (id: number, rejectReason?: string) =>
    api.patch(`/leaves/${id}`, { status: 'approved', rejectReason }),
  
  reject: (id: number, rejectReason: string) =>
    api.patch(`/leaves/${id}`, { status: 'rejected', rejectReason }),
};

// 电子书API
export const ebookAPI = {
  getAll: () => api.get<Ebook[]>('/ebooks'),
  
  upload: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) =>
    api.post('/ebooks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    }),
  
  delete: (id: number) => api.delete(`/ebooks/${id}`),
  
  getDownloadUrl: (filename: string) => api.get(`/ebooks/download/${encodeURIComponent(filename)}`),
};

// 点名API
export const attendanceAPI = {
  getAll: () => api.get<Attendance[]>('/attendances'),
  
  getOne: (id: number) => api.get<Attendance>(`/attendances/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    locationName: string;
    latitude: number;
    longitude: number;
    radius: number;
    penaltyPoints?: number;
  }) => api.post('/attendances', data),
  
  update: (id: number, data: {
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    locationName: string;
    latitude: number;
    longitude: number;
    radius: number;
    penaltyPoints?: number;
  }) => api.put(`/attendances/${id}`, data),
  
  delete: (id: number) => api.delete(`/attendances/${id}`),
  
  sign: (id: number, latitude: number, longitude: number) =>
    api.post(`/attendances/${id}/sign`, { latitude, longitude }),
};

export default api;

