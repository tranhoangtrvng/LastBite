// VT1 - Đăng ký, đăng nhập, hồ sơ.
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { updateMe, changePassword } = require('../controllers/profile.controller');
const { forgotPassword, resetPassword } = require('../controllers/passwordReset.controller');
const { authenticate } = require('../middlewares/auth');
const {
  loginLimiter,
  loginIpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require('../middlewares/rateLimit');

router.post('/register', register);
router.post('/login', loginIpLimiter, loginLimiter, login); // sai 5 lần / 15 phút -> 429
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword); // quên mật khẩu: xin mã 6 số (in ở cửa sổ backend)
router.post('/reset-password', resetPasswordLimiter, resetPassword); // dùng mã để đặt mật khẩu mới
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.put('/password', authenticate, changePassword);

module.exports = router;
