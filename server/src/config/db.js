// Kết nối MySQL bằng connection pool (dùng chung cho toàn bộ backend).
// Cách dùng ở nơi khác:
//   const pool = require('../config/db');
//   const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [id]);
// Luôn truyền giá trị qua dấu ? để tránh SQL Injection.
//
// MÚI GIỜ: toàn bộ hệ thống dùng GIỜ VIỆT NAM (+07:00). Có hai chỗ cần đặt:
//   1) option `timezone` của mysql2: cách Node đổi qua lại giữa Date <-> chuỗi DATETIME.
//   2) lệnh SET time_zone cho từng kết nối MySQL: để NOW() trong câu SQL cũng là giờ Việt Nam.

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'lastbite',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+07:00',
});

// Mỗi khi pool mở một kết nối mới: đặt múi giờ của phiên làm việc đó là +07:00.
pool.pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00'", (err) => {
    if (err) console.warn(`[DB] Không đặt được múi giờ +07:00: ${err.message}`);
  });
});

// Kiểm tra kết nối khi khởi động (không làm sập server nếu DB chưa bật).
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Kết nối MySQL thành công');
    return true;
  } catch (err) {
    console.warn(`[DB] Chưa kết nối được MySQL: ${err.code || err.message}`);
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
