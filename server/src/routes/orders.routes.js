// Đơn đặt chỗ, phía người mua (VT1).
// POST  /api/orders              đặt chỗ (transaction trừ tồn kho, sinh mã 6 ký tự)
// GET   /api/orders/my           lịch sử đơn của người mua
// GET   /api/orders/:id          chi tiết đơn (chủ đơn, cửa hàng của đơn, admin)
// PATCH /api/orders/:id/cancel   huỷ đơn
// (VT4 sẽ thêm POST /api/orders/:id/review vào file này nếu làm tính năng đánh giá)
// QUY TẮC: '/my' phải khai báo TRƯỚC '/:id', nếu không Express hiểu "my" là một id.
const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { createOrder, getMyOrders, getOrderById, cancelOrder } = require('../controllers/orders.controller');

router.use(authenticate); // mọi API đơn đều cần đăng nhập

router.post('/', createOrder); // kiểm tra vai trò buyer nằm trong controller (để có thông báo riêng)
router.get('/my', authorize('buyer'), getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', authorize('buyer'), cancelOrder);

module.exports = router;
