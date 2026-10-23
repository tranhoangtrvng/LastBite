// client/src/api/authApi.js
import axiosClient from './axiosClient';

export const authApi = {
  // Đăng nhập: gửi { email, password }  (docs/api.md mục 3.2)
  login: (credentials) => axiosClient.post('/auth/login', credentials),

  // Đăng ký: gửi { name, email, password, phone?, role: 'buyer' | 'store' }
  register: (userData) => axiosClient.post('/auth/register', userData),

  // Lấy thông tin tài khoản hiện tại qua JWT Token
  getProfile: () => axiosClient.get('/auth/me'),
};
