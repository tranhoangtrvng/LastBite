import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import BuyerLayout from './layouts/BuyerLayout';
import StoreLayout from './layouts/StoreLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Phân hệ Xác thực
import AuthPage from './pages/auth/AuthPage';

// Phân hệ Người mua (Tất cả các trang chính thức)
import SearchPage from './pages/buyer/SearchPage';
import FoodDetailPage from './pages/buyer/FoodDetailPage';
import OrderHistoryPage from './pages/buyer/OrderHistoryPage';
import ProfilePage from './pages/buyer/ProfilePage';

// Phân hệ Cửa hàng
import StorePage from './pages/store/StorePage';
import StoreDashboard from './components/store/StoreDashboard';
import StoreOrders from './components/store/StoreOrders';

// Phân hệ Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStores from './pages/admin/AdminStores';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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

              {/* Các trang cần đăng nhập (chưa đăng nhập -> chuyển về /auth) */}
              <Route element={<ProtectedRoute />}>
                {/* Trang Lịch sử đơn hàng 4 tab & Hủy đơn (Frame 6): chỉ người mua */}
                <Route element={<ProtectedRoute roles={['buyer']} />}>
                  <Route path="/orders" element={<OrderHistoryPage />} />
                </Route>

                {/* Trang Quản lý hồ sơ cá nhân (Frame 7) */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* 3. Phân hệ Cửa hàng (chỉ tài khoản role = store) */}
            <Route element={<ProtectedRoute roles={['store']} />}>
              <Route element={<StoreLayout />}>
                <Route path="/store" element={<StorePage />} />
                <Route path="/store/orders" element={<StoreOrders />} />
                <Route path="/store/dashboard" element={<StoreDashboard />} />
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

            {/* 5. Fallback cho các đường dẫn không tồn tại */}
            <Route path="*" element={<Navigate to="/foods" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
