// Chuẩn hoá dữ liệu user trước khi trả về cho frontend.
// - KHÔNG bao giờ trả password_hash.
// - created_at theo ISO 8601 với múi giờ +07:00 (đúng như docs/api.md).

function toIsoVN(date) {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.getTime() + 7 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+07:00');
}

// store: null hoặc { id, name, status }. Chỉ thêm khi user có role 'store'.
function formatUser(row, store) {
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    created_at: toIsoVN(row.created_at),
  };
  if (row.role === 'store') user.store = store || null;
  return user;
}

module.exports = { formatUser, toIsoVN };