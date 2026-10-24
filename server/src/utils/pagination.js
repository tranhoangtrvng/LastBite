// Phân trang dùng chung (docs/api.md mục 1.6): page mặc định 1, limit mặc định 12, tối đa 50.
// Giá trị sai thì dùng mặc định, vượt giới hạn thì cắt về giới hạn, KHÔNG báo lỗi.
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 12;
  if (limit > 50) limit = 50;
  return { page, limit, offset: (page - 1) * limit };
}

function buildPagination(page, limit, total) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) };
}

module.exports = { parsePagination, buildPagination };
