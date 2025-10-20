import axios from 'axios';
import { User, Rule, AuthResponse, PointLog } from '../types';

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
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  
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
  
  getLogs: (id: number) => api.get<PointLog[]>(`/users/${id}/logs`),
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

export default api;

