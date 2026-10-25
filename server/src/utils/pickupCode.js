// Mã nhận hàng 6 ký tự (docs/api.md mục 5.4).
// Bộ ký tự bỏ 0, O, 1, I để khách đọc/ghi không nhầm. Dùng crypto để mã khó đoán.
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 ký tự -> hơn 1 tỷ mã khác nhau

function generatePickupCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return code;
}

// Chuẩn hoá mã người dùng nhập: bỏ khoảng trắng đầu cuối, chuyển chữ hoa.
const normalizeCode = (value) => String(value === undefined || value === null ? '' : value).trim().toUpperCase();

module.exports = { generatePickupCode, normalizeCode };
