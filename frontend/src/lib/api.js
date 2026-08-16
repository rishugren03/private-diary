import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('diary_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('diary_token');
      localStorage.removeItem('diary_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
