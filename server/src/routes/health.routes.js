const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/health  -> server còn sống không
router.get('/', (req, res) => {
  res.json({ success: true, message: 'LastBite API đang chạy', time: new Date().toISOString() });
});

// GET /api/health/db  -> kết nối được MySQL không
router.get('/db', asyncHandler(async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Kết nối MySQL ổn' });
  } catch (err) {
    res.status(503).json({ success: false, message: `Không kết nối được MySQL: ${err.code || err.message}` });
  }
}));

module.exports = router;
