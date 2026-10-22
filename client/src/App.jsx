// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'; // Thêm Link ở đây
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import ListingList from './components/store/ListingList'; 
import StoreOrders from './components/store/StoreOrders'; // <-- Import file mới của bạn

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

        {/* THÊM MENU ĐIỀU HƯỚNG DÀNH CHO CHỦ QUÁN */}
        <div className="flex flex-col gap-3 py-4 border-t border-b border-gray-100 my-4">
          <Link 
            to="/store/listings" 
            className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
          >
            📋 Quản lý Tin đăng (Món ăn)
          </Link>
          <Link 
            to="/store/orders" 
            className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition"
          >
            📦 Quản lý Đơn hàng & Xác nhận
          </Link>
        </div>

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

          {/* Trang Quản lý tin đăng của bạn - Yêu cầu đăng nhập */}
          <Route
            path="/store/listings"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <ListingList />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Trang Quản lý Đơn hàng (Của Ngọc TV3) - Yêu cầu đăng nhập */}
          <Route
            path="/store/orders"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <StoreOrders />
                </div>
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