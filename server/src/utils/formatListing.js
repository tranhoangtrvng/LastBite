// Chuẩn hoá 1 dòng dữ liệu (kết quả JOIN listings + stores + categories)
// thành đối tượng Listing đúng như docs/api.md mục 3.5.
const { toIsoVN } = require('./formatUser');

// DECIMAL trong MySQL được mysql2 trả về dạng chuỗi ("10.768000") -> đổi sang số.
function toNumberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function formatListing(row) {
  const originalPrice = Number(row.original_price);
  const salePrice = Number(row.sale_price);
  const remaining = Number(row.remaining);

  return {
    id: row.id,
    store_id: row.store_id,
    store: {
      id: row.store_id,
      name: row.store_name,
      address: row.store_address,
      image_url: row.store_image_url,
      latitude: toNumberOrNull(row.store_latitude),
      longitude: toNumberOrNull(row.store_longitude),
    },
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    original_price: originalPrice,
    sale_price: salePrice,
    discount_percent: originalPrice > 0 ? Math.round((1 - salePrice / originalPrice) * 100) : 0,
    quantity: Number(row.quantity),
    remaining,
    pickup_start: toIsoVN(row.pickup_start),
    pickup_end: toIsoVN(row.pickup_end),
    status: row.status,
    is_available: remaining > 0 && new Date(row.pickup_end).getTime() > Date.now(),
    created_at: toIsoVN(row.created_at),
  };
}

module.exports = { formatListing };
