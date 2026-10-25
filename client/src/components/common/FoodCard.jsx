// src/components/common/FoodCard.jsx
import React from 'react';
import Badge from './Badge';
import { PLACEHOLDER_IMAGE, formatMoney } from '../../utils/format';

export default function FoodCard({ item = {}, onBookNow, onCardClick }) {
  const soldOut = Number(item.quantity) === 0;

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
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <Badge type="stock" count={item.quantity} />
        </div>
      </div>

      {/* Thông tin thẻ món */}
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

        {/* Hàng giá & nút Đặt chỗ */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[#2563EB]">
              {formatMoney(item.discountPrice)}
            </span>
            {item.originalPrice ? (
              <span className="text-xs text-[#9CA3AF] line-through">
                {formatMoney(item.originalPrice)}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            disabled={soldOut}
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(item);
            }}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-md shadow-sm transition cursor-pointer"
          >
            {soldOut ? 'Hết hàng' : 'Đặt chỗ'}
          </button>
        </div>
      </div>
    </div>
  );
}
