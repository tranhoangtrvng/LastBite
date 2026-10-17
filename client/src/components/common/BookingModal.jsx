// src/components/common/BookingModal.jsx
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function BookingModal({ isOpen, onClose, item, onConfirm }) {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const maxQty = item.quantity || 3;
  const totalPrice = item.discountPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < maxQty) setQuantity(quantity + 1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận đặt giữ chỗ" maxWidth="max-w-[500px]">
      <div className="space-y-4 text-left">
        {/* Tên món & Tên quán[cite: 13] */}
        <div className="border-b border-[#E5E7EB] pb-3">
          <h4 className="font-bold text-base text-[#111827]">{item.title}</h4>
          <p className="text-xs text-[#6B7280] mt-0.5">{item.storeName}</p>
        </div>

        {/* Bộ đếm số lượng suất[cite: 13] */}
        <div>
          <label className="text-xs font-semibold text-[#111827] block mb-2">
            Số lượng muốn đặt:
          </label>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-[#111827]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= maxQty}
                className="w-9 h-9 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <span className="text-xs text-[#6B7280]">
              (Tối đa: {maxQty} suất)
            </span>
          </div>
        </div>

        {/* Tóm tắt tiền[cite: 13] */}
        <div className="space-y-1 text-xs text-[#4B5563] pt-1">
          <p>Đơn giá: <span className="font-semibold">{item.discountPrice.toLocaleString('vi-VN')}đ</span></p>
          <p className="text-sm font-bold text-[#111827]">
            TỔNG THANH TOÁN TẠI QUÁN: <span className="text-[#2563EB]">{totalPrice.toLocaleString('vi-VN')}đ</span>
          </p>
        </div>

        {/* Lưu ý nhận món[cite: 13] */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 leading-relaxed">
          ℹ️ Vui lòng đến nhận hàng đúng khung giờ <strong>{item.pickupTimeRange}</strong>. Đơn hàng sẽ thanh toán trực tiếp tại quầy bằng tiền mặt hoặc chuyển khoản QR khi nhận đồ.
        </div>

        {/* Cụm 2 nút chân modal[cite: 13] */}
        <div className="flex gap-3 pt-3 border-t border-[#E5E7EB]">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            QUAY LẠI
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="flex-1"
            onClick={() => onConfirm({ ...item, selectedQuantity: quantity, totalPrice })}
          >
            XÁC NHẬN ĐẶT CHỖ
          </Button>
        </div>
      </div>
    </Modal>
  );
}