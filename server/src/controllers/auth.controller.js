// Xử lý đăng ký, đăng nhập, lấy thông tin tài khoản.
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/token');
const { formatUser } = require('../utils/formatUser');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9,11}$/;
const REGISTER_ROLES = ['buyer', 'store']; // 'admin' không được tự đăng ký

// Lấy thông tin cửa hàng của một tài khoản (null nếu chưa đăng ký cửa hàng).
async function findStoreOfOwner(ownerId) {
  const [rows] = await pool.query(
    'SELECT id, name, status FROM stores WHERE owner_id = ?',
    [ownerId]
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = body.phone === undefined || body.phone === null || body.phone === ''
    ? null
    : String(body.phone).trim();
  const role = body.role === undefined || body.role === '' ? 'buyer' : body.role;

  // 1. Kiểm tra dữ liệu
  if (name.length < 2 || name.length > 100) {
    throw new AppError('Tên phải từ 2 đến 100 ký tự', 400);
  }
  if (!EMAIL_REGEX.test(email) || email.length > 150) {
    throw new AppError('Email không đúng định dạng', 400);
  }
  if (password.length < 6 || password.length > 72) {
    throw new AppError('Mật khẩu phải từ 6 đến 72 ký tự', 400);
  }
  if (phone !== null && !PHONE_REGEX.test(phone)) {
    throw new AppError('Số điện thoại phải gồm 9 đến 11 chữ số', 400);
  }
  if (!REGISTER_ROLES.includes(role)) {
    throw new AppError("Vai trò chỉ được là 'buyer' hoặc 'store'", 400);
  }

  // 2. Email đã dùng chưa?
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new AppError('Email đã được sử dụng', 409);

  // 3. Băm mật khẩu rồi lưu
  const passwordHash = await hashPassword(password);
  let insertId;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone, role]
    );
    insertId = result.insertId;
  } catch (err) {
    // Hai người đăng ký cùng email cùng lúc: UNIQUE trong DB sẽ chặn người đến sau.
    if (err.code === 'ER_DUP_ENTRY') throw new AppError('Email đã được sử dụng', 409);
    throw err;
  }

  // 4. Lấy lại dòng vừa tạo rồi cấp token
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [insertId]);
  const user = rows[0];

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công',
    data: { token: signToken(user), user: formatUser(user, null) },
  });
});



// ---------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------
const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    throw new AppError('Vui lòng nhập email và mật khẩu', 400);
  }

  const wrongCredentials = new AppError('Email hoặc mật khẩu không đúng', 401);

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) throw wrongCredentials; // cùng một câu với trường hợp sai mật khẩu

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw wrongCredentials;

  // Chỉ báo khoá SAU khi mật khẩu đúng (đúng như docs/api.md)
  if (user.status === 'locked') throw new AppError('Tài khoản đã bị khoá', 403);

  const store = user.role === 'store' ? await findStoreOfOwner(user.id) : null;

  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: { token: signToken(user), user: formatUser(user, store) },
  });
});


// ---------------------------------------------------------------------
// GET /api/auth/me  (đã qua middleware authenticate nên có req.user)
// ---------------------------------------------------------------------
const getMe = asyncHandler(async (req, res) => {
  const store = req.user.role === 'store' ? await findStoreOfOwner(req.user.id) : null;
  res.json({ success: true, data: formatUser(req.user, store) });
});

module.exports = { register, login, getMe };
