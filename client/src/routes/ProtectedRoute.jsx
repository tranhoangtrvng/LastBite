// client/src/routes/ProtectedRoute.jsx
// Chặn trang theo đăng nhập và vai trò (README: routes/ProtectedRoute theo vai trò).
//   <Route element={<ProtectedRoute roles={['store']} />}> ...các trang chỉ dành cho cửa hàng... </Route>
// - Chưa đăng nhập      -> chuyển tới /auth (nhớ trang đang xem để quay lại sau khi đăng nhập)
// - Sai vai trò         -> chuyển về trang chủ của vai trò đó
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Trang chủ của từng vai trò
export function homePathForRole(role) {
  if (role === 'store') return '/store';
  if (role === 'admin') return '/admin';
  return '/foods';
}

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return <Outlet />;
}
