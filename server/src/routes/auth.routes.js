// VT1 - Đăng ký, đăng nhập, hồ sơ.   Hạn: 16/10
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: auth' }));

module.exports = router;
