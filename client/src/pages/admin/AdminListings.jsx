import { useCallback, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import DataState from '../../components/admin/DataState';
import Notice from '../../components/admin/Notice';
import Pagination from '../../components/admin/Pagination';
import StatusBadge from '../../components/admin/StatusBadge';
import useAdminList, { useDebounce } from '../../components/admin/useAdminList';
import {
  BTN,
  FIELD,
  TD,
  TH,
  assetUrl,
  formatMoney,
  formatPickupRange,
} from '../../components/admin/adminUtils';

const FILTERS = [
  { value: '', label: 'Tất cả (trừ đã xoá)' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'hidden', label: 'Đang ẩn' },
  { value: 'deleted', label: 'Đã xoá' },
];

function describe(listing, nextStatus) {
  if (nextStatus === 'hidden') {
    return {
      title: 'Ẩn tin đăng',
      message: `Tin “${listing.title}” sẽ biến khỏi trang người mua. Bạn có thể hiện lại sau.`,
      confirmText: 'Ẩn tin',
      danger: false,
      done: `Đã ẩn tin “${listing.title}”`,
    };
  }
  if (nextStatus === 'deleted') {
    return {
      title: 'Xoá tin đăng',
      message: `Tin “${listing.title}” sẽ bị xoá khỏi hệ thống. Đơn cũ vẫn được giữ. Bạn vẫn có thể khôi phục trong mục Đã xoá.`,
      confirmText: 'Xoá tin',
      danger: true,
      done: `Đã xoá tin “${listing.title}”`,
    };
  }
  return {
    title: listing.status === 'deleted' ? 'Khôi phục tin đăng' : 'Hiện lại tin đăng',
    message: `Tin “${listing.title}” sẽ hiển thị lại cho người mua nếu còn hạn và còn suất.`,
    confirmText: listing.status === 'deleted' ? 'Khôi phục' : 'Hiện lại',
    danger: false,
    done: `Đã hiện lại tin “${listing.title}”`,
  };
}

export default function AdminListings() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 400);

  const params = useMemo(
    () => ({ status: status || undefined, q: q || undefined, page, limit: 10 }),
    [status, q, page]
  );
  const goPrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const { items, pagination, loading, error, reload } = useAdminList(adminApi.getListings, params, goPrevPage);

  const [confirm, setConfirm] = useState(null); // { listing, nextStatus }
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const cancelConfirm = useCallback(() => {
    setConfirm(null);
    setDialogError('');
  }, []);

  const ask = (listing, nextStatus) => {
    setDialogError('');
    setConfirm({ listing, nextStatus });
  };

  const submit = async () => {
    const info = describe(confirm.listing, confirm.nextStatus);
    setSaving(true);
    setDialogError('');
    try {
      await adminApi.setListingStatus(confirm.listing.id, confirm.nextStatus);
      setNotice({ type: 'success', text: info.done });
      setConfirm(null);
      reload();
    } catch (err) {
      setDialogError(err.message || 'Không thể cập nhật, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const info = confirm ? describe(confirm.listing, confirm.nextStatus) : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#111827]">Tin đăng</h1>
      <p className="mt-1 text-sm text-gray-600">Ẩn, hiện lại hoặc xoá các tin đăng vi phạm.</p>

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
          aria-label="Tìm tin đăng"
          placeholder="Tìm theo tên món hoặc tên quán"
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
          emptyText="Không có tin đăng nào phù hợp."
          onRetry={reload}
        >
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-[860px] w-full divide-y divide-[#E5E7EB]">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Món</th>
                  <th className={TH}>Giá cứu</th>
                  <th className={TH}>Suất còn</th>
                  <th className={TH}>Giờ nhận</th>
                  <th className={TH}>Trạng thái</th>
                  <th className={TH}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((l) => (
                  <tr key={l.id}>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        {l.image_url ? (
                          <img
                            src={assetUrl(l.image_url)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.visibility = 'hidden';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
                        )}
                        <div>
                          <p className="font-semibold text-[#111827]">{l.title}</p>
                          <p className="text-xs text-gray-500">{l.store?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <p className="font-semibold text-[#111827]">{formatMoney(l.sale_price)}</p>
                      <p className="text-xs text-gray-400 line-through">{formatMoney(l.original_price)}</p>
                    </td>
                    <td className={TD}>
                      {l.remaining}/{l.quantity}
                    </td>
                    <td className={TD}>{formatPickupRange(l.pickup_start, l.pickup_end)}</td>
                    <td className={TD}>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge kind="listing" status={l.status} />
                        {l.status === 'active' && !l.is_available && (
                          <span className="text-xs text-gray-500">{l.remaining === 0 ? 'Hết suất' : 'Hết giờ nhận'}</span>
                        )}
                      </div>
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap gap-2">
                        {l.status === 'active' && (
                          <button type="button" className={BTN.neutral} onClick={() => ask(l, 'hidden')}>
                            Ẩn
                          </button>
                        )}
                        {l.status === 'hidden' && (
                          <button type="button" className={BTN.primary} onClick={() => ask(l, 'active')}>
                            Hiện lại
                          </button>
                        )}
                        {l.status === 'deleted' && (
                          <button type="button" className={BTN.primary} onClick={() => ask(l, 'active')}>
                            Khôi phục
                          </button>
                        )}
                        {l.status !== 'deleted' && (
                          <button type="button" className={BTN.danger} onClick={() => ask(l, 'deleted')}>
                            Xoá
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
