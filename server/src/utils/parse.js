// Hàm nhỏ để đọc dữ liệu người dùng gửi lên một cách an toàn.

// Số nguyên dương (>= 1). Chấp nhận số hoặc chuỗi toàn chữ số ("5"). Sai thì trả null.
function toPositiveInt(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 1 ? value : null;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    return n >= 1 ? n : null;
  }
  return null;
}

// Tham số trên đường dẫn (req.params.id) có phải số nguyên dương không?
const isIdParam = (value) => typeof value === 'string' && /^\d+$/.test(value) && Number(value) >= 1;

module.exports = { toPositiveInt, isIdParam };
