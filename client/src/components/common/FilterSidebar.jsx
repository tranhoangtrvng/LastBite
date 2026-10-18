// src/components/common/FilterSidebar.jsx
import React, { useState } from 'react';
import Button from './Button';

export default function FilterSidebar({ onApplyFilter, onResetFilter, className = '' }) {
  // Quản lý state các tiêu chí lọc
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedTimes, setSelectedTimes] = useState([]);

  // Dữ liệu hiển thị chuẩn theo Figma Frame 2
  const categories = [
    { id: 'com', label: 'Cơm' },
    { id: 'banhmi', label: 'Bánh mì' },
    { id: 'bunpho', label: 'Bún / Phở' },
    { id: 'trasua', label: 'Trà sữa' },
    { id: 'doanvat', label: 'Đồ ăn vặt' },
  ];

  const priceRanges = [
    { id: 'all', label: 'Tất cả mức giá' },
    { id: 'under20', label: 'Dưới 20.000đ' },
    { id: '20to40', label: '20.000đ - 40.000đ' },
    { id: 'over40', label: 'Trên 40.000đ' },
  ];

  const pickupTimes = [
    { id: 'lunch', label: 'Trưa (11:00 - 13:30)' },
    { id: 'evening', label: 'Tối (18:00 - 20:00)' },
    { id: 'late', label: 'Sau 20:00' },
  ];

  // Xử lý toggle checkbox danh mục
  const handleToggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Xử lý toggle checkbox giờ nhận
  const handleToggleTime = (id) => {
    setSelectedTimes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (onApplyFilter) {
      onApplyFilter({
        categories: selectedCategories,
        priceRange: selectedPrice,
        pickupTimes: selectedTimes,
      });
    }
  };

  return (
    <aside className={`w-[280px] bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm space-y-6 text-left shrink-0 ${className}`}>
      {/* Tiêu đề Sidebar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-[#111827]">BỘ LỌC TÌM KIẾM</h3>
        <button
          type="button"
          onClick={() => {
            setSelectedCategories([]);
            setSelectedPrice('all');
            setSelectedTimes([]);
            if (onResetFilter) onResetFilter();
          }}
          className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer"
        >
          Đặt lại
        </button>
      </div>

      {/* Nhóm 1: Danh mục */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Danh mục</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 text-xs text-[#374151] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() => handleToggleCategory(cat.id)}
                className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nhóm 2: Khoảng giá */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Khoảng giá</h4>
        <div className="space-y-2">
          {priceRanges.map((price) => (
            <label key={price.id} className="flex items-center gap-2.5 text-xs text-[#374151] cursor-pointer select-none">
              <input
                type="radio"
                name="priceRange"
                value={price.id}
                checked={selectedPrice === price.id}
                onChange={() => setSelectedPrice(price.id)}
                className="w-4 h-4 border-gray-300 text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
              />
              <span>{price.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nhóm 3: Giờ nhận hàng */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Giờ nhận hàng</h4>
        <div className="space-y-2">
          {pickupTimes.map((t) => (
            <label key={t.id} className="flex items-center gap-2.5 text-xs text-[#374151] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedTimes.includes(t.id)}
                onChange={() => handleToggleTime(t.id)}
                className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nút bấm áp dụng màu xanh full-width */}
      <div className="pt-2">
        <Button fullWidth variant="primary" size="md" onClick={handleApply}>
          ÁP DỤNG BỘ LỌC
        </Button>
      </div>
    </aside>
  );
}