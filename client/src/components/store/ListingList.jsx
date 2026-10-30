// client/src/components/store/ListingList.jsx
import React, { useEffect, useState } from 'react';
import Button from '../common/Button';
import { listingApi } from '../../api/listingApi';
import ListingForm from './ListingForm';
import ConfirmDialog from '../admin/ConfirmDialog';
import { formatMoney, resolveImageUrl, isoTime, shortDate, PLACEHOLDER_IMAGE } from '../../utils/format';

export default function ListingList({ store = null }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingListing, setEditingListing] = useState(null);
  // Tin đang chờ xác nhận xoá (thay window.confirm bằng hộp xác nhận chung của dự án)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await listingApi.getMyListings({ limit: 50 });
      setListings(res.data || []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    setDeleting(true);
    try {
      await listingApi.deleteListing(deleteTarget.id);
      fetchListings();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };


  const handleDuplicate = (item) => {
    const { id, booked, remaining, ...clonedData } = item;
    setEditingListing({
      ...clonedData,
      id: null,
      title: item.title, // Giữ nguyên tên món gốc, không thêm (Bản sao)
      pickup_start: '20:00',
      pickup_end: '21:30',
    });
  };

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

  const now = new Date();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tin đăng</h1>
          {store && <p className="text-sm text-gray-500 mt-1">{store.name} · {store.address}</p>}
        </div>
        <Button variant="primary" onClick={() => setEditingListing('NEW')}>
          + Đăng món mới
        </Button>
      </div>

      {actionError && (
        <div className="mb-4 p-3 text-sm rounded-lg border text-red-600 bg-red-50 border-red-200">{actionError}</div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
      ) : loadError ? (
        <div className="text-center py-12 bg-white rounded-xl border border-red-200 space-y-3">
          <p className="font-semibold text-red-600">Không tải được danh sách tin đăng</p>
          <p className="text-xs text-gray-500">{loadError}</p>
          <Button variant="outline" onClick={fetchListings}>Thử lại</Button>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">Cửa hàng chưa có món ăn nào đang thanh lý.</p>
          <Button variant="outline" onClick={() => setEditingListing('NEW')}>Đăng món đầu tiên</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
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
                const remaining = Number(item.remaining ?? 0);
                const expired = new Date(item.pickup_end) < now;
                const hidden = item.status === 'hidden';

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={resolveImageUrl(item.image_url)}
                          alt={item.title}
                          className="w-20 h-20 rounded-md object-cover border bg-gray-100 shadow-sm shrink-0"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                        />
                        <span className="font-bold text-gray-800 text-base">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {isoTime(item.pickup_start)} - {isoTime(item.pickup_end)}
                      <div className="text-xs text-gray-400">ngày {shortDate(item.pickup_start)}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{formatMoney(item.sale_price)}</td>
                    <td className="px-4 py-3 space-y-1">
                      {hidden ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Bị admin ẩn</span>
                      ) : expired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Đã hết giờ</span>
                      ) : remaining > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Còn {remaining} suất</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Đã hết</span>
                      )}
                      <div className="text-xs text-gray-400">Đã đặt {item.booked ?? 0}/{item.quantity}</div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {/* Nút nhân bản */}
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(item)}>
                        Nhân bản
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingListing(item)}>
                        Sửa
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(item)}>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá tin đăng?"
        message={`Tin "${deleteTarget?.title ?? ''}" sẽ bị xoá khỏi danh sách. Tin còn đơn đang chờ nhận thì không xoá được.`}
        confirmText="Xoá tin"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}