// Gom toàn bộ route, mỗi module một file. Tất cả nằm dưới tiền tố /api.
const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/listings', require('./listings.routes'));
router.use('/orders', require('./orders.routes'));
// QUAN TRỌNG: '/stores/me/orders' phải đứng TRƯỚC '/stores', nếu không route '/stores' sẽ bắt mất.
router.use('/stores/me/orders', require('./storeOrders.routes'));
router.use('/stores', require('./stores.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/uploads', require('./uploads.routes'));
router.use('/favorites', require('./favorites.routes'));
router.use('/notifications', require('./notifications.routes'));

module.exports = router;
