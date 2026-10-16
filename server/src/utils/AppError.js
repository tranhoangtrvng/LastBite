// Lỗi "có chủ đích" kèm mã HTTP. Ví dụ:
//   throw new AppError('Hết suất', 409);
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
