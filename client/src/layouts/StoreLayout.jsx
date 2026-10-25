// client/src/layouts/StoreLayout.jsx
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StoreLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const displayName = user?.name || user?.email || '';

  const navLinks = [
    { name: 'Quản lý tin đăng', path: '/store' },
    { name: 'Quản lý đơn hàng', path: '/store/orders' },
    { name: 'Thống kê hoạt động', path: '/store/dashboard' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-16 shadow-sm">
        <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Link to="/store" className="text-2xl font-bold text-[#2563EB] tracking-tight">
                LastBite
              </Link>
              <span className="hidden sm:inline-block text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full">
                Khu vực cửa hàng
              </span>
            </div>

            {/* Menu chuyển tab cho Quán */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'text-[#2563EB] bg-[#EFF6FF] font-semibold'
                        : 'text-[#4B5563] hover:text-[#111827] hover:bg-gray-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/foods" className="hidden sm:inline text-sm font-medium text-[#4B5563] hover:text-[#2563EB]">
              Xem trang người mua
            </Link>
            <span className="hidden sm:inline text-sm font-medium text-[#374151]">{displayName}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-[#DC2626] bg-[#FEE2E2] hover:bg-[#FCA5A5] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-[#E5E7EB] py-4 text-center text-xs text-[#6B7280]">
        LastBite - Cổng quản lý dành cho cửa hàng
      </footer>
    </div>
  );
}