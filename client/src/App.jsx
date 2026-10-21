// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BuyerLayout from './layouts/BuyerLayout';
import SearchPage from './pages/buyer/SearchPage';
import FoodDetailPage from './pages/buyer/FoodDetailPage';
import AuthPage from './pages/auth/AuthPage';

// Component giữ chỗ cho Trang Lịch sử đơn hàng (Frame 6)
const DummyOrderHistory = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3 shadow-sm">
    <span className="inline-block p-3 bg-amber-50 text-amber-600 rounded-full text-xl font-bold">📋</span>
    <h1 className="text-xl font-bold text-[#111827]">Đơn hàng của tôi (Frame 6)</h1>
    <p className="text-sm text-[#4B5563]">
      Khu vực hiển thị danh sách đơn với 4 tab trạng thái: Chờ nhận, Đã nhận, Đã huỷ, Không đến.
    </p>
  </div>
);

// Component giữ chỗ cho Trang Hồ sơ cá nhân (Frame 7)
const DummyProfile = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3 shadow-sm">
    <span className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-full text-xl font-bold">👤</span>
    <h1 className="text-xl font-bold text-[#111827]">Hồ sơ cá nhân (Frame 7)</h1>
    <p className="text-sm text-[#4B5563]">
      Khu vực quản lý thông tin tài khoản cá nhân, cài đặt bảo mật và huy hiệu giải cứu suất ăn.
    </p>
  </div>
);

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
            
            {/* Trang Lịch sử đơn hàng (Frame 6) */}
            <Route path="/orders" element={<DummyOrderHistory />} />
            
            {/* Trang Quản lý hồ sơ cá nhân (Frame 7) */}
            <Route path="/profile" element={<DummyProfile />} />
          </Route>

          {/* 3. Bắt các đường dẫn không tồn tại (Fallback 404) */}
          <Route path="*" element={<Navigate to="/foods" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}