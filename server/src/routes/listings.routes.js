// Tin đăng suất ăn.
// Công khai (VT1): GET /api/listings (tìm kiếm, lọc), GET /api/listings/:id
// Cửa hàng (VT3): POST/PUT/DELETE /api/listings, upload ảnh bằng multer
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: listings' }));

module.exports = router;
