import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { formatMoney } from '../../components/admin/adminUtils';

function Card({ label, value, hint, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? 'border-emerald-200 bg-emerald-50' : 'border-[#E5E7EB] bg-white'
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`mt-1 font-bold ${highlight ? 'text-4xl text-emerald-700' : 'text-2xl text-[#111827]'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// "2026-10-21" -> "21/10"
const shortDate = (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Không tải được thống kê');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-[#111827]">Tổng quan</h1>
        <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 cursor-pointer rounded-lg border border-[#E5E7EB] px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  if (loading || !stats) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-[#111827]">Tổng quan</h1>
        <p className="mt-5 text-sm text-gray-600">Đang tải...</p>
      </section>
    );
  }

  const { users, stores, listings, orders, weekly = [] } = stats;
  const maxMeals = Math.max(1, ...weekly.map((w) => w.meals));

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#111827]">Tổng quan</h1>
      <p className="mt-1 text-sm text-gray-600">Số liệu toàn hệ thống LastBite.</p>

      {stores.pending > 0 && (
        <Link
          to="/admin/stores"
          className="mt-5 block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          Có {stores.pending} cửa hàng đang chờ duyệt. Bấm để xem.
        </Link>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card highlight label="Số suất đã cứu" value={stats.meals_saved} hint="Tổng suất của các đơn đã nhận" />
        <Card label="Doanh thu" value={formatMoney(stats.revenue_total)} hint="Từ các đơn đã nhận" />
        <Card
          label="Đơn hàng"
          value={orders.total}
          hint={`${orders.pending} chờ nhận · ${orders.picked_up} đã nhận · ${orders.cancelled} đã huỷ · ${orders.no_show} không đến`}
        />
        <Card
          label="Cửa hàng"
          value={stores.total}
          hint={`${stores.approved} đã duyệt · ${stores.pending} chờ duyệt · ${stores.locked} đã khoá`}
        />
        <Card
          label="Người dùng"
          value={users.total}
          hint={`${users.buyers} người mua · ${users.stores} cửa hàng · ${users.admins} quản trị · ${users.locked} bị khoá`}
        />
        <Card label="Tin đang hiển thị" value={listings.active_now} hint={`Trên tổng ${listings.total} tin`} />
      </div>

      <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h2 className="text-base font-bold text-[#111827]">Suất đã cứu trong 7 ngày gần nhất</h2>
        <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label="Biểu đồ số suất đã cứu theo ngày">
          {weekly.map((w) => (
            <div key={w.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold text-gray-700">{w.meals}</span>
              <div
                className="w-full max-w-[40px] rounded-t-md bg-[#2563EB]"
                style={{ height: `${Math.max(2, (w.meals / maxMeals) * 100)}%` }}
              />
              <span className="text-xs text-gray-500">{shortDate(w.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
