import { useEffect } from 'react';

// Hộp xác nhận trước khi duyệt, khoá, ẩn, xoá. Nhấn Esc hoặc bấm nền để huỷ.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Xác nhận',
  danger = false,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmTone = danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2563EB] hover:bg-blue-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold text-[#111827]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${confirmTone}`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
