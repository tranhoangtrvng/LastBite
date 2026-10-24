// Các hàm định dạng dùng chung (tiền, ngày giờ, đường dẫn ảnh).
// Server luôn trả ngày giờ ISO 8601 theo giờ Việt Nam kèm "+07:00" (docs/api.md mục 1.5),
// ví dụ "2026-10-24T20:00:00+07:00", nên có thể cắt chuỗi để lấy ngày/giờ đúng giờ Việt Nam
// mà không bị lệch dù trình duyệt đang ở múi giờ nào.

// Địa chỉ gốc của server (bỏ đuôi /api) để nối với đường dẫn ảnh dạng "/uploads/xxx.jpg".
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Ảnh mặc định (SVG nhúng sẵn) khi món chưa có ảnh hoặc ảnh lỗi.
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#F3F4F6"/>' +
      '<text x="200" y="165" font-size="64" text-anchor="middle">🍱</text></svg>'
  );

export function resolveImageUrl(path) {
  if (!path) return PLACEHOLDER_IMAGE;
  if (/^(https?:|data:)/i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\//, '')}`;
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

// Ngày hôm nay theo máy người dùng, dạng "YYYY-MM-DD" (dùng để so với phần ngày của chuỗi ISO).
export function todayString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const isoDate = (iso) => (iso ? iso.slice(0, 10) : '');
export const isoTime = (iso) => (iso ? iso.slice(11, 16) : '');
export const isToday = (iso) => isoDate(iso) === todayString();

// "2026-10-24" -> "24/10"
export function shortDate(iso) {
  const d = isoDate(iso);
  return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '';
}

// "20:00 - 21:30"
export function formatPickupRange(startIso, endIso) {
  return `${isoTime(startIso)} - ${isoTime(endIso)}`;
}

// "HH:mm - dd/MM/yyyy" (hiển thị giờ nhận hàng của đơn đã hoàn tất)
export function formatDateTime(iso) {
  if (!iso) return '';
  return `${isoTime(iso)} - ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

// Ghép ngày "YYYY-MM-DD" và giờ "HH:mm" thành chuỗi ISO giờ Việt Nam gửi cho server.
export function toVietnamIso(dateStr, timeStr) {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${time}+07:00`;
}
