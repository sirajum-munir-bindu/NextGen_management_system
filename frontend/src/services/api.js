import axios from 'axios';

// Create instance pointing to backend Nginx proxy or fallback direct dev server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Inject Bearer token from localStorage for all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if unauthorized
      localStorage.removeItem('admin_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_username', username);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
  getUsername: () => {
    return localStorage.getItem('admin_username') || 'Admin';
  }
};

export const employeeService = {
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

export const planService = {
  get: async (employeeId, dateStr) => {
    try {
      const response = await api.get(`/plans/${employeeId}/${dateStr}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null; // Return null if no plan exists for this date
      }
      throw error;
    }
  },
  upload: async (employeeId, dateStr, tasksList) => {
    const response = await api.post('/plans', {
      employee_id: employeeId,
      date: dateStr,
      planned_tasks: tasksList
    });
    return response.data;
  }
};

export const reportService = {
  get: async (employeeId, dateStr) => {
    try {
      const response = await api.get(`/reports/${employeeId}/${dateStr}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  upload: async (employeeId, dateStr, completedTasks, pendingTasks, remarks = '') => {
    const response = await api.post('/reports', {
      employee_id: employeeId,
      date: dateStr,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      remarks: remarks
    });
    return response.data;
  }
};

export const analyticsService = {
  getDashboardStats: async (selectedDate = '') => {
    const params = selectedDate ? { selected_date: selectedDate } : {};
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },
  getPerformers: async () => {
    const response = await api.get('/analytics/performers');
    return response.data;
  },
  getEmployeeProductivity: async () => {
    const response = await api.get('/analytics/charts/productivity-by-employee');
    return response.data;
  },
  getDailyPerformance: async () => {
    const response = await api.get('/analytics/charts/daily-performance');
    return response.data;
  },
  getWeeklyTrend: async () => {
    const response = await api.get('/analytics/charts/weekly-trend');
    return response.data;
  },
  getMonthlyTrend: async () => {
    const response = await api.get('/analytics/charts/monthly-trend');
    return response.data;
  },
  getReportsList: async (filters = {}) => {
    const response = await api.get('/analytics/reports/list', { params: filters });
    return response.data;
  },
  getExportUrl: (format, filters = {}) => {
    const query = new URLSearchParams({ format, ...filters }).toString();
    return `${API_BASE_URL}/analytics/reports/export?${query}`;
  }
};

export default api;
