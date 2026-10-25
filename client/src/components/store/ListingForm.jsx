import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../common/Button';
import Input from '../common/Input';
import { listingApi } from '../../api/listingApi';
import { categoryApi } from '../../api/categoryApi';
import { resolveImageUrl, isoDate, isoTime, todayString, toVietnamIso } from '../../utils/format';

// Dữ liệu ban đầu của form: tạo mới -> giá trị mặc định; sửa -> đổi tin từ API (ISO 8601) sang ô nhập.
function buildDefaults(initialData) {
  if (!initialData) {
    return {
      title: '',
      description: '',
      category_id: '',
      original_price: '',
      sale_price: '',
      quantity: 1,
      pickup_start: '20:00',
      pickup_end: '21:30',
      image_url: '',
    };
  }
  return {
    title: initialData.title || '',
    description: initialData.description || '',
    category_id: initialData.category?.id ? String(initialData.category.id) : '',
    original_price: initialData.original_price ?? '',
    sale_price: initialData.sale_price ?? '',
    quantity: initialData.quantity ?? 1,
    pickup_start: isoTime(initialData.pickup_start), // ô giờ chỉ nhận "HH:mm"
    pickup_end: isoTime(initialData.pickup_end),
    image_url: initialData.image_url || '',
  };
}

export default function ListingForm({ initialData = null, onSuccess, onCancel }) {
  const isEdit = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: buildDefaults(initialData) });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([]);

  // Loại món lấy từ server (GET /categories) để người bán chọn khi đăng
  useEffect(() => {
    categoryApi
      .getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {}); // lỗi thì để trống, loại món là không bắt buộc
  }, []);

  // Form sửa: các <option> chỉ xuất hiện sau khi danh sách loại món tải xong, nên phải chọn lại loại món
  // cũ của tin SAU lần hiển thị đó, nếu không ô chọn sẽ hiện "Chưa chọn" và lần lưu sau sẽ xoá mất loại món.
  useEffect(() => {
    if (categories.length > 0 && initialData?.category?.id) {
      setValue('category_id', String(initialData.category.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Theo dõi link ảnh để hiện xem trước
  const previewImage = watch('image_url');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setServerMessage({ type: 'error', text: 'Kích thước ảnh tối đa là 2MB!' });
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      setServerMessage({ type: '', text: '' });
      const res = await listingApi.uploadImage(file);
      // Server trả { success, data: { image_url: '/uploads/xxx.jpg' } }
      if (res.data?.image_url) {
        setValue('image_url', res.data.image_url);
      }
    } catch (err) {
      setServerMessage({ type: 'error', text: err.message || 'Lỗi khi tải ảnh lên server.' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData) => {
    const originalPrice = Number(formData.original_price);
    const salePrice = Number(formData.sale_price);

    // 1. Kiểm tra giá bán (docs/api.md: giá bán nhỏ hơn hoặc bằng giá gốc)
    if (salePrice > originalPrice) {
      setServerMessage({ type: 'error', text: 'Giá thanh lý không được lớn hơn giá gốc!' });
      return;
    }

    // 2. Ghép ngày + giờ thành ISO 8601 giờ Việt Nam ("2026-10-24T20:00:00+07:00").
    //    Đăng mới: ngày hôm nay. Sửa: giữ nguyên ngày của tin cũ.
    const startDate = isEdit ? isoDate(initialData.pickup_start) : todayString();
    const endDate = isEdit ? isoDate(initialData.pickup_end) : todayString();
    const pickupStart = toVietnamIso(startDate, formData.pickup_start);
    const pickupEnd = toVietnamIso(endDate, formData.pickup_end);

    if (pickupEnd <= pickupStart) {
      setServerMessage({ type: 'error', text: 'Giờ kết thúc nhận phải sau giờ bắt đầu.' });
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category_id: formData.category_id ? Number(formData.category_id) : null,
      image_url: formData.image_url || null,
      original_price: originalPrice,
      sale_price: salePrice,
      quantity: Number(formData.quantity),
    };

    // Khi sửa chỉ gửi giờ nhận nếu người bán thật sự đổi (tin đã hết giờ vẫn sửa được giá, số suất...)
    if (!isEdit || formData.pickup_start !== isoTime(initialData.pickup_start)) {
      submitData.pickup_start = pickupStart;
    }
    if (!isEdit || formData.pickup_end !== isoTime(initialData.pickup_end)) {
      submitData.pickup_end = pickupEnd;
    }

    try {
      setSubmitting(true);
      setServerMessage({ type: '', text: '' });

      // 3. Gửi dữ liệu đã chuẩn hoá xuống Backend
      if (isEdit) {
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
      // 400 kèm errors[{field,message}] -> gắn lỗi vào đúng ô nhập
      if (err.errors?.length) {
        err.errors.forEach((e) => setError(e.field, { message: e.message }));
      }
      setServerMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra khi lưu tin.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
        {isEdit ? 'Chỉnh sửa tin đăng' : 'Đăng món ăn thanh lý'}
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
        id="listing-title"
        label="Tên món ăn *"
        placeholder="VD: Cơm gà xối mỡ sốt cay"
        {...register('title', {
          required: 'Vui lòng nhập tên món',
          minLength: { value: 3, message: 'Tên món tối thiểu 3 ký tự' },
        })}
        error={errors.title?.message}
      />

      {/* Loại món */}
      <div>
        <label htmlFor="listing-category" className="block text-sm font-semibold text-[#111827] mb-1.5">Loại món</label>
        <select
          id="listing-category"
          className="w-full h-11 px-3 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          {...register('category_id')}
        >
          <option value="">-- Chưa chọn --</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {errors.category_id?.message && <span className="text-xs text-[#DC2626] font-medium">{errors.category_id.message}</span>}
      </div>

      {/* Mô tả */}
      <div>
        <label htmlFor="listing-description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
        <textarea
          id="listing-description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mô tả tình trạng, cách đóng gói..."
          {...register('description')}
        />
      </div>

      {/* Upload ảnh */}
      <div>
        <label htmlFor="listing-image" className="block text-sm font-medium text-gray-700 mb-1">Ảnh món ăn (JPG hoặc PNG, tối đa 2MB)</label>
        <input type="hidden" {...register('image_url')} />
        <div className="flex items-center gap-4">
          <input
            id="listing-image"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {uploading && <span className="text-sm text-blue-600 font-medium">Đang tải ảnh...</span>}
        </div>
        {previewImage && (
          <div className="mt-3">
            <img src={resolveImageUrl(previewImage)} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm" />
          </div>
        )}
      </div>

      {/* Giá và Số lượng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          id="listing-original-price"
          label="Giá gốc (VNĐ) *"
          type="number"
          placeholder="50000"
          {...register('original_price', { required: 'Nhập giá gốc', min: { value: 1000, message: 'Giá tối thiểu 1.000đ' } })}
          error={errors.original_price?.message}
        />
        <Input
          id="listing-sale-price"
          label="Giá thanh lý (VNĐ) *"
          type="number"
          placeholder="20000"
          {...register('sale_price', { required: 'Nhập giá bán', min: { value: 1000, message: 'Giá tối thiểu 1.000đ' } })}
          error={errors.sale_price?.message}
        />
        <Input
          id="listing-quantity"
          label="Số suất *"
          type="number"
          placeholder="3"
          helperText={isEdit && initialData.booked > 0 ? `Đã có ${initialData.booked} suất được đặt` : undefined}
          {...register('quantity', {
            required: 'Nhập số lượng',
            min: { value: 1, message: 'Ít nhất 1' },
            max: { value: 999, message: 'Tối đa 999' },
          })}
          error={errors.quantity?.message}
        />
      </div>

      {/* Khung giờ nhận */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="listing-pickup-start"
          label="Giờ bắt đầu nhận *"
          type="time"
          {...register('pickup_start', { required: 'Chọn giờ bắt đầu' })}
          error={errors.pickup_start?.message}
        />
        <Input
          id="listing-pickup-end"
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
        <Button type="submit" variant="primary" isLoading={submitting} disabled={uploading}>
          {isEdit ? 'Lưu thay đổi' : 'Đăng món ngay'}
        </Button>
      </div>
    </form>
  );
}
