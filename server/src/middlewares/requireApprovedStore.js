// Dùng cho các API "đăng/sửa/xoá tin": người gọi phải là cửa hàng ĐÃ ĐƯỢC DUYỆT (docs/api.md mục 3.6, 5.6).
// Thứ tự dùng:  authenticate -> authorize('store') -> requireApprovedStore
// Sau middleware này có req.store = { id, status } (do requireStore gán).
const requireStore = require('./requireStore');
const AppError = require('../utils/AppError');

module.exports = [
  requireStore,
  (req, res, next) => {
    if (req.store.status === 'approved') return next();
    if (req.store.status === 'locked') return next(new AppError('Cửa hàng đang bị khoá', 403));
    return next(new AppError('Cửa hàng chưa được duyệt', 403));
  },
];
