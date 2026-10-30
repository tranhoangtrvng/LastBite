// Kiểm thử chống bán lố: nhiều người cùng đặt một tin trong cùng lúc.
// 20 tài khoản, mỗi tài khoản gửi 2 yêu cầu cùng lúc (40 yêu cầu) cho tin chỉ có 10 suất.
// Đúng khi: đúng 10 đơn thành công, remaining = 0, tổng suất đã bán = 10 (không âm, không bán lố).
const { call, login, newBuyer, newListing, sql, check } = require('./helpers');

const BUYERS = 20;
const QUANTITY = 10;
const ROUNDS = 3;

module.exports = async function concurrency() {
  console.log('\n[7] Chống bán lố khi đặt đồng thời');
  const store = await login('tuankhang76@gmail.com');
  const buyers = [];
  for (let i = 0; i < BUYERS; i += 1) buyers.push(await newBuyer(`cc-${i}`));

  for (let round = 1; round <= ROUNDS; round += 1) {
    const listing = await newListing(store, `Đồng thời ${round}`, QUANTITY);
    if (!listing) {
      console.log('  (Đã quá muộn trong ngày để tạo tin thử, bỏ qua)');
      return;
    }
    const requests = [];
    for (const b of buyers) {
      for (let k = 0; k < 2; k += 1) {
        requests.push(call('POST', '/orders', { token: b.token, body: { listing_id: listing.id, quantity: 1 } }));
      }
    }
    const statuses = (await Promise.all(requests)).map((r) => r.status);
    const success = statuses.filter((s) => s === 201).length;
    const [{ remaining }] = await sql('SELECT remaining FROM listings WHERE id = ?', [listing.id]);
    const [{ sold }] = await sql(
      "SELECT COALESCE(SUM(quantity), 0) AS sold FROM orders WHERE listing_id = ? AND status <> 'cancelled'",
      [listing.id]
    );
    check(
      success === QUANTITY && remaining === 0 && Number(sold) === QUANTITY,
      `vòng ${round}: ${statuses.length} yêu cầu cùng lúc -> ${success} thành công, còn ${remaining}, đã bán ${sold}`,
      { success, remaining, sold }
    );
    // Huỷ các đơn vòng này để mỗi người lại có chỗ trong giới hạn 2 đơn chờ.
    await sql("UPDATE orders SET status = 'cancelled' WHERE listing_id = ?", [listing.id]);
  }
};
