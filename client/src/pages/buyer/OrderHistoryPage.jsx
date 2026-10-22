// client/src/pages/buyer/OrderHistoryPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// 5 Tab trạng thái theo đúng thiết kế Frame 6 trên Figma
const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ nhận' },
  { id: 'COMPLETED', label: 'Đã nhận' },
  { id: 'CANCELLED', label: 'Đã huỷ' },
  { id: 'NO_SHOW', label: 'Không đến' }
];

// Dữ liệu mẫu ban đầu đã nạp ảnh thật
const INITIAL_ORDERS = [
  {
    id: 'LB-ORD-101',
    code: 'LB-9482',
    storeName: 'Quán Cơm Gà Bà Năm',
    address: '123 Chùa Láng',
    foodId: 1,
    title: 'Cơm gà xối mỡ sốt cay',
    quantity: 1,
    pickupTime: '21:30 hôm nay',
    totalPrice: 20000,
    status: 'PENDING',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'LB-ORD-102',
    code: 'LB-4219',
    storeName: 'Tiệm Bánh Mì Chảo 99',
    address: '45 Chùa Láng',
    foodId: 2,
    title: 'Bánh mì chảo',
    quantity: 1,
    completedTime: '12:15 - 12/10/2026',
    totalPrice: 35000,
    status: 'COMPLETED',
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=300&auto=format&fit=crop&q=80'
  }
];

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Đếm số lượng đơn tương ứng cho từng tab
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
      NO_SHOW: orders.filter((o) => o.status === 'NO_SHOW').length
    };
  }, [orders]);

  // Lọc danh sách theo tab đang chọn
  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  // Xử lý xác nhận HỦY ĐƠN
  const handleConfirmCancel = () => {
    if (!orderToCancel) return;
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderToCancel.id ? { ...ord, status: 'CANCELLED' } : ord
      )
    );
    setOrderToCancel(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto py-4 px-2 sm:px-0">
      {/* 1. Tiêu đề trang */}
      <h1 className="text-2xl font-bold text-[#111827] mb-4">
        Đơn hàng của tôi
      </h1>

      {/* 2. Thanh Tabs trạng thái */}
      <div className="flex items-center gap-6 border-b border-transparent mb-6 text-sm overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-1 font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab.label}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {/* 3. Lưới hiển thị 2 cột chuẩn Figma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-sm text-[#6B7280] bg-white rounded-xl border border-[#E5E7EB]">
            Không có đơn hàng nào trong mục này.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isCompleted = order.status === 'COMPLETED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Header thẻ: Tên quán & Địa chỉ • Badge trạng thái */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-sm text-[#111827] truncate">
                      <strong className="font-bold">{order.storeName}</strong>
                      <span className="text-[#6B7280] font-normal">
                        {' '}• {order.address}
                      </span>
                    </span>

                    {/* Badge trạng thái */}
                    {isPending && (
                      <span className="bg-[#FEF08A] text-[#854D0E] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                        Đang chờ nhận
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-[#22C55E] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                        Đã nhận
                      </span>
                    )}
                    {order.status === 'CANCELLED' && (
                      <span className="bg-[#FEE2E2] text-[#DC2626] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                        Đã huỷ
                      </span>
                    )}
                    {order.status === 'NO_SHOW' && (
                      <span className="bg-gray-100 text-[#4B5563] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                        Không đến
                      </span>
                    )}
                  </div>

                  {/* Body thẻ: Ảnh thật sắc nét + Thông tin đơn hàng */}
                  <div className="flex gap-4 items-start mb-6">
                    <img
                      src={order.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                      alt={order.title}
                      onClick={() => navigate(`/foods/${order.foodId}`)}
                      className="w-[72px] h-[72px] rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-85 transition border border-[#E5E7EB] bg-gray-100"
                      title="Xem chi tiết món"
                    />

                    <div className="text-xs text-[#4B5563] space-y-1">
                      <p
                        onClick={() => navigate(`/foods/${order.foodId}`)}
                        className="text-sm font-bold text-[#111827] cursor-pointer hover:text-[#2563EB] transition"
                      >
                        {order.title} × {order.quantity}
                      </p>

                      {isPending && (
                        <>
                          <p className="text-[#4B5563]">
                            Nhận trước: {order.pickupTime}
                          </p>
                          <p className="text-[#4B5563]">
                            Mã: <strong className="font-bold text-[#111827]">{order.code}</strong>
                          </p>
                        </>
                      )}

                      {isCompleted && (
                        <p className="text-[#4B5563]">
                          Đã nhận lúc: {order.completedTime}
                        </p>
                      )}

                      <p className="text-[#4B5563]">
                        Tổng tiền:{' '}
                        <strong className="text-sm font-bold text-[#2563EB]">
                          {order.totalPrice.toLocaleString('vi-VN')}đ
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nút hành động Full-width chân thẻ */}
                <div>
                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => setOrderToCancel(order)}
                      className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg transition tracking-wide cursor-pointer uppercase"
                    >
                      HỦY ĐƠN
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/foods/${order.foodId}`)}
                      className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition tracking-wide cursor-pointer uppercase"
                    >
                      ĐẶT LẠI
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal xác nhận HỦY ĐƠN (Icon Vector SVG chuẩn nét) */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-gray-100">
            {/* SVG Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto border border-red-100">
              <svg 
                className="w-6 h-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="2" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">
                Xác nhận hủy đơn?
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Suất ăn <strong className="text-[#111827]">"{orderToCancel.title}"</strong> sẽ được mở lại cho người khác và mã <strong>{orderToCancel.code}</strong> sẽ bị vô hiệu hóa.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl transition cursor-pointer shadow-sm"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}