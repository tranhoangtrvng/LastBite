// Kiểm thử giới hạn đăng nhập sai: sai 5 lần -> lần thứ 6 bị 429, kể cả khi nhập đúng.
const { call, newBuyer, check } = require('./helpers');

module.exports = async function rateLimit() {
  console.log('\n[6] Giới hạn đăng nhập sai (429)');
  const u = await newBuyer('rl');
  const statuses = [];
  for (let i = 0; i < 5; i += 1) {
    statuses.push((await call('POST', '/auth/login', { body: { email: u.email, password: 'sai-mat-khau' } })).status);
  }
  check(statuses.every((s) => s === 401), '5 lần sai đầu -> 401', statuses);
  const sixth = await call('POST', '/auth/login', { body: { email: u.email, password: 'Demo@123' } });
  check(sixth.status === 429 && /15 phút|phút/.test(sixth.body.message), 'lần 6 (kể cả đúng mật khẩu) -> 429', sixth);
  const other = await call('POST', '/auth/login', { body: { email: 'buyer.lastbite@gmail.com', password: 'Demo@123' } });
  check(other.status === 200, 'tài khoản khác trên cùng máy vẫn đăng nhập được');
};
