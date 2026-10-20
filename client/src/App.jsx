// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BuyerLayout from './layouts/BuyerLayout';
import SearchPage from './pages/buyer/SearchPage';
import AuthPage from './pages/auth/AuthPage';

// Component giữ chỗ cho Trang Chi tiết món ăn (Frame 3)
const DummyFoodDetail = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3">
    <span className="inline-block p-3 bg-blue-50 text-[#2563EB] rounded-full text-xl font-bold">🍽️</span>
    <h1 className="text-xl font-bold text-[#111827]">Chi tiết suất ăn (Frame 3)</h1>
    <p className="text-sm text-[#4B5563]">
      Trang hiển thị hình ảnh lớn, mô tả bảo quản, địa chỉ quán và khối đặt chỗ cố định.
    </p>
  </div>
);

// Component giữ chỗ cho Trang Lịch sử đơn hàng (Frame 6)
const DummyOrderHistory = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3">
    <span className="inline-block p-3 bg-amber-50 text-amber-600 rounded-full text-xl font-bold">📋</span>
    <h1 className="text-xl font-bold text-[#111827]">Đơn hàng của tôi (Frame 6)</h1>
    <p className="text-sm text-[#4B5563]">
      Khu vực hiển thị danh sách đơn với 4 tab trạng thái: Chờ nhận, Đã nhận, Đã huỷ, Không đến.
    </p>
  </div>
);

// Component giữ chỗ riêng biệt cho Trang Hồ sơ cá nhân (Frame 7)
const DummyProfile = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3">
    <span className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-full text-xl font-bold">👤</span>
    <h1 className="text-xl font-bold text-[#111827]">Hồ sơ cá nhân (Frame 7)</h1>
    <p className="text-sm text-[#4B5563]">
      Khu vực quản lý thông tin tài khoản cá nhân, cài đặt bảo mật và huy hiệu tác động giải cứu suất ăn.
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

          {/* 2. Phân hệ Người mua (Dùng chung BuyerLayout) */}
          <Route element={<BuyerLayout />}>
            <Route path="/" element={<Navigate to="/foods" replace />} />
            <Route path="/foods" element={<SearchPage />} />
            <Route path="/foods/:id" element={<DummyFoodDetail />} />
            
            {/* Tách biệt rõ ràng giữa Đơn hàng và Hồ sơ cá nhân */}
            <Route path="/orders" element={<DummyOrderHistory />} />
            <Route path="/profile" element={<DummyProfile />} />
          </Route>

          {/* 3. Route điều hướng mặc định */}
          <Route path="*" element={<Navigate to="/foods" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}