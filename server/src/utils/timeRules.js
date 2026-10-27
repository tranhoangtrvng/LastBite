// Quy tắc thời gian "cứu suất cuối ngày" dùng chung cho tin đăng, đặt chỗ và danh sách.
//
//   1) Cửa hàng chỉ đăng suất nhận hàng TRONG NGÀY HÔM NAY (giờ Việt Nam).
//   2) Người mua chỉ đặt được khi đã gần giờ nhận: từ (giờ bắt đầu nhận - BOOKING_LEAD_MINUTES) trở đi.
//      Mặc định 120 phút (2 tiếng). Đổi bằng biến BOOKING_LEAD_MINUTES trong server/.env,
//      ví dụ khi demo ban ngày đặt 1440 (24 tiếng) để món hiện ra suốt cả ngày.
//
// Server đã đặt TZ = Asia/Ho_Chi_Minh (server.js) nên getFullYear()/getDate()... là theo giờ Việt Nam.

const DEFAULT_BOOKING_LEAD_MINUTES = 120;

// Đọc lại biến môi trường mỗi lần gọi; giá trị thiếu hoặc sai (không phải số >= 0) thì dùng mặc định.
function getBookingLeadMinutes() {
  const raw = process.env.BOOKING_LEAD_MINUTES;
  if (raw === undefined || String(raw).trim() === '') return DEFAULT_BOOKING_LEAD_MINUTES;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_BOOKING_LEAD_MINUTES;
}

// Thời điểm bắt đầu cho phép đặt chỗ của một tin: giờ bắt đầu nhận trừ đi số phút cho phép đặt trước.
function bookingOpensAt(pickupStart) {
  return new Date(new Date(pickupStart).getTime() - getBookingLeadMinutes() * 60 * 1000);
}

// Hai thời điểm có cùng ngày (theo giờ Việt Nam) không?
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

const isToday = (date) => isSameDay(new Date(date), new Date());

// "21:30" (kèm "ngày 27/10" nếu không phải hôm nay) - dùng trong câu báo lỗi.
function formatClock(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return isToday(d) ? clock : `${clock} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

module.exports = {
  DEFAULT_BOOKING_LEAD_MINUTES,
  getBookingLeadMinutes,
  bookingOpensAt,
  isSameDay,
  isToday,
  formatClock,
};
