import React from 'react';

export default function Badge({ type = 'stock', status, count: propCount, text, className = '' }) {
  if (type === 'stock') {
    // Đọc count từ propCount (nếu FoodCard truyền count) hoặc từ status
    const count = Number(propCount !== undefined ? propCount : status) || 0;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
        count <= 2 
          ? 'bg-red-50 text-[#DC2626] border border-red-200' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      } ${className}`}>
        {count === 0 ? 'Hết suất' : `Còn ${count} suất`}
      </span>
    );
  }

  // Kiểu hiển thị trạng thái đơn hàng (order)
  const orderStyles = {
    PENDING: { label: 'Chờ nhận', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Đã nhận', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Đã huỷ', style: 'bg-rose-50 text-rose-600 border-rose-200' },
    NO_SHOW: { label: 'Không đến', style: 'bg-gray-100 text-gray-600 border-gray-200' }
  };

  const current = orderStyles[status] || { label: text || status, style: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.style} ${className}`}>
      {text || current.label}
    </span>
  );
}
