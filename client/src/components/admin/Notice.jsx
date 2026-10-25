import { useEffect } from 'react';

// Thông báo ngắn ở đầu trang, tự tắt sau 4 giây. notice = { type: 'success' | 'error', text }.
export default function Notice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [notice, onClose]);

  if (!notice) return null;
  const tone =
    notice.type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div role="status" className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo" className="cursor-pointer font-bold">
        ×
      </button>
    </div>
  );
}
