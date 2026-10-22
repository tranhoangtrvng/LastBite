// client/src/layouts/BuyerLayout.jsx
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BuyerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/foods' },
    { name: 'Đơn hàng của tôi', path: '/orders' },
  ];

  const displayName = user?.name || user?.emailOrPhone || 'Hải Anh';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      {/* HEADER: Chiều cao 80px cố định, menu giữa căn tuyệt đối ở tâm */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-20 shadow-2xs">
        <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between relative">
          
          {/* Logo */}
          <Link to="/foods" className="text-2xl font-bold text-[#2563EB] tracking-tight shrink-0 z-10">
            LastBite
          </Link>

          {/* Menu giữa: Khóa chặt tại tâm màn hình */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-[#2563EB] font-bold' : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Cụm User & Đăng xuất */}
          <div className="flex items-center gap-3 shrink-0 z-10">
            <Link to="/profile" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs border border-[#BFDBFE]">
                {initial}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-[#374151] group-hover:text-[#2563EB]">
                {displayName}
              </span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-[#DC2626] bg-[#FEE2E2] hover:bg-[#FCA5A5] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Thẳng hàng với Header */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6 text-center text-xs text-[#6B7280]">
        <p className="font-medium text-[#374151]">LastBite - Cứu món ngon cuối ngày, giảm lãng phí thực phẩm</p>
        <p className="mt-1">Lưu ý: Quý khách thanh toán trực tiếp tại quầy khi đến nhận món ăn.</p>
      </footer>
    </div>
  );
}