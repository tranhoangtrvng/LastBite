// Dùng cho các API "của cửa hàng tôi": tìm cửa hàng của người đang đăng nhập, gán vào req.store.
// Phải đứng SAU authenticate và authorize('store').
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const [rows] = await pool.query('SELECT id, status FROM stores WHERE owner_id = ?', [req.user.id]);
  if (!rows[0]) throw new AppError('Bạn chưa đăng ký cửa hàng', 403);
  req.store = rows[0]; // { id, status }
  next();
});
