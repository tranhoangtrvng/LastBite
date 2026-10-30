// Hàm dùng chung cho bộ kiểm thử. Kiểm thử gọi API của server ĐANG CHẠY (npm run dev)
// và đọc/dọn dữ liệu thử trực tiếp trong MySQL (dùng chính cấu hình trong server/.env).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const BASE = process.env.TEST_API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const PASSWORD = 'Demo@123';
const RUN_ID = Date.now().toString(36); // để email tài khoản thử không trùng giữa các lần chạy

let pool;
function db() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lastbite',
      timezone: '+07:00',
      connectionLimit: 3,
    });
  }
  return pool;
}
async function sql(query, params = []) {
  const [rows] = await db().query(query, params);
  return rows;
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  try { json = await res.json(); } catch (e) { /* không phải JSON */ }
  return { status: res.status, body: json };
}

async function login(email, password = PASSWORD) {
  const r = await call('POST', '/auth/login', { body: { email, password } });
  if (r.status !== 200) throw new Error(`Không đăng nhập được ${email}: ${r.status} ${r.body?.message}`);
  return r.body.data.token;
}

// Tài khoản thử: email dạng test-...@lastbite.test, tên bắt đầu bằng "Test LastBite" để dọn dễ.
async function newBuyer(label) {
  const email = `test-${RUN_ID}-${label}@lastbite.test`;
  const r = await call('POST', '/auth/register', {
    body: { name: `Test LastBite ${label}`, email, password: PASSWORD, role: 'buyer' },
  });
  if (r.status !== 201) throw new Error(`Không tạo được tài khoản thử: ${r.status} ${r.body?.message}`);
  return { email, token: r.body.data.token, id: r.body.data.user.id };
}

// Giờ Việt Nam dạng ISO, ví dụ 2026-10-30T20:00:00+07:00
function vnIso(date) {
  const d = new Date(date.getTime() + 7 * 3600 * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, '+07:00');
}

// Khung giờ nhận cho tin thử: bắt đầu sau vài phút, kết thúc trước 24:00 hôm nay (quy tắc "trong ngày").
// Trả null nếu đã quá muộn trong ngày để tạo tin (sau khoảng 23:45).
function todayWindow() {
  const now = new Date();
  const vn = new Date(now.getTime() + 7 * 3600 * 1000);
  const minutesLeft = 24 * 60 - (vn.getUTCHours() * 60 + vn.getUTCMinutes());
  if (minutesLeft < 15) return null;
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const end = new Date(now.getTime() + Math.min(60, minutesLeft - 2) * 60 * 1000);
  return { start: vnIso(start), end: vnIso(end) };
}

const createdListingIds = [];
async function newListing(storeToken, title, quantity) {
  const w = todayWindow();
  if (!w) return null;
  const r = await call('POST', '/listings', {
    token: storeToken,
    body: {
      title: `[TEST] ${title}`, category_id: 1, original_price: 30000, sale_price: 15000,
      quantity, pickup_start: w.start, pickup_end: w.end,
    },
  });
  if (r.status !== 201) throw new Error(`Không tạo được tin thử: ${r.status} ${r.body?.message}`);
  createdListingIds.push(r.body.data.id);
  return r.body.data;
}

// Dọn sạch dữ liệu thử để không lẫn vào buổi demo.
async function cleanup() {
  await sql(
    `DELETE o FROM orders o JOIN users u ON u.id = o.buyer_id WHERE u.email LIKE 'test-%@lastbite.test'`
  );
  if (createdListingIds.length) {
    await sql('DELETE FROM orders WHERE listing_id IN (?)', [createdListingIds]);
    await sql('DELETE FROM listings WHERE id IN (?)', [createdListingIds]);
  }
  await sql("DELETE FROM notifications WHERE content LIKE 'Test LastBite%'");
  await sql("DELETE FROM users WHERE email LIKE 'test-%@lastbite.test'");
}

async function close() {
  if (pool) await pool.end();
}

// Ghi kết quả từng phép thử
const results = [];
function check(cond, name, extra) {
  results.push({ ok: Boolean(cond), name });
  console.log(`  ${cond ? 'PASS' : 'FAIL'} ${name}${!cond && extra !== undefined ? '  -> ' + JSON.stringify(extra) : ''}`);
}

module.exports = {
  BASE, PASSWORD, call, login, newBuyer, newListing, todayWindow, sql, cleanup, close, check, results,
};
