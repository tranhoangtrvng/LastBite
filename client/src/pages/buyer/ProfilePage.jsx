// client/src/pages/buyer/ProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Dữ liệu người dùng hiển thị
  const [profileData, setProfileData] = useState({
    name: user?.name || 'user',
    email: user?.email || 'user123@gmail.com',
    phone: user?.phone || '0987 654 321',
    role: 'khách hàng'
  });

  // Modal 1: Chỉnh sửa thông tin cá nhân
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({ ...profileData });

  // Modal 2: Đổi mật khẩu
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Thống kê tác động giải cứu cùng LastBite
  const impactStats = {
    savedMeals: 5,
    savedMoney: 125000
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileData({ ...editForm });
    setIsEditingInfo(false);
  };

  // Làm sạch và kiểm soát ký tự khi nhập hoặc paste vào ô mật khẩu
  const handlePasswordChange = (field, value) => {
    const cleanValue = value.trim().slice(0, 32);
    setPasswordForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = (e) => {
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

    // Giả lập cập nhật mật khẩu thành công
    setPasswordSuccess('Đổi mật khẩu thành công!');
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('');
    }, 1200);
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
                setEditForm({ ...profileData });
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
          <div>
            <h3 className="text-base font-bold text-[#111827] mb-4">
              Tác động giải cứu cùng LastBite
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-2xl font-bold text-[#16A34A]">
                  {impactStats.savedMeals} suất ăn
                </div>
                <p className="text-xs text-[#6B7280] mt-1">Đã giải cứu thành công</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-2xl font-bold text-[#2563EB]">
                  {impactStats.savedMoney.toLocaleString('vi-VN')}đ
                </div>
                <p className="text-xs text-[#6B7280] mt-1">Chi phí tiết kiệm được</p>
              </div>
            </div>
          </div>

          {/* Khối 2: Thiết lập (Đã khóa công tắc và thêm nhãn "Sắp có") */}
          <div>
            <h3 className="text-base font-bold text-[#111827] mb-4">
              Thiết lập
            </h3>
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
                className="w-12 h-6 flex items-center rounded-full p-1 bg-[#E5E7EB] cursor-not-allowed"
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
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Tên tài khoản"
                id="edit-name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              <Input
                label="Số điện thoại"
                id="edit-phone"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <Input
                label="Email"
                id="edit-email"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Lưu thay đổi
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
                label="Mật khẩu hiện tại"
                id="current-password"
                type="password"
                required
                maxLength={32}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              />

              <Input
                label="Mật khẩu mới"
                id="new-password"
                type="password"
                required
                maxLength={32}
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              />

              <Input
                label="Xác nhận mật khẩu mới"
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
