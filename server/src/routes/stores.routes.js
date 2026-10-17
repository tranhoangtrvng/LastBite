// Cửa hàng (VT3).
// POST /api/stores           đăng ký cửa hàng (trạng thái pending)
// GET  /api/stores/me        thông tin cửa hàng của tôi
// GET  /api/stores/me/listings danh sách món ăn của quán (kèm booked = quantity - remaining)
// GET  /api/stores/me/stats  dashboard thống kê (P1)
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: Xác định cửa hàng hiện tại của người dùng.
 * Tương thích với auth của VT1 (khi có req.user);
 * ở chế độ phát triển sẽ lấy quán đầu tiên trong DB để test.
 */
async function resolveCurrentStore(req) {
  const userId = req.user ? req.user.id : 1;

  const [stores] = await pool.query(
    'SELECT * FROM stores WHERE owner_id = ? LIMIT 1',
    [userId]
  );

  if (stores.length === 0) {
    const [fallback] = await pool.query('SELECT * FROM stores LIMIT 1');
    return fallback.length > 0 ? fallback[0] : null;
  }

  return stores[0];
}

// ==============================================================
// 1. GET /api/stores/me/listings - Danh sách món ăn của quán (VT3 - Dòng 4)
// ==============================================================
router.get('/me/listings', asyncHandler(async (req, res, next) => {
  const store = await resolveCurrentStore(req);
  if (!store) {
    return next(new AppError('Bạn chưa đăng ký cửa hàng', 404));
  }

  const { status } = req.query;
  let sql = 'SELECT * FROM listings WHERE store_id = ?';
  const params = [store.id];

  // Hỗ trợ lọc theo trạng thái: ?status=active, ?status=all...
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  } else if (!status) {
    // Mặc định không lấy tin đã xóa mềm
    sql += " AND status != 'deleted'";
  }

  sql += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(sql, params);

  // Tính toán các trường hiển thị theo api.md
  const now = new Date();
  const data = rows.map((item) => {
    const booked = item.quantity - item.remaining;
    const discount_percent = Math.round((1 - item.sale_price / item.original_price) * 100);
    const is_available = item.remaining > 0 && new Date(item.pickup_end) > now && item.status === 'active';

    return {
      ...item,
      booked: Math.max(0, booked),
      discount_percent,
      is_available
    };
  });

  res.status(200).json({
    success: true,
    data
  });
}));

// ==============================================================
// 2. GET /api/stores/me/stats - Thống kê Dashboard cửa hàng (VT3 - Dòng 9 P1)
// ==============================================================
router.get('/me/stats', asyncHandler(async (req, res, next) => {
  const store = await resolveCurrentStore(req);
  if (!store) {
    return next(new AppError('Bạn chưa đăng ký cửa hàng', 404));
  }

  // 1. Thống kê tin đăng
  const [listingStats] = await pool.query(
    `SELECT 
       COUNT(*) AS total_listings,
       SUM(CASE WHEN status = 'active' AND remaining > 0 AND pickup_end > NOW() THEN 1 ELSE 0 END) AS active_listings
     FROM listings 
     WHERE store_id = ? AND status != 'deleted'`,
    [store.id]
  );

  // 2. Thống kê đơn hàng và doanh thu
  const [orderStats] = await pool.query(
    `SELECT 
       COUNT(*) AS total_orders,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END), 0) AS saved_portions,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) AS total_revenue
     FROM orders 
     WHERE store_id = ?`,
    [store.id]
  );

  res.status(200).json({
    success: true,
    data: {
      total_listings: Number(listingStats[0].total_listings) || 0,
      active_listings: Number(listingStats[0].active_listings) || 0,
      total_orders: Number(orderStats[0].total_orders) || 0,
      completed_orders: Number(orderStats[0].completed_orders) || 0,
      saved_portions: Number(orderStats[0].saved_portions) || 0,
      total_revenue: Number(orderStats[0].total_revenue) || 0
    }
  });
}));

// ==============================================================
// 3. GET /api/stores/me - Xem thông tin hồ sơ quán của tôi (VT3 - Dòng 6)
// ==============================================================
router.get('/me', asyncHandler(async (req, res, next) => {
  const store = await resolveCurrentStore(req);
  if (!store) {
    return next(new AppError('Bạn chưa đăng ký cửa hàng', 404));
  }

  res.status(200).json({
    success: true,
    data: store
  });
}));

// ==============================================================
// 4. POST /api/stores - Đăng ký mở cửa hàng mới (VT3 - Dòng 6)
// ==============================================================
router.post('/', asyncHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : 1;
  const { name, address, phone, description, image_url, latitude, longitude } = req.body;

  // Kiểm tra bắt buộc
  if (!name || name.trim().length < 3 || name.trim().length > 100) {
    return next(new AppError('Tên cửa hàng phải từ 3 đến 100 ký tự', 400));
  }

  if (!address || address.trim().length === 0) {
    return next(new AppError('Địa chỉ không được để trống', 400));
  }

  if (!phone || !/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
    return next(new AppError('Số điện thoại không đúng định dạng', 400));
  }

  // Kiểm tra tài khoản đã có quán chưa
  const [existing] = await pool.query('SELECT id FROM stores WHERE owner_id = ?', [userId]);
  if (existing.length > 0) {
    return next(new AppError('Tài khoản này đã đăng ký cửa hàng', 409));
  }

  // Tạo quán với trạng thái ban đầu là 'pending' (chờ duyệt)
  const [result] = await pool.query(
    `INSERT INTO stores (owner_id, name, address, phone, description, image_url, latitude, longitude, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId,
      name.trim(),
      address.trim(),
      phone.trim(),
      description ? description.trim() : null,
      image_url || null,
      latitude || null,
      longitude || null
    ]
  );

  // Cập nhật role của user thành store
  await pool.query("UPDATE users SET role = 'store' WHERE id = ?", [userId]);

  const [newStore] = await pool.query('SELECT * FROM stores WHERE id = ?', [result.insertId]);

  res.status(201).json({
    success: true,
    data: newStore[0]
  });
}));

module.exports = router;