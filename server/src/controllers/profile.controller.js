// Sửa hồ sơ và đổi mật khẩu (đã đăng nhập). Tách riêng khỏi auth.controller.js để không đụng file cũ.
//   PUT /api/auth/me        sửa tên, số điện thoại
//   PUT /api/auth/password  đổi mật khẩu
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/password');
const { formatUser } = require('../utils/formatUser');

const PHONE_REGEX = /^\d{9,11}$/;

// ---------------------------------------------------------------------
// PUT /api/auth/me   (chỉ đổi được name và phone; email, role bị bỏ qua)
// ---------------------------------------------------------------------
const updateMe = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = [];
  const changes = {}; // cột -> giá trị mới

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 100) {
      errors.push({ field: 'name', message: 'Tên phải từ 2 đến 100 ký tự' });
    } else {
      changes.name = name;
    }
  }

  if (body.phone !== undefined) {
    // Gửi null hoặc chuỗi rỗng nghĩa là xoá số điện thoại.
    const phone = body.phone === null || body.phone === '' ? null : String(body.phone).trim();
    if (phone !== null && !PHONE_REGEX.test(phone)) {
      errors.push({ field: 'phone', message: 'Số điện thoại phải gồm 9 đến 11 chữ số' });
    } else {
      changes.phone = phone;
    }
  }

  if (errors.length > 0) throw new AppError('Dữ liệu không hợp lệ', 400, errors);
  if (Object.keys(changes).length === 0) throw new AppError('Không có thông tin nào để cập nhật', 400);

  // Ghép câu UPDATE từ danh sách cột đã kiểm tra (tên cột do mình viết, giá trị đi qua dấu ?).
  const setSql = Object.keys(changes).map((column) => `${column} = ?`).join(', ');
  await pool.query(`UPDATE users SET ${setSql} WHERE id = ?`, [...Object.values(changes), req.user.id]);

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const user = rows[0];
  let store = null;
  if (user.role === 'store') {
    const [stores] = await pool.query('SELECT id, name, status FROM stores WHERE owner_id = ?', [user.id]);
    store = stores[0] || null;
  }

  res.json({ success: true, message: 'Đã cập nhật hồ sơ', data: formatUser(user, store) });
});

// ---------------------------------------------------------------------
// PUT /api/auth/password
// Sai mật khẩu hiện tại trả 400 (KHÔNG dùng 401, vì frontend sẽ tự đăng xuất khi gặp 401).
// ---------------------------------------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const current = typeof body.current_password === 'string' ? body.current_password : '';
  const next = typeof body.new_password === 'string' ? body.new_password : '';

  if (!current) {
    throw new AppError('Vui lòng nhập mật khẩu hiện tại', 400, [
      { field: 'current_password', message: 'Vui lòng nhập mật khẩu hiện tại' },
    ]);
  }
  if (next.length < 6 || next.length > 72) {
    throw new AppError('Mật khẩu mới phải từ 6 đến 72 ký tự', 400, [
      { field: 'new_password', message: 'Mật khẩu mới phải từ 6 đến 72 ký tự' },
    ]);
  }
  if (next === current) {
    throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400, [
      { field: 'new_password', message: 'Mật khẩu mới phải khác mật khẩu hiện tại' },
    ]);
  }

  // req.user không chứa password_hash (đã loại ở authenticate) nên tra lại từ database.
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const ok = rows[0] && (await comparePassword(current, rows[0].password_hash));
  if (!ok) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400, [
      { field: 'current_password', message: 'Mật khẩu hiện tại không đúng' },
    ]);
  }

  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(next), req.user.id]);
  res.json({ success: true, message: 'Đã đổi mật khẩu' });
});

module.exports = { updateMe, changePassword };
