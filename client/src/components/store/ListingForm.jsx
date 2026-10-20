import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import { listingApi } from '../../api/listingApi';

export default function ListingForm({ initialData = null, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      original_price: '',
      sale_price: '',
      quantity: 1,
      pickup_start: '20:00',
      pickup_end: '21:30',
      image_url: '',
    },
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Theo dõi link ảnh để hiện xem trước
  const previewImage = watch('image_url');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setServerMessage({ type: 'error', text: 'Kích thước ảnh tối đa là 2MB!' });
      return;
    }

    try {
      setUploading(true);
      setServerMessage({ type: '', text: '' });
      const res = await listingApi.uploadImage(file);
      // Giả sử backend trả về { data: { image_url: '/uploads/xxx.jpg' } }
      if (res.data?.image_url) {
        setValue('image_url', res.data.image_url);
      }
    } catch (err) {
      setServerMessage({ type: 'error', text: 'Lỗi khi tải ảnh lên server.' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData) => {
    // 1. Kiểm tra giá bán
    if (Number(formData.sale_price) >= Number(formData.original_price)) {
      setServerMessage({ type: 'error', text: 'Giá thanh lý phải nhỏ hơn giá gốc!' });
      return;
    }

    // 2. CHUẨN HOÁ THỜI GIAN
    // Khởi tạo đối tượng Date hiện tại
    const now = new Date();
    
    // Bù trừ độ lệch múi giờ (Timezone Offset) của máy tính so với UTC
    // getTimezoneOffset() trả về số phút, nhân với 60000 để ra số mili-giây
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    
    // Chuyển sang chuỗi ISO và lấy đúng phần YYYY-MM-DD
    const localToday = localNow.toISOString().split('T')[0];
    
    // Đảm bảo đuôi giờ luôn có giây (VD: "21:30" -> "21:30:00")
    const formatTime = (timeStr) => timeStr.length === 5 ? `${timeStr}:00` : timeStr;

    // Ghép Ngày và Giờ thành định dạng chuẩn của Database
    const submitData = {
      ...formData,
      pickup_start: `${localToday} ${formatTime(formData.pickup_start)}`, 
      pickup_end: `${localToday} ${formatTime(formData.pickup_end)}` 
    };

    try {
      setSubmitting(true);
      setServerMessage({ type: '', text: '' });

      // 3. Gửi dữ liệu đã chuẩn hoá xuống Backend
      if (initialData?.id) {
        await listingApi.updateListing(initialData.id, submitData);
        setServerMessage({ type: 'success', text: 'Cập nhật món thành công!' });
      } else {
        await listingApi.createListing(submitData);
        setServerMessage({ type: 'success', text: 'Đăng món thành công!' });
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000); 
      }
    } catch (err) {
      setServerMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu tin.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
        {initialData?.id ? 'Chỉnh sửa tin đăng' : 'Đăng món ăn thanh lý'}
      </h2>

      {/* Thông báo lỗi hoặc thành công */}
      {serverMessage.text && (
        <div className={`p-3 text-sm rounded-lg border ${
          serverMessage.type === 'error' ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'
        }`}>
          {serverMessage.text}
        </div>
      )}

      {/* Tên món */}
      <Input
        label="Tên món ăn *"
        placeholder="VD: Cơm gà xối mỡ sốt cay"
        {...register('title', { required: 'Vui lòng nhập tên món' })}
        error={errors.title?.message}
      />

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mô tả tình trạng, cách đóng gói..."
          {...register('description')}
        />
      </div>

      {/* Upload ảnh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh món ăn (tối đa 2MB)</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {uploading && <span className="text-sm text-blue-600 font-medium">Đang tải ảnh...</span>}
        </div>
        {previewImage && (
          <div className="mt-3">
            <img src={`http://localhost:5000${previewImage}`} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm" />
          </div>
        )}
      </div>

      {/* Giá và Số lượng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Giá gốc (VNĐ) *"
          type="number"
          placeholder="50000"
          {...register('original_price', { required: 'Nhập giá gốc', min: { value: 1000, message: 'Giá > 1000' } })}
          error={errors.original_price?.message}
        />
        <Input
          label="Giá thanh lý (VNĐ) *"
          type="number"
          placeholder="20000"
          {...register('sale_price', { required: 'Nhập giá bán', min: { value: 1000, message: 'Giá > 1000' } })}
          error={errors.sale_price?.message}
        />
        <Input
          label="Số suất *"
          type="number"
          placeholder="3"
          {...register('quantity', { required: 'Nhập số lượng', min: { value: 1, message: 'Ít nhất 1' } })}
          error={errors.quantity?.message}
        />
      </div>

      {/* Khung giờ nhận */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Giờ bắt đầu nhận *"
          type="time"
          {...register('pickup_start', { required: 'Chọn giờ bắt đầu' })}
          error={errors.pickup_start?.message}
        />
        <Input
          label="Giờ kết thúc nhận *"
          type="time"
          {...register('pickup_end', { required: 'Chọn giờ kết thúc' })}
          error={errors.pickup_end?.message}
        />
      </div>

      {/* Nút hành động */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={submitting}>
          {initialData?.id ? 'Lưu thay đổi' : 'Đăng món ngay'}
        </Button>
      </div>
    </form>
  );
}