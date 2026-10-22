// VT1 - Đăng ký, đăng nhập, hồ sơ.
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { updateMe, changePassword } = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.put('/password', authenticate, changePassword);

module.exports = router;
