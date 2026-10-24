import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Modal } from '../../components/common';
import { INITIAL_ORDERS } from '../../mocks/mockData';
import { formatCurrency } from '../../utils/format';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const TABS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ nhận' },
    { key: 'COMPLETED', label: 'Đã nhận' },
    { key: 'CANCELLED', label: 'Đã huỷ' },
    { key: 'NO_SHOW', label: 'Không đến' },
  ];

  const filteredOrders = activeTab === 'ALL' 
    ? orders 
    : orders.filter((o) => o.status === activeTab);

  const handleConfirmCancel = () => {
    setOrders((prev) =>
      prev.map((ord) => ord.id === cancellingOrderId ? { ...ord, status: 'CANCELLED' } : ord)
    );
    setCancellingOrderId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#111827]">Lịch sử đơn hàng</h1>

      {/* Tabs thanh trạng thái */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-6 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#2563EB] text-[#2563EB] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng dạng thẻ lưới */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Chưa có đơn hàng nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="font-mono font-bold text-base text-[#2563EB]">{order.id}</span>
                  <Badge type="order" status={order.status} />
                </div>

                <div className="flex gap-4 mt-3">
                  <img
                    src={order.imageUrl}
                    alt={order.title}
                    className="w-20 h-20 rounded-lg object-cover bg-gray-50 shrink-0 cursor-pointer"
                    onClick={() => navigate(`/foods/${order.foodId}`)}
                  />
                  <div className="space-y-1">
                    <h3 
                      onClick={() => navigate(`/foods/${order.foodId}`)}
                      className="font-bold text-[#111827] text-sm hover:text-[#2563EB] cursor-pointer line-clamp-1"
                    >
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-500">{order.storeName}</p>
                    <p className="text-xs text-[#EA580C] font-medium">🕒 {order.pickupTimeRange}</p>
                    <p className="text-xs text-gray-600">Số lượng: <strong>{order.quantity} suất</strong></p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Thanh toán tại quầy</span>
                  <span className="text-base font-bold text-[#111827]">{formatCurrency(order.totalPrice)}</span>
                </div>

                <div className="flex gap-2">
                  {order.status === 'PENDING' ? (
                    <Button variant="danger" size="sm" onClick={() => setCancellingOrderId(order.id)}>
                      Hủy đơn
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/foods/${order.foodId}`)}>
                      Đặt lại
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal dùng chung cho Xác nhận hủy đơn */}
      <Modal
        isOpen={Boolean(cancellingOrderId)}
        onClose={() => setCancellingOrderId(null)}
        title="Xác nhận hủy đặt chỗ"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{cancellingOrderId}</strong>? Suất ăn này sẽ được nhường lại cho người khác.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setCancellingOrderId(null)}>
              Giữ lại đơn
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmCancel}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}