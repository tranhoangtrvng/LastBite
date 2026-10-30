// Chạy toàn bộ kiểm thử:  cd server  ->  npm test
// Yêu cầu: MySQL đang chạy, đã nạp schema.sql + seed.sql, và backend đang chạy (npm run dev ở cửa sổ khác).
// Kiểm thử tự tạo tài khoản / tin đăng thử (tên "Test LastBite", "[TEST] ...") và TỰ DỌN SẠCH khi xong.
const { BASE, results, cleanup, close } = require('./helpers');

(async () => {
  console.log(`Kiểm thử LastBite API tại ${BASE}`);
  try {
    const health = await fetch(`${BASE}/health`).catch(() => null);
    if (!health || !health.ok) {
      console.error('\nKhông gọi được backend. Hãy chạy "npm run dev" ở một cửa sổ khác rồi thử lại.');
      process.exit(1);
    }
    for (const file of ['./smoke.test', './rateLimit.test', './concurrency.test']) {
      try {
        await require(file)();
      } catch (err) {
        results.push({ ok: false, name: `${file}: ${err.message}` });
        console.error(`  LỖI ${file}: ${err.message}`);
      }
    }
  } finally {
    try {
      await cleanup();
    } catch (e) {
      console.error('Dọn dữ liệu thử lỗi:', e.message);
    }
    await close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nKẾT QUẢ: ${results.length - failed.length}/${results.length} đạt`);
  if (failed.length) {
    console.log('Chưa đạt:');
    failed.forEach((r) => console.log(' - ' + r.name));
  }
  process.exit(failed.length ? 1 : 0);
})();
