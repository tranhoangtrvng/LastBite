// Quản trị (VT4). Chỉ vai trò admin.
// GET   /api/admin/stores            danh sách cửa hàng (lọc theo trạng thái)
// PATCH /api/admin/stores/:id/status duyệt / khoá
// GET   /api/admin/users, PATCH /api/admin/users/:id/status
// GET   /api/admin/listings, DELETE /api/admin/listings/:id
// GET   /api/admin/stats             số suất đã cứu
const router = require('express').Router();

router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: admin' }));

module.exports = router;
