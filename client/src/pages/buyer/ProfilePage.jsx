// client/src/pages/buyer/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { orderApi } from '../../api/orderApi';
import { formatMoney } from '../../utils/format';
import Input from '../../components/common/Input';

const ROLE_LABELS = { buyer: 'Người mua', store: 'Cửa hàng', admin: 'Quản trị viên' };

// Số điện thoại: 9 đến 11 chữ số (đúng quy tắc của server). Cho phép gõ "+84 901 234 567" hoặc "0901.234.567".
const PHONE_REGEX = /^\d{9,11}$/;
const normalizePhone = (value) => {
  const compact = value.replace(/[\s.\-()]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  // Dữ liệu hiển thị lấy thẳng từ tài khoản đang đăng nhập (GET /auth/me)
  const profileData = {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || 'Chưa cập nhật',
    role: ROLE_LABELS[user?.role] || ''
  };

  // Modal 1: Chỉnh sửa thông tin cá nhân (PUT /auth/me: chỉ đổi được tên và số điện thoại)
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  // Modal 2: Đổi mật khẩu (PUT /auth/password)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);


  // Thống kê của người mua, tính từ các đơn đã nhận (trong 50 đơn gần nhất)
  const [stats, setStats] = useState({ meals: 0, spent: 0 });
  useEffect(() => {
    if (user?.role !== 'buyer') return undefined;
    let cancelled = false;
    orderApi
      .getMyOrders({ limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const done = res.data.filter((o) => o.status === 'picked_up');
        setStats({
          meals: done.reduce((sum, o) => sum + Number(o.quantity || 0), 0),
          spent: done.reduce((sum, o) => sum + Number(o.total_price || 0), 0)
        });
      })
      .catch(() => {}); // lỗi mạng thì giữ số 0, không chặn trang hồ sơ
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    const name = editForm.name.trim();
    const phone = editForm.phone.trim() ? normalizePhone(editForm.phone.trim()) : '';
    if (name.length < 2 || name.length > 100) {
      setProfileError('Họ và tên phải từ 2 đến 100 ký tự.');
      return;
    }
    if (phone && !PHONE_REGEX.test(phone)) {
      setProfileError('Số điện thoại phải gồm 9 đến 11 chữ số (vd: 0987654321).');
      return;
    }

    setProfileBusy(true);
    try {
      await authApi.updateMe({ name, phone: phone || null });
      await refreshUser(); // lấy lại thông tin mới nhất để hiển thị
      setIsEditingInfo(false);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileBusy(false);
    }
  };

  // Không cắt khoảng trắng: mật khẩu có thể chứa khoảng trắng. Tối đa 72 ký tự như server.
  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value.slice(0, 72) }));
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPasswordBusy(true);
    try {
      await authApi.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess('');
      }, 1200);
    } catch (err) {
      setPasswordError(err.message); // ví dụ "Mật khẩu hiện tại không đúng"
    } finally {
      setPasswordBusy(false);
    }
  };

  // Đăng xuất tài khoản
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      logout();
      navigate('/auth');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THẺ THÔNG TIN CÁ NHÂN (4 CỘT) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col items-center text-center">
          {/* Avatar vuông bo góc viền nét đứt chuẩn Figma */}
          <div className="w-20 h-20 rounded-2xl bg-[#F3F4F6] flex items-center justify-center text-gray-500 font-bold text-2xl mb-5 border border-dashed border-gray-300">
            {profileData.name.charAt(0).toUpperCase()}
          </div>

          {/* Danh sách thông tin tài khoản */}
          <div className="space-y-1.5 text-left w-full px-2">
            <p className="text-sm text-[#111827]">
              <span className="font-semibold text-gray-600">Tên tài khoản:</span> {profileData.name}
            </p>
            <p className="text-sm text-[#111827]">
              <span className="font-semibold text-gray-600">Email:</span> {profileData.email}
            </p>
            <p className="text-sm text-[#111827]">
              <span className="font-semibold text-gray-600">Số điện thoại:</span> {profileData.phone}
            </p>
            <p className="text-sm text-[#111827]">
              <span className="font-semibold text-gray-600">Nhãn:</span> {profileData.role}
            </p>
          </div>

          <hr className="w-full my-6 border-[#E5E7EB]" />

          {/* 3 Nút bấm viền theo đúng Wireframe */}
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

        {/* CỘT PHẢI: TÁC ĐỘNG XANH & THIẾT LẬP (8 CỘT) */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm space-y-8">
          
          {/* Khối 1: Tác động giải cứu cùng LastBite */}
          {user?.role === 'buyer' && (
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
                  {formatMoney(stats.spent)}
                </div>
                <p className="text-xs text-[#6B7280] mt-1">Tổng tiền đã thanh toán</p>
              </div>
            </div>
          </div>
          )}

          {/* Khối 2: Thiết lập (Duy nhất 1 công tắc thông báo theo đúng bản thiết kế) */}
          <div>
            <h3 className="text-base font-bold text-[#111827] mb-4">
              Thiết lập
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                  Nhắc nhở nhận món trước giờ hẹn
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">
                    Sắp có
                  </span>
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Tính năng thông báo đang được phát triển, chưa bật được.
                </p>
              </div>
              {/* Công tắc bị khoá: chưa có hệ thống thông báo nên không giả vờ bật/tắt được */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Tính năng sắp có"
                className="w-12 h-6 flex items-center rounded-full p-1 bg-[#E5E7EB] opacity-60 cursor-not-allowed"
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>

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
                label="Tên tài khoản"
                id="edit-name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              <Input
                label="Số điện thoại (không bắt buộc)"
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <Input
                label="Email"
                id="edit-email"
                type="email"
                disabled
                value={profileData.email}
                helperText="Email dùng để đăng nhập nên không thể thay đổi."
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={profileBusy}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-60"
                >
                  {profileBusy ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI MẬT KHẨU (DÙNG COMPONENT INPUT CÓ SẴN ICON ẨN/HIỆN) */}
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
                label="Mật khẩu hiện tại"
                id="current-password"
                type="password"
                required
                maxLength={72}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              />

              <Input
                label="Mật khẩu mới"
                id="new-password"
                type="password"
                required
                maxLength={72}
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              />

              <Input
                label="Xác nhận mật khẩu mới"
                id="confirm-password"
                type="password"
                required
                maxLength={72}
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-60"
                >
                  {passwordBusy ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}