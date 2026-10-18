// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';

// Component bảo vệ Route: Chưa đăng nhập thì bắt chuyển về /auth
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

// Trang chủ sau khi đăng nhập thành công
function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-[#E5E7EB] text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#111827]">Trang chủ LastBite</h2>
        
        <p className="text-sm text-gray-600">
          Xin chào,{' '}
          <span className="font-bold text-[#2563EB]">
            {user?.name || user?.emailOrPhone}
          </span>
          !
        </p>
        
        <p className="text-xs text-emerald-600 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-200">
          ✓ Bạn đã đăng nhập vào hệ thống thành công.
        </p>

        <button
          onClick={logout}
          className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Trang Đăng nhập / Đăng ký */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* Trang chủ yêu cầu phải đăng nhập */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Các đường dẫn không tồn tại đều chuyển về / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}