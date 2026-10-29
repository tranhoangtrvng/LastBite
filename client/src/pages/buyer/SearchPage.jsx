// client/src/pages/buyer/SearchPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  SortDropdown,
  FilterSidebar,
  FoodCard,
  BookingModal,
  PickupSuccessModal,
  Pagination
} from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { listingApi } from '../../api/listingApi';
import { categoryApi } from '../../api/categoryApi';
import { orderApi } from '../../api/orderApi';
import { toFoodItem, toPickupModalData } from '../../utils/mappers';
import { isoTime } from '../../utils/format';

const PAGE_SIZE = 12;

// Khung giờ nhận trong bộ lọc: tin được giữ lại khi khung giờ nhận của tin GIAO với khung giờ này.
const TIME_SLOTS = {
  lunch: ['11:00', '13:30'],
  evening: ['18:00', '20:00'],
  late: ['20:00', '24:00']
};

// Khoảng giá trong bộ lọc -> tham số min_price / max_price của GET /listings (tính theo giá cứu)
const PRICE_PARAMS = {
  under20: { max_price: 19999 },
  '20to40': { min_price: 20000, max_price: 40000 },
  over40: { min_price: 40001 }
};

const EMPTY_FILTERS = { categories: [], priceRange: 'all', pickupTimes: [] };

export default function SearchPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  // Dữ liệu thật từ server
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // tăng lên để tải lại danh sách (sau khi đặt chỗ)
  const [categoryOptions, setCategoryOptions] = useState([]);

  // State quản lý luồng Modal đặt chỗ & Modal mã đối soát 6 ký tự
  const [selectedItem, setSelectedItem] = useState(null);
  const [pickupCodeData, setPickupCodeData] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Tự động làm mới dữ liệu khi người dùng chuyển tab và quay trở lại
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setReloadKey((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Loại món lấy từ server (GET /categories) cho bộ lọc
  useEffect(() => {
    categoryApi
      .getCategories()
      .then((res) => setCategoryOptions(res.data.map((c) => ({ id: c.id, label: c.name }))))
      .catch(() => {}); // lỗi thì FilterSidebar dùng danh sách mẫu
  }, []);

  // Tải các suất đang bán. Từ khóa và khoảng giá lọc ngay ở server; loại món, khung giờ (chọn nhiều ô)
  // và sắp xếp xử lý ở trình duyệt trên tối đa 50 suất đã tải (đủ cho quy mô bài tập lớn).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setLoadError('');
      try {
        const params = { limit: 50, ...(PRICE_PARAMS[filters.priceRange] || {}) };
        if (keyword.trim()) params.q = keyword.trim();
        const res = await listingApi.getListings(params);
        if (!cancelled) setFoods(res.data.map(toFoodItem));
      } catch (err) {
        if (!cancelled) {
          setFoods([]);
          setLoadError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, keyword ? 350 : 0); // đợi người dùng gõ xong mới gọi server
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword, filters.priceRange, reloadKey]);

  // Đổi bộ lọc / từ khóa / cách sắp xếp thì quay về trang 1
  useEffect(() => {
    setPage(1);
  }, [keyword, filters, sortBy]);

  // ==================== LOGIC XỬ LÝ DỮ LIỆU (SEARCH / FILTER / SORT) ====================
  const processedFoods = useMemo(() => {
    let result = [...foods];

    // 1. Lọc danh mục
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((item) => filters.categories.includes(item.categoryId));
    }

    // 2. Lọc khung giờ nhận
    if (filters.pickupTimes && filters.pickupTimes.length > 0) {
      result = result.filter((item) =>
        filters.pickupTimes.some((slotId) => {
          const [slotStart, slotEnd] = TIME_SLOTS[slotId] || [];
          return isoTime(item.pickupStart) < slotEnd && isoTime(item.pickupEnd) > slotStart;
        })
      );
    }

    // 3. Sắp xếp
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.discountPrice - a.discountPrice);
    } else if (sortBy === 'discount_desc' || sortBy === 'discount') {
      result.sort((a, b) => (b.originalPrice - b.discountPrice) - (a.originalPrice - a.discountPrice));
    } else {
      // newest: tin đăng mới nhất lên đầu
      result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id));
    }

    return result;
  }, [foods, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedFoods.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = processedFoods.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Bấm "Đặt chỗ": chưa đăng nhập thì chuyển sang trang đăng nhập
  const handleBookNow = (item) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/foods' } });
      return;
    }
    setBookingError('');
    setSelectedItem(item);
  };

  // Xử lý khi xác nhận đặt chỗ: gọi POST /orders, nhận mã 6 ký tự từ server rồi hiện modal thành công
  const handleBookingConfirm = async (bookingInfo) => {
    setBookingBusy(true);
    setBookingError('');
    try {
      const res = await orderApi.createOrder(selectedItem.id, bookingInfo.selectedQuantity || 1);
      setPickupCodeData(toPickupModalData(res.data));
      setSelectedItem(null); // Đóng BookingModal
      setReloadKey((k) => k + 1); // cập nhật lại số suất còn lại
    } catch (err) {
      setBookingError(err.message);
      if (err.status === 409) setReloadKey((k) => k + 1); // hết suất / hết giờ: làm mới danh sách
    } finally {
      setBookingBusy(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* CỘT TRÁI: BỘ LỌC TÌM KIẾM (SIDEBAR CỐ ĐỊNH KHI CUỘN) */}
      <aside className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-28 z-10">
        <FilterSidebar
          categoryOptions={categoryOptions}
          onApplyFilter={(receivedFilters) => setFilters(receivedFilters)}
          onResetFilter={() => setFilters(EMPTY_FILTERS)}
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

        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB]">
            <p className="text-sm text-gray-500">Đang tải danh sách suất ăn...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white p-12 text-center rounded-xl border border-red-200 space-y-3">
            <p className="text-base font-semibold text-red-600">Không tải được danh sách suất ăn</p>
            <p className="text-xs text-gray-500">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : processedFoods.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-[#E5E7EB] space-y-2">
            <p className="text-base font-semibold text-gray-700">Không tìm thấy suất ăn nào phù hợp</p>
            <p className="text-xs text-gray-400">Hãy thử xóa từ khóa hoặc nới lỏng các tiêu chí bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pageItems.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  onCardClick={(f) => navigate(`/foods/${f.id}`)}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </section>

      {/* Frame 4: Modal Đặt giữ chỗ */}
      {selectedItem && (
        <BookingModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          isSubmitting={bookingBusy}
          errorMessage={bookingError}
          onClose={() => !bookingBusy && setSelectedItem(null)}
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
