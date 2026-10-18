// Đơn đặt chỗ (VT1).   Hạn: 20-23/10
// POST /api/orders            đặt chỗ (transaction trừ tồn kho, sinh mã 6 ký tự)
// GET  /api/orders/my         lịch sử đơn của người mua
// PATCH /api/orders/:id/cancel huỷ đơn
// Phía cửa hàng (VT3): danh sách đơn, xác nhận nhận hàng bằng mã
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: orders' }));

module.exports = router;
