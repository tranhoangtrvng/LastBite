// Xử lý lỗi tập trung: mọi lỗi đều trả về cùng một dạng JSON
// { success: false, message: "..." } để frontend dễ hiển thị.
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Lỗi máy chủ'
      : err.message,
  });
};
