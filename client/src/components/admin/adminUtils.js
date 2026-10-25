// Hàm định dạng dùng riêng cho khu quản trị.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TZ = 'Asia/Ho_Chi_Minh';

// "/uploads/abc.jpg" -> "http://localhost:5000/uploads/abc.jpg"
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return API_URL.replace(/\/api\/?$/, '') + path;
}

export function formatMoney(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
}

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso) {
  const d = toDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
}

// "20:00 - 21:30 · 24/10"
export function formatPickupRange(startIso, endIso) {
  const s = toDate(startIso);
  const e = toDate(endIso);
  if (!s || !e) return '—';
  const time = (d) => d.toLocaleTimeString('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const day = s.toLocaleDateString('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit' });
  return `${time(s)} - ${time(e)} · ${day}`;
}

// Kiểu nút nhỏ trong bảng và kiểu ô lọc, dùng chung cho các trang admin.
const BASE = 'cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition';
export const BTN = {
  primary: `${BASE} bg-[#2563EB] text-white hover:bg-blue-700`,
  danger: `${BASE} border border-red-200 bg-white text-red-600 hover:bg-red-50`,
  neutral: `${BASE} border border-[#E5E7EB] bg-white text-gray-700 hover:bg-gray-100`,
};
export const FIELD =
  'rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563EB]';
export const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500';
export const TD = 'px-4 py-3 align-middle text-sm text-gray-700';
