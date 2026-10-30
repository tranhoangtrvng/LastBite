// Giới hạn số lần thử (chống dò mật khẩu), không cần thư viện ngoài.
// Đếm trong bộ nhớ của server (tắt server là reset), đủ cho dự án chạy local / một máy chủ.
//
// Cách dùng:
//   const { loginLimiter } = require('../middlewares/rateLimit');
//   router.post('/login', loginLimiter, login);
//
// Vượt giới hạn -> 429 "Too Many Requests" + header Retry-After (số giây phải chờ).
const AppError = require('../utils/AppError');

/**
 * Tạo một middleware giới hạn.
 * - windowMs: khoảng thời gian tính (ms)
 * - max: số lần tối đa trong khoảng đó
 * - key(req): chuỗi nhận diện người thử (vd: IP + email)
 * - onlyFailures: true = chỉ đếm các lần THẤT BẠI (phản hồi >= 400)
 * - resetOnSuccess: khi onlyFailures, một lần thành công có xoá bộ đếm không (mặc định có)
 * - message(minutes): câu báo lỗi
 */
function createLimiter({ windowMs, max, key, onlyFailures = false, resetOnSuccess = true, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // Dọn các mục đã hết hạn mỗi phút để bộ nhớ không phình ra.
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, 60 * 1000);
  timer.unref(); // không giữ tiến trình sống chỉ vì bộ hẹn giờ này

  const bump = (k) => {
    const now = Date.now();
    const entry = hits.get(k);
    if (!entry || entry.resetAt <= now) hits.set(k, { count: 1, resetAt: now + windowMs });
    else entry.count += 1;
  };

  const middleware = (req, res, next) => {
    const k = key(req);
    const entry = hits.get(k);
    const now = Date.now();
    if (entry && entry.resetAt > now && entry.count >= max) {
      const seconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(seconds));
      return next(new AppError(message(Math.ceil(seconds / 60)), 429));
    }

    if (!onlyFailures) {
      bump(k);
    } else {
      // Đợi phản hồi xong mới biết thành công hay thất bại.
      res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode !== 429) bump(k);
        else if (res.statusCode < 400 && resetOnSuccess) hits.delete(k);
      });
    }
    return next();
  };

  middleware.reset = () => hits.clear(); // dùng khi kiểm thử
  return middleware;
}

const ipOf = (req) => req.ip || req.socket?.remoteAddress || 'unknown';
const emailOf = (req) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

const MINUTES = 15;

// Đăng nhập: sai 5 lần liên tiếp với cùng email từ cùng máy -> khoá 15 phút. Đăng nhập đúng thì xoá bộ đếm.
const loginLimiter = createLimiter({
  windowMs: MINUTES * 60 * 1000,
  max: 5,
  onlyFailures: true,
  key: (req) => `login:${ipOf(req)}:${emailOf(req)}`,
  message: (m) => `Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau ${m} phút hoặc dùng "Quên mật khẩu?"`,
});

// Thêm một lớp theo IP (đổi nhiều email để dò): tối đa 30 lần sai / 15 phút trên một máy.
const loginIpLimiter = createLimiter({
  windowMs: MINUTES * 60 * 1000,
  max: 30,
  onlyFailures: true,
  resetOnSuccess: false, // đăng nhập đúng một tài khoản không xoá được số lần sai của các email khác
  key: (req) => `login-ip:${ipOf(req)}`,
  message: (m) => `Có quá nhiều lần đăng nhập sai từ máy này. Vui lòng thử lại sau ${m} phút`,
});

// Quên mật khẩu: tối đa 10 lần xin mã / 15 phút trên một máy (mỗi tài khoản đã có giới hạn 60 giây riêng).
const forgotPasswordLimiter = createLimiter({
  windowMs: MINUTES * 60 * 1000,
  max: 10,
  key: (req) => `forgot:${ipOf(req)}`,
  message: (m) => `Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ${m} phút`,
});

// Đặt lại mật khẩu: tối đa 20 lần thử sai / 15 phút trên một máy (mỗi mã đã bị huỷ sau 5 lần sai).
const resetPasswordLimiter = createLimiter({
  windowMs: MINUTES * 60 * 1000,
  max: 20,
  onlyFailures: true,
  key: (req) => `reset:${ipOf(req)}`,
  message: (m) => `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${m} phút`,
});

module.exports = {
  createLimiter,
  loginLimiter,
  loginIpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
