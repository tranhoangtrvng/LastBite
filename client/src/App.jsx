// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BuyerLayout from './layouts/BuyerLayout';

// Phân hệ Xác thực
import AuthPage from './pages/auth/AuthPage';

// Phân hệ Người mua (Tất cả các trang chính thức)
import SearchPage from './pages/buyer/SearchPage';
import FoodDetailPage from './pages/buyer/FoodDetailPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import ProfilePage from './pages/buyer/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Phân hệ Xác thực (Auth) */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* 2. Phân hệ Người mua (Dùng chung BuyerLayout có Header 80px & Footer) */}
          <Route element={<BuyerLayout />}>
            {/* Chuyển hướng mặc định về danh sách món ăn */}
            <Route path="/" element={<Navigate to="/foods" replace />} />

            {/* Trang Danh sách & Bộ lọc tìm kiếm món ăn (Frame 2) */}
            <Route path="/foods" element={<SearchPage />} />

            {/* Trang Chi tiết suất ăn (Frame 3) */}
            <Route path="/foods/:id" element={<FoodDetailPage />} />

            {/* Trang Lịch sử đơn hàng 4 tab & Hủy đơn (Frame 6) */}
            <Route path="/orders" element={<OrderHistoryPage />} />

            {/* Trang Quản lý hồ sơ cá nhân (Frame 7 - Đã thay component thật) */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 3. Fallback cho các đường dẫn không tồn tại */}
          <Route path="*" element={<Navigate to="/foods" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}