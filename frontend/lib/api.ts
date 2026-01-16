import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { identifier: string; password: string }) =>
    api.post('/auth/login', data),
  verify: (email: string, code: string) =>
    api.get(`/auth/verify?email=${encodeURIComponent(email)}&code=${code}`),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
};

// User API
export const userApi = {
  getMe: () => api.get('/user/me'),
  updateProfile: (data: { name?: string; bio?: string; timezone?: string }) =>
    api.put('/user/me', data),
};

// Event Type API
export const eventTypeApi = {
  create: (data: {
    title: string;
    description?: string;
    durationMinutes: number;
    locationType: string;
    locationDetails?: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    dailyLimit?: number;
    color?: string;
    defaultVideoLink?: string;
  }) => api.post('/event-type', data),
  getAll: () => api.get('/event-type'),
  getById: (id: string) => api.get(`/event-type/${id}`),
  update: (id: string, data: Partial<{
    title: string;
    description?: string;
    durationMinutes: number;
    locationType: string;
    locationDetails?: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    dailyLimit?: number;
    color?: string;
    defaultVideoLink?: string;
  }>) => api.put(`/event-type/${id}`, data),
  delete: (id: string) => api.delete(`/event-type/${id}`),
};

// Public API
export const publicApi = {
  getEventType: (username: string, slug: string) =>
    api.get(`/public/${username}/${slug}`),
  getUserEventTypes: (username: string) =>
    api.get(`/public/${username}`),
};

// Availability API
export const availabilityApi = {
  getSlots: (eventTypeId: string, startDate: string, endDate: string, timezone: string) =>
    api.get(`/availability/${eventTypeId}?startDate=${startDate}&endDate=${endDate}&timezone=${timezone}`),
};

// Booking API
export const bookingApi = {
  create: (data: {
    eventTypeId: string;
    startTime: string;
    guestName: string;
    guestEmail: string;
    guestNotes?: string;
    status: string;
    customAnswers?: { questionId: string; answerText: string }[];
    timezone: string;
    videoLink?: string;
  }) => api.post('/booking', data),
  getMyBookings: () => api.get('/booking'),
  cancel: (token: string) => api.post(`/booking/cancel/${token}`),
};

export default api;
