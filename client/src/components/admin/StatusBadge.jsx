const AMBER = 'border-amber-200 bg-amber-50 text-amber-700';
const GREEN = 'border-emerald-200 bg-emerald-50 text-emerald-700';
const RED = 'border-red-200 bg-red-50 text-red-700';
const GRAY = 'border-gray-200 bg-gray-100 text-gray-600';

const KINDS = {
  store: {
    pending: ['Chờ duyệt', AMBER],
    approved: ['Đã duyệt', GREEN],
    locked: ['Đã khoá', RED],
  },
  user: {
    active: ['Hoạt động', GREEN],
    locked: ['Đã khoá', RED],
  },
  listing: {
    active: ['Đang hiển thị', GREEN],
    hidden: ['Đang ẩn', GRAY],
    deleted: ['Đã xoá', RED],
  },
};

export default function StatusBadge({ kind, status }) {
  const [label, tone] = (KINDS[kind] && KINDS[kind][status]) || [status, GRAY];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}
