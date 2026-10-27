// Tin đăng suất ăn.
// Công khai (VT1): GET /api/listings (tìm kiếm, lọc), GET /api/listings/:id
// Cửa hàng (VT3): POST/PUT/DELETE /api/listings
//   - Phải đăng nhập bằng tài khoản 'store' có cửa hàng ĐÃ DUYỆT (docs/api.md mục 3.6, 5.6)
//   - Chỉ CHỦ TIN mới sửa/xoá được tin (mục 5.5)
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isIdParam, toPositiveInt } = require('../utils/parse');
const { formatListing } = require('../utils/formatListing');
const { authenticate, authorize } = require('../middlewares/auth');
const requireApprovedStore = require('../middlewares/requireApprovedStore');
const { getListings, getListingById, SELECT_LISTING } = require('../controllers/listings.controller');
const { isToday } = require('../utils/timeRules');

// Quyền cho 3 API ghi dữ liệu: đăng nhập -> vai trò store -> cửa hàng đã duyệt.
const storeOnly = [authenticate, authorize('store'), requireApprovedStore];

const NOT_FOUND_MESSAGE = 'Tin đăng không tồn tại hoặc đã bị xoá';

// Chuỗi ngày giờ phải có cả ngày và giờ ("2026-10-24T20:00:00+07:00" hoặc "2026-10-24 20:00:00").
// Chuỗi không kèm múi giờ được hiểu là giờ Việt Nam (server đã đặt TZ = Asia/Ho_Chi_Minh).
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function parseDateTime(value) {
  if (typeof value !== 'string' || !DATETIME_REGEX.test(value.trim())) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Kiểm tra dữ liệu gửi lên khi TẠO (current = null) hoặc SỬA (current = dòng listings hiện tại).
 * - Tạo: các trường bắt buộc phải có.
 * - Sửa: chỉ kiểm tra những trường được gửi, trường không gửi giữ nguyên (docs/api.md mục 3.6).
 * Trả về object { tên_cột: giá_trị_mới } đã chuẩn hoá. Sai thì ném AppError 400 kèm errors[].
 */
function validateListingBody(body, current = null) {
  const errors = [];
  const values = {};
  const isUpdate = current !== null;
  const has = (key) => body[key] !== undefined;
  const check = (key) => !isUpdate || has(key); // tạo: luôn kiểm tra; sửa: chỉ khi có gửi
  const fail = (field, message) => errors.push({ field, message });

  // Tiêu đề: 3 đến 150 ký tự
  if (check('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 3 || title.length > 150) fail('title', 'Tiêu đề phải từ 3 đến 150 ký tự');
    else values.title = title;
  }

  // Mô tả: tối đa 2000 ký tự (gửi null hoặc rỗng = xoá mô tả)
  if (has('description')) {
    if (body.description === null || body.description === '') {
      values.description = null;
    } else if (typeof body.description !== 'string' || body.description.length > 2000) {
      fail('description', 'Mô tả không được vượt quá 2000 ký tự');
    } else {
      values.description = body.description.trim() || null;
    }
  }

  // Ảnh: đường dẫn nhận từ POST /uploads/image (gửi null hoặc rỗng = bỏ ảnh)
  if (has('image_url')) {
    if (body.image_url === null || body.image_url === '') {
      values.image_url = null;
    } else if (typeof body.image_url !== 'string' || body.image_url.length > 255) {
      fail('image_url', 'Đường dẫn ảnh không hợp lệ');
    } else {
      values.image_url = body.image_url.trim();
    }
  }

  // Loại món: để trống được; nếu gửi thì phải là số nguyên (sự tồn tại kiểm tra sau bằng database)
  if (has('category_id')) {
    if (body.category_id === null || body.category_id === '') {
      values.category_id = null;
    } else {
      const categoryId = toPositiveInt(body.category_id);
      if (categoryId === null) fail('category_id', 'Loại món không hợp lệ');
      else values.category_id = categoryId;
    }
  }

  // Giá gốc, giá bán: số nguyên từ 1.000 đồng; giá bán <= giá gốc
  let originalPrice = isUpdate ? current.original_price : null;
  let salePrice = isUpdate ? current.sale_price : null;
  if (check('original_price')) {
    const price = toPositiveInt(body.original_price);
    if (price === null || price < 1000) fail('original_price', 'Giá gốc phải là số nguyên từ 1.000 đồng trở lên');
    else { values.original_price = price; originalPrice = price; }
  }
  if (check('sale_price')) {
    const price = toPositiveInt(body.sale_price);
    if (price === null || price < 1000) fail('sale_price', 'Giá bán phải là số nguyên từ 1.000 đồng trở lên');
    else { values.sale_price = price; salePrice = price; }
  }
  if (originalPrice !== null && salePrice !== null && salePrice > originalPrice) {
    fail('sale_price', 'Giá bán phải nhỏ hơn hoặc bằng giá gốc');
  }

  // Số suất: 1 đến 999
  if (check('quantity')) {
    const quantity = toPositiveInt(body.quantity);
    if (quantity === null || quantity > 999) fail('quantity', 'Số lượng suất phải từ 1 đến 999');
    else values.quantity = quantity;
  }

  // Giờ nhận hàng: giờ kết thúc phải sau giờ bắt đầu, và (khi gửi giờ kết thúc) phải sau thời điểm hiện tại
  let pickupStart = isUpdate ? new Date(current.pickup_start) : null;
  let pickupEnd = isUpdate ? new Date(current.pickup_end) : null;
  if (check('pickup_start')) {
    const date = parseDateTime(body.pickup_start);
    if (!date) fail('pickup_start', 'Giờ bắt đầu nhận không đúng định dạng (cần ISO 8601)');
    else { values.pickup_start = date; pickupStart = date; }
  }
  if (check('pickup_end')) {
    const date = parseDateTime(body.pickup_end);
    if (!date) fail('pickup_end', 'Giờ kết thúc nhận không đúng định dạng (cần ISO 8601)');
    else if (date <= new Date()) fail('pickup_end', 'Giờ kết thúc nhận phải sau thời điểm hiện tại');
    else { values.pickup_end = date; pickupEnd = date; }
  }
  if (pickupStart && pickupEnd && pickupEnd <= pickupStart) {
    fail('pickup_end', 'Giờ kết thúc nhận phải sau giờ bắt đầu');
  }
  // Chỉ đăng suất dư CUỐI NGÀY: cả giờ bắt đầu và giờ kết thúc phải nằm trong ngày hôm nay.
  // (Khi sửa tin mà không đụng đến giờ nhận thì không kiểm tra, tin cũ vẫn sửa giá, số suất... được.)
  if (check('pickup_start') || check('pickup_end')) {
    if (pickupStart && !isToday(pickupStart)) {
      fail('pickup_start', 'Chỉ được đăng suất nhận hàng trong ngày hôm nay (giờ bắt đầu phải là hôm nay)');
    }
    if (pickupEnd && !isToday(pickupEnd)) {
      fail('pickup_end', 'Chỉ được đăng suất nhận hàng trong ngày hôm nay (giờ kết thúc phải trước 24:00 hôm nay)');
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.length === 1 ? errors[0].message : 'Dữ liệu không hợp lệ', 400, errors);
  }
  return values;
}

// Loại món gửi lên phải có thật trong bảng categories (trước đây gửi sai thì bị bỏ qua âm thầm).
async function assertCategoryExists(db, categoryId) {
  if (categoryId === undefined || categoryId === null) return;
  const [rows] = await db.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (rows.length === 0) {
    throw new AppError('Loại món không tồn tại', 400, [{ field: 'category_id', message: 'Loại món không tồn tại' }]);
  }
}

// Đọc lại tin kèm cửa hàng, loại món rồi chuẩn hoá thành đối tượng Listing (docs/api.md mục 4).
async function loadListing(db, listingId) {
  const [rows] = await db.query(`${SELECT_LISTING} WHERE l.id = ?`, [listingId]);
  return formatListing(rows[0]);
}

// Chạy fn(conn) trong một transaction; lỗi thì ROLLBACK rồi ném tiếp.
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch (rollbackErr) { /* bỏ qua, ném lỗi gốc */ }
    throw err;
  } finally {
    conn.release();
  }
}

// ==============================================================
// 1. POST /api/listings - Tạo tin đăng mới (VT3)
// ==============================================================
router.post('/', storeOnly, asyncHandler(async (req, res) => {
  const values = validateListingBody(req.body || {});
  await assertCategoryExists(pool, values.category_id);

  // Server tự đặt remaining = quantity và status = 'active'
  const [result] = await pool.query(
    `INSERT INTO listings
      (store_id, category_id, title, description, image_url, original_price, sale_price,
       quantity, remaining, pickup_start, pickup_end, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      req.store.id,
      values.category_id ?? null,
      values.title,
      values.description ?? null,
      values.image_url ?? null,
      values.original_price,
      values.sale_price,
      values.quantity, // cột quantity
      values.quantity, // cột remaining (bằng quantity lúc mới tạo)
      values.pickup_start,
      values.pickup_end,
    ]
  );

  res.status(201).json({ success: true, data: await loadListing(pool, result.insertId) });
}));

// ==============================================================
// 2. PUT /api/listings/:id - Cập nhật tin đăng (VT3 - Chủ tin)
// ==============================================================
router.put('/:id', storeOnly, asyncHandler(async (req, res) => {
  if (!isIdParam(req.params.id)) throw new AppError(NOT_FOUND_MESSAGE, 404);
  const listingId = Number(req.params.id);

  // Khoá dòng tin (FOR UPDATE) trong suốt lúc sửa: nếu có người đang đặt chỗ cùng lúc thì
  // hai bên chờ nhau, nên remaining không bị ghi đè sai (trước đây có thể bán lố).
  await withTransaction(async (conn) => {
    const [rows] = await conn.query(
      "SELECT * FROM listings WHERE id = ? AND status <> 'deleted' FOR UPDATE",
      [listingId]
    );
    const current = rows[0];
    if (!current) throw new AppError(NOT_FOUND_MESSAGE, 404);
    if (current.store_id !== req.store.id) {
      throw new AppError('Bạn không có quyền sửa tin đăng của cửa hàng khác', 403);
    }

    const values = validateListingBody(req.body || {}, current);
    await assertCategoryExists(conn, values.category_id);

    // Đổi số lượng: booked = quantity_cũ - remaining_cũ; remaining_mới = quantity_mới - booked
    if (values.quantity !== undefined) {
      const booked = current.quantity - current.remaining;
      const newRemaining = values.quantity - booked;
      if (newRemaining < 0) throw new AppError('Số lượng thấp hơn số suất đã được đặt', 409);
      values.remaining = newRemaining;
    }

    const columns = Object.keys(values);
    if (columns.length === 0) throw new AppError('Không có thông tin nào để cập nhật', 400);

    // Tên cột do mình viết ở trên (không lấy từ người dùng), giá trị đi qua dấu ?.
    const setSql = columns.map((column) => `${column} = ?`).join(', ');
    await conn.query(`UPDATE listings SET ${setSql} WHERE id = ?`, [...Object.values(values), listingId]);
  });

  res.json({ success: true, data: await loadListing(pool, listingId) });
}));

// ==============================================================
// 3. DELETE /api/listings/:id - Xoá mềm tin đăng (VT3 - Chủ tin)
// ==============================================================
router.delete('/:id', storeOnly, asyncHandler(async (req, res) => {
  if (!isIdParam(req.params.id)) throw new AppError(NOT_FOUND_MESSAGE, 404);
  const listingId = Number(req.params.id);

  // Khoá dòng tin rồi mới đếm đơn pending: người mua không đặt chen vào được giữa lúc kiểm tra và lúc xoá.
  await withTransaction(async (conn) => {
    const [rows] = await conn.query(
      "SELECT id, store_id FROM listings WHERE id = ? AND status <> 'deleted' FOR UPDATE",
      [listingId]
    );
    if (rows.length === 0) throw new AppError(NOT_FOUND_MESSAGE, 404);
    if (rows[0].store_id !== req.store.id) {
      throw new AppError('Bạn không có quyền xoá tin đăng của cửa hàng khác', 403);
    }

    const [pending] = await conn.query(
      "SELECT COUNT(*) AS count FROM orders WHERE listing_id = ? AND status = 'pending'",
      [listingId]
    );
    if (pending[0].count > 0) {
      throw new AppError(`Còn ${pending[0].count} đơn đang chờ nhận, hãy xử lý trước khi xoá`, 409);
    }

    // Xoá mềm: đổi trạng thái, không xoá dòng (đơn cũ vẫn tham chiếu tới tin)
    await conn.query("UPDATE listings SET status = 'deleted' WHERE id = ?", [listingId]);
  });

  res.json({ success: true, message: 'Đã xoá tin' });
}));

// ==============================================================
// 4. API CÔNG KHAI (VT1 giữ chỗ)
// ==============================================================
// QUY TẮC: đường dẫn cố định phải khai báo TRƯỚC '/:id'
router.get('/', getListings);
router.get('/:id', getListingById);

module.exports = router;
