const AppError = require('../utils/AppError');

// Chạy khi không có route nào khớp.
module.exports = (req, res, next) => {
  next(new AppError(`Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`, 404));
};
