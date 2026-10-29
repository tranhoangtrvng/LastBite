// Thông báo trong web (docs/api.md mục 3.12). Mọi API cần đăng nhập, chỉ thấy thông báo của chính mình.
//   GET   /api/notifications             danh sách, mới nhất trước (?unread=true chỉ lấy chưa đọc), kèm unread_count
//   PATCH /api/notifications/read-all    đánh dấu tất cả đã đọc
//   PATCH /api/notifications/:id/read    đánh dấu một thông báo đã đọc
// Thông báo do hệ thống tự tạo (hiện có: "Có đơn mới" gửi chủ cửa hàng khi có người đặt chỗ), không có API tạo.
const router = require('express').Router();
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isIdParam } = require('../utils/parse');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { authenticate } = require('../middlewares/auth');
const { toIsoVN } = require('../utils/formatUser');

router.use(authenticate);

function formatNotification(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    is_read: Boolean(row.is_read),
    created_at: toIsoVN(row.created_at),
  };
}

async function countUnread(userId) {
  const [[{ unread }]] = await pool.query(
    'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return Number(unread);
}

router.get('/', asyncHandler(async (req, res) => {
  const where = ['user_id = ?'];
  const params = [req.user.id];
  if (req.query.unread === 'true') where.push('is_read = 0');
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const { page, limit, offset } = parsePagination(req.query);

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM notifications ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT id, title, content, is_read, created_at FROM notifications ${whereSql}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    unread_count: await countUnread(req.user.id),
    data: rows.map(formatNotification),
    pagination: buildPagination(page, limit, Number(total)),
  });
}));

// Đặt TRƯỚC '/:id/read' để chữ "read-all" không bị hiểu là một id.
router.patch('/read-all', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );
  res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc', updated: result.affectedRows, unread_count: 0 });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notFound = () => new AppError('Không tìm thấy thông báo', 404);
  if (!isIdParam(req.params.id)) throw notFound();
  const id = Number(req.params.id);

  // Thông báo của người khác cũng trả 404 (không lộ là có tồn tại).
  const [result] = await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [
    id,
    req.user.id,
  ]);
  if (result.affectedRows === 0) throw notFound();

  const [rows] = await pool.query('SELECT id, title, content, is_read, created_at FROM notifications WHERE id = ?', [id]);
  res.json({ success: true, data: formatNotification(rows[0]), unread_count: await countUnread(req.user.id) });
}));

module.exports = router;
