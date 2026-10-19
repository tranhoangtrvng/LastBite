const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// Đảm bảo thư mục uploads luôn tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tự sinh tên file: timestamp + số ngẫu nhiên + extension gốc
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = Math.random().toString(16).substring(2, 8);
    cb(null, `${Date.now()}-${randomHex}${ext}`);
  }
});

// Bộ lọc định dạng file (chỉ nhận JPG, JPEG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ chấp nhận ảnh JPG hoặc PNG', 400), false);
  }
};

// Khởi tạo multer với giới hạn 2MB
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter
});

module.exports = upload;