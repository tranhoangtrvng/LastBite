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

  // Đổi mật khẩu (khi ĐÃ đăng nhập tại Profile): { current_password, new_password }
  changePassword: (data) => axiosClient.put('/auth/password', data),

  // 1. Quên mật khẩu: gửi { email } để yêu cầu gửi mã xác thực OTP
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),

  // 2. Đặt lại mật khẩu: gửi { email, otp, newPassword } để lưu mật khẩu mới
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
};