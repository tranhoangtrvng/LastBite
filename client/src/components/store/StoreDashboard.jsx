// client/src/components/store/StoreDashboard.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { formatMoney } from '../../utils/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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
        setStats(res?.data || res);
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
      <div className="bg-white p-12 text-center rounded-2xl border border-[#E5E7EB] text-sm text-gray-500">
        Đang tổng hợp số liệu thống kê...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 text-center rounded-2xl border border-red-200 text-red-600 text-sm space-y-3">
        <p className="font-semibold">{error}</p>
        <button onClick={fetchStats} className="text-xs font-semibold text-white bg-[#2563EB] px-4 py-2 rounded-lg">
          Thử lại
        </button>
      </div>
    );
  }

  const { total_listings = 0, active_now = 0, orders = {}, meals_saved = 0, revenue = 0, weekly = [] } = stats || {};

  // Định dạng dữ liệu cho biểu đồ Recharts
  const chartData = weekly.map((item) => ({
    date: item.date.slice(5), // Lấy MM-DD
    revenue: Number(item.revenue),
    meals: Number(item.meals),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Thống kê hoạt động quán</h1>
          <p className="text-sm text-[#4B5563] mt-1">Biểu đồ doanh thu và tác động giải cứu thực phẩm thực tế.</p>
        </div>
        <button
          onClick={fetchStats}
          className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-blue-100 px-3 py-2 rounded-lg transition"
        >
          🔄 Cập nhật số liệu
        </button>
      </div>

      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Doanh thu thực tế</p>
          <p className="text-2xl font-bold text-[#2563EB]">{formatMoney(revenue)}</p>
          <p className="text-xs text-gray-400">Từ các đơn khách đã nhận tại quầy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Suất ăn đã cứu</p>
          <p className="text-2xl font-bold text-emerald-600">{meals_saved} <span className="text-sm font-normal text-gray-500">suất</span></p>
          <p className="text-xs text-gray-400">Giảm lãng phí thực phẩm</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Đơn chờ lấy hàng</p>
          <p className="text-2xl font-bold text-amber-500">{orders.pending || 0} <span className="text-sm font-normal text-gray-500">đơn</span></p>
          <p className="text-xs text-gray-400">Khách đã đặt giữ chỗ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Món đang mở bán</p>
          <p className="text-2xl font-bold text-purple-600">{active_now} <span className="text-sm font-normal text-gray-500">/ {total_listings} món</span></p>
          <p className="text-xs text-gray-400">Đang hiển thị cho người mua</p>
        </div>
      </div>

      {/* Biểu đồ Recharts và Tình trạng đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Recharts */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827]">Biểu đồ doanh thu 7 ngày (Recharts)</h2>
            <span className="text-xs text-gray-400">Đơn vị: VNĐ</span>
          </div>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Chưa có giao dịch hoàn tất trong 7 ngày qua.</p>
          ) : (
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày ${label}`}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tình trạng đơn hàng */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#111827]">Tình trạng đơn hàng</h2>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Đơn hoàn tất (Đã nhận):</span>
              <span className="font-semibold text-emerald-600">{orders.picked_up || 0} đơn</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Đơn đang chờ khách đến:</span>
              <span className="font-semibold text-amber-600">{orders.pending || 0} đơn</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-[#4B5563]">Khách không đến nhận:</span>
              <span className="font-semibold text-orange-600">{orders.no_show || 0} đơn</span>
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
      </div>
    </div>
  );
}