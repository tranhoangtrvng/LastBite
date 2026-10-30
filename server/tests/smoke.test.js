// Kiểm thử các luồng chính (P0) và các quy tắc quan trọng.
const bcrypt = require('bcrypt');
const { call, login, newBuyer, newListing, sql, check } = require('./helpers');

module.exports = async function smoke() {
  console.log('\n[1] Hệ thống và đăng nhập');
  check((await call('GET', '/health')).status === 200, 'GET /health');
  check((await call('GET', '/health/db')).status === 200, 'GET /health/db (kết nối MySQL)');
  const store = await login('tuankhang76@gmail.com');
  const admin = await login('admin@lastbite.vn');
  check(Boolean(store && admin), 'đăng nhập cửa hàng và admin mẫu');
  const wrong = await call('POST', '/auth/login', { body: { email: 'admin@lastbite.vn', password: 'sai-mat-khau' } });
  check(wrong.status === 401, 'sai mật khẩu -> 401', wrong.status);
  check((await call('GET', '/orders/my')).status === 401, 'chưa đăng nhập -> 401');
  const buyerOnly = await call('GET', '/admin/stats', { token: store });
  check(buyerOnly.status === 403, 'cửa hàng gọi API admin -> 403');

  console.log('\n[2] Tìm kiếm suất ăn');
  const list = await call('GET', '/listings?limit=5');
  check(list.status === 200 && Array.isArray(list.body.data), 'GET /listings');
  check((await call('GET', '/listings/999999')).status === 404, 'tin không tồn tại -> 404');

  const listing = await newListing(store, 'Smoke', 5);
  if (!listing) {
    console.log('  (Đã quá muộn trong ngày để tạo tin thử, bỏ qua phần đặt chỗ)');
    return;
  }
  check(listing.is_booking_open === true, 'tin thử trong ngày, đã mở đặt');

  console.log('\n[3] Đặt chỗ, giới hạn 2 đơn chờ, huỷ, xác nhận');
  const a = await newBuyer('smoke-a');
  const o1 = await call('POST', '/orders', { token: a.token, body: { listing_id: listing.id, quantity: 2 } });
  check(o1.status === 201 && /^[A-Z0-9]{6}$/.test(o1.body.data.pickup_code), 'đặt chỗ -> 201 + mã 6 ký tự', o1.status);
  const o2 = await call('POST', '/orders', { token: a.token, body: { listing_id: listing.id, quantity: 1 } });
  check(o2.status === 201, 'đơn chờ thứ 2 -> 201');
  const o3 = await call('POST', '/orders', { token: a.token, body: { listing_id: listing.id, quantity: 1 } });
  check(o3.status === 409 && /tối đa 2 đơn/.test(o3.body.message), 'đơn chờ thứ 3 -> 409 (giới hạn 2 đơn)', o3.body);
  let [{ remaining }] = await sql('SELECT remaining FROM listings WHERE id = ?', [listing.id]);
  check(remaining === 2, 'còn lại 5 - 2 - 1 = 2 suất', remaining);
  const tooMany = await call('POST', '/orders', { token: (await newBuyer('smoke-b')).token, body: { listing_id: listing.id, quantity: 3 } });
  check(tooMany.status === 409, 'đặt vượt số suất còn lại -> 409');

  const cancel = await call('PATCH', `/orders/${o2.body.data.id}/cancel`, { token: a.token });
  check(cancel.status === 200, 'huỷ đơn -> 200');
  [{ remaining }] = await sql('SELECT remaining FROM listings WHERE id = ?', [listing.id]);
  check(remaining === 3, 'huỷ đơn trả suất lại (còn 3)', remaining);

  const bad = await call('POST', '/stores/me/orders/confirm', { token: store, body: { pickup_code: 'ZZZZZZ' } });
  check(bad.status === 404, 'cửa hàng nhập mã sai -> 404');
  const ok = await call('POST', '/stores/me/orders/confirm', { token: store, body: { pickup_code: o1.body.data.pickup_code.toLowerCase() } });
  check(ok.status === 200 && ok.body.data.status === 'picked_up', 'cửa hàng nhập đúng mã (chữ thường cũng được) -> đã nhận');
  const again = await call('POST', '/stores/me/orders/confirm', { token: store, body: { pickup_code: o1.body.data.pickup_code } });
  check(again.status === 409, 'xác nhận lần 2 -> 409');

  console.log('\n[4] Thông báo "Có đơn mới" cho chủ quán');
  const notes = await call('GET', '/notifications?unread=true', { token: store });
  const mine = (notes.body.data || []).filter((n) => n.content.startsWith('Test LastBite smoke-a'));
  check(notes.status === 200 && mine.length >= 2, 'chủ quán nhận thông báo cho mỗi đơn mới', mine.length);
  check(!mine.some((n) => n.content.includes(o1.body.data.pickup_code)), 'thông báo không lộ mã nhận hàng');
  if (mine[0]) {
    const read = await call('PATCH', `/notifications/${mine[0].id}/read`, { token: store });
    check(read.status === 200 && read.body.data.is_read === true, 'đánh dấu đã đọc');
    check((await call('PATCH', `/notifications/${mine[0].id}/read`, { token: a.token })).status === 404,
      'không đọc được thông báo của người khác -> 404');
  }

  console.log('\n[5] Quên mật khẩu');
  const f = await call('POST', '/auth/forgot-password', { body: { email: a.email } });
  check(f.status === 200, 'xin mã -> 200');
  const fake = await call('POST', '/auth/forgot-password', { body: { email: 'khong-ton-tai@lastbite.test' } });
  check(fake.status === 200 && fake.body.message === f.body.message, 'email không tồn tại: cùng câu trả lời (không dò được email)');
  const rows = await sql('SELECT id FROM password_resets WHERE user_id = ? AND used_at IS NULL', [a.id]);
  check(rows.length === 1, 'database có đúng 1 mã còn hiệu lực (chỉ lưu bản băm)');
  // Mã thật chỉ in ở cửa sổ backend, nên kiểm thử tự đặt một mã đã biết (bản băm) để thử bước đặt lại.
  await sql('UPDATE password_resets SET code_hash = ? WHERE id = ?', [await bcrypt.hash('246810', 10), rows[0].id]);
  const wrongCode = await call('POST', '/auth/reset-password', { body: { email: a.email, code: '135791', new_password: 'Moi@1234' } });
  check(wrongCode.status === 400 && /còn 4 lần/.test(wrongCode.body.message), 'mã sai -> 400, báo số lần còn lại');
  const reset = await call('POST', '/auth/reset-password', { body: { email: a.email, code: '246810', new_password: 'Moi@1234' } });
  check(reset.status === 200, 'mã đúng -> đặt lại mật khẩu');
  check((await call('POST', '/auth/login', { body: { email: a.email, password: 'Moi@1234' } })).status === 200,
    'đăng nhập bằng mật khẩu mới');
};
