// Xử lý lỗi tập trung: mọi lỗi đều trả về cùng một dạng JSON
//   { success: false, message: "..." }                      (lỗi thường)
//   { success: false, message: "...", errors: [{field, message}] }   (lỗi 400 theo từng trường)
module.exports = (err, req, res, next) => {
  // Nếu đã gửi một phần phản hồi thì giao lại cho Express xử lý mặc định.
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Lỗi của multer (tải ảnh lên) -> đổi thành 400 với thông báo tiếng Việt.
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Ảnh tối đa 2MB';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Trường chứa file phải có tên là "image"';
    else message = 'Tải ảnh lên không hợp lệ';
  }
  // Body gửi lên không phải JSON hợp lệ (ví dụ thiếu dấu phẩy, thừa dấu ngoặc).
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Dữ liệu gửi lên không phải JSON hợp lệ';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Dữ liệu gửi lên quá lớn';
  }

  if (statusCode === 500) console.error(err);

  const body = {
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Lỗi máy chủ' : message,
  };
  if (statusCode === 400 && Array.isArray(err.errors)) body.errors = err.errors;

  res.status(statusCode).json(body);
};
