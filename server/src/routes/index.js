// Gom toàn bộ route, mỗi module một file. Tất cả nằm dưới tiền tố /api.
const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/listings', require('./listings.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/stores', require('./stores.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/categories', require('./categories.routes'));

module.exports = router;
