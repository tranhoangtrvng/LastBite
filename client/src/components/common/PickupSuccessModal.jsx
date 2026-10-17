// src/components/common/PickupSuccessModal.jsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import PickupCode from './PickupCode';

export default function PickupSuccessModal({
  isOpen,
  onClose,
  bookingData,
  onGoHome,
  onViewOrders,
}) {
  if (!bookingData) return null;

  const expireTime = bookingData.pickupTimeRange 
    ? bookingData.pickupTimeRange.split('-')[1]?.trim() 
    : '21:30';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-[480px]">
      <div className="text-center space-y-4 py-2">
        {/* Icon tích xanh tròn */}
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>

        {/* Tiêu đề thông báo */}
        <div>
          <h3 className="text-xl font-bold text-[#111827]">Đặt giữ chỗ thành công!</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Vui lòng đưa mã bên dưới cho nhân viên khi đến lấy món
          </p>
        </div>

        {/* Nhúng Component PickupCode tại đây */}
        <PickupCode 
          code={bookingData.pickupCode || 'LB-9482'} 
          expireTime={expireTime} 
        />

        {/* Danh sách tóm tắt thông tin nhận món */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 text-left text-xs text-[#374151] space-y-1.5">
          <p>• Suất ăn: <strong>{bookingData.title} × {bookingData.selectedQuantity || 1}</strong></p>
          <p>• Địa chỉ: {bookingData.storeAddress || '123 Chùa Láng, Đống Đa, Hà Nội'}</p>
          <p>• Thanh toán tại quầy: <strong className="text-[#2563EB]">{(bookingData.totalPrice || 20000).toLocaleString('vi-VN')}đ</strong></p>
        </div>

        {/* Cảnh báo tự hủy đơn */}
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 text-left">
          ⚠️ Quán chỉ giữ món trong khung giờ hẹn. Đơn sẽ tự hủy nếu bạn không đến nhận trước giờ hẹn.
        </div>

        {/* Cặp nút điều hướng chân modal */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="md" className="flex-1 text-xs" onClick={onGoHome}>
            VỀ TRANG CHỦ
          </Button>
          <Button variant="primary" size="md" className="flex-1 text-xs" onClick={onViewOrders}>
            XEM ĐƠN HÀNG
          </Button>
        </div>
      </div>
    </Modal>
  );
}