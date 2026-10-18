// client/src/api/authApi.js
import axiosClient from './axiosClient';

export const authApi = {
  // Đăng nhập: gửi { emailOrPhone, password }
  login: (credentials) => axiosClient.post('/auth/login', credentials),

  // Đăng ký: gửi { name, emailOrPhone, password, role: 'buyer' }
  register: (userData) => axiosClient.post('/auth/register', userData),

  // Lấy thông tin tài khoản hiện tại qua JWT Token
  getProfile: () => axiosClient.get('/auth/me'),
};