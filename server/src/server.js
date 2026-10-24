// Điểm khởi động: đặt múi giờ, nạp biến môi trường, kiểm tra DB, mở cổng.

// Đặt múi giờ Việt Nam cho Node.js. PHẢI nằm trên cùng, trước mọi dòng require khác.
process.env.TZ = 'Asia/Ho_Chi_Minh';

require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[Server] LastBite API chạy tại http://localhost:${PORT}/api/health`);
  await testConnection();
});
