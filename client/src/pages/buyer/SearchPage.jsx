// client/src/pages/buyer/SearchPage.jsx
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
import { MOCK_FOODS } from '../../mocks/mockData';

export default function SearchPage() {
  const navigate = useNavigate();

  // State tìm kiếm, sắp xếp và bộ lọc
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: 'all',
    pickupTimes: []
  });

  // State quản lý luồng Modal đặt chỗ & Modal mã đối soát 6 ký tự
  const [selectedItem, setSelectedItem] = useState(null);
  const [pickupCodeData, setPickupCodeData] = useState(null);

  // ==================== LOGIC XỬ LÝ DỮ LIỆU (SEARCH / FILTER / SORT) ====================
  const processedFoods = useMemo(() => {
    let result = [...MOCK_FOODS];

    // 1. Lọc theo từ khóa (Tìm theo tên món, tên quán, địa chỉ)
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.storeName?.toLowerCase().includes(q) ||
          item.address?.toLowerCase().includes(q)
      );
    }

    // 2. Lọc theo danh mục (Tương thích cả mã viết tắt lẫn tên tiếng Việt)
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((item) => {
        const itemCat = item.category?.toLowerCase() || '';
        return filters.categories.some((c) => {
          const lowerC = c.toLowerCase();
          return (
            itemCat === lowerC ||
            (lowerC === 'com' && itemCat.includes('cơm')) ||
            (lowerC === 'banhmi' && itemCat.includes('bánh mì')) ||
            (lowerC === 'bunpho' && (itemCat.includes('bún') || itemCat.includes('phở'))) ||
            (lowerC === 'trasua' && itemCat.includes('trà')) ||
            (lowerC === 'doanvat' && itemCat.includes('vặt'))
          );
        });
      });
    }

    // 3. Lọc theo khoảng giá (under20, 20to40, over40)
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (filters.priceRange === 'under20' || filters.priceRange === 'under_20k') {
        result = result.filter((item) => item.discountPrice < 20000);
      } else if (filters.priceRange === '20to40' || filters.priceRange === '20k_40k') {
        result = result.filter((item) => item.discountPrice >= 20000 && item.discountPrice <= 40000);
      } else if (filters.priceRange === 'over40' || filters.priceRange === 'above_40k') {
        result = result.filter((item) => item.discountPrice > 40000);
      }
    }

    // 4. Lọc theo khung giờ nhận món (lunch, evening, late)
    if (filters.pickupTimes && filters.pickupTimes.length > 0) {
      result = result.filter((item) => {
        if (!item.timeSlot) return true;
        return filters.pickupTimes.includes(item.timeSlot);
      });
    }

    // 5. Sắp xếp danh sách
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.discountPrice - a.discountPrice);
    } else if (sortBy === 'discount_desc' || sortBy === 'discount') {
      result.sort((a, b) => (b.originalPrice - b.discountPrice) - (a.originalPrice - a.discountPrice));
    }

    return result;
  }, [keyword, filters, sortBy]);

  // ==================== HANDLER LUỒNG ĐẶT CHỖ (FRAME 4 ➔ FRAME 5) ====================
  const handleBookingConfirm = (bookingInfo) => {
    // Sinh mã ngẫu nhiên chuẩn format đối soát LB-xxxx
    const mockPickupCode = 'LB-' + Math.floor(1000 + Math.random() * 9000);
    const qty = bookingInfo.selectedQuantity || 1;

    setPickupCodeData({
      ...bookingInfo,
      pickupCode: mockPickupCode,
      code: mockPickupCode,
      pickupTimeRange: selectedItem.pickupTimeRange,
      storeAddress: `${selectedItem.storeName} - ${selectedItem.address}`,
      address: `${selectedItem.storeName} - ${selectedItem.address}`,
      title: selectedItem.title,
      selectedQuantity: qty,
      totalPrice: bookingInfo.totalPrice || selectedItem.discountPrice * qty
    });

    setSelectedItem(null); // Đóng modal đặt chỗ
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* CỘT TRÁI: BỘ LỌC TÌM KIẾM (SIDEBAR CỐ ĐỊNH KHI CUỘN) */}
      <aside className="w-full lg:w-[280px] shrink-0 sticky top-28">
        <FilterSidebar
          onApplyFilter={(receivedFilters) => setFilters(receivedFilters)}
          onResetFilter={() => setFilters({ categories: [], priceRange: 'all', pickupTimes: [] })}
        />
      </aside>

      {/* CỘT PHẢI: KẾT QUẢ TÌM KIẾM & LƯỚI MÓN ĂN */}
      <section className="flex-1 w-full space-y-6">
        {/* Toolbar: Thanh tìm kiếm & Dropdown sắp xếp */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
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

        {/* Lưới danh sách món ăn */}
        {processedFoods.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB] space-y-2">
            <p className="text-base font-semibold text-gray-700">Không tìm thấy suất ăn nào phù hợp</p>
            <p className="text-xs text-gray-400">Hãy thử xóa từ khóa hoặc nới lỏng các tiêu chí bộ lọc.</p>
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

      {/* Frame 4: Modal Đặt giữ chỗ */}
      {selectedItem && (
        <BookingModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* Frame 5: Modal Mã nhận hàng 6 ký tự */}
      {pickupCodeData && (
        <PickupSuccessModal
          isOpen={Boolean(pickupCodeData)}
          bookingData={pickupCodeData}
          data={pickupCodeData}
          onClose={() => setPickupCodeData(null)}
          onGoHome={() => setPickupCodeData(null)}
          onViewOrders={() => {
            setPickupCodeData(null);
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
}