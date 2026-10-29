// client/src/pages/buyer/FoodDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookingModal, PickupSuccessModal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { listingApi } from '../../api/listingApi';
import { orderApi } from '../../api/orderApi';
import { toFoodItem, toPickupModalData } from '../../utils/mappers';
import { formatMoney, PLACEHOLDER_IMAGE, describePickupTiming, isoTime } from '../../utils/format';
import useNow from '../../utils/useNow';
import useRefreshOnFocus from '../../utils/useRefreshOnFocus';

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const now = useNow(); // đồng hồ chạy để đếm ngược / khoá nút khi hết giờ

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(''); // lỗi tải trang (ví dụ 404: không tìm thấy suất ăn)
  const [reloadKey, setReloadKey] = useState(0); // tăng lên để tải lại (sau khi đặt chỗ)

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [pickupCodeData, setPickupCodeData] = useState(null);

  // Tải chi tiết suất ăn từ server (GET /listings/:id). Tin hết hạn/hết suất vẫn trả về, kèm is_available = false.
  useEffect(() => {
    let cancelled = false;
    listingApi
      .getListingById(id)
      .then((res) => {
        if (cancelled) return;
        setFood(toFoodItem(res.data));
        setLoadError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setFood(null);
        setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // Quay lại tab (hoặc mỗi phút) thì tải lại để số suất còn lại luôn mới
  useRefreshOnFocus(() => setReloadKey((k) => k + 1));

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB]">
        <p className="text-sm text-gray-500">Đang tải thông tin suất ăn...</p>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB] space-y-3">
        <p className="text-base font-semibold text-gray-700">{loadError || 'Không tìm thấy suất ăn'}</p>
        <Link to="/foods" className="inline-block text-sm font-semibold text-[#2563EB] hover:underline">
          ← Quay lại danh sách suất ăn
        </Link>
      </div>
    );
  }

  const discountPercent = food.discountPercent;
  // Khoá nút đặt chỗ khi: đã quá giờ nhận (tính theo đồng hồ chạy, không chờ tải lại), hết suất,
  // hoặc chưa tới giờ mở đặt (chỉ đặt được trong khoảng ngắn trước giờ bắt đầu nhận).
  const timing = describePickupTiming(food.pickupStart, food.pickupEnd, now);
  const isEnded = timing.phase === 'ended' || (!food.isAvailable && food.quantity > 0);
  const isSoldOut = !isEnded && food.quantity <= 0;
  const opensAtMs = food.bookingOpensAt ? new Date(food.bookingOpensAt).getTime() : 0;
  const notOpenYet = !isEnded && !isSoldOut && now < opensAtMs;
  const isUnavailable = isEnded || isSoldOut || notOpenYet;
  const unavailableLabel = isEnded ? 'Đã hết giờ nhận' : isSoldOut ? 'Đã hết suất' : 'Chưa mở đặt chỗ';
  const buttonLabel = isEnded ? 'ĐÃ HẾT GIỜ NHẬN' : isSoldOut ? 'HẾT SUẤT' : 'CHƯA MỞ ĐẶT CHỖ';
  const opensAtLabel = food.bookingOpensAt ? isoTime(food.bookingOpensAt) : '';

  // 1. Mở modal đặt chỗ (chưa đăng nhập thì chuyển sang trang đăng nhập)
  const handleOpenBooking = () => {
    if (isUnavailable) return;
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/foods/${food.id}` } });
      return;
    }
    setBookingError('');
    setIsBookingOpen(true);
  };

  // 2. Xác nhận đặt chỗ -> gọi POST /orders (server trừ tồn kho trong transaction) & hiển thị modal mã
  const handleBookingConfirm = async (bookingInfo) => {
    setBookingBusy(true);
    setBookingError('');
    try {
      const res = await orderApi.createOrder(food.id, bookingInfo.selectedQuantity || 1);
      setIsBookingOpen(false);
      setPickupCodeData(toPickupModalData(res.data));
      setReloadKey((k) => k + 1); // cập nhật lại số suất còn lại
    } catch (err) {
      setBookingError(err.message);
      if (err.status === 409) setReloadKey((k) => k + 1); // hết suất / hết giờ: làm mới số liệu
    } finally {
      setBookingBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb: Trang chủ > Tên món */}
      <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
        <Link to="/foods" className="hover:text-[#2563EB] transition-colors">
          Trang chủ
        </Link>
        <span>&gt;</span>
        <span className="text-[#111827] font-semibold truncate max-w-md">
          {food.title}
        </span>
      </nav>

      {/* 2. Bố cục 2 cột chuẩn Figma Frame 3 (60% Trái - 40% Phải) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* CỘT TRÁI (60%) */}
        <div className="w-full lg:w-[60%] space-y-6">
          <div className="w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-gray-100 shadow-sm">
            <img
              src={food.imageUrl}
              alt={food.title}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
              className={`w-full h-full object-cover ${isEnded ? 'grayscale opacity-70' : ''}`}
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#111827]">Thông tin suất ăn</h2>
            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
              {food.description || 'Cửa hàng chưa thêm mô tả cho suất ăn này.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#111827]">Thông tin quán</h2>
            <p className="text-base font-bold text-[#111827]">{food.storeName}</p>

            <div className="space-y-1.5 text-sm text-[#4B5563]">
              <p className="flex items-center gap-2">
                <span className="text-[#DC2626]">📍</span>
                <span>{food.address}</span>
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (40%): Sticky Card */}
        <div className="w-full lg:w-[40%] sticky top-28">
          <div className="bg-white p-7 rounded-2xl border border-[#E5E7EB] shadow-md space-y-5">
            <h1 className="text-2xl font-bold text-[#111827] leading-snug">
              {food.title}
            </h1>

            {/* Badge số lượng & Khung giờ nhận */}
            <div className="flex items-center gap-3">
              {isUnavailable ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-200 text-gray-600">
                  {unavailableLabel}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-[#DC2626] text-white">
                  Còn {food.quantity} suất
                </span>
              )}

              <span className="text-sm text-[#4B5563] flex items-center gap-1.5">
                <span>🕒</span>
                <span>
                  {food.pickupToday ? 'Hôm nay' : `Ngày ${food.pickupDateLabel}`}: {food.pickupTimeRange}
                </span>
              </span>
            </div>

            {/* Cụm giá tiền */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-bold text-[#2563EB]">
                {formatMoney(food.discountPrice)}
              </span>
              <span className="text-sm text-[#9CA3AF] line-through">
                {formatMoney(food.originalPrice)}
              </span>
              <span className="px-1.5 py-0.5 text-xs font-medium text-[#4B5563] border border-[#D1D5DB] rounded">
                -{discountPercent}%
              </span>
            </div>

            {/* Đếm ngược theo giờ nhận hàng */}
            {!isEnded && (
              <p
                className={`text-sm font-semibold ${
                  timing.phase === 'ending' ? 'text-[#DC2626]' : 'text-[#EA580C]'
                }`}
              >
                ⏳ {timing.label}
              </p>
            )}

            {isEnded && (
              <p className="text-sm text-[#4B5563] bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                Suất ăn này đã hết giờ nhận nên không đặt được nữa. Hãy xem các suất khác đang mở.
              </p>
            )}
            {notOpenYet && (
              <p className="text-sm text-[#1D4ED8] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Suất này mở đặt chỗ lúc <strong>{opensAtLabel}</strong>, gần giờ nhận hàng. Bạn quay lại sau nhé.
              </p>
            )}

            <p className="text-xs text-[#DC2626] leading-relaxed font-medium">
              ⚠️ Lưu ý: Thanh toán trực tiếp tại quầy bằng tiền mặt khi nhận đồ. Không thu tiền online.
            </p>

            {/* Nút hành động */}
            {isUnavailable ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 bg-gray-200 text-gray-400 font-bold text-sm rounded-xl cursor-not-allowed text-center uppercase tracking-wide"
              >
                {buttonLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenBooking}
                className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow transition duration-150 cursor-pointer"
              >
                ĐẶT CHỖ NGAY
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Frame 4 Modal */}
      {isBookingOpen && (
        <BookingModal
          item={food}
          isOpen={isBookingOpen}
          isSubmitting={bookingBusy}
          errorMessage={bookingError}
          onClose={() => !bookingBusy && setIsBookingOpen(false)}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* Frame 5 Modal */}
      {pickupCodeData && (
        <PickupSuccessModal
          isOpen={Boolean(pickupCodeData)}
          bookingData={pickupCodeData}
          data={pickupCodeData}
          onClose={() => setPickupCodeData(null)}
          onGoHome={() => {
            setPickupCodeData(null);
            navigate('/foods');
          }}
          onViewOrders={() => {
            setPickupCodeData(null);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
}