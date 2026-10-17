// Tạo và kiểm tra JWT. Khoá bí mật lấy từ .env (JWT_SECRET).
const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError('Server chưa cấu hình JWT_SECRET trong file .env', 500);
  }
  return process.env.JWT_SECRET;
}

// Trong token chỉ cần id và role. Thông tin khác luôn tra lại từ database.
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Trả về payload nếu hợp lệ, ném lỗi của jsonwebtoken nếu sai hoặc hết hạn.
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };