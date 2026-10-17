// src/components/common/OrderCard.jsx
import React from 'react';
import Badge from './Badge';
import Button from './Button';

export default function OrderCard({ order, onCancelOrder, onReorder }) {
  const isPending = order.status === 'PENDING';

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-3.5 text-left">
      {/* Tiêu đề quán & Badge trạng thái: thêm gap-3 và items-start */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
        <h4 className="font-bold text-sm text-[#111827] flex-1 leading-snug">
          {order.storeName} • {order.address}
        </h4>
        <Badge status={order.status} />
      </div>

      {/* Thông tin chi tiết món & thời gian */}
      <div className="space-y-1 text-xs text-[#4B5563]">
        <p className="font-semibold text-sm text-[#111827]">
          {order.foodTitle} × {order.quantity}
        </p>
        
        {isPending ? (
          <>
            {/* Đã bỏ chữ "hôm nay" phía sau để tránh lỗi lặp 2 lần */}
            <p className="text-orange-600 font-medium">Nhận trước: {order.expireTime}</p>
            <p className="font-mono text-gray-700">Mã: <strong className="text-[#111827]">{order.pickupCode}</strong></p>
          </>
        ) : (
          <p className="text-gray-500">Đã nhận lúc: {order.completedTime}</p>
        )}

        <p className="pt-1">
          Thanh toán tại quầy: <strong className="text-[#2563EB] text-sm">{order.totalPrice.toLocaleString('vi-VN')}đ</strong>
        </p>
      </div>

      {/* Nút hành động Full-width */}
      <div className="pt-2">
        {isPending ? (
          <Button 
            variant="danger" 
            size="md" 
            className="w-full text-xs font-bold"
            onClick={() => onCancelOrder && onCancelOrder(order)}
          >
            HỦY ĐƠN
          </Button>
        ) : (
          <Button 
            variant="primary" 
            size="md" 
            className="w-full text-xs font-bold"
            onClick={() => onReorder && onReorder(order)}
          >
            ĐẶT LẠI
          </Button>
        )}
      </div>
    </div>
  );
}