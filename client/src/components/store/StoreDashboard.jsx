// client/src/components/store/StoreDashboard.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { formatMoney } from '../../utils/format';

export default function StoreDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = () => {
    setLoading(true);
    setError('');
    axiosClient
      .get('/stores/me/stats')
      .then((res) => {
        // Hỗ trợ cả trường hợp res bóc tách data
        const data = res?.data || res;
        setStats(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Không thể tải số liệu thống kê');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-[#E5E7EB] shadow-sm">
        <p className="text-sm text-gray-500">Đang tổng hợp số liệu thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 text-center rounded-2xl border border-red-200 text-red-600 shadow-sm space-y-3">
        <p className="text-sm font-semibold">{error}</p>
        <button
          onClick={fetchStats}
          className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { total_listings = 0, active_now = 0, orders = {}, meals_saved = 0, revenue = 0, weekly = [] } = stats || {};

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút làm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Thống kê hoạt động quán</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Tổng hợp doanh thu, suất ăn giải cứu thành công và hiệu quả theo thời gian thực.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          🔄 Cập nhật số liệu
        </button>
      </div>

      {/* 4 Thẻ KPI chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Doanh thu thực tế</p>
          <p className="text-2xl font-bold text-[#2563EB]">{formatMoney(revenue)}</p>
          <p className="text-xs text-gray-400">Từ các đơn khách đã nhận tại quầy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Suất ăn đã cứu</p>
          <p className="text-2xl font-bold text-emerald-600">
            {meals_saved} <span className="text-sm font-normal text-gray-500">suất</span>
          </p>
          <p className="text-xs text-gray-400">Giảm lãng phí thực phẩm</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Đơn chờ lấy hàng</p>
          <p className="text-2xl font-bold text-amber-500">
            {orders.pending || 0} <span className="text-sm font-normal text-gray-500">đơn</span>
          </p>
          <p className="text-xs text-gray-400">Khách đã đặt giữ chỗ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Món đang mở bán</p>
          <p className="text-2xl font-bold text-purple-600">
            {active_now} <span className="text-sm font-normal text-gray-500">/ {total_listings} món</span>
          </p>
          <p className="text-xs text-gray-400">Đang hiển thị cho người mua</p>
        </div>
      </div>

      {/* Tình trạng đơn hàng & Lịch sử tuần */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bảng phân bổ đơn hàng */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#111827]">Tình trạng đơn hàng</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Đơn hoàn tất (Đã nhận hàng):</span>
              <span className="font-semibold text-emerald-600">{orders.picked_up || 0} đơn</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Đơn đang chờ khách đến:</span>
              <span className="font-semibold text-amber-600">{orders.pending || 0} đơn</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Đơn khách đã hủy:</span>
              <span className="font-semibold text-red-500">{orders.cancelled || 0} đơn</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-[#111827] font-semibold">Tổng lượt đặt chỗ:</span>
              <span className="font-bold text-[#111827]">{orders.total || 0} lượt</span>
            </div>
          </div>
        </div>

        {/* Lịch sử 7 ngày gần nhất */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#111827]">Doanh thu 7 ngày gần nhất</h2>
          {weekly.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Chưa có lượt nhận hàng nào trong 7 ngày qua.</p>
          ) : (
            <div className="space-y-3">
              {weekly.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-[#374151] font-medium">{w.date}</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#2563EB]">{formatMoney(w.revenue)}</span>
                    <span className="text-xs text-gray-500 ml-2">({w.meals} suất)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}