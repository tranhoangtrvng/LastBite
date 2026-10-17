// src/components/common/SearchBar.jsx
import React from 'react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Tìm món ăn, cửa hàng hoặc khu vực...',
  className = '',
  ...props
}) {
  return (
    <div className={`relative flex items-center w-full max-w-[420px] ${className}`}>
      {/* Icon kính lúp ở đầu ô */}
      <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>

      {/* Ô nhập liệu chuẩn Figma: Chiều cao 40px, bo góc 8px, viền xám nhẹ */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm"
        {...props}
      />

      {/* Nút bấm xóa nhanh khi người dùng đã nhập chữ */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}