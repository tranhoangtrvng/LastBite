// Đơn đặt chỗ, phía NGƯỜI MUA (docs/api.md mục 3.8). Đây là phần quan trọng nhất của dự án.
//   POST  /api/orders              đặt chỗ (transaction)
//   GET   /api/orders/my           lịch sử đơn của tôi
//   GET   /api/orders/:id          chi tiết một đơn
//   PATCH /api/orders/:id/cancel   huỷ đơn (transaction, trả suất lại)
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { toPositiveInt, isIdParam } = require('../utils/parse');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { generatePickupCode } = require('../utils/pickupCode');
const { ORDER_SELECT, ORDER_STATUSES, formatOrder } = require('../utils/formatOrder');
const { getBookingLeadMinutes, bookingOpensAt, formatClock } = require('../utils/timeRules');

const MAX_QUANTITY_PER_ORDER = 5;
const MAX_CODE_ATTEMPTS = 5;

// Chạy ROLLBACK nhưng không để lỗi của chính ROLLBACK che mất lỗi gốc.
async function safeRollback(conn) {
  try {
    await conn.rollback();
  } catch (e) {
    /* bỏ qua */
  }
}

// ---------------------------------------------------------------------
// POST /api/orders   { listing_id, quantity }
// ---------------------------------------------------------------------
const createOrder = asyncHandler(async (req, res) => {
  if (req.user.role !== 'buyer') throw new AppError('Chỉ người mua mới đặt chỗ được', 403);

  const body = req.body || {};
  const listingId = toPositiveInt(body.listing_id);
  const quantity = toPositiveInt(body.quantity);
  if (listingId === null) throw new AppError('listing_id không hợp lệ', 400);
  if (quantity === null || quantity > MAX_QUANTITY_PER_ORDER) {
    throw new AppError(`Số lượng từ 1 đến ${MAX_QUANTITY_PER_ORDER}`, 400);
  }

  // Transaction cần dùng CÙNG MỘT kết nối từ đầu đến cuối -> lấy riêng một kết nối từ pool.
  const leadMinutes = getBookingLeadMinutes(); // số phút cho phép đặt trước giờ nhận
  const conn = await pool.getConnection();
  let orderId = null;
  try {
    await conn.beginTransaction();

    // 1. Khoá dòng của tin (FOR UPDATE): người đặt khác phải chờ ta xong mới đọc/sửa được dòng này.
    const [listings] = await conn.query(
      `SELECT id, store_id, status, sale_price, remaining, pickup_start,
              (pickup_end > NOW()) AS before_end,
              (DATE_SUB(pickup_start, INTERVAL ? MINUTE) <= NOW()) AS booking_open
       FROM listings WHERE id = ? FOR UPDATE`,
      [leadMinutes, listingId]
    );
    const listing = listings[0];
    if (!listing || listing.status !== 'active') throw new AppError('Không tìm thấy suất ăn', 404);

    const [stores] = await conn.query('SELECT status FROM stores WHERE id = ?', [listing.store_id]);
    if (!stores[0] || stores[0].status !== 'approved') throw new AppError('Không tìm thấy suất ăn', 404);

    // 2. Các điều kiện đặt được (phân biệt rõ để báo đúng lý do)
    if (!listing.before_end) throw new AppError('Suất này đã hết giờ nhận', 409);
    if (!listing.booking_open) {
      throw new AppError(
        `Suất này chưa mở đặt chỗ, bạn đặt được từ ${formatClock(bookingOpensAt(listing.pickup_start))}`,
        409
      );
    }
    if (listing.remaining < quantity) {
      throw new AppError(
        listing.remaining === 0 ? 'Suất này đã hết' : `Không đủ suất, chỉ còn ${listing.remaining} suất`,
        409
      );
    }

    // 3. Trừ suất. Điều kiện nằm ngay trong câu UPDATE = lớp bảo vệ thứ hai chống bán lố.
    const [updated] = await conn.query(
      `UPDATE listings SET remaining = remaining - ?
       WHERE id = ? AND status = 'active' AND pickup_end > NOW()
         AND DATE_SUB(pickup_start, INTERVAL ? MINUTE) <= NOW() AND remaining >= ?`,
      [quantity, listingId, leadMinutes, quantity]
    );
    if (updated.affectedRows === 0) throw new AppError('Không đủ suất, vui lòng thử lại', 409);

    // 4. Tạo đơn kèm mã nhận hàng. Trùng mã (ER_DUP_ENTRY) thì sinh mã khác và thử lại.
    //    Trong InnoDB, một INSERT lỗi chỉ hỏng riêng câu đó, transaction vẫn dùng tiếp được.
    const unitPrice = Number(listing.sale_price);
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && orderId === null; attempt += 1) {
      try {
        const [inserted] = await conn.query(
          `INSERT INTO orders (buyer_id, listing_id, quantity, unit_price, total_price, pickup_code)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user.id, listingId, quantity, unitPrice, unitPrice * quantity, generatePickupCode()]
        );
        orderId = inserted.insertId;
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    }
    if (orderId === null) throw new AppError('Không tạo được mã nhận hàng, vui lòng thử lại', 500);

    // >>> [CHỜ QUYẾT ĐỊNH] Thông báo (P2): nếu muốn gửi thông báo "có đơn mới" cho chủ cửa hàng,
    // >>> thêm một câu INSERT INTO notifications ... ngay tại đây (trước COMMIT). Hiện CHƯA làm.

    // 5. Mọi thứ thành công -> lưu.
    await conn.commit();
  } catch (err) {
    await safeRollback(conn); // hoàn tác: suất không bị trừ, không có đơn nào được tạo
    throw err;
  } finally {
    conn.release(); // luôn trả kết nối về pool, dù thành công hay lỗi
  }

  const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [orderId]);
  res.status(201).json({ success: true, message: 'Đặt chỗ thành công', data: formatOrder(rows[0]) });
});

// ---------------------------------------------------------------------
// GET /api/orders/my?status=&page=&limit=
// ---------------------------------------------------------------------
const getMyOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && status !== '' && !ORDER_STATUSES.includes(status)) {
    throw new AppError(`status chỉ được là: ${ORDER_STATUSES.join(', ')}`, 400);
  }

  const where = ['o.buyer_id = ?'];
  const params = [req.user.id];
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const { page, limit, offset } = parsePagination(req.query);

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  const [rows] = await pool.query(
    `${ORDER_SELECT} ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map((row) => formatOrder(row)),
    pagination: buildPagination(page, limit, total),
  });
});

// ---------------------------------------------------------------------
// GET /api/orders/:id   buyer (chủ đơn) | store (chủ cửa hàng của đơn) | admin
// ---------------------------------------------------------------------
const getOrderById = asyncHandler(async (req, res) => {
  if (!isIdParam(req.params.id)) throw new AppError('Không tìm thấy đơn', 404);

  const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [Number(req.params.id)]);
  const row = rows[0];
  if (!row) throw new AppError('Không tìm thấy đơn', 404);

  // Kiểm tra ĐÚNG CHỦ (docs/api.md mục 5.5): có vai trò đúng vẫn chưa đủ.
  const { role, id: userId } = req.user;
  if (role === 'buyer') {
    if (row.buyer_id !== userId) throw new AppError('Bạn không có quyền xem đơn này', 403);
  } else if (role === 'store') {
    const [stores] = await pool.query('SELECT id FROM stores WHERE owner_id = ?', [userId]);
    if (!stores[0] || stores[0].id !== row.store_id) {
      throw new AppError('Bạn không có quyền xem đơn này', 403);
    }
  } // admin: được xem mọi đơn

  res.json({ success: true, data: formatOrder(row, role !== 'buyer') });
});

// ---------------------------------------------------------------------
// PATCH /api/orders/:id/cancel
// ---------------------------------------------------------------------
const cancelOrder = asyncHandler(async (req, res) => {
  if (!isIdParam(req.params.id)) throw new AppError('Không tìm thấy đơn', 404);
  const orderId = Number(req.params.id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Khoá dòng đơn để hai lần bấm "huỷ" cùng lúc không cùng được xử lý.
    const [orders] = await conn.query(
      'SELECT id, buyer_id, listing_id, quantity, status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    const order = orders[0];
    if (!order) throw new AppError('Không tìm thấy đơn', 404);
    if (order.buyer_id !== req.user.id) throw new AppError('Bạn không có quyền huỷ đơn này', 403);

    const [listings] = await conn.query('SELECT (pickup_end > NOW()) AS before_end FROM listings WHERE id = ?', [
      order.listing_id,
    ]);
    // Chỉ huỷ được khi đang "chờ nhận" và CHƯA qua giờ nhận.
    if (order.status !== 'pending' || !listings[0] || !listings[0].before_end) {
      throw new AppError('Đơn không thể huỷ', 409);
    }

    // Điều kiện status = 'pending' trong chính câu UPDATE: chặn huỷ hai lần làm cộng suất hai lần.
    const [updated] = await conn.query(
      `UPDATE orders SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = ? AND buyer_id = ? AND status = 'pending'`,
      [orderId, req.user.id]
    );
    if (updated.affectedRows !== 1) throw new AppError('Đơn không thể huỷ', 409);

    // Trả suất lại cho tin.
    await conn.query('UPDATE listings SET remaining = remaining + ? WHERE id = ?', [
      order.quantity,
      order.listing_id,
    ]);

    await conn.commit();
  } catch (err) {
    await safeRollback(conn);
    throw err;
  } finally {
    conn.release();
  }

  res.json({ success: true, message: 'Đã huỷ đơn' });
});

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };
