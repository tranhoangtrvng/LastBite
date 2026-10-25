// Lỗi "có chủ đích" kèm mã HTTP. Ví dụ:
//   throw new AppError('Hết suất', 409);
// Lỗi dữ liệu (400) có thể kèm danh sách lỗi theo từng trường (docs/api.md mục 1.3):
//   throw new AppError('Dữ liệu không hợp lệ', 400, [{ field: 'phone', message: 'Số điện thoại sai' }]);
class AppError extends Error {
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (errors) this.errors = errors;
  }
}

module.exports = AppError;
