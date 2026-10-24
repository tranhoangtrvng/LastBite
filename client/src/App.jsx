// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BuyerLayout from './layouts/BuyerLayout';
import StoreLayout from './layouts/StoreLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Phân hệ Xác thực
import AuthPage from './pages/auth/AuthPage';

// Phân hệ Người mua
import SearchPage from './pages/buyer/SearchPage';
import FoodDetailPage from './pages/buyer/FoodDetailPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';

// Phân hệ Cửa hàng
import StorePage from './pages/store/StorePage';
// Phân hệ Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStores from './pages/admin/AdminStores';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';

// Component giữ chỗ cho Trang Hồ sơ cá nhân (Frame 7)
const DummyProfile = () => (
  <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center max-w-2xl mx-auto space-y-3 shadow-sm">
    <span className="inline-block p-3 bg-emerald-50 text-emerald-600 rounded-full text-xl font-bold">👤</span>
    <h1 className="text-xl font-bold text-[#111827]">Hồ sơ cá nhân (Frame 7)</h1>
    <p className="text-sm text-[#4B5563]">
      Khu vực quản lý thông tin tài khoản cá nhân, cài đặt bảo mật và thống kê số suất ăn đã giải cứu.
    </p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Phân hệ Xác thực */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* 2. Phân hệ Người mua (Dùng chung BuyerLayout có Header 80px & Footer) */}
          <Route element={<BuyerLayout />}>
            {/* Mặc định chuyển hướng sang danh sách món */}
            <Route path="/" element={<Navigate to="/foods" replace />} />

            {/* Trang Tìm kiếm món ăn (Frame 2) */}
            <Route path="/foods" element={<SearchPage />} />

            {/* Trang Chi tiết suất ăn (Frame 3) */}
            <Route path="/foods/:id" element={<FoodDetailPage />} />

            {/* Các trang cần đăng nhập (chưa đăng nhập -> chuyển về /auth) */}
            <Route element={<ProtectedRoute />}>
              {/* Trang Lịch sử đơn hàng (Frame 6): chỉ người mua */}
              <Route element={<ProtectedRoute roles={['buyer']} />}>
                <Route path="/orders" element={<OrderHistoryPage />} />
              </Route>

              {/* Trang Hồ sơ cá nhân (Frame 7) */}
              <Route path="/profile" element={<DummyProfile />} />
            </Route>
          </Route>

          {/* 3. Phân hệ Cửa hàng (chỉ tài khoản role = store) */}
          <Route element={<ProtectedRoute roles={['store']} />}>
            <Route element={<StoreLayout />}>
              <Route path="/store" element={<StorePage />} />
            </Route>
          </Route>

          {/* 4. Phân hệ Admin (chỉ tài khoản role = admin) */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="stores" element={<AdminStores />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
            </Route>
          </Route>

          {/* 5. Fallback cho các đường dẫn sai */}
          <Route path="*" element={<Navigate to="/foods" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
