// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
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

  // Hàm xử lý Đăng nhập
  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const authToken = res.token || res.accessToken;
    const userData = res.user || res.data;

    if (authToken) {
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return res;
  };

  // Hàm xử lý Đăng ký
  const register = async (userData) => {
    const res = await authApi.register({ ...userData, role: 'buyer' });
    const authToken = res.token || res.accessToken;
    const userPayload = res.user || res.data;

    if (authToken) {
      setToken(authToken);
      setUser(userPayload);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userPayload));
    }
    return res;
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};