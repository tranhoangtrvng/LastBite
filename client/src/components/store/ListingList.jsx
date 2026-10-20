import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import { listingApi } from '../../api/listingApi';
import ListingForm from './ListingForm';

export default function ListingList() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState(null); // null = danh sách, có data = mở form sửa, 'NEW' = form tạo mới

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await listingApi.getMyListings();
      if (res.data) setListings(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Hàm cắt giờ phút từ chuỗi ISO của DB
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin này?')) return;
    try {
      await listingApi.deleteListing(id);
      fetchListings(); // Load lại danh sách sau khi xóa
    } catch (error) {
      alert('Lỗi khi xóa tin');
    }
  };

  // Nếu đang ở trạng thái chỉnh sửa hoặc tạo mới thì render Form
  if (editingListing) {
    return (
      <div className="p-6">
        <ListingForm 
          initialData={editingListing === 'NEW' ? null : editingListing} 
          onSuccess={() => {
            setEditingListing(null);
            fetchListings();
          }}
          onCancel={() => setEditingListing(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tin đăng</h1>
        <Button variant="primary" onClick={() => setEditingListing('NEW')}>
          + Đăng món mới
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">Cửa hàng chưa có món ăn nào đang thanh lý.</p>
          <Button variant="outline" onClick={() => setEditingListing('NEW')}>Đăng món đầu tiên</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Món ăn</th>
                <th className="px-4 py-3">Khung giờ</th>
                <th className="px-4 py-3">Giá thanh lý</th>
                <th className="px-4 py-3">Còn lại</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((item) => {
                // Lấy chuẩn xác giá trị remaining từ Backend
                const sl = item.remaining || item.quantity || 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-4">
                      <img 
                        src={`http://localhost:5000/${(item.image_url || '').replace(/^\//, '')}`} 
                        alt={item.title} 
                        className="w-24 h-24 rounded-md object-cover border bg-gray-100 shadow-sm shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="font-bold text-gray-800 text-base">{item.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatTime(item.pickup_start)} - {formatTime(item.pickup_end)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      {Number(item.sale_price).toLocaleString()}đ
                    </td>
                    <td className="px-4 py-3">
                      {sl > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Còn {sl} suất
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Đã hết
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditingListing(item)}>
                        Sửa
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                        Xóa
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
