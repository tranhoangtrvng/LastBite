// Quên mật khẩu (VT1). Hai bước:
//   POST /api/auth/forgot-password  { email }                         -> tạo mã 6 số, hạn 15 phút
//   POST /api/auth/reset-password   { email, code, new_password }     -> kiểm tra mã, đặt mật khẩu mới
//
// Dự án chạy local, CHƯA có dịch vụ gửi email, nên mã được IN RA CỬA SỔ BACKEND (giả lập email).
// Khi có dịch vụ email thật, chỉ cần thay hàm deliverResetCode() bên dưới.
//
// An toàn:
// - Email không tồn tại hay tồn tại đều trả CÙNG một câu, để không ai dò được email nào đã đăng ký.
// - Chỉ lưu bản băm (bcrypt) của mã, không lưu mã thô.
// - Mỗi mã chỉ dùng 1 lần, sai quá 5 lần thì mã bị huỷ; xin mã mới thì mã cũ hết hiệu lực.
// - Phải chờ 60 giây giữa hai lần xin mã cho cùng một tài khoản.
const crypto = require('crypto');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/password');

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const GENERIC_SENT_MESSAGE =
  'Nếu email này đã đăng ký, mã đặt lại mật khẩu (6 chữ số, hiệu lực 15 phút) đã được gửi tới bạn';
const INVALID_CODE_MESSAGE = 'Mã không đúng hoặc đã hết hạn';

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// "Gửi" mã cho người dùng. Hiện tại: in ra cửa sổ backend.
function deliverResetCode(email, code) {
  console.log(`[Quên mật khẩu] Mã đặt lại cho ${email}: ${code} (hết hạn sau ${CODE_TTL_MINUTES} phút)`);
}

// ---------------------------------------------------------------------
// POST /api/auth/forgot-password   { email }
// ---------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail((req.body || {}).email);
  if (!email) {
    throw new AppError('Vui lòng nhập email', 400, [{ field: 'email', message: 'Vui lòng nhập email' }]);
  }

  const [users] = await pool.query("SELECT id, email FROM users WHERE email = ? AND status = 'active'", [email]);
  const user = users[0];

  if (user) {
    // Vừa xin mã chưa đủ 60 giây thì không tạo mã mới (vẫn trả câu chung).
    const [[recent]] = await pool.query(
      `SELECT COUNT(*) AS n FROM password_resets
       WHERE user_id = ? AND created_at > NOW() - INTERVAL ? SECOND`,
      [user.id, RESEND_COOLDOWN_SECONDS]
    );
    if (Number(recent.n) === 0) {
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      // Mã cũ chưa dùng -> huỷ, chỉ mã mới nhất có hiệu lực.
      await pool.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id]);
      await pool.query(
        `INSERT INTO password_resets (user_id, code_hash, expires_at)
         VALUES (?, ?, NOW() + INTERVAL ? MINUTE)`,
        [user.id, await hashPassword(code), CODE_TTL_MINUTES]
      );
      deliverResetCode(user.email, code);
    }
  }

  res.json({ success: true, message: GENERIC_SENT_MESSAGE });
});

// ---------------------------------------------------------------------
// POST /api/auth/reset-password   { email, code, new_password }
// ---------------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : String(body.code ?? '').trim();
  const next = typeof body.new_password === 'string' ? body.new_password : '';

  const errors = [];
  if (!email) errors.push({ field: 'email', message: 'Vui lòng nhập email' });
  if (!/^\d{6}$/.test(code)) errors.push({ field: 'code', message: 'Mã gồm 6 chữ số' });
  if (next.length < 6 || next.length > 72) {
    errors.push({ field: 'new_password', message: 'Mật khẩu mới phải từ 6 đến 72 ký tự' });
  }
  if (errors.length > 0) {
    throw new AppError(errors.length === 1 ? errors[0].message : 'Dữ liệu không hợp lệ', 400, errors);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [users] = await conn.query("SELECT id FROM users WHERE email = ? AND status = 'active'", [email]);
    const user = users[0];
    // Mã mới nhất còn hiệu lực của tài khoản này (khoá dòng để hai lần gửi cùng lúc không cùng dùng được).
    const [resets] = user
      ? await conn.query(
          `SELECT id, code_hash, attempts FROM password_resets
           WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW()
           ORDER BY id DESC LIMIT 1 FOR UPDATE`,
          [user.id]
        )
      : [[]];
    const reset = resets[0];
    if (!reset) throw new AppError(INVALID_CODE_MESSAGE, 400, [{ field: 'code', message: INVALID_CODE_MESSAGE }]);

    if (!(await comparePassword(code, reset.code_hash))) {
      const attempts = reset.attempts + 1;
      // Sai đủ 5 lần thì huỷ mã luôn.
      await conn.query(
        'UPDATE password_resets SET attempts = ?, used_at = IF(? >= ?, NOW(), used_at) WHERE id = ?',
        [attempts, attempts, MAX_ATTEMPTS, reset.id]
      );
      await conn.commit();
      const message =
        attempts >= MAX_ATTEMPTS
          ? 'Nhập sai quá 5 lần, mã đã bị huỷ. Hãy yêu cầu mã mới'
          : `${INVALID_CODE_MESSAGE} (còn ${MAX_ATTEMPTS - attempts} lần thử)`;
      throw new AppError(message, 400, [{ field: 'code', message }]);
    }

    await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(next), user.id]);
    await conn.query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id]);
    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch (e) {
      /* đã commit ở nhánh nhập sai, rollback lúc này không làm gì */
    }
    throw err;
  } finally {
    conn.release();
  }

  res.json({ success: true, message: 'Đã đặt lại mật khẩu, bạn có thể đăng nhập bằng mật khẩu mới' });
});

module.exports = { forgotPassword, resetPassword };
