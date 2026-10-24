// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

// Đọc user đã lưu; dữ liệu hỏng thì coi như chưa đăng nhập (tránh trắng trang).
function readSavedUser() {
  try {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readSavedUser);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, [token]);

  // Mỗi lần mở lại trang: hỏi server thông tin mới nhất (ví dụ cửa hàng vừa được admin duyệt).
  // Token hết hạn thì axiosClient tự đăng xuất khi gặp 401.
  useEffect(() => {
    if (!token) return;
    authApi
      .getProfile()
      .then((res) => saveUser(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Lưu token + user sau khi đăng nhập / đăng ký thành công.
  // Server trả { success, message, data: { token, user } } (docs/api.md mục 3.2).
  const saveSession = (res) => {
    const authToken = res.data?.token;
    const userData = res.data?.user;
    if (!authToken || !userData) {
      throw new Error('Phản hồi từ máy chủ không đúng định dạng.');
    }
    setToken(authToken);
    localStorage.setItem('token', authToken);
    saveUser(userData);
    return userData;
  };

  // Hàm xử lý Đăng nhập: credentials = { email, password }. Trả về user để trang gọi chuyển hướng theo vai trò.
  const login = async (credentials) => saveSession(await authApi.login(credentials));

  // Hàm xử lý Đăng ký: userData = { name, email, password, phone?, role }. role mặc định là 'buyer'.
  const register = async (userData) =>
    saveSession(await authApi.register({ role: 'buyer', ...userData }));

  // Tải lại thông tin tài khoản từ server (dùng sau khi đăng ký cửa hàng hoặc kiểm tra trạng thái duyệt).
  const refreshUser = async () => {
    const res = await authApi.getProfile();
    saveUser(res.data);
    return res.data;
  };

  // Hàm Đăng xuất
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
