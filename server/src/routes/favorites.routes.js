// favorites (VT4). GET/POST/DELETE /api/favorites
// Khung tạm do VT1 tạo; VT4 thay bằng route thật khi làm phần này.
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: favorites' }));

module.exports = router;
