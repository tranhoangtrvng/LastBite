// VT1 - Đăng ký, đăng nhập, hồ sơ.
// Giai đoạn 16/10: register, login, me.
// Hạn 22/10 (còn lại): PUT /api/auth/me, PUT /api/auth/password
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

module.exports = router;