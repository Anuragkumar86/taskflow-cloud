// File: taskflow-cloud/frontend/src/lib/api.js
// Purpose: Centralized API call functions for the frontend
// Every component imports from here to call the backend
// Why: Keeps API URLs in one place. Easy to change the backend URL.

import axios from 'axios';
import Cookies from 'js-cookie';

// Backend API base URL
// In local dev: http://localhost:5000
// In production: the Load Balancer or EC2 public DNS
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Automatically add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('taskflow_token');
      Cookies.remove('taskflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// Project functions
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Task functions
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// File functions
// File functions
export const fileAPI = {
  upload: (formData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDownloadUrl: (id) => api.get(`/files/${id}/download`),
  getByTask: (taskId) => api.get('/files', { params: { task_id: taskId } }),
  getMyFiles: () => api.get('/files/my-files'),
  deleteFile: (id) => api.delete(`/files/${id}`),
};

// Comment functions
export const commentAPI = {
  getByTask: (taskId) => api.get('/comments', { params: { task_id: taskId } }),
  add: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export default api;