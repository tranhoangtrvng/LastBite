// src/pages/buyer/SearchPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SearchBar, 
  SortDropdown, 
  FilterSidebar, 
  FoodCard, 
  BookingModal, 
  PickupSuccessModal 
} from '../../components/common';

// Dữ liệu chuẩn khớp 100% với mã của FilterSidebar (com, banhmi, bunpho, trasua, doanvat)
const MOCK_FOODS = [
  {
    id: 1,
    title: 'Cơm gà xối mỡ sốt cay',
    storeName: 'Cơm Gà Bà Năm',
    address: 'Đống Đa, Hà Nội',
    originalPrice: 45000,
    discountPrice: 20000,
    quantity: 3,
    pickupTimeRange: '20:30 - 21:30',
    category: 'com', // Khớp với category ID trong FilterSidebar
    timeSlot: 'late', // Sau 20:00
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    title: 'Bánh mì pate trứng chả',
    storeName: 'Bánh Mì Phố Cổ',
    address: 'Cầu Giấy, Hà Nội',
    originalPrice: 35000,
    discountPrice: 15000,
    quantity: 5,
    pickupTimeRange: '12:00 - 13:00',
    category: 'banhmi',
    timeSlot: 'lunch', // Trưa 11:00 - 13:30
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    title: 'Bún bò Huế đặc biệt',
    storeName: 'Bún Bò O Trâm',
    address: 'Thanh Xuân, Hà Nội',
    originalPrice: 50000,
    discountPrice: 25000,
    quantity: 2,
    pickupTimeRange: '19:00 - 20:00',
    category: 'bunpho',
    timeSlot: 'evening', // Tối 18:00 - 20:00
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    title: 'Trà sữa Oolong kem trứng',
    storeName: 'Trà Sữa Nhà Bông',
    address: 'Hai Bà Trưng, Hà Nội',
    originalPrice: 40000,
    discountPrice: 18000,
    quantity: 4,
    pickupTimeRange: '21:00 - 22:00',
    category: 'trasua',
    timeSlot: 'late', // Sau 20:00
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371a5c60205?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    title: 'Cơm sườn bì chả nướng than',
    storeName: 'Cơm Tấm 1989',
    address: 'Ba Đình, Hà Nội',
    originalPrice: 55000,
    discountPrice: 25000,
    quantity: 1,
    pickupTimeRange: '12:30 - 13:30',
    category: 'com',
    timeSlot: 'lunch', // Trưa 11:00 - 13:30
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    title: 'Nem chua rán nướng hồ tây',
    storeName: 'Ăn Vặt Cô Béo',
    address: 'Tây Hồ, Hà Nội',
    originalPrice: 30000,
    discountPrice: 12000,
    quantity: 6,
    pickupTimeRange: '18:30 - 19:30',
    category: 'doanvat',
    timeSlot: 'evening', // Tối 18:00 - 20:00
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60'
  }
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: 'all',
    pickupTimes: []
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [pickupCodeData, setPickupCodeData] = useState(null);

  // LOGIC LỌC VÀ SẮP XẾP CHUẨN XÁC
  const processedFoods = useMemo(() => {
    let result = [...MOCK_FOODS];

    // 1. Lọc từ khóa tìm kiếm
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.storeName.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q)
      );
    }

    // 2. Lọc theo danh mục (hỗ trợ cả mã 'com' lẫn nhãn 'Cơm')
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((item) => filters.categories.includes(item.category));
    }

    // 3. Lọc khoảng giá (khớp với FilterSidebar: under20, 20to40, over40)
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (filters.priceRange === 'under20') {
        result = result.filter((item) => item.discountPrice < 20000);
      } else if (filters.priceRange === '20to40') {
        result = result.filter((item) => item.discountPrice >= 20000 && item.discountPrice <= 40000);
      } else if (filters.priceRange === 'over40') {
        result = result.filter((item) => item.discountPrice > 40000);
      }
    }

    // 4. Lọc khung giờ nhận hàng (lunch, evening, late)
    if (filters.pickupTimes && filters.pickupTimes.length > 0) {
      result = result.filter((item) => filters.pickupTimes.includes(item.timeSlot));
    }

    // 5. Sắp xếp
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.discountPrice - a.discountPrice);
    } else if (sortBy === 'discount_desc') {
      result.sort((a, b) => (b.originalPrice - b.discountPrice) - (a.originalPrice - a.discountPrice));
    }

    return result;
  }, [keyword, filters, sortBy]);

  const handleBookingConfirm = (bookingInfo) => {
    const mockPickupCode = 'LB-' + Math.floor(1000 + Math.random() * 9000);
    setPickupCodeData({
      ...bookingInfo,
      code: mockPickupCode,
      pickupWindow: selectedItem.pickupTimeRange,
      address: `${selectedItem.storeName} - ${selectedItem.address}`
    });
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* CỘT TRÁI: SIDEBAR BỘ LỌC (3 CỘT) */}
      <aside className="w-full lg:w-[280px] shrink-0 sticky top-28">
        <FilterSidebar
          onApplyFilter={(receivedFilters) => setFilters(receivedFilters)}
          onResetFilter={() => setFilters({ categories: [], priceRange: 'all', pickupTimes: [] })}
        />
      </aside>

      {/* CỘT PHẢI: KẾT QUẢ TÌM KIẾM (9 CỘT) */}
      <section className="flex-1 w-full space-y-6">
        {/* Toolbar: Thanh tìm kiếm & Sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <SearchBar
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onClear={() => setKeyword('')}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">
              Tìm thấy <strong className="text-[#111827]">{processedFoods.length}</strong> suất ăn
            </span>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Danh sách món ăn sau khi lọc */}
        {processedFoods.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB] space-y-2">
            <p className="text-base font-semibold text-gray-700">Không tìm thấy suất ăn nào phù hợp</p>
            <p className="text-xs text-gray-400">Hãy thử bỏ bớt tiêu chí lọc hoặc đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedFoods.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onCardClick={(f) => navigate(`/foods/${f.id}`)}
                onBookNow={(f) => setSelectedItem(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Frame 4: Modal Đặt Chỗ */}
      {selectedItem && (
        <BookingModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* Frame 5: Modal Mã Nhận 6 Ký Tự */}
      {pickupCodeData && (
        <PickupSuccessModal
          isOpen={Boolean(pickupCodeData)}
          data={pickupCodeData}
          onClose={() => setPickupCodeData(null)}
          onViewOrders={() => {
            setPickupCodeData(null);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
}