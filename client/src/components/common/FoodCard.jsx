import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { formatCurrency } from '../../utils/format';

export default function FoodCard({ item = {}, onBookNow, onCardClick }) {
  const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  return (
    <div 
      onClick={() => onCardClick && onCardClick(item)}
      className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full cursor-pointer group"
    >
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        <img
          src={item.imageUrl || fallbackImg}
          alt={item.title || 'Món ăn'}
          onError={(e) => { e.currentTarget.src = fallbackImg; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <Badge type="stock" status={item.quantity} />
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-[#111827] text-base line-clamp-1 group-hover:text-[#2563EB] transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 line-clamp-1">
            {item.storeName} • {item.address}
          </p>
          <p className="text-xs text-[#EA580C] font-medium mt-2 flex items-center gap-1">
            <span>🕒</span> {item.pickupTimeRange}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#2563EB]">
              {formatCurrency(item.discountPrice)}
            </span>
            {item.originalPrice && (
              <span className="text-xs text-[#9CA3AF] line-through">
                {formatCurrency(item.originalPrice)}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            disabled={item.quantity === 0}
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(item);
            }}
          >
            {item.quantity === 0 ? 'Hết hàng' : 'Đặt chỗ'}
          </Button>
        </div>
      </div>
    </div>
  );
}