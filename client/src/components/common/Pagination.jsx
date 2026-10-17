// src/components/common/Pagination.jsx
import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 4, onPageChange, className = '' }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex items-center justify-center gap-2 pt-6 select-none ${className}`}>
      {/* Nút Quay lại [<] */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
      >
        &lt;
      </button>

      {/* Danh sách các số trang [1] [2] [3]... */}
      {pages.map((page) => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-bold transition cursor-pointer ${
              isActive
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'border border-[#E5E7EB] bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Nút Đi tiếp [>] */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
      >
        &gt;
      </button>
    </div>
  );
}