import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { TaskStatus } from '@/types';

// API 基礎設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 建立 axios 實例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 自動添加 JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理 401 錯誤和自動重新整理
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // 更新儲存的 tokens
          Cookies.set('access_token', access_token, { expires: 1 });
          if (newRefreshToken) {
            Cookies.set('refresh_token', newRefreshToken, { expires: 7 });
          }
          
          // 重新發送原始請求
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token 也過期或無效，清除所有 tokens 並重定向
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // 沒有 refresh token，直接清除並重定向
        Cookies.remove('access_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 使用者相關 API
export const authAPI = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// 任務相關 API
export const tasksAPI = {
  getTasks: (status?: TaskStatus) => {
    const params = status ? { status } : {};
    return api.get('/tasks/', { params });
  },
  
  getTask: (id: number) =>
    api.get(`/tasks/${id}`),
  
  createTask: (title: string, description?: string) =>
    api.post('/tasks/', { title, description }),
  
  updateTask: (id: number, data: { title?: string; description?: string; status?: TaskStatus }) =>
    api.put(`/tasks/${id}`, data),
  
  deleteTask: (id: number) =>
    api.delete(`/tasks/${id}`),
  
  getStats: () =>
    api.get('/tasks/stats/overview'),
};

// 留言相關 API
export const commentsAPI = {
  getComments: (taskId: number, skip: number = 0, limit: number = 100) =>
    api.get(`/tasks/${taskId}/comments/`, { params: { skip, limit } }),
  
  createComment: (taskId: number, content: string) =>
    api.post(`/tasks/${taskId}/comments/`, { content }),
  
  deleteComment: (taskId: number, commentId: number) =>
    api.delete(`/tasks/${taskId}/comments/${commentId}`)
};

// 工具函數
export const setAuthToken = (token: string) => {
  Cookies.set('access_token', token, { expires: 1 }); // 1天過期
};

export const setRefreshToken = (token: string) => {
  Cookies.set('refresh_token', token, { expires: 7 }); // 7天過期
};

export const removeAuthToken = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

export const getAuthToken = () => {
  return Cookies.get('access_token');
};

export const getRefreshToken = () => {
  return Cookies.get('refresh_token');
};

export default api;