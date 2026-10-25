<<<<<<< HEAD
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/stores', label: 'Cửa hàng' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/listings', label: 'Tin đăng' },
];

function navClass({ isActive }) {
  return [
    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-blue-50 text-[#2563EB]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#111827]',
  ].join(' ');
}

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9FAFB] md:flex">
      <aside className="border-b border-[#E5E7EB] bg-white md:flex md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="px-5 py-4 text-lg font-bold text-[#111827]">LastBite Admin</div>

        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-3 md:flex-col md:items-stretch">
          <p className="truncate text-sm text-gray-600">{user?.name || user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
=======
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/stores', label: 'Cửa hàng' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/listings', label: 'Tin đăng' },
];

function navClass({ isActive }) {
  return [
    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-blue-50 text-[#2563EB]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#111827]',
  ].join(' ');
}

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9FAFB] md:flex">
      <aside className="border-b border-[#E5E7EB] bg-white md:flex md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="px-5 py-4 text-lg font-bold text-[#111827]">LastBite Admin</div>

        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-3 md:flex-col md:items-stretch">
          <p className="truncate text-sm text-gray-600">{user?.name || user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
>>>>>>> 83eee0e7baa37e9a7ec1bcd147a1154eb4710b2e
