// src/App.jsx - Showcase tinh giản nộp task Base UI
import React, { useState } from 'react';
import { Button, Badge, Input, Modal, FoodCard, PickupCode } from './components/common';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const mockItem = {
    id: 'f1',
    title: 'Cơm gà xối mỡ sốt cay',
    storeName: 'Quán Cơm Gà Bà Năm',
    address: '123 Chùa Láng, Đống Đa',
    originalPrice: 45000,
    discountPrice: 20000,
    quantity: 3,
    pickupTimeRange: '20:30 - 21:30',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500',
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8 max-w-4xl mx-auto space-y-8 text-left">
      <div className="border-b border-[#E5E7EB] pb-3">
        <h1 className="text-xl font-bold text-[#111827]">
          Thư viện Component dùng chung - LastBite (Base UI)
        </h1>
        <p className="text-xs text-gray-500">
          Các thành phần UI cốt lõi phục vụ luồng Người mua, Cửa hàng và Admin
        </p>
      </div>

      {/* 1. Nút bấm */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-3">
        <h2 className="text-sm font-bold text-gray-700">1. Button Variants</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Hủy đơn (Danger)</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="primary" size="sm">Size SM</Button>
          <Button 
            variant="primary" 
            isLoading={loading} 
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            {loading ? 'Đang gửi...' : 'Bấm test Loading'}
          </Button>
        </div>
      </div>

      {/* 2. Badges */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-3">
        <h2 className="text-sm font-bold text-gray-700">2. Badges trạng thái & Số lượng</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge status="PENDING" />
          <Badge status="COMPLETED" />
          <Badge status="CANCELLED" />
          <Badge status="NO_SHOW" />
          <Badge type="stock" count={3} />
        </div>
      </div>

      {/* 3. Input & PickupCode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-3">
          <h2 className="text-sm font-bold text-gray-700">3. Form Input</h2>
          <Input label="Email đăng nhập" placeholder="example@gmail.com" />
          <Input label="Mật khẩu" type="password" placeholder="••••••••" />
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-3">
          <h2 className="text-sm font-bold text-gray-700">4. Mã nhận hàng đối soát</h2>
          <PickupCode code="LB-9482" expireTime="21:30" />
        </div>
      </div>

      {/* 4. Thẻ món ăn & Modal */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">5. FoodCard & Modal</h2>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            Mở thử Modal
          </Button>
        </div>

        <div className="w-[280px]">
          <FoodCard 
            item={mockItem} 
            onBookNow={() => setIsOpen(true)} 
          />
        </div>

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Xác nhận đặt giữ chỗ">
          <div className="space-y-4 text-xs text-gray-600">
            <p>Bạn đang chọn đặt suất: <strong className="text-[#111827]">{mockItem.title}</strong></p>
            <p>Quán: {mockItem.storeName} ({mockItem.address})</p>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
              ℹ️ Thanh toán trực tiếp tại quầy bằng tiền mặt hoặc QR khi nhận đồ.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Quay lại</Button>
              <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>Xác nhận</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}