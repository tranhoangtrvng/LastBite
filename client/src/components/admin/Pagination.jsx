export default function Pagination({ pagination, onPage }) {
  if (!pagination) return null;
  const { page, total_pages: totalPages, total } = pagination;
  const btn =
    'cursor-pointer rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600">
      <span>Tổng {total} mục</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
