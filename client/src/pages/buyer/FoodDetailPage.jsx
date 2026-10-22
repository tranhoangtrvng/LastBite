// client/src/pages/buyer/FoodDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookingModal, PickupSuccessModal } from '../../components/common';

const MOCK_FOODS = [
  {
    id: 1,
    title: 'Cơm gà xối mỡ sốt cay',
    storeName: 'Cơm Gà Bà Năm',
    address: '123 Chùa Láng, Đống Đa, Hà Nội',
    phone: '0987.654.321',
    originalPrice: 45000,
    discountPrice: 20000,
    quantity: 3,
    pickupTimeRange: '20:30 - 21:30',
    category: 'Cơm',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
    description: 'Suất cơm gà xối mỡ giòn rụm kèm sốt cay ngọt đặc trưng. Được chuẩn bị cuối ca bán chiều và bảo quản đúng tiêu chuẩn vệ sinh an toàn thực phẩm. Suất gồm cơm trắng, canh và dưa chua ăn kèm, đã đóng gói đầy đủ thìa đũa tiện lợi mang về.'
  },
  {
    id: 2,
    title: 'Bánh mì pate trứng chả',
    storeName: 'Bánh Mì Phố Cổ',
    address: '45 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
    phone: '0912.345.678',
    originalPrice: 35000,
    discountPrice: 15000,
    quantity: 5,
    pickupTimeRange: '12:00 - 13:00',
    category: 'Bánh mì',
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&auto=format&fit=crop&q=80',
    description: 'Bánh mì nướng giòn nóng tại chỗ, nhân pate gan béo ngậy kèm trứng ốp và chả lụa. Đồ ăn chuẩn bị ca sáng, khách nhận vui lòng dùng ngay trong khung giờ hẹn để đảm bảo độ giòn ngon nhất.'
  },
  {
    id: 3,
    title: 'Bún bò Huế đặc biệt',
    storeName: 'Bún Bò O Trâm',
    address: '88 Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội',
    phone: '0934.567.890',
    originalPrice: 50000,
    discountPrice: 25000,
    quantity: 2,
    pickupTimeRange: '19:00 - 20:00',
    category: 'Bún / Phở',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
    description: 'Bún bò Huế đậm đà chuẩn vị cố đô, đầy đủ thịt nạm bò, chả cua, tiết luộc và rau ghém tươi sạch. Nước dùng ninh trong ngày, để riêng trong hộp chịu nhiệt an toàn.'
  },
  {
    id: 4,
    title: 'Trà sữa Oolong kem trứng',
    storeName: 'Trà Sữa Nhà Bông',
    address: '15 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    phone: '0901.234.567',
    originalPrice: 40000,
    discountPrice: 18000,
    quantity: 4,
    pickupTimeRange: '21:00 - 22:00',
    category: 'Trà sữa',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371a5c60205?w=800&auto=format&fit=crop&q=80',
    description: 'Trà Oolong nướng đậm đà kết hợp lớp kem trứng béo ngậy khò đường caramel thơm phức. Chuẩn bị tươi trong ngày, đá riêng.'
  },
  {
    id: 5,
    title: 'Cơm sườn bì chả nướng than',
    storeName: 'Cơm Tấm 1989',
    address: '10 Kim Mã, Ba Đình, Hà Nội',
    phone: '0945.678.901',
    originalPrice: 55000,
    discountPrice: 25000,
    quantity: 1,
    pickupTimeRange: '12:30 - 13:30',
    category: 'Cơm',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    description: 'Cơm tấm sườn nướng than hoa thơm lừng kèm chả trứng hấp, bì heo giòn dai và mỡ hành béo ngậy. Đóng hộp giấy chia ngăn sạch sẽ.'
  },
  {
    id: 6,
    title: 'Nem chua rán nướng hồ tây',
    storeName: 'Ăn Vặt Cô Béo',
    address: '22 Trích Sài, Tây Hồ, Hà Nội',
    phone: '0978.901.234',
    originalPrice: 30000,
    discountPrice: 12000,
    quantity: 6,
    pickupTimeRange: '18:30 - 19:30',
    category: 'Đồ ăn vặt',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    description: 'Hộp 10 chiếc nem chua rán vàng giòn chấm kèm tương ớt cay nồng chuẩn vị ăn vặt phố cổ. Đóng hộp lót giấy thấm dầu cẩn thận.'
  }
];

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [foodList, setFoodList] = useState(MOCK_FOODS);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [pickupCodeData, setPickupCodeData] = useState(null);

  const food = foodList.find((item) => item.id === parseInt(id, 10)) || foodList[0];
  const discountPercent = Math.round(((food.originalPrice - food.discountPrice) / food.originalPrice) * 100);
  const isOutOfStock = food.quantity <= 0;

  // 1. Mở modal đặt chỗ (chặn ngay nếu hết suất)
  const handleOpenBooking = () => {
    if (isOutOfStock) {
      alert(`Rất tiếc! Món "${food.title}" hôm nay đã hết suất thanh lý.`);
      return;
    }
    setIsBookingOpen(true);
  };

  // 2. Xác nhận đặt chỗ -> Trừ tồn kho & hiển thị modal mã
  const handleBookingConfirm = (bookingInfo) => {
    setIsBookingOpen(false);

    if (food.quantity <= 0) {
      alert('Rất tiếc! Suất ăn này vừa có khách hàng khác nhanh tay đặt trước.');
      return;
    }

    const qty = bookingInfo.selectedQuantity || 1;

    setFoodList((prev) =>
      prev.map((item) =>
        item.id === food.id
          ? { ...item, quantity: Math.max(0, item.quantity - qty) }
          : item
      )
    );

    const mockCode = 'LB-' + Math.floor(1000 + Math.random() * 9000);

    setPickupCodeData({
      ...bookingInfo,
      pickupCode: mockCode,
      code: mockCode,
      pickupTimeRange: food.pickupTimeRange,
      storeAddress: `${food.storeName} - ${food.address}`,
      address: `${food.storeName} - ${food.address}`,
      title: food.title,
      selectedQuantity: qty,
      totalPrice: bookingInfo.totalPrice || food.discountPrice * qty
    });
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
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#111827]">Thông tin suất ăn</h2>
            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
              {food.description}
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
              <p className="flex items-center gap-2">
                <span className="text-[#E11D48]">📞</span>
                <span>Hotline: {food.phone}</span>
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
              {isOutOfStock ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-200 text-gray-600">
                  Đã hết suất
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-[#DC2626] text-white">
                  Còn {food.quantity} suất
                </span>
              )}

              <span className="text-sm text-[#4B5563] flex items-center gap-1.5">
                <span>🕒</span>
                <span>Hôm nay: {food.pickupTimeRange}</span>
              </span>
            </div>

            {/* Cụm giá tiền */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-bold text-[#2563EB]">
                {food.discountPrice.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-sm text-[#9CA3AF] line-through">
                {food.originalPrice.toLocaleString('vi-VN')}đ
              </span>
              <span className="px-1.5 py-0.5 text-xs font-medium text-[#4B5563] border border-[#D1D5DB] rounded">
                -{discountPercent}%
              </span>
            </div>

            <p className="text-xs text-[#DC2626] leading-relaxed font-medium">
              ⚠️ Lưu ý: Thanh toán trực tiếp tại quầy bằng tiền mặt hoặc quét mã QR khi nhận đồ. Không thu tiền online.
            </p>

            {/* Nút hành động */}
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 bg-gray-200 text-gray-400 font-bold text-sm rounded-xl cursor-not-allowed text-center uppercase tracking-wide"
              >
                HẾT SUẤT HÔM NAY
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
          onClose={() => setIsBookingOpen(false)}
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