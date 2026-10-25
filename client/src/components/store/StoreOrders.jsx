// client/src/components/store/StoreOrders.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { formatMoney } from '../../utils/format';

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [pickupCodes, setPickupCodes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // 1. Tải danh sách đơn hàng của quán
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get('/stores/me/orders');
      const data = res?.data || res || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCodeChange = (orderId, value) => {
    setPickupCodes((prev) => ({
      ...prev,
      [orderId]: value.toUpperCase(),
    }));
  };

  // 2. Xác nhận nhận hàng qua mã 6 ký tự
  const handleConfirmOrder = async (orderId) => {
    const code = (pickupCodes[orderId] || '').trim().toUpperCase();
    if (!code) {
      alert('Vui lòng nhập mã nhận hàng 6 ký tự!');
      return;
    }

    setSubmittingId(orderId);
    try {
      await axiosClient.post('/stores/me/orders/confirm', { pickup_code: code });
      alert('✅ Xác nhận khách nhận hàng thành công!');
      setPickupCodes((prev) => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err) {
      alert(`Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  // 3. Đánh dấu khách không đến (No-show)
  const handleMarkNoShow = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn đánh dấu khách KHÔNG ĐẾN lấy đơn này?')) return;

    setSubmittingId(orderId);
    try {
      await axiosClient.patch(`/stores/me/orders/${orderId}/no-show`);
      alert('⚠️ Đã đánh dấu khách không đến.');
      fetchOrders();
    } catch (err) {
      alert(`Lỗi: ${err.response?.data?.message || err.message || 'Chưa thể đánh dấu (phải sau khung giờ nhận hàng)'}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Chờ nhận hàng</span>;
      case 'picked_up':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Đã nhận hàng</span>;
      case 'no_show':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">Khách không đến</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Quản lý đơn hàng</h1>
          <p className="text-sm text-[#4B5563] mt-1">Đối soát mã nhận hàng tại quầy và xử lý đơn quá hạn.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          🔄 Làm mới danh sách
        </button>
      </div>

      {/* Tabs lọc trạng thái */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ lấy món' },
          { key: 'picked_up', label: 'Đã hoàn tất' },
          { key: 'no_show', label: 'Không đến' },
          { key: 'cancelled', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.key ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#4B5563] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E5E7EB] text-sm text-gray-500">Đang tải danh sách đơn hàng...</div>
      ) : error ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-red-200 text-red-600 text-sm space-y-3">
          <p>{error}</p>
          <button onClick={fetchOrders} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Thử lại</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E5E7EB] text-sm text-gray-400">Không có đơn hàng nào trong mục này.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3.5">Mã đơn / Khách</th>
                  <th className="px-6 py-3.5">Món ăn</th>
                  <th className="px-6 py-3.5">Số lượng</th>
                  <th className="px-6 py-3.5">Tổng tiền</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-center">Thao tác xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'pending';
                  const customer = order.buyer?.name || order.buyer_name || order.customer_name || 'Khách hàng';
                  const phone = order.buyer?.phone || order.buyer_phone || '';
                  const title = order.listing?.title || order.listing_title || order.food_name || 'Suất ăn';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#111827]">#{order.id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{customer} {phone ? `· ${phone}` : ''}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#111827]">{title}</td>
                      <td className="px-6 py-4 font-medium text-[#374151]">{order.quantity} suất</td>
                      <td className="px-6 py-4 font-bold text-[#2563EB]">{formatMoney(order.total_price)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Mã 6 ký tự"
                              value={pickupCodes[order.id] || ''}
                              onChange={(e) => handleCodeChange(order.id, e.target.value)}
                              className="w-28 px-2 py-1.5 text-xs font-mono font-bold tracking-wider text-center border border-[#D1D5DB] rounded-lg focus:outline-none focus:border-[#2563EB]"
                            />
                            <button
                              disabled={submittingId === order.id}
                              onClick={() => handleConfirmOrder(order.id)}
                              className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                            >
                              Xác nhận
                            </button>
                            <button
                              disabled={submittingId === order.id}
                              onClick={() => handleMarkNoShow(order.id)}
                              title="Chỉ áp dụng khi quá giờ nhận hàng"
                              className="text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition"
                            >
                              Không đến
                            </button>
                          </div>
                        ) : order.status === 'picked_up' ? (
                          <span className="text-xs font-medium text-emerald-600">✓ Đã giao thành công</span>
                        ) : order.status === 'no_show' ? (
                          <span className="text-xs font-medium text-orange-600">Khách không đến lấy</span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}