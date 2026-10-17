// src/components/common/Input.jsx
import React, { useState } from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  error,
  helperText,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-[#111827]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          className={`w-full h-11 px-3.5 rounded-lg border text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:ring-2 focus:ring-[#2563EB]/20 ${
            error ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#2563EB]'
          } ${isPasswordType ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {showPassword ? 'Ẩn' : 'Hiện'}
          </button>
        )}
      </div>
      {error ? (
        <span className="text-xs text-[#DC2626] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
}