// VT4 - API quản trị. Đặc tả: docs/api.md, mục 3.13 (endpoint #39 đến #45).
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const STORE_STATUSES = ['pending', 'approved', 'locked'];
const STORE_SET_STATUSES = ['approved', 'locked']; // admin không được đặt lại 'pending'
const USER_ROLES = ['buyer', 'store', 'admin'];
const USER_STATUSES = ['active', 'locked'];
const LISTING_STATUSES = ['active', 'hidden', 'deleted'];

// ---------------------------------------------------------------------
// Hàm dùng chung
// ---------------------------------------------------------------------

// DATETIME (giờ Việt Nam) -> chuỗi ISO 8601 kèm +07:00 (docs/api.md, mục 1.5).
// Yêu cầu MySQL và Node.js cùng chạy giờ Việt Nam.
function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 7 * 3600 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, '+07:00');
}

// page mặc định 1, limit mặc định 12, tối đa 50; vượt giới hạn thì kéo về giới hạn.
function parsePaging(query) {
  let page = parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(limit)) limit = 12;
  limit = Math.min(Math.max(limit, 1), 50);
  return { page, limit, offset: (page - 1) * limit };
}

function paginate(page, limit, total) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) };
}

function cleanKeyword(q) {
  return typeof q === 'string' ? q.trim().slice(0, 100) : '';
}

function toNumberOrNull(v) {
  return v === null || v === undefined ? null : Number(v);
}

// Kiểm tra giá trị lọc trong query (rỗng/không gửi thì bỏ qua).
function readEnumFilter(value, allowed, label) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new AppError(`${label} không hợp lệ`, 400);
  }
  return value;
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---------------------------------------------------------------------
// Cửa hàng: GET /admin/stores, PATCH /admin/stores/:id/status
// ---------------------------------------------------------------------
const STORE_SELECT = `
  SELECT s.id, s.owner_id, s.name, s.address, s.phone, s.description, s.image_url,
         s.latitude, s.longitude, s.status, s.created_at,
         u.name AS owner_name, u.email AS owner_email,
         (SELECT COUNT(*) FROM listings l
           WHERE l.store_id = s.id AND l.status <> 'deleted') AS listing_count
  FROM stores s
  JOIN users u ON u.id = s.owner_id`;

function formatStore(r) {
  return {
    id: r.id,
    owner_id: r.owner_id,
    name: r.name,
    address: r.address,
    phone: r.phone,
    description: r.description,
    image_url: r.image_url,
    latitude: toNumberOrNull(r.latitude),
    longitude: toNumberOrNull(r.longitude),
    status: r.status,
    created_at: toIso(r.created_at),
    owner: { id: r.owner_id, name: r.owner_name, email: r.owner_email },
    listing_count: Number(r.listing_count),
  };
}

const listStores = asyncHandler(async (req, res) => {
  const status = readEnumFilter(req.query.status, STORE_STATUSES, 'Trạng thái');
  const keyword = cleanKeyword(req.query.q);
  const { page, limit, offset } = parsePaging(req.query);

  const where = [];
  const params = [];
  if (status) {
    where.push('s.status = ?');
    params.push(status);
  }
  if (keyword) {
    where.push('(s.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM stores s JOIN users u ON u.id = s.owner_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `${STORE_SELECT} ${whereSql} ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map(formatStore),
    pagination: paginate(page, limit, Number(total)),
  });
});

const updateStoreStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const status = (req.body || {}).status;
  if (!STORE_SET_STATUSES.includes(status)) {
    throw new AppError("Trạng thái chỉ được là 'approved' hoặc 'locked'", 400);
  }

  const [found] = await pool.query('SELECT id FROM stores WHERE id = ?', [id]);
  if (id === null || found.length === 0) throw new AppError('Không tìm thấy cửa hàng', 404);

  await pool.query('UPDATE stores SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await pool.query(`${STORE_SELECT} WHERE s.id = ?`, [id]);

  res.json({ success: true, data: formatStore(rows[0]) });
});

// ---------------------------------------------------------------------
// Người dùng: GET /admin/users, PATCH /admin/users/:id/status
// ---------------------------------------------------------------------
function formatUserRow(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    status: r.status,
    created_at: toIso(r.created_at),
  };
}

const USER_COLUMNS = 'id, name, email, phone, role, status, created_at'; // không có password_hash

const listUsers = asyncHandler(async (req, res) => {
  const role = readEnumFilter(req.query.role, USER_ROLES, 'Vai trò');
  const status = readEnumFilter(req.query.status, USER_STATUSES, 'Trạng thái');
  const keyword = cleanKeyword(req.query.q);
  const { page, limit, offset } = parsePaging(req.query);

  const where = [];
  const params = [];
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map(formatUserRow),
    pagination: paginate(page, limit, Number(total)),
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const status = (req.body || {}).status;
  if (!USER_STATUSES.includes(status)) {
    throw new AppError("Trạng thái chỉ được là 'active' hoặc 'locked'", 400);
  }

  const [found] = id === null ? [[]] : await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  if (found.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  const target = found[0];

  // Không cho khoá chính mình hoặc một admin khác (mở khoá thì vẫn cho phép).
  if (status === 'locked') {
    if (target.id === req.user.id) throw new AppError('Bạn không thể tự khoá tài khoản của mình', 403);
    if (target.role === 'admin') throw new AppError('Không thể khoá tài khoản quản trị viên', 403);
  }

  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);

  res.json({ success: true, data: formatUserRow(rows[0]) });
});

// ---------------------------------------------------------------------
// Tin đăng: GET /admin/listings, PATCH /admin/listings/:id/status
// ---------------------------------------------------------------------
const LISTING_SELECT = `
  SELECT l.id, l.store_id, l.category_id, l.title, l.description, l.image_url,
         l.original_price, l.sale_price, l.quantity, l.remaining,
         l.pickup_start, l.pickup_end, l.status, l.created_at,
         s.name AS store_name, s.address AS store_address, s.image_url AS store_image_url,
         s.latitude AS store_latitude, s.longitude AS store_longitude,
         c.name AS category_name
  FROM listings l
  JOIN stores s ON s.id = l.store_id
  LEFT JOIN categories c ON c.id = l.category_id`;

function formatListing(r) {
  const original = Number(r.original_price);
  const sale = Number(r.sale_price);
  const pickupEnd = r.pickup_end instanceof Date ? r.pickup_end : new Date(r.pickup_end);
  return {
    id: r.id,
    store_id: r.store_id,
    store: {
      id: r.store_id,
      name: r.store_name,
      address: r.store_address,
      image_url: r.store_image_url,
      latitude: toNumberOrNull(r.store_latitude),
      longitude: toNumberOrNull(r.store_longitude),
    },
    category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
    title: r.title,
    description: r.description,
    image_url: r.image_url,
    original_price: original,
    sale_price: sale,
    discount_percent: original > 0 ? Math.round((1 - sale / original) * 100) : 0,
    quantity: r.quantity,
    remaining: r.remaining,
    pickup_start: toIso(r.pickup_start),
    pickup_end: toIso(r.pickup_end),
    status: r.status,
    is_available: r.remaining > 0 && pickupEnd.getTime() > Date.now(),
    created_at: toIso(r.created_at),
  };
}

const listListings = asyncHandler(async (req, res) => {
  const status = readEnumFilter(req.query.status, LISTING_STATUSES, 'Trạng thái');
  const keyword = cleanKeyword(req.query.q);
  const { page, limit, offset } = parsePaging(req.query);

  const where = [];
  const params = [];
  if (status) {
    where.push('l.status = ?');
    params.push(status);
  } else {
    // Không lọc trạng thái: ẩn tin đã xoá mềm; muốn xem thì lọc status=deleted.
    where.push("l.status <> 'deleted'");
  }
  if (req.query.store_id !== undefined && req.query.store_id !== '') {
    const storeId = parseId(req.query.store_id);
    if (storeId === null) throw new AppError('store_id không hợp lệ', 400);
    where.push('l.store_id = ?');
    params.push(storeId);
  }
  if (keyword) {
    where.push('(l.title LIKE ? OR s.name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM listings l JOIN stores s ON s.id = l.store_id ${whereSql}`,
    params
  );
  const [rows] = await pool.query(
    `${LISTING_SELECT} ${whereSql} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows.map(formatListing),
    pagination: paginate(page, limit, Number(total)),
  });
});

const updateListingStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const status = (req.body || {}).status;
  if (!LISTING_STATUSES.includes(status)) {
    throw new AppError("Trạng thái chỉ được là 'active', 'hidden' hoặc 'deleted'", 400);
  }

  const [found] = id === null ? [[]] : await pool.query('SELECT id FROM listings WHERE id = ?', [id]);
  if (found.length === 0) throw new AppError('Không tìm thấy tin đăng', 404);

  await pool.query('UPDATE listings SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await pool.query(`${LISTING_SELECT} WHERE l.id = ?`, [id]);

  res.json({ success: true, data: formatListing(rows[0]) });
});

// ---------------------------------------------------------------------
// Thống kê: GET /admin/stats
// ---------------------------------------------------------------------
async function buildWeekly() {
  const [[{ today }]] = await pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(picked_up_at, '%Y-%m-%d') AS d,
            SUM(quantity) AS meals, SUM(total_price) AS revenue
     FROM orders
     WHERE status = 'picked_up' AND picked_up_at >= CURDATE() - INTERVAL 6 DAY
     GROUP BY DATE_FORMAT(picked_up_at, '%Y-%m-%d')`
  );
  const byDay = new Map(rows.map((r) => [r.d, r]));

  const weekly = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const r = byDay.get(key);
    weekly.push({
      date: key,
      meals: r ? Number(r.meals) : 0,
      revenue: r ? Number(r.revenue) : 0,
    });
  }
  return weekly;
}

const getStats = asyncHandler(async (req, res) => {
  const [
    [[u]],
    [[s]],
    [[lActive]],
    [[lTotal]],
    [[o]],
    weekly,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(role = 'buyer'), 0) AS buyers,
              COALESCE(SUM(role = 'store'), 0) AS stores,
              COALESCE(SUM(role = 'admin'), 0) AS admins,
              COALESCE(SUM(status = 'locked'), 0) AS locked
       FROM users`
    ),
    pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(status = 'pending'), 0) AS pending,
              COALESCE(SUM(status = 'approved'), 0) AS approved,
              COALESCE(SUM(status = 'locked'), 0) AS locked
       FROM stores`
    ),
    pool.query(
      `SELECT COUNT(*) AS c
       FROM listings l JOIN stores s ON s.id = l.store_id
       WHERE l.status = 'active' AND s.status = 'approved'
         AND l.pickup_end > NOW() AND l.remaining > 0`
    ),
    pool.query("SELECT COUNT(*) AS c FROM listings WHERE status <> 'deleted'"),
    pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(status = 'pending'), 0) AS pending,
              COALESCE(SUM(status = 'picked_up'), 0) AS picked_up,
              COALESCE(SUM(status = 'cancelled'), 0) AS cancelled,
              COALESCE(SUM(status = 'no_show'), 0) AS no_show,
              COALESCE(SUM(CASE WHEN status = 'picked_up' THEN quantity END), 0) AS meals_saved,
              COALESCE(SUM(CASE WHEN status = 'picked_up' THEN total_price END), 0) AS revenue_total
       FROM orders`
    ),
    buildWeekly(),
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: Number(u.total),
        buyers: Number(u.buyers),
        stores: Number(u.stores),
        admins: Number(u.admins),
        locked: Number(u.locked),
      },
      stores: {
        total: Number(s.total),
        pending: Number(s.pending),
        approved: Number(s.approved),
        locked: Number(s.locked),
      },
      listings: { active_now: Number(lActive.c), total: Number(lTotal.c) },
      orders: {
        total: Number(o.total),
        pending: Number(o.pending),
        picked_up: Number(o.picked_up),
        cancelled: Number(o.cancelled),
        no_show: Number(o.no_show),
      },
      meals_saved: Number(o.meals_saved),
      revenue_total: Number(o.revenue_total),
      weekly,
    },
  });
});

module.exports = {
  listStores,
  updateStoreStatus,
  listUsers,
  updateUserStatus,
  listListings,
  updateListingStatus,
  getStats,
};
