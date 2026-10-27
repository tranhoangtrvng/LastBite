// Tác vụ nền: mỗi phút chuyển các đơn "đang chờ nhận" đã QUÁ GIỜ NHẬN HÀNG sang "không đến" (no_show).
// - Không trả suất lại cho tin (cùng quy tắc với việc cửa hàng bấm "Không đến" bằng tay).
// - Server vừa bật lại cũng chạy ngay một lần để bù những đơn quá giờ trong lúc tắt máy.
const pool = require('../config/db');

const INTERVAL_MS = 60 * 1000;

// Trả về số đơn vừa được chuyển trạng thái.
async function markExpiredOrders() {
  const [result] = await pool.query(
    `UPDATE orders o JOIN listings l ON l.id = o.listing_id
     SET o.status = 'no_show'
     WHERE o.status = 'pending' AND l.pickup_end <= NOW()`
  );
  return result.affectedRows;
}

function startExpireOrdersJob() {
  let failing = false; // chỉ báo lỗi một lần cho đến khi chạy lại được (tránh in lỗi mỗi phút khi DB tắt)

  const run = async () => {
    try {
      const count = await markExpiredOrders();
      failing = false;
      if (count > 0) console.log(`[Job] Đã chuyển ${count} đơn quá giờ nhận sang "không đến"`);
    } catch (err) {
      if (!failing) console.warn(`[Job] Không cập nhật được đơn quá giờ: ${err.code || err.message}`);
      failing = true;
    }
  };

  run();
  return setInterval(run, INTERVAL_MS);
}

module.exports = { markExpiredOrders, startExpireOrdersJob };
