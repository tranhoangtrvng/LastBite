// Cửa hàng (VT3).
// POST /api/stores        đăng ký cửa hàng (trạng thái pending)
// GET  /api/stores/me     thông tin cửa hàng của tôi
// GET  /api/stores/me/stats  dashboard (P1)
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: stores' }));

module.exports = router;
