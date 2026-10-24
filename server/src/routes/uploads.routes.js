const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const AppError = require('../utils/AppError');
const { authenticate, authorize } = require('../middlewares/auth');

// POST /api/uploads/image
// Quyền: store, admin (docs/api.md mục 3.4). Kiểm tra đăng nhập TRƯỚC khi nhận file,
// để người lạ không ghi được file lên server.
router.post('/image', authenticate, authorize('store', 'admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Ảnh tối đa 2MB', 400));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('Vui lòng chọn file ảnh để tải lên', 400));
    }

    // Trả về đúng định dạng hợp đồng docs/api.md
    res.status(201).json({
      success: true,
      data: {
        image_url: `/uploads/${req.file.filename}`
      }
    });
  });
});

module.exports = router;
