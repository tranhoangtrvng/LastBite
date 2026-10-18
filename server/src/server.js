// Điểm khởi động: nạp biến môi trường, kiểm tra DB, mở cổng.
require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[Server] LastBite API chạy tại http://localhost:${PORT}/api/health`);
  await testConnection();
});
