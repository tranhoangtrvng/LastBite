// Kết nối MySQL bằng connection pool (dùng chung cho toàn bộ backend).
// Cách dùng ở nơi khác:
//   const pool = require('../config/db');
//   const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [id]);
// Luôn truyền giá trị qua dấu ? để tránh SQL Injection.

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
