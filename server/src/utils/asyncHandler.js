// Bọc hàm async để lỗi tự chuyển sang errorHandler, khỏi viết try/catch ở mọi nơi.
//   router.get('/', asyncHandler(async (req, res) => { ... }));
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
