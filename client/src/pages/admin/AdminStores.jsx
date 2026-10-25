import { useCallback, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import DataState from '../../components/admin/DataState';
import Notice from '../../components/admin/Notice';
import Pagination from '../../components/admin/Pagination';
import StatusBadge from '../../components/admin/StatusBadge';
import useAdminList, { useDebounce } from '../../components/admin/useAdminList';
import { BTN, FIELD, TD, TH, formatDate } from '../../components/admin/adminUtils';

const FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'locked', label: 'Đã khoá' },
];

// Nội dung hộp xác nhận theo thao tác.
function describe(store, nextStatus) {
  if (nextStatus === 'locked') {
    return {
      title: 'Khoá cửa hàng',
      message: `Tin đăng của “${store.name}” sẽ biến khỏi trang người mua. Các đơn đang chờ nhận vẫn được giữ.`,
      confirmText: 'Khoá cửa hàng',
      danger: true,
      done: `Đã khoá cửa hàng “${store.name}”`,
    };
  }
  if (store.status === 'locked') {
    return {
      title: 'Mở khoá cửa hàng',
      message: `“${store.name}” sẽ hoạt động trở lại và các tin còn hạn hiện lại cho người mua.`,
      confirmText: 'Mở khoá',
      danger: false,
      done: `Đã mở khoá cửa hàng “${store.name}”`,
    };
  }
  return {
    title: 'Duyệt cửa hàng',
    message: `“${store.name}” sẽ được phép đăng tin và hiển thị cho người mua.`,
    confirmText: 'Duyệt',
    danger: false,
    done: `Đã duyệt cửa hàng “${store.name}”`,
  };
}

export default function AdminStores() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 400);

  const params = useMemo(
    () => ({ status: status || undefined, q: q || undefined, page, limit: 10 }),
    [status, q, page]
  );
  const goPrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const { items, pagination, loading, error, reload } = useAdminList(adminApi.getStores, params, goPrevPage);

  const [confirm, setConfirm] = useState(null); // { store, nextStatus }
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const cancelConfirm = useCallback(() => {
    setConfirm(null);
    setDialogError('');
  }, []);

  const ask = (store, nextStatus) => {
    setDialogError('');
    setConfirm({ store, nextStatus });
  };

  const submit = async () => {
    const info = describe(confirm.store, confirm.nextStatus);
    setSaving(true);
    setDialogError('');
    try {
      await adminApi.setStoreStatus(confirm.store.id, confirm.nextStatus);
      setNotice({ type: 'success', text: info.done });
      setConfirm(null);
      reload();
    } catch (err) {
      setDialogError(err.message || 'Không thể cập nhật, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const info = confirm ? describe(confirm.store, confirm.nextStatus) : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#111827]">Cửa hàng</h1>
      <p className="mt-1 text-sm text-gray-600">Duyệt cửa hàng mới đăng ký và khoá cửa hàng vi phạm.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <select
          aria-label="Lọc theo trạng thái"
          className={FIELD}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Tìm cửa hàng"
          placeholder="Tìm theo tên quán hoặc email chủ quán"
          className={`${FIELD} w-full sm:w-80`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        <Notice notice={notice} onClose={closeNotice} />
        <DataState
          loading={loading}
          error={error}
          isEmpty={items.length === 0}
          emptyText="Không có cửa hàng nào phù hợp."
          onRetry={reload}
        >
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-[760px] w-full divide-y divide-[#E5E7EB]">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Cửa hàng</th>
                  <th className={TH}>Chủ quán</th>
                  <th className={TH}>Số tin</th>
                  <th className={TH}>Ngày đăng ký</th>
                  <th className={TH}>Trạng thái</th>
                  <th className={TH}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className={TD}>
                      <p className="font-semibold text-[#111827]">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.address}</p>
                    </td>
                    <td className={TD}>
                      <p>{s.owner?.name}</p>
                      <p className="text-xs text-gray-500">{s.owner?.email}</p>
                    </td>
                    <td className={TD}>{s.listing_count}</td>
                    <td className={TD}>{formatDate(s.created_at)}</td>
                    <td className={TD}>
                      <StatusBadge kind="store" status={s.status} />
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap gap-2">
                        {s.status === 'pending' && (
                          <button type="button" className={BTN.primary} onClick={() => ask(s, 'approved')}>
                            Duyệt
                          </button>
                        )}
                        {s.status === 'locked' && (
                          <button type="button" className={BTN.primary} onClick={() => ask(s, 'approved')}>
                            Mở khoá
                          </button>
                        )}
                        {s.status !== 'locked' && (
                          <button type="button" className={BTN.danger} onClick={() => ask(s, 'locked')}>
                            Khoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={info?.title}
        message={info?.message}
        confirmText={info?.confirmText}
        danger={info?.danger}
        loading={saving}
        error={dialogError}
        onConfirm={submit}
        onCancel={cancelConfirm}
      />
    </section>
  );
}
