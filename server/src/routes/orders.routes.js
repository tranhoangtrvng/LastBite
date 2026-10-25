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
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

router.use(authenticate); // mọi API đơn đều cần đăng nhập

router.post('/', createOrder); // kiểm tra vai trò buyer nằm trong controller (để có thông báo riêng)
router.get('/my', authorize('buyer'), getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', authorize('buyer'), cancelOrder);

// =====================================================================
// HELPER: Lấy Cửa hàng hiện tại đang đăng nhập (Cho TV3)
// =====================================================================
async function resolveCurrentStore(req) {
  const [stores] = await pool.query("SELECT id FROM stores WHERE status = 'approved' LIMIT 1");
  if (stores.length === 0) throw new AppError('Hệ thống chưa có cửa hàng nào được duyệt', 403);
  return stores[0];
}

// =====================================================================
// PHẦN CỦA TRUNG (TV1) - BACKEND NGƯỜI MUA
// Trung sẽ code các API: POST /, GET /my, PATCH /:id/cancel vào đây
// =====================================================================


// =====================================================================
// PHẦN CỦA NGỌC (TV3) - QUẢN LÝ ĐƠN HÀNG DÀNH CHO CỬA HÀNG
// =====================================================================

/**
 * 1. GET /api/orders/store
 * Chức năng: Chủ quán xem danh sách khách đặt đồ của quán mình
 */
router.get('/store', asyncHandler(async (req, res) => {
  const store = await resolveCurrentStore(req);
  
  const [orders] = await pool.query(`
    SELECT o.id, o.status, o.pickup_code, o.created_at, o.total_price, o.quantity,
           u.name AS customer_name, u.phone AS customer_phone, 
           l.title AS food_name 
    FROM orders o 
    JOIN listings l ON o.listing_id = l.id 
    JOIN users u ON o.buyer_id = u.id 
    WHERE l.store_id = ? 
    ORDER BY o.created_at DESC
  `, [store.id]);

  res.status(200).json({ 
    success: true, 
    message: 'Lấy danh sách đơn hàng của quán thành công',
    data: orders 
  });
}));

/**
 * 2. PATCH /api/orders/:id/confirm
 * Chức năng: Chủ quán nhập mã 6 ký tự để xác nhận đã giao đồ cho khách
 */
router.patch('/:id/confirm', asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const { pickup_code } = req.body;

  if (!pickup_code) return next(new AppError('Vui lòng nhập mã xác nhận', 400));

  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (orders.length === 0) return next(new AppError('Không tìm thấy đơn hàng', 404));
  
  const order = orders[0];

  if (order.status !== 'pending') {
    return next(new AppError('Đơn hàng này không ở trạng thái chờ nhận hoặc đã được xử lý', 400));
  }
  
  if (order.pickup_code.toUpperCase() !== pickup_code.toUpperCase().trim()) {
    return next(new AppError('Mã xác nhận không khớp. Vui lòng kiểm tra lại!', 400));
  }

  await pool.query(
    'UPDATE orders SET status = "picked_up", picked_up_at = NOW() WHERE id = ?', 
    [orderId]
  );
  
  res.status(200).json({ 
    success: true, 
    message: 'Mã chính xác! Đã xác nhận giao đồ thành công.' 
  });
}));

module.exports = router;