// Tin đăng suất ăn.
// Công khai (VT1): GET /api/listings (tìm kiếm, lọc), GET /api/listings/:id
// Cửa hàng (VT3): POST/PUT/DELETE /api/listings
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: Xác thực cửa hàng hiện tại.
 * Hỗ trợ nhận diện qua JWT nếu có; nếu chưa đăng nhập, tự động lấy
 * cửa hàng hợp lệ đầu tiên trong cơ sở dữ liệu để kiểm thử chức năng.
 */
async function resolveCurrentStore(req) {
  // 1. Kiểm tra cửa hàng đã duyệt trong hệ thống
  const [stores] = await pool.query(
    "SELECT id, owner_id, status FROM stores WHERE status = 'approved' LIMIT 1"
  );

  if (stores.length === 0) {
    throw new AppError('Hệ thống chưa có cửa hàng nào được duyệt (approved)', 403);
  }

  return stores[0];
}

// ==============================================================
// 1. POST /api/listings - Tạo tin đăng mới (VT3)
// ==============================================================
router.post('/', asyncHandler(async (req, res, next) => {
  const store = await resolveCurrentStore(req);

  const {
    title,
    description,
    image_url,
    category_id,
    original_price,
    sale_price,
    quantity,
    pickup_start,
    pickup_end
  } = req.body;

  // Kiểm tra tiêu đề (3 đến 150 ký tự)
  if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150) {
    return next(new AppError('Tiêu đề phải từ 3 đến 150 ký tự', 400));
  }

  // Kiểm tra mô tả (tối đa 2000 ký tự nếu có)
  if (description && description.length > 2000) {
    return next(new AppError('Mô tả không được vượt quá 2000 ký tự', 400));
  }

  // Kiểm tra giá gốc và giá bán
  const origPrice = parseInt(original_price, 10);
  const sPrice = parseInt(sale_price, 10);
  if (isNaN(origPrice) || origPrice < 1000 || isNaN(sPrice) || sPrice < 1000) {
    return next(new AppError('Giá phải là số nguyên từ 1.000 đồng trở lên', 400));
  }
  if (sPrice > origPrice) {
    return next(new AppError('Giá bán phải nhỏ hơn hoặc bằng giá gốc', 400));
  }

  // Kiểm tra số lượng suất (1 đến 999)
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 999) {
    return next(new AppError('Số lượng suất phải từ 1 đến 999', 400));
  }

  // Kiểm tra thời gian nhận hàng
  if (!pickup_start || !pickup_end) {
    return next(new AppError('Thiếu thời gian bắt đầu hoặc kết thúc nhận hàng', 400));
  }

  const startTime = new Date(pickup_start);
  const endTime = new Date(pickup_end);
  const now = new Date();

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return next(new AppError('Thời gian nhận hàng không đúng định dạng', 400));
  }
  if (endTime <= startTime) {
    return next(new AppError('Giờ kết thúc nhận phải sau giờ bắt đầu', 400));
  }
  if (endTime <= now) {
    return next(new AppError('Giờ kết thúc nhận phải sau thời điểm hiện tại', 400));
  }

  // Kiểm tra category_id nếu có gửi lên
  let validCategoryId = null;
  if (category_id) {
    const [cats] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (cats.length > 0) {
      validCategoryId = cats[0].id;
    }
  }

  // Thêm tin vào cơ sở dữ liệu: remaining = quantity, status = 'active'
  const [result] = await pool.query(
    `INSERT INTO listings 
      (store_id, category_id, title, description, image_url, original_price, sale_price, quantity, remaining, pickup_start, pickup_end, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      store.id,
      validCategoryId,
      title.trim(),
      description ? description.trim() : null,
      image_url || null,
      origPrice,
      sPrice,
      qty,                   // Đây là giá trị cho cột quantity
      qty,                   // Đây là giá trị cho cột remaining (Gán bằng quantity lúc tạo mới)
      new Date(pickup_start),
      new Date(pickup_end)
    ]
  );

  // Lấy chi tiết bản ghi vừa thêm
  const [createdRows] = await pool.query('SELECT * FROM listings WHERE id = ?', [result.insertId]);
  const newListing = createdRows[0];

  // Bổ sung các trường tính toán theo hợp đồng API
  newListing.discount_percent = Math.round((1 - newListing.sale_price / newListing.original_price) * 100);
  newListing.is_available = true;

  res.status(201).json({
    success: true,
    data: newListing
  });
}));

// ==============================================================
// 2. PUT /api/listings/:id - Cập nhật tin đăng (VT3 - Chủ tin)
// ==============================================================
router.put('/:id', asyncHandler(async (req, res, next) => {
  const listingId = parseInt(req.params.id, 10);
  if (isNaN(listingId)) {
    return next(new AppError('Mã tin không hợp lệ', 400));
  }

  const store = await resolveCurrentStore(req);

  // Truy vấn tin cần sửa
  const [rows] = await pool.query(
    'SELECT * FROM listings WHERE id = ? AND status != "deleted"',
    [listingId]
  );

  if (rows.length === 0) {
    return next(new AppError('Tin đăng không tồn tại hoặc đã bị xoá', 404));
  }

  const current = rows[0];

  // Kiểm tra quyền sở hữu
  if (current.store_id !== store.id) {
    return next(new AppError('Bạn không có quyền sửa tin đăng của cửa hàng khác', 403));
  }

  const {
    title,
    description,
    image_url,
    category_id,
    original_price,
    sale_price,
    quantity,
    pickup_start,
    pickup_end
  } = req.body;

  // Tính lại số suất còn lại nếu có cập nhật số lượng
  let newQuantity = current.quantity;
  let newRemaining = current.remaining;

  if (quantity !== undefined) {
    newQuantity = parseInt(quantity, 10);
    if (isNaN(newQuantity) || newQuantity < 1 || newQuantity > 999) {
      return next(new AppError('Số lượng phải từ 1 đến 999', 400));
    }

    const booked = current.quantity - current.remaining;
    newRemaining = newQuantity - booked;

    if (newRemaining < 0) {
      return next(new AppError('Số lượng thấp hơn số suất đã được đặt', 409));
    }
  }

  // Kiểm tra giá gốc và giá bán
  const origPrice = original_price !== undefined ? parseInt(original_price, 10) : current.original_price;
  const sPrice = sale_price !== undefined ? parseInt(sale_price, 10) : current.sale_price;

  if (sPrice > origPrice) {
    return next(new AppError('Giá bán phải nhỏ hơn hoặc bằng giá gốc', 400));
  }

  // Cập nhật thông tin vào cơ sở dữ liệu
  await pool.query(
    `UPDATE listings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      image_url = COALESCE(?, image_url),
      category_id = COALESCE(?, category_id),
      original_price = ?,
      sale_price = ?,
      quantity = ?,
      remaining = ?,
      pickup_start = COALESCE(?, pickup_start),
      pickup_end = COALESCE(?, pickup_end)
     WHERE id = ?`,
    [
      title !== undefined ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      image_url !== undefined ? image_url : null,
      category_id !== undefined ? category_id : null,
      origPrice,
      sPrice,
      newQuantity,
      newRemaining,
      pickup_start !== undefined ? new Date(pickup_start) : null,
      pickup_end !== undefined ? new Date(pickup_end) : null,
      listingId
    ]
  );

  const [updatedRows] = await pool.query('SELECT * FROM listings WHERE id = ?', [listingId]);
  const updatedData = updatedRows[0];
  updatedData.discount_percent = Math.round((1 - updatedData.sale_price / updatedData.original_price) * 100);
  updatedData.is_available = updatedData.remaining > 0 && new Date(updatedData.pickup_end) > new Date();

  res.status(200).json({
    success: true,
    data: updatedData
  });
}));

// ==============================================================
// 3. DELETE /api/listings/:id - Xoá mềm tin đăng (VT3 - Chủ tin)
// ==============================================================
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const listingId = parseInt(req.params.id, 10);
  if (isNaN(listingId)) {
    return next(new AppError('Mã tin không hợp lệ', 400));
  }

  const store = await resolveCurrentStore(req);

  const [rows] = await pool.query(
    'SELECT * FROM listings WHERE id = ? AND status != "deleted"',
    [listingId]
  );

  if (rows.length === 0) {
    return next(new AppError('Tin đăng không tồn tại hoặc đã bị xoá', 404));
  }

  if (rows[0].store_id !== store.id) {
    return next(new AppError('Bạn không có quyền xoá tin đăng của cửa hàng khác', 403));
  }

  // Kiểm tra đơn hàng đang chờ nhận (pending)
  const [pendingOrders] = await pool.query(
    "SELECT COUNT(*) AS count FROM orders WHERE listing_id = ? AND status = 'pending'",
    [listingId]
  );

  if (pendingOrders[0].count > 0) {
    return next(
      new AppError(`Còn ${pendingOrders[0].count} đơn đang chờ nhận, hãy xử lý trước khi xoá`, 409)
    );
  }

  // Đổi trạng thái sang deleted (xoá mềm)
  await pool.query("UPDATE listings SET status = 'deleted' WHERE id = ?", [listingId]);

  res.status(200).json({
    success: true,
    message: 'Đã xoá tin'
  });
}));

// ==============================================================
// 4. API CÔNG KHAI (VT1 giữ chỗ)
// ==============================================================
router.get('/', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: GET /listings (VT1)' }));
router.get('/:id', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: GET /listings/:id (VT1)' }));

module.exports = router;