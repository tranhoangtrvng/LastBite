// Câu SELECT dùng chung và hàm chuẩn hoá cho "đối tượng Order" (docs/api.md mục 3.8).
const { toIsoVN } = require('./formatUser');

const ORDER_STATUSES = ['pending', 'picked_up', 'cancelled', 'no_show'];

// JOIN: đơn -> tin -> cửa hàng, và đơn -> người mua. Dùng cho mọi API trả về đơn.
const ORDER_SELECT = `
  SELECT
    o.id, o.quantity, o.unit_price, o.total_price, o.pickup_code, o.status,
    o.created_at, o.picked_up_at, o.cancelled_at, o.buyer_id,
    l.id AS listing_id, l.title AS listing_title, l.image_url AS listing_image_url,
    l.pickup_start, l.pickup_end, l.store_id,
    s.name AS store_name, s.address AS store_address, s.phone AS store_phone,
    u.name AS buyer_name, u.phone AS buyer_phone
  FROM orders o
  JOIN listings l ON l.id = o.listing_id
  JOIN stores s ON s.id = l.store_id
  JOIN users u ON u.id = o.buyer_id`;

// withBuyer = true khi người xem là cửa hàng hoặc admin (cần biết tên, SĐT khách).
function formatOrder(row, withBuyer = false) {
  const order = {
    id: row.id,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total_price: Number(row.total_price),
    pickup_code: row.pickup_code,
    status: row.status,
    created_at: toIsoVN(row.created_at),
    picked_up_at: toIsoVN(row.picked_up_at),
    cancelled_at: toIsoVN(row.cancelled_at),
    listing: {
      id: row.listing_id,
      title: row.listing_title,
      image_url: row.listing_image_url,
      pickup_start: toIsoVN(row.pickup_start),
      pickup_end: toIsoVN(row.pickup_end),
    },
    store: {
      id: row.store_id,
      name: row.store_name,
      address: row.store_address,
      phone: row.store_phone,
    },
  };
  if (withBuyer) {
    order.buyer = { id: row.buyer_id, name: row.buyer_name, phone: row.buyer_phone };
  }
  return order;
}

module.exports = { ORDER_SELECT, ORDER_STATUSES, formatOrder };
