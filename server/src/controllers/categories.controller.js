// GET /api/categories - công khai, danh sách loại món (dùng cho bộ lọc và form đăng tin).
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, slug FROM categories ORDER BY id');
  res.json({ success: true, data: rows });
});

module.exports = { getCategories };
