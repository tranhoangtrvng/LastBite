// client/src/pages/buyer/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storeApi } from '../../api/storeApi';
import Input from '../../components/common/Input';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isStore = user?.role === 'store';

  // State thông tin tài khoản cá nhân
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: isStore ? 'Chủ cửa hàng' : 'Khách hàng',
  });

  // State thông tin cửa hàng (dành riêng cho role 'store')
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
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState({ type: '', text: '' });

  // Tải dữ liệu quán nếu là tài khoản store
  useEffect(() => {
    if (isStore) {
      storeApi
        .getMyStore()
        .then((res) => {
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
        .catch((err) => console.error('Lỗi tải thông tin quán:', err))
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
      alert('Trình duyệt không hỗ trợ lấy toạ độ vị trí');
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
      (err) => {
        alert('Không thể lấy vị trí. Vui lòng cấp quyền định vị trong trình duyệt.');
      }
    );
  };

  // Đăng xuất
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      navigate('/auth');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THẺ THÔNG TIN TÀI KHOẢN (4 CỘT) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-3xl mb-4 border border-[#BFDBFE]">
            {profileData.name.charAt(0).toUpperCase() || 'U'}
          </div>

          <h2 className="text-lg font-bold text-[#111827]">{profileData.name}</h2>
          <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
            {profileData.role}
          </span>

          <div className="space-y-2 text-left w-full mt-6 px-2 text-sm text-[#374151]">
            <p>
              <span className="font-semibold text-gray-500">Email:</span> {profileData.email}
            </p>
            <p>
              <span className="font-semibold text-gray-500">Số điện thoại:</span> {profileData.phone || 'Chưa cập nhật'}
            </p>
          </div>

          <hr className="w-full my-6 border-[#E5E7EB]" />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-[#DC2626] text-[#DC2626] text-sm font-medium hover:bg-red-50 transition cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CỬA HÀNG HOẶC THỐNG KÊ NGƯỜI MUA (8 CỘT) */}
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
            /* KHỐI THỐNG KÊ CHO NGƯỜI MUA */
            <div>
              <h3 className="text-base font-bold text-[#111827] mb-4">Tác động giải cứu cùng LastBite</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="text-2xl font-bold text-[#16A34A]">5 suất ăn</div>
                  <p className="text-xs text-[#6B7280] mt-1">Đã giải cứu thành công</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="text-2xl font-bold text-[#2563EB]">125.000đ</div>
                  <p className="text-xs text-[#6B7280] mt-1">Chi phí tiết kiệm được</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}