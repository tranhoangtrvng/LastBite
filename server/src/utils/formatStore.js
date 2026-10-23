// Chuẩn hoá 1 dòng bảng stores thành đối tượng Store đúng như docs/api.md mục 4.
// - DECIMAL (latitude, longitude) mysql2 trả dạng chuỗi -> đổi sang số.
// - created_at theo ISO 8601 kèm +07:00.
// - owner_id chỉ trả cho chủ cửa hàng và admin (các API công khai sau này gọi với includeOwner = false).
const { toIsoVN } = require('./formatUser');

const toNumberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

function formatStore(row, { includeOwner = true } = {}) {
  const store = {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    description: row.description,
    image_url: row.image_url,
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    status: row.status,
    created_at: toIsoVN(row.created_at),
  };
  if (includeOwner) store.owner_id = row.owner_id;
  return store;
}

module.exports = { formatStore };
