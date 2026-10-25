import { useCallback, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import DataState from '../../components/admin/DataState';
import Notice from '../../components/admin/Notice';
import Pagination from '../../components/admin/Pagination';
import StatusBadge from '../../components/admin/StatusBadge';
import useAdminList, { useDebounce } from '../../components/admin/useAdminList';
import { BTN, FIELD, TD, TH, formatDate } from '../../components/admin/adminUtils';

const ROLE_LABEL = { buyer: 'Người mua', store: 'Cửa hàng', admin: 'Quản trị viên' };
const ROLE_FILTERS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'buyer', label: 'Người mua' },
  { value: 'store', label: 'Cửa hàng' },
  { value: 'admin', label: 'Quản trị viên' },
];
const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'locked', label: 'Đã khoá' },
];

function describe(user, nextStatus) {
  if (nextStatus === 'locked') {
    return {
      title: 'Khoá tài khoản',
      message: `“${user.name}” sẽ không đăng nhập được và các phiên đang đăng nhập bị chặn ngay.`,
      confirmText: 'Khoá tài khoản',
      danger: true,
      done: `Đã khoá tài khoản “${user.name}”`,
    };
  }
  return {
    title: 'Mở khoá tài khoản',
    message: `“${user.name}” sẽ đăng nhập lại được bình thường.`,
    confirmText: 'Mở khoá',
    danger: false,
    done: `Đã mở khoá tài khoản “${user.name}”`,
  };
}

export default function AdminUsers() {
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 400);

  const params = useMemo(
    () => ({ role: role || undefined, status: status || undefined, q: q || undefined, page, limit: 10 }),
    [role, status, q, page]
  );
  const goPrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const { items, pagination, loading, error, reload } = useAdminList(adminApi.getUsers, params, goPrevPage);

  const [confirm, setConfirm] = useState(null); // { user, nextStatus }
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const cancelConfirm = useCallback(() => {
    setConfirm(null);
    setDialogError('');
  }, []);

  const ask = (user, nextStatus) => {
    setDialogError('');
    setConfirm({ user, nextStatus });
  };

  const submit = async () => {
    const info = describe(confirm.user, confirm.nextStatus);
    setSaving(true);
    setDialogError('');
    try {
      await adminApi.setUserStatus(confirm.user.id, confirm.nextStatus);
      setNotice({ type: 'success', text: info.done });
      setConfirm(null);
      reload();
    } catch (err) {
      setDialogError(err.message || 'Không thể cập nhật, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const info = confirm ? describe(confirm.user, confirm.nextStatus) : null;

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#111827]">Người dùng</h1>
      <p className="mt-1 text-sm text-gray-600">Khoá hoặc mở khoá tài khoản. Không thể khoá tài khoản quản trị viên.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <select
          aria-label="Lọc theo vai trò"
          className={FIELD}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          className={FIELD}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Tìm người dùng"
          placeholder="Tìm theo tên hoặc email"
          className={`${FIELD} w-full sm:w-72`}
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
          emptyText="Không có người dùng nào phù hợp."
          onRetry={reload}
        >
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="min-w-[720px] w-full divide-y divide-[#E5E7EB]">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Người dùng</th>
                  <th className={TH}>Số điện thoại</th>
                  <th className={TH}>Vai trò</th>
                  <th className={TH}>Ngày tạo</th>
                  <th className={TH}>Trạng thái</th>
                  <th className={TH}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((u) => (
                  <tr key={u.id}>
                    <td className={TD}>
                      <p className="font-semibold text-[#111827]">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className={TD}>{u.phone || '—'}</td>
                    <td className={TD}>{ROLE_LABEL[u.role] || u.role}</td>
                    <td className={TD}>{formatDate(u.created_at)}</td>
                    <td className={TD}>
                      <StatusBadge kind="user" status={u.status} />
                    </td>
                    <td className={TD}>
                      {u.role === 'admin' && <span className="text-gray-400">—</span>}
                      {u.role !== 'admin' && u.status === 'active' && (
                        <button type="button" className={BTN.danger} onClick={() => ask(u, 'locked')}>
                          Khoá
                        </button>
                      )}
                      {u.role !== 'admin' && u.status === 'locked' && (
                        <button type="button" className={BTN.primary} onClick={() => ask(u, 'active')}>
                          Mở khoá
                        </button>
                      )}
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
