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
export const isoTime = (iso) => {
  if (!iso) return '';
  return iso.length === 5 ? iso : iso.slice(11, 16);
};
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

// Định dạng khoảng giờ từ hai chuỗi giờ đã có sẵn, ví dụ "19:30" và "20:30" -> "19:30 - 20:30".
// Giữ lại từ nhánh buyer-profile; thiếu dữ liệu thì trả "Trong ngày".
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return 'Trong ngày';
  return `${startTime} - ${endTime}`;
};

// Đổi số mili-giây thành chữ dễ đọc: "25 phút", "1 giờ 20 phút", "2 giờ".
export function formatDuration(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

// Mô tả thời điểm hiện tại so với khung giờ nhận hàng (dùng cho nhãn đếm ngược).
// Trả về { phase: 'upcoming' | 'open' | 'ending' | 'ended', label }.
//   upcoming: chưa tới giờ nhận      open: đang trong giờ nhận
//   ending:   còn <= 30 phút         ended: đã hết giờ nhận
export function describePickupTiming(startIso, endIso, now = Date.now()) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end) || now >= end) return { phase: 'ended', label: 'Đã hết giờ nhận' };
  if (!Number.isNaN(start) && now < start) {
    return { phase: 'upcoming', label: `Bắt đầu nhận sau ${formatDuration(start - now)}` };
  }
  const left = end - now;
  return {
    phase: left <= 30 * 60000 ? 'ending' : 'open',
    label: `Còn ${formatDuration(left)} để nhận`,
  };
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