// src/components/common/SortDropdown.jsx
import React from 'react';

export default function SortDropdown({ value, onChange, className = '' }) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#111827] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm cursor-pointer appearance-none"
      >
        <option value="newest">Sắp xếp: Mới nhất</option>
        <option value="price_asc">Giá: Thấp đến cao</option>
        <option value="discount_desc">Giảm giá nhiều nhất</option>
      </select>

      {/* Mũi tên trỏ xuống ▾ */}
      <span className="absolute right-2.5 pointer-events-none text-gray-500 text-xs">
        ▾
      </span>
    </div>
  );
}