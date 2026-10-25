// client/src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token vào Header cho các request sau khi đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hai API này trả 401 khi sai email/mật khẩu: đó là lỗi bình thường, KHÔNG được đăng xuất.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

// Xử lý dữ liệu trả về và trích xuất câu báo lỗi từ Backend
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    // docs/api.md mục 1.4: gặp 401 (token sai/hết hạn) thì đăng xuất và về trang đăng nhập.
    if (status === 401 && !AUTH_ENDPOINTS.some((url) => error.config?.url?.startsWith(url))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/auth') {
        window.location.assign('/auth');
      }
    }

    const message =
      error.response?.data?.message ||
      (error.response ? 'Có lỗi xảy ra, vui lòng thử lại sau!' : 'Không kết nối được máy chủ, hãy kiểm tra backend đã chạy chưa.');

    const err = new Error(message);
    err.status = status;
    err.errors = error.response?.data?.errors; // danh sách lỗi theo từng trường (400)
    return Promise.reject(err);
  }
);

export default axiosClient;
