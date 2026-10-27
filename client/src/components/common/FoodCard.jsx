// src/components/common/FoodCard.jsx
import React from 'react';
import Badge from './Badge';
import { PLACEHOLDER_IMAGE, formatMoney, describePickupTiming } from '../../utils/format';

// now: thời điểm hiện tại (mili-giây) do trang cha cập nhật định kỳ, để nhãn đếm ngược tự chạy.
export default function FoodCard({ item = {}, now = Date.now(), onBookNow, onCardClick }) {
  const soldOut = Number(item.quantity) === 0;
  const timing = describePickupTiming(item.pickupStart, item.pickupEnd, now);
  const ended = timing.phase === 'ended';
  const disabled = soldOut || ended;

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
          <Badge type="stock" status={item.quantity} />
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

        <div>
          <p className="text-xs text-[#EA580C] font-medium flex items-center gap-1">
            <span>🕒</span>
            <span>{item.pickupTimeRange}</span>
          </p>
          {/* Đếm ngược: còn bao lâu để nhận (đỏ khi sắp hết giờ) */}
          <p
            className={`text-[11px] mt-0.5 pl-5 ${
              timing.phase === 'ending' || ended ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'
            }`}
          >
            {timing.label}
          </p>
        </div>

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
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(item);
            }}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-md shadow-sm transition cursor-pointer"
          >
            {ended ? 'Hết giờ' : soldOut ? 'Hết hàng' : 'Đặt chỗ'}
          </button>
        </div>
      </div>
    </div>
  );
}
