// Cấu hình ứng dụng Express (chưa lắng nghe cổng, việc đó nằm ở server.js).
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Ảnh người dùng tải lên: http://localhost:5000/uploads/ten-file.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Ảnh của dữ liệu mẫu (database/seed.sql) nằm trong server/seed-images và được đưa lên Git,
// nên máy nào clone về cũng thấy ảnh. Cùng đường dẫn /uploads/... nên seed.sql không cần sửa.
app.use('/uploads', express.static(path.join(__dirname, '..', 'seed-images'), {
  // Express 4 chưa biết đuôi .avif nên tự khai báo loại nội dung cho ảnh pastrami.avif.
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) res.type('image/avif');
  },
}));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
