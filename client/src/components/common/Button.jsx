// src/components/common/Button.jsx
import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | danger | outline
  size = 'md',         // sm | md | lg
  fullWidth = false,   // Bật true nếu muốn nút giãn hết 100% chiều ngang
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  // Cố định chiều cao và font chữ theo chuẩn hệ thống nút Figma
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs font-semibold rounded-md',      // Cao 32px, chữ 12px (Đặt chỗ trên FoodCard)
    md: 'h-10 px-4 text-sm font-bold rounded-lg',         // Cao 40px, chữ 14px (Kích thước chuẩn phổ biến)[cite: 14]
    lg: 'h-12 px-6 text-base font-bold rounded-lg',       // Cao 48px, chữ 16px (Đầm tay, không còn bị tràn viền)
  };

  const variantClasses = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm disabled:bg-blue-300',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-[#4B5563] disabled:bg-gray-50',
    danger: 'bg-[#DC2626] hover:bg-red-700 text-white shadow-sm disabled:bg-red-300',
    outline: 'bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] disabled:opacity-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}