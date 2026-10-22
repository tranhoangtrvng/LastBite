// Đơn đặt chỗ, phía cửa hàng (VT1). Được gắn tại /api/stores/me/orders trong routes/index.js
// (và phải gắn TRƯỚC '/stores', vì '/stores' của VT3 cũng bắt đường dẫn bắt đầu bằng /stores).
const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth');
const requireStore = require('../middlewares/requireStore');
const {
  listStoreOrders,
  getOrderByCode,
  confirmOrder,
  markNoShow,
} = require('../controllers/storeOrders.controller');

router.use(authenticate, authorize('store'), requireStore);

router.get('/', listStoreOrders);
router.get('/by-code/:code', getOrderByCode); // đường dẫn cố định, đứng trước '/:id/...'
router.post('/confirm', confirmOrder);
router.patch('/:id/no-show', markNoShow);

module.exports = router;
