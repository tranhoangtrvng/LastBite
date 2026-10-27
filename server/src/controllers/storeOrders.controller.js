// Đơn đặt chỗ, phía CỬA HÀNG (docs/api.md mục 3.9). Mọi API ở đây nằm dưới /api/stores/me/orders
// và chỉ thấy đơn của tin thuộc CỬA HÀNG CỦA MÌNH (req.store do middleware requireStore gán).
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { toPositiveInt, isIdParam } = require('../utils/parse');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { normalizeCode } = require('../utils/pickupCode');
const { ORDER_SELECT, ORDER_STATUSES, formatOrder } = require('../utils/formatOrder');

const CODE_FORMAT = /^[A-Z0-9]{6}$/;
const WRONG_CODE_MESSAGE = 'Mã nhận hàng không đúng hoặc không thuộc cửa hàng của bạn';

// Lấy một đơn (kèm thông tin khách) với điều kiện đơn thuộc cửa hàng này.
async function findStoreOrder(storeId, where, value) {
  const [rows] = await pool.query(`${ORDER_SELECT} WHERE l.store_id = ? AND ${where}`, [storeId, value]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// GET /api/stores/me/orders?status=&listing_id=&page=&limit=
// ---------------------------------------------------------------------
const listStoreOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && status !== '' && !ORDER_STATUSES.includes(status)) {
    throw new AppError(`status chỉ được là: ${ORDER_STATUSES.join(', ')}`, 400);
  }
  let listingId = null;
  if (req.query.listing_id !== undefined && req.query.listing_id !== '') {
    listingId = toPositiveInt(req.query.listing_id);
    if (listingId === null) throw new AppError('listing_id không hợp lệ', 400);
  }

  const where = ['l.store_id = ?'];
  const params = [req.store.id];
  if (status) { where.push('o.status = ?'); params.push(status); }
  if (listingId !== null) { where.push('o.listing_id = ?'); params.push(listingId); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const { page, limit, offset } = parsePagination(req.query);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders o JOIN listings l ON l.id = o.listing_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `${ORDER_SELECT} ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((row) => formatOrder(row, true)),
    pagination: buildPagination(page, limit, total),
  });
});

// ---------------------------------------------------------------------
// GET /api/stores/me/orders/by-code/:code   (tra cứu trước khi xác nhận)
// ---------------------------------------------------------------------
const getOrderByCode = asyncHandler(async (req, res) => {
  const code = normalizeCode(req.params.code);
  if (!CODE_FORMAT.test(code)) throw new AppError('Mã nhận hàng gồm 6 ký tự', 400);

  const row = await findStoreOrder(req.store.id, 'o.pickup_code = ?', code);
  // Mã không tồn tại và mã của cửa hàng khác dùng CHUNG một thông báo, để không lộ mã của người khác.
  if (!row) throw new AppError(WRONG_CODE_MESSAGE, 404);

  res.json({ success: true, data: formatOrder(row, true) });
});

// ---------------------------------------------------------------------
// POST /api/stores/me/orders/confirm   { pickup_code }
// ---------------------------------------------------------------------
const confirmOrder = asyncHandler(async (req, res) => {
  const code = normalizeCode((req.body || {}).pickup_code);
  if (!CODE_FORMAT.test(code)) throw new AppError('Mã nhận hàng gồm 6 ký tự', 400);

  const order = await findStoreOrder(req.store.id, 'o.pickup_code = ?', code);
  if (!order) throw new AppError(WRONG_CODE_MESSAGE, 404);

  if (order.status === 'picked_up') throw new AppError('Đơn này đã được nhận trước đó', 409);
  if (order.status === 'cancelled') throw new AppError('Đơn này đã bị huỷ', 409);
  if (order.status === 'no_show') throw new AppError('Đơn này đã được đánh dấu không đến', 409);
  // Quá giờ nhận thì không xác nhận được nữa (đơn sẽ được tự chuyển sang "không đến").
  if (new Date(order.pickup_end).getTime() <= Date.now()) {
    throw new AppError('Đã quá giờ nhận hàng, không thể xác nhận đơn này', 409);
  }

  // status = 'pending' và còn trong giờ nhận nằm ngay trong câu UPDATE: nếu hai máy cùng bấm xác nhận,
  // hoặc tác vụ tự động vừa đổi đơn sang "không đến", chỉ một bên thành công.
  const [updated] = await pool.query(
    `UPDATE orders o JOIN listings l ON l.id = o.listing_id
     SET o.status = 'picked_up', o.picked_up_at = NOW()
     WHERE o.id = ? AND o.status = 'pending' AND l.pickup_end > NOW()`,
    [order.id]
  );
  if (updated.affectedRows === 0) throw new AppError('Đơn này đã được xử lý trước đó', 409);

  const fresh = await findStoreOrder(req.store.id, 'o.id = ?', order.id);
  res.json({ success: true, message: 'Đã xác nhận khách nhận hàng', data: formatOrder(fresh, true) });
});

// ---------------------------------------------------------------------
// PATCH /api/stores/me/orders/:id/no-show   (khách không đến, CHỈ sau pickup_end, KHÔNG trả suất)
// ---------------------------------------------------------------------
const markNoShow = asyncHandler(async (req, res) => {
  if (!isIdParam(req.params.id)) throw new AppError('Không tìm thấy đơn', 404);
  const orderId = Number(req.params.id);

  const [rows] = await pool.query(
    `SELECT o.id, o.status, (l.pickup_end <= NOW()) AS ended
     FROM orders o JOIN listings l ON l.id = o.listing_id
     WHERE o.id = ? AND l.store_id = ?`,
    [orderId, req.store.id]
  );
  const order = rows[0];
  if (!order) throw new AppError('Không tìm thấy đơn', 404); // không có hoặc thuộc cửa hàng khác
  if (order.status !== 'pending') throw new AppError('Chỉ đơn đang chờ nhận mới đánh dấu không đến được', 409);
  if (!order.ended) throw new AppError('Chưa hết giờ nhận hàng', 409);

  const [updated] = await pool.query(
    `UPDATE orders o JOIN listings l ON l.id = o.listing_id
     SET o.status = 'no_show'
     WHERE o.id = ? AND o.status = 'pending' AND l.store_id = ? AND l.pickup_end <= NOW()`,
    [orderId, req.store.id]
  );
  if (updated.affectedRows === 0) throw new AppError('Đơn này đã được xử lý trước đó', 409);

  const fresh = await findStoreOrder(req.store.id, 'o.id = ?', orderId);
  res.json({ success: true, message: 'Đã đánh dấu khách không đến', data: formatOrder(fresh, true) });
});

module.exports = { listStoreOrders, getOrderByCode, confirmOrder, markNoShow };
