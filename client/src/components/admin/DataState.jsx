// Hiển thị 3 trạng thái của một bảng: đang tải, lỗi (có nút Thử lại), rỗng.
function Box({ children }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-gray-600">
      {children}
    </div>
  );
}

export default function DataState({ loading, error, isEmpty, emptyText, onRetry, children }) {
  if (error) {
    return (
      <Box>
        <p className="text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 cursor-pointer rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Thử lại
        </button>
      </Box>
    );
  }
  if (loading && isEmpty) return <Box>Đang tải...</Box>;
  if (isEmpty) return <Box>{emptyText}</Box>;
  return <div className={loading ? 'opacity-60 transition-opacity' : ''}>{children}</div>;
}
