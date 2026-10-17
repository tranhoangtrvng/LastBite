// src/components/common/Badge.jsx
import React from 'react';

export default function Badge({ type = 'status', status, count, text, className = '' }) {
  if (type === 'stock') {
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded bg-[#DC2626] text-white shadow-sm whitespace-nowrap shrink-0 ${className}`}>
        Còn {count} suất
      </span>
    );
  }

  if (type === 'time') {
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-[#EA580C] border border-orange-200 whitespace-nowrap shrink-0 ${className}`}>
        {text}
      </span>
    );
  }

  const statusStyles = {
    PENDING: 'bg-[#FEF3C7] text-[#B45309] border border-amber-300',     // Đang chờ nhận
    COMPLETED: 'bg-[#DCFCE7] text-[#15803D] border border-emerald-300', // Đã nhận
    CANCELLED: 'bg-[#FEE2E2] text-[#DC2626] border border-rose-300',    // Đã huỷ
    NO_SHOW: 'bg-gray-100 text-[#4B5563] border border-gray-300',        // Không đến
  };

  const statusLabels = {
    PENDING: 'Đang chờ nhận',
    COMPLETED: 'Đã nhận',
    CANCELLED: 'Đã huỷ',
    NO_SHOW: 'Không đến',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${statusStyles[status] || statusStyles.NO_SHOW} ${className}`}>
      {text || statusLabels[status] || status}
    </span>
  );
}