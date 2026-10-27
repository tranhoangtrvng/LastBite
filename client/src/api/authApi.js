// client/src/api/authApi.js
import axiosClient from './axiosClient';

export const authApi = {
  // Đăng nhập: gửi { email, password }  (docs/api.md mục 3.2)
  login: (credentials) => axiosClient.post('/auth/login', credentials),

  // Đăng ký: gửi { name, email, password, phone?, role: 'buyer' | 'store' }
  register: (userData) => axiosClient.post('/auth/register', userData),

  // Lấy thông tin tài khoản hiện tại qua JWT Token
  getProfile: () => axiosClient.get('/auth/me'),

  // Sửa hồ sơ: chỉ đổi được name và phone (email, role bị server bỏ qua)
  updateMe: (data) => axiosClient.put('/auth/me', data),

  // Đổi mật khẩu: { current_password, new_password }. Sai mật khẩu hiện tại trả 400.
  changePassword: (data) => axiosClient.put('/auth/password', data),
};
