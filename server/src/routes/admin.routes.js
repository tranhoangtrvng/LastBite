// VT4 - Các API quản trị (docs/api.md, mục 3.13). Chỉ admin được gọi.
const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth');
const ctrl = require('../controllers/admin.controller');

// Đăng nhập (401 nếu thiếu/sai token, 403 nếu tài khoản bị khoá),
// rồi phải là admin (403 nếu là vai trò khác).
router.use(authenticate, authorize('admin'));

router.get('/stores', ctrl.listStores);
router.patch('/stores/:id/status', ctrl.updateStoreStatus);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/status', ctrl.updateUserStatus);

router.get('/listings', ctrl.listListings);
router.patch('/listings/:id/status', ctrl.updateListingStatus);

router.get('/stats', ctrl.getStats);

module.exports = router;
