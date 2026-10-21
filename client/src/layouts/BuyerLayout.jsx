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
      {/* Header cố định 80px */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-20 px-6 sm:px-12 lg:px-28">
        <div className="h-full flex items-center justify-between">
          <Link to="/foods" className="text-2xl font-bold text-[#2563EB] tracking-tight">
            LastBite
          </Link>

          {/* Menu điều hướng chính */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-[#2563EB] font-semibold' : 'text-[#4B5563] hover:text-[#111827]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Cụm tài khoản & Nút Đăng xuất */}
          <div className="flex items-center gap-4">
            <Link 
              to="/profile" 
              className={`flex items-center gap-2 group p-1 rounded-lg transition-colors ${
                location.pathname === '/profile' ? 'bg-blue-50/60' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs border border-blue-200">
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

      {/* Vùng nội dung theo từng Route */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-12 lg:px-28 py-8">
        <Outlet />
      </main>

      {/* Footer chung */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8 text-center text-xs text-[#6B7280]">
        <p className="font-medium text-[#374151]">LastBite - Cứu món ngon cuối ngày, giảm lãng phí thực phẩm</p>
        <p className="mt-1">Lưu ý: Quý khách thanh toán trực tiếp tại quầy khi đến nhận món ăn.</p>
      </footer>
    </div>
  );
}