// client/src/pages/buyer/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { storeApi } from '../../api/storeApi';
import { orderApi } from '../../api/orderApi';
import { formatMoney } from '../../utils/format';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const ROLE_LABELS = { buyer: 'Người mua', store: 'Cửa hàng', admin: 'Quản trị viên' };
const PHONE_REGEX = /^\d{9,11}$/;

const normalizePhone = (value) => {
  const compact = (value || '').replace(/[\s.-]/g, '');
  return compact.startsWith('+84') ? '0' + compact.slice(3) : compact;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const isStore = user?.role === 'store';

  // --- 1. STATE & LOGIC THÔNG TIN CỬA HÀNG (Dành riêng cho role 'store') ---
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    latitude: '',
    longitude: '',
    status: '',
  });
  const [loadingStore, setLoadingStore] = useState(isStore);
  // false = tài khoản cửa hàng nhưng CHƯA đăng ký quán (GET /stores/me trả data: null).
  // Khi đó không hiện form sửa (PUT /stores/me sẽ bị 403), mà dẫn sang trang đăng ký quán /store.
  const [hasStore, setHasStore] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState({ type: '', text: '' });

  // Tải dữ liệu quán nếu là tài khoản store
  useEffect(() => {
    if (isStore) {
      storeApi
        .getMyStore()
        .then((res) => {
          setHasStore(Boolean(res.data));
          if (res.data) {
            setStoreData({
              name: res.data.name || '',
              address: res.data.address || '',
              phone: res.data.phone || '',
              description: res.data.description || '',
              latitude: res.data.latitude ?? '',
              longitude: res.data.longitude ?? '',
              status: res.data.status || 'pending',
            });
          }
        })
        .catch((err) =>
          setStoreMessage({ type: 'error', text: '❌ ' + (err.message || 'Không tải được thông tin quán.') })
        )
        .finally(() => setLoadingStore(false));
    }
  }, [isStore]);

  // Lưu thông tin quán
  const handleSaveStore = async (e) => {
    e.preventDefault();
    setStoreSaving(true);
    setStoreMessage({ type: '', text: '' });

    try {
      const payload = {
        name: storeData.name.trim(),
        address: storeData.address.trim(),
        phone: storeData.phone ? storeData.phone.trim() : null,
        description: storeData.description ? storeData.description.trim() : null,
      };

      if (storeData.latitude !== '' && storeData.longitude !== '') {
        payload.latitude = Number(storeData.latitude);
        payload.longitude = Number(storeData.longitude);
      } else {
        payload.latitude = null;
        payload.longitude = null;
      }

      await storeApi.updateMyStore(payload);
      setStoreMessage({ type: 'success', text: '✅ Đã lưu thông tin cửa hàng thành công!' });
    } catch (err) {
      setStoreMessage({
        type: 'error',
        text: '❌ ' + (err.message || 'Lỗi khi cập nhật cửa hàng.'),
      });
    } finally {
      setStoreSaving(false);
    }
  };

  // Nút lấy toạ độ GPS tự động bằng định vị trình duyệt
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStoreMessage({ type: 'error', text: '❌ Trình duyệt không hỗ trợ lấy toạ độ vị trí.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setStoreMessage({ type: 'success', text: '📍 Đã lấy toạ độ GPS hiện tại thành công!' });
      },
      () => {
        setStoreMessage({
          type: 'error',
          text: '❌ Không thể lấy vị trí. Vui lòng cấp quyền định vị trong trình duyệt.',
        });
      }
    );
  };

  // --- 2. STATE & LOGIC THÔNG TIN TÀI KHOẢN (MODAL 1: CHỈNH SỬA HỒ SƠ) ---
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    const cleanName = editForm.name.trim();
    const cleanPhone = normalizePhone(editForm.phone);

    if (cleanName.length < 2) {
      setProfileError('Tên phải từ 2 ký tự trở lên.');
      return;
    }
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setProfileError('Số điện thoại không hợp lệ (cần 9 đến 11 chữ số).');
      return;
    }

    try {
      setProfileSaving(true);
      await authApi.updateMe?.({ name: cleanName, phone: cleanPhone || null });
      if (refreshUser) await refreshUser();
      setIsEditingInfo(false);
    } catch (err) {
      setProfileError(err.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setProfileSaving(false);
    }
  };

  // --- 3. STATE & LOGIC ĐỔI MẬT KHẨU (MODAL 2) ---
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordChange = (field, value) => {
    const cleanValue = value.trim().slice(0, 32);
    setPasswordForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setPasswordSaving(true);
      await authApi.changePassword?.({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess('');
      }, 1200);
    } catch (err) {
      setPasswordError(err.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // --- 4. THỐNG KÊ NGƯỜI MUA ---
  // Tính từ các đơn ĐÃ NHẬN của chính người mua (GET /orders/my), không dùng số giả.
  const [stats, setStats] = useState({ meals: 0, saved_money: 0 });

  useEffect(() => {
    if (user?.role !== 'buyer') return;
    orderApi
      .getMyOrders({ limit: 50 })
      .then((res) => {
        const pickedUp = (res.data || []).filter((o) => o.status === 'picked_up');
        setStats({
          meals: pickedUp.reduce((sum, o) => sum + Number(o.quantity || 0), 0),
          saved_money: pickedUp.reduce((sum, o) => sum + Number(o.total_price || 0), 0),
        });
      })
      .catch(() => {});
  }, [user]);

  // Đăng xuất (hộp xác nhận chung của dự án, thay window.confirm)
  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = () => setConfirmLogout(true);
  const doLogout = () => {
    setConfirmLogout(false);
    logout();
    navigate('/auth');
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THẺ THÔNG TIN CÁ NHÂN (4 CỘT) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-3xl mb-4 border border-[#BFDBFE]">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="space-y-1.5 text-left w-full px-2 text-sm text-[#111827]">
            <p>
              <span className="font-semibold text-gray-500">Tên tài khoản:</span> {user?.name || 'Chưa đặt tên'}
            </p>
            <p>
              <span className="font-semibold text-gray-500">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-semibold text-gray-500">Số điện thoại:</span> {user?.phone || 'Chưa cập nhật'}
            </p>
            <p>
              <span className="font-semibold text-gray-500">Vai trò:</span>{' '}
              <span className="font-medium text-[#2563EB]">
                {ROLE_LABELS[user?.role] || user?.role || 'Người mua'}
              </span>
            </p>
          </div>

          <hr className="w-full my-6 border-[#E5E7EB]" />

          {/* 3 Nút bấm viền đúng Figma */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => {
                setEditForm({ name: user?.name || '', phone: user?.phone || '' });
                setProfileError('');
                setIsEditingInfo(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-[#2563EB] text-[#2563EB] text-sm font-medium hover:bg-blue-50 transition cursor-pointer"
            >
              Chỉnh sửa thông tin
            </button>

            <button
              type="button"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangingPassword(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-[#2563EB] text-[#2563EB] text-sm font-medium hover:bg-blue-50 transition cursor-pointer"
            >
              Đổi mật khẩu
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-[#DC2626] text-[#DC2626] text-sm font-medium hover:bg-red-50 transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CỬA HÀNG (role store) HOẶC THỐNG KÊ (role buyer) */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
          {isStore ? (
            /* KHỐI QUẢN LÝ THÔNG TIN CỬA HÀNG */
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">Thông tin cửa hàng</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Quản lý thông tin hiển thị của quán và toạ độ phục vụ bản đồ
                  </p>
                </div>
                {storeData.status && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      storeData.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : storeData.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {storeData.status === 'approved' ? '● Đã duyệt' : storeData.status === 'pending' ? '⏳ Chờ duyệt' : '🔒 Đã khoá'}
                  </span>
                )}
              </div>

              {loadingStore ? (
                <p className="text-sm text-gray-500 py-6 text-center">Đang tải thông tin quán...</p>
              ) : !hasStore ? (
                /* Tài khoản cửa hàng chưa có quán: đăng ký ở trang /store, sau đó chờ admin duyệt */
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-[#111827]">Bạn chưa đăng ký cửa hàng</p>
                  <p className="text-xs text-[#6B7280]">
                    Điền thông tin quán ở trang Quản lý cửa hàng và chờ admin duyệt, sau đó có thể sửa thông tin tại đây.
                  </p>
                  <Link
                    to="/store"
                    className="inline-block px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Đăng ký cửa hàng
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSaveStore} className="space-y-4">
                  {storeMessage.text && (
                    <div
                      className={`p-3 text-xs rounded-xl border ${
                        storeMessage.type === 'error'
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {storeMessage.text}
                    </div>
                  )}

                  <Input
                    label="Tên cửa hàng *"
                    id="store-name"
                    required
                    value={storeData.name}
                    onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                  />

                  <Input
                    label="Địa chỉ quán *"
                    id="store-address"
                    required
                    value={storeData.address}
                    onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                  />

                  <Input
                    label="Số điện thoại quán"
                    id="store-phone"
                    value={storeData.phone}
                    onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                  />

                  {/* Toạ độ GPS */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-[#111827]">
                        Toạ độ vị trí trên Bản đồ (GPS)
                      </label>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        📍 Lấy vị trí GPS hiện tại
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="any"
                        placeholder="Vĩ độ (Latitude, VD: 21.006520)"
                        value={storeData.latitude}
                        onChange={(e) => setStoreData({ ...storeData, latitude: e.target.value })}
                        className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none focus:border-[#2563EB]"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Kinh độ (Longitude, VD: 105.850510)"
                        value={storeData.longitude}
                        onChange={(e) => setStoreData({ ...storeData, longitude: e.target.value })}
                        className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                      Mô tả giới thiệu quán
                    </label>
                    <textarea
                      rows={3}
                      value={storeData.description}
                      onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                      placeholder="Giới thiệu về các món ăn hoặc khung giờ nhận hàng..."
                      className="w-full p-3 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={storeSaving}
                      className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {storeSaving ? 'Đang lưu...' : 'Lưu thông tin cửa hàng'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* KHỐI CHO NGƯỜI MUA */
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-[#111827] mb-4">
                  Tác động giải cứu cùng LastBite
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="text-2xl font-bold text-[#16A34A]">
                      {stats.meals} suất ăn
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">Đã giải cứu thành công</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="text-2xl font-bold text-[#2563EB]">
                      {formatMoney(stats.saved_money)}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">Tổng tiền các suất đã nhận</p>
                  </div>
                </div>
              </div>

              {/* Thiết lập: tính năng nhắc nhở chưa làm nên khoá công tắc và ghi "Sắp có" */}
              <div>
                <h3 className="text-base font-bold text-[#111827] mb-4">Thiết lập</h3>
                <div className="flex items-center justify-between opacity-60">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#111827]">
                        Nhắc nhở nhận món trước giờ hẹn
                      </p>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200">
                        Sắp có
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Tính năng nhận thông báo đẩy qua trình duyệt đang được phát triển
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Tính năng sắp có"
                    className="w-12 h-6 flex items-center rounded-full p-1 bg-[#E5E7EB] cursor-not-allowed"
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA THÔNG TIN */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Chỉnh sửa thông tin</h3>

            {profileError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                ⚠️ {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Tên tài khoản *"
                id="edit-name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              <Input
                label="Số điện thoại"
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI MẬT KHẨU */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-[#111827] mb-4">Đổi mật khẩu</h3>

            {passwordError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                ⚠️ {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                ✓ {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Mật khẩu hiện tại *"
                id="current-password"
                type="password"
                required
                maxLength={32}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              />

              <Input
                label="Mật khẩu mới *"
                id="new-password"
                type="password"
                required
                maxLength={32}
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              />

              <Input
                label="Xác nhận mật khẩu mới *"
                id="confirm-password"
                type="password"
                required
                maxLength={32}
                placeholder="Nhập lại mật khẩu mới"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmLogout}
        title="Đăng xuất?"
        message="Bạn có chắc chắn muốn đăng xuất tài khoản?"
        confirmText="Đăng xuất"
        danger
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
