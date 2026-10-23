// Cửa hàng (VT3).
// POST /api/stores             đăng ký cửa hàng (trạng thái pending)
// GET  /api/stores/me          thông tin cửa hàng của tôi (chưa đăng ký -> data: null)
// PUT  /api/stores/me          sửa thông tin cửa hàng
// GET  /api/stores/me/listings danh sách món ăn của quán (kèm booked = quantity - remaining)
// GET  /api/stores/me/stats    dashboard thống kê (P1)
// Tất cả đều cần đăng nhập bằng tài khoản 'store' (docs/api.md mục 3.6, 3.7).
// Lưu ý: gắn quyền TỪNG route (không dùng router.use) để sau này thêm GET /stores, GET /stores/:id công khai (P1).
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { formatListing } = require('../utils/formatListing');
const { formatStore } = require('../utils/formatStore');
const { authenticate, authorize } = require('../middlewares/auth');
const requireStore = require('../middlewares/requireStore');
const { SELECT_LISTING } = require('../controllers/listings.controller');

const storeOnly = [authenticate, authorize('store')];
const PHONE_REGEX = /^\d{9,11}$/;

// Số thực hợp lệ từ number hoặc chuỗi số ("10.768"); sai thì trả null.
function toCoordinate(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Kiểm tra dữ liệu cửa hàng khi ĐĂNG KÝ (isUpdate = false) hoặc SỬA (isUpdate = true).
 * Đăng ký: name, address bắt buộc. Sửa: chỉ kiểm tra trường được gửi (docs/api.md mục 3.7).
 * Trả về { tên_cột: giá_trị }. Sai thì ném AppError 400 kèm errors[].
 */
function validateStoreBody(body, isUpdate) {
  const errors = [];
  const values = {};
  const has = (key) => body[key] !== undefined;
  const check = (key) => !isUpdate || has(key);
  const fail = (field, message) => errors.push({ field, message });

  if (check('name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 150) fail('name', 'Tên cửa hàng phải từ 2 đến 150 ký tự');
    else values.name = name;
  }

  if (check('address')) {
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    if (address.length < 5 || address.length > 255) fail('address', 'Địa chỉ phải từ 5 đến 255 ký tự');
    else values.address = address;
  }

  // Số điện thoại: không bắt buộc, 9 đến 11 chữ số (gửi null hoặc rỗng = xoá)
  if (has('phone')) {
    if (body.phone === null || body.phone === '') {
      values.phone = null;
    } else {
      const phone = String(body.phone).trim();
      if (!PHONE_REGEX.test(phone)) fail('phone', 'Số điện thoại phải gồm 9 đến 11 chữ số');
      else values.phone = phone;
    }
  }

  if (has('description')) {
    if (body.description === null || body.description === '') {
      values.description = null;
    } else if (typeof body.description !== 'string' || body.description.length > 2000) {
      fail('description', 'Mô tả không được vượt quá 2000 ký tự');
    } else {
      values.description = body.description.trim() || null;
    }
  }

  if (has('image_url')) {
    if (body.image_url === null || body.image_url === '') {
      values.image_url = null;
    } else if (typeof body.image_url !== 'string' || body.image_url.length > 255) {
      fail('image_url', 'Đường dẫn ảnh không hợp lệ');
    } else {
      values.image_url = body.image_url.trim();
    }
  }

  // Toạ độ: phải gửi CẢ HAI hoặc không gửi (cả hai null = xoá toạ độ)
  if (has('latitude') || has('longitude')) {
    const bothNull = (body.latitude === null || body.latitude === '') && (body.longitude === null || body.longitude === '');
    if (bothNull) {
      values.latitude = null;
      values.longitude = null;
    } else {
      const lat = toCoordinate(body.latitude);
      const lng = toCoordinate(body.longitude);
      if (lat === null || lng === null) fail('latitude', 'Phải gửi cả vĩ độ và kinh độ (số hợp lệ)');
      else if (lat < -90 || lat > 90) fail('latitude', 'Vĩ độ phải từ -90 đến 90');
      else if (lng < -180 || lng > 180) fail('longitude', 'Kinh độ phải từ -180 đến 180');
      else { values.latitude = lat; values.longitude = lng; }
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.length === 1 ? errors[0].message : 'Dữ liệu không hợp lệ', 400, errors);
  }
  return values;
}

// ==============================================================
// 1. GET /api/stores/me/listings - Danh sách món ăn của quán (VT3)
// ==============================================================
router.get('/me/listings', storeOnly, requireStore, asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && status !== '' && !['active', 'hidden', 'all'].includes(status)) {
    throw new AppError('status chỉ được là: active, hidden', 400);
  }

  // Gồm cả tin đã hết hạn, KHÔNG gồm tin đã xoá mềm. Bỏ trống status = lấy cả active và hidden.
  const where = ['l.store_id = ?', "l.status <> 'deleted'"];
  const params = [req.store.id];
  if (status === 'active' || status === 'hidden') {
    where.push('l.status = ?');
    params.push(status);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const { page, limit, offset } = parsePagination(req.query);

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM listings l ${whereSql}`, params);
  const [rows] = await pool.query(
    `${SELECT_LISTING} ${whereSql} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((row) => {
      const listing = formatListing(row);
      return { ...listing, booked: Math.max(0, listing.quantity - listing.remaining) };
    }),
    pagination: buildPagination(page, limit, total),
  });
}));

// ==============================================================
// 2. GET /api/stores/me/stats - Thống kê Dashboard cửa hàng (VT3, P1)
// ==============================================================
router.get('/me/stats', storeOnly, requireStore, asyncHandler(async (req, res) => {
  const storeId = req.store.id;

  // Tin đăng (không tính tin đã xoá mềm)
  const [[listingStats]] = await pool.query(
    `SELECT COUNT(*) AS total_listings,
            COALESCE(SUM(l.status = 'active' AND l.remaining > 0 AND l.pickup_end > NOW()), 0) AS active_now
     FROM listings l
     WHERE l.store_id = ? AND l.status <> 'deleted'`,
    [storeId]
  );

  // Đơn: bảng orders KHÔNG có store_id, phải JOIN qua listings. Trạng thái đã nhận là 'picked_up'.
  const [orderRows] = await pool.query(
    `SELECT o.status,
            COUNT(*) AS orders,
            COALESCE(SUM(o.quantity), 0) AS meals,
            COALESCE(SUM(o.total_price), 0) AS revenue
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     WHERE l.store_id = ?
     GROUP BY o.status`,
    [storeId]
  );
  const orders = { total: 0, pending: 0, picked_up: 0, cancelled: 0, no_show: 0 };
  let mealsSaved = 0;
  let revenue = 0;
  for (const row of orderRows) {
    orders[row.status] = Number(row.orders);
    orders.total += Number(row.orders);
    if (row.status === 'picked_up') {
      mealsSaved = Number(row.meals);
      revenue = Number(row.revenue);
    }
  }

  // 7 ngày gần nhất (tính theo ngày nhận hàng picked_up_at), chỉ liệt kê ngày có đơn
  const [weeklyRows] = await pool.query(
    `SELECT DATE_FORMAT(o.picked_up_at, '%Y-%m-%d') AS picked_day,
            SUM(o.quantity) AS meals,
            SUM(o.total_price) AS revenue
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     WHERE l.store_id = ? AND o.status = 'picked_up'
       AND o.picked_up_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY picked_day
     ORDER BY picked_day`,
    [storeId]
  );

  res.json({
    success: true,
    data: {
      total_listings: Number(listingStats.total_listings),
      active_now: Number(listingStats.active_now),
      orders,
      meals_saved: mealsSaved,
      revenue,
      weekly: weeklyRows.map((row) => ({
        date: row.picked_day,
        meals: Number(row.meals),
        revenue: Number(row.revenue),
      })),
    },
  });
}));

// ==============================================================
// 3. GET /api/stores/me - Xem thông tin hồ sơ quán của tôi (VT3)
// ==============================================================
router.get('/me', storeOnly, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stores WHERE owner_id = ?', [req.user.id]);
  // Chưa đăng ký thì vẫn trả 200 với data: null để frontend dễ rẽ nhánh (docs/api.md mục 3.7)
  res.json({ success: true, data: rows[0] ? formatStore(rows[0]) : null });
}));

// ==============================================================
// 4. PUT /api/stores/me - Sửa thông tin cửa hàng (VT3)
// ==============================================================
router.put('/me', storeOnly, requireStore, asyncHandler(async (req, res) => {
  if (req.store.status === 'locked') throw new AppError('Cửa hàng đang bị khoá, không thể chỉnh sửa', 403);

  // Chỉ nhận các trường cho phép; status, owner_id (nếu có gửi) bị bỏ qua.
  const values = validateStoreBody(req.body || {}, true);
  const columns = Object.keys(values);
  if (columns.length === 0) throw new AppError('Không có thông tin nào để cập nhật', 400);

  const setSql = columns.map((column) => `${column} = ?`).join(', ');
  await pool.query(`UPDATE stores SET ${setSql} WHERE id = ?`, [...Object.values(values), req.store.id]);

  const [rows] = await pool.query('SELECT * FROM stores WHERE id = ?', [req.store.id]);
  res.json({ success: true, message: 'Đã cập nhật cửa hàng', data: formatStore(rows[0]) });
}));

// ==============================================================
// 5. POST /api/stores - Đăng ký mở cửa hàng mới (VT3)
// ==============================================================
router.post('/', storeOnly, asyncHandler(async (req, res) => {
  const values = validateStoreBody(req.body || {}, false);

  const [existing] = await pool.query('SELECT id FROM stores WHERE owner_id = ?', [req.user.id]);
  if (existing.length > 0) throw new AppError('Bạn đã đăng ký cửa hàng', 409);

  // Trạng thái ban đầu luôn là 'pending' (chờ admin duyệt)
  let insertId;
  try {
    const [result] = await pool.query(
      `INSERT INTO stores (owner_id, name, address, phone, description, image_url, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.id,
        values.name,
        values.address,
        values.phone ?? null,
        values.description ?? null,
        values.image_url ?? null,
        values.latitude ?? null,
        values.longitude ?? null,
      ]
    );
    insertId = result.insertId;
  } catch (err) {
    // Bấm đăng ký hai lần cùng lúc: UNIQUE(owner_id) trong database chặn lần đến sau.
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Bạn đã đăng ký cửa hàng', 409);
    throw err;
  }

  const [rows] = await pool.query('SELECT * FROM stores WHERE id = ?', [insertId]);
  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công, vui lòng chờ admin duyệt',
    data: formatStore(rows[0]),
  });
}));

module.exports = router;
