// src/components/common/FoodCard.jsx
import React from 'react';
import Badge from './Badge';

export default function FoodCard({ item, onBookNow, onCardClick }) {
  return (
    <div 
      onClick={() => onCardClick && onCardClick(item)}
      className="w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
    >
      {/* Khung ảnh món kèm badge Còn X suất */}
      <div className="relative w-full h-40 bg-[#F3F4F6] overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <Badge type="stock" count={item.quantity} />
        </div>
      </div>

      {/* Thông tin thẻ món: padding 14px, các dòng ôm khít không đường kẻ thừa[cite: 10] */}
      <div className="p-3.5 flex flex-col gap-2">
        <div>
          <h3 className="font-bold text-[#111827] text-[15px] leading-tight line-clamp-1 group-hover:text-[#2563EB] transition">
            {item.title}
          </h3>
          <p className="text-xs text-[#6B7280] line-clamp-1 mt-1">
            {item.storeName} • {item.address}
          </p>
        </div>

        <p className="text-xs text-[#EA580C] font-medium flex items-center gap-1">
          <span>🕒</span>
          <span>{item.pickupTimeRange}</span>
        </p>

        {/* Hàng giá & nút Đặt chỗ[cite: 10] */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[#2563EB]">
              {item.discountPrice.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-xs text-[#9CA3AF] line-through">
              {item.originalPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(item);
            }}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md shadow-sm transition cursor-pointer"
          >
            Đặt chỗ
          </button>
        </div>
      </div>
    </div>
  );
}