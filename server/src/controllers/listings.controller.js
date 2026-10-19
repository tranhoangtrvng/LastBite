// Tin đăng phía người mua (công khai): GET /api/listings và GET /api/listings/:id
// Tài liệu: docs/api.md mục 3.5
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { formatListing } = require('../utils/formatListing');

// Phần SELECT + JOIN dùng chung cho cả danh sách và chi tiết.
const SELECT_LISTING = `
  SELECT
    l.id, l.store_id, l.category_id, l.title, l.description, l.image_url,
    l.original_price, l.sale_price, l.quantity, l.remaining,
    l.pickup_start, l.pickup_end, l.status, l.created_at,
    s.name AS store_name, s.address AS store_address, s.image_url AS store_image_url,
    s.latitude AS store_latitude, s.longitude AS store_longitude,
    c.name AS category_name
  FROM listings l
  JOIN stores s ON s.id = l.store_id
  LEFT JOIN categories c ON c.id = l.category_id`;

// Điều kiện mặc định của danh sách công khai (docs/api.md mục 3.5).
const BASE_WHERE = [
  "l.status = 'active'",
  "s.status = 'approved'",
  'l.pickup_end > NOW()',
  'l.remaining > 0',
];

const SORTS = {
  pickup_asc: 'l.pickup_end ASC, l.id ASC',
  price_asc: 'l.sale_price ASC, l.pickup_end ASC, l.id ASC',
  price_desc: 'l.sale_price DESC, l.pickup_end ASC, l.id ASC',
  newest: 'l.created_at DESC, l.id DESC',
};

// Số nguyên dương tuỳ chọn: không gửi -> null; gửi sai -> lỗi 400.
function optionalInt(value, name) {
  if (value === undefined || value === '') return null;
  if (!/^\d+$/.test(String(value))) throw new AppError(`Tham số ${name} không hợp lệ`, 400);
  return Number(value);
}

// Ngày giờ ISO 8601 tuỳ chọn -> Date.
function optionalDate(value, name) {
  if (value === undefined || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new AppError(`Tham số ${name} không hợp lệ (cần ISO 8601)`, 400);
  return d;
}

// page, limit: giá trị sai thì dùng mặc định, vượt giới hạn thì cắt về giới hạn (không báo lỗi).
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 12;
  if (limit > 50) limit = 50;
  return { page, limit, offset: (page - 1) * limit };
}

const getListings = asyncHandler(async (req, res) => {
  const { q, sort } = req.query;
  const categoryId = optionalInt(req.query.category_id, 'category_id');
  const storeId = optionalInt(req.query.store_id, 'store_id');
  const minPrice = optionalInt(req.query.min_price, 'min_price');
  const maxPrice = optionalInt(req.query.max_price, 'max_price');
  const pickupFrom = optionalDate(req.query.pickup_from, 'pickup_from');
  const pickupTo = optionalDate(req.query.pickup_to, 'pickup_to');

  const where = [...BASE_WHERE];
  const params = [];

  if (typeof q === 'string' && q.trim()) {
    // Thoát ký tự đặc biệt của LIKE để "50%" được hiểu là chữ, không phải ký tự đại diện.
    const like = `%${q.trim().replace(/[\\%_]/g, '\\$&')}%`;
    where.push('(l.title LIKE ? OR s.name LIKE ?)');
    params.push(like, like);
  }
  if (categoryId !== null) { where.push('l.category_id = ?'); params.push(categoryId); }
  if (storeId !== null) { where.push('l.store_id = ?'); params.push(storeId); }
  if (minPrice !== null) { where.push('l.sale_price >= ?'); params.push(minPrice); }
  if (maxPrice !== null) { where.push('l.sale_price <= ?'); params.push(maxPrice); }
  // Khung giờ nhận GIAO với khoảng [pickup_from, pickup_to].
  if (pickupFrom) { where.push('l.pickup_end > ?'); params.push(pickupFrom); }
  if (pickupTo) { where.push('l.pickup_start < ?'); params.push(pickupTo); }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderSql = SORTS[sort] || SORTS.pickup_asc;
  const { page, limit, offset } = parsePagination(req.query);

  // Lưu ý: dùng pool.query (không phải execute) vì LIMIT ? không chạy được với execute trên MySQL 8.
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM listings l JOIN stores s ON s.id = l.store_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `${SELECT_LISTING} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map(formatListing),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
});

const getListingById = asyncHandler(async (req, res) => {
  const notFound = () => new AppError('Không tìm thấy suất ăn', 404);
  if (!/^\d+$/.test(req.params.id)) throw notFound();

  // Chi tiết: KHÔNG lọc hết hạn/hết suất (chỉ trả is_available=false), nhưng ẩn tin hidden/deleted
  // và tin của cửa hàng chưa được duyệt.
  const [rows] = await pool.query(
    `${SELECT_LISTING} WHERE l.id = ? AND l.status = 'active' AND s.status = 'approved'`,
    [Number(req.params.id)]
  );
  if (rows.length === 0) throw notFound();

  res.json({ success: true, data: formatListing(rows[0]) });
});

module.exports = { getListings, getListingById };
