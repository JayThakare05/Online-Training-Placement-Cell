// src/services/profileApi.js - Frontend API service for profile management
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Profile API functions
export const profileApi = {
  // Get current user's profile (role-agnostic)
  getCurrentProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  // Update current user's profile (role-agnostic)
  updateCurrentProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Admin specific APIs
  admin: {
    getProfile: async () => {
      try {
        const response = await api.get('/admin/profile');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch admin profile');
      }
    },

    updateProfile: async (adminData) => {
      try {
        const response = await api.put('/admin/profile', adminData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update admin profile');
      }
    }
  },

  // Student specific APIs
  student: {
    getProfile: async () => {
      try {
        const response = await api.get('/student/profile');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch student profile');
      }
    },

    updateProfile: async (studentData) => {
      try {
        const response = await api.put('/student/profile', studentData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update student profile');
      }
    }
  },

  // Recruiter specific APIs
  recruiter: {
    getProfile: async () => {
      try {
        const response = await api.get('/recruiter/profile');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch recruiter profile');
      }
    },

    updateProfile: async (recruiterData) => {
      try {
        const response = await api.put('/recruiter/profile', recruiterData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update recruiter profile');
      }
    }
  }
};

// Auth API functions
export const authApi = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  }
};

// Export the configured axios instance for custom requests
export default api;