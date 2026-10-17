// Hai middleware dùng chung cho cả nhóm:
//   authenticate : "bạn là ai?"  -> kiểm tra token, gán req.user
//   authorize    : "bạn được làm gì?" -> kiểm tra vai trò
//
// Cách dùng ở route của mình:
//   const { authenticate, authorize } = require('../middlewares/auth');
//   router.post('/', authenticate, authorize('store'), createListing);
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

const authenticate = asyncHandler(async (req, res, next) => {
  // 1. Header phải có dạng: Authorization: Bearer <token>
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Vui lòng đăng nhập', 401);
  }

  // 2. Kiểm tra chữ ký và hạn của token
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof AppError) throw err; // lỗi cấu hình JWT_SECRET
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    throw new AppError('Token không hợp lệ', 401);
  }

  // 3. Tra lại database để biết tài khoản còn tồn tại và có bị khoá không
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.id]);
  const user = rows[0];
  if (!user) throw new AppError('Tài khoản không tồn tại', 401);
  if (user.status === 'locked') throw new AppError('Tài khoản đã bị khoá', 403);

  // 4. Gán cho các bước sau dùng (không có password_hash)
  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  next();
});

// Phải đứng SAU authenticate.  authorize('store')  hoặc  authorize('buyer', 'admin')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Vui lòng đăng nhập', 401));
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
  }
  next();
};

module.exports = { authenticate, authorize };