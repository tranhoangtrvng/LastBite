// client/src/pages/store/StorePage.jsx
// Trang chủ của cửa hàng (/store). Tuỳ trạng thái cửa hàng của tài khoản đang đăng nhập:
//   - chưa đăng ký cửa hàng  -> form đăng ký (POST /stores, trạng thái ban đầu "chờ duyệt")
//   - pending (chờ admin duyệt) -> thông báo chờ + nút kiểm tra lại
//   - locked (bị khoá)          -> thông báo bị khoá
//   - approved                  -> danh sách tin đăng (ListingList) để đăng / sửa / xoá món
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { storeApi } from '../../api/storeApi';
import { Button, Input } from '../../components/common';
import ListingList from '../../components/store/ListingList';

function NoticeCard({ icon, title, children, tone = 'blue' }) {
  const tones = {
    blue: 'border-[#BFDBFE] bg-[#EFF6FF]',
    red: 'border-red-200 bg-red-50',
  };
  return (
    <div className={`max-w-xl mx-auto rounded-2xl border p-8 text-center space-y-3 ${tones[tone]}`}>
      <div className="text-4xl">{icon}</div>
      <h1 className="text-xl font-bold text-[#111827]">{title}</h1>
      <div className="text-sm text-[#4B5563] space-y-3">{children}</div>
    </div>
  );
}

function StoreRegisterForm({ onRegistered }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', address: '', phone: '', description: '' } });
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await storeApi.registerStore({
        name: values.name.trim(),
        address: values.address.trim(),
        phone: values.phone.trim() || undefined,
        description: values.description.trim() || undefined,
      });
      onRegistered();
    } catch (err) {
      // 400 có errors[{field,message}] -> hiện ngay dưới ô nhập tương ứng
      if (err.errors?.length) {
        err.errors.forEach((e) => setError(e.field, { message: e.message }));
      }
      setServerError(err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-4"
    >
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Đăng ký cửa hàng</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Điền thông tin cửa hàng. Sau khi gửi, admin sẽ duyệt trước khi bạn đăng được món ăn.
        </p>
      </div>

      {serverError && (
        <div className="p-3 text-sm rounded-lg border text-red-600 bg-red-50 border-red-200">{serverError}</div>
      )}

      <Input
        id="store-name"
        label="Tên cửa hàng *"
        placeholder="VD: Bánh mì Tuấn Khang"
        {...register('name', {
          required: 'Vui lòng nhập tên cửa hàng',
          minLength: { value: 2, message: 'Tên cửa hàng tối thiểu 2 ký tự' },
        })}
        error={errors.name?.message}
      />
      <Input
        id="store-address"
        label="Địa chỉ *"
        placeholder="Số nhà, đường, phường/xã, quận/huyện"
        {...register('address', {
          required: 'Vui lòng nhập địa chỉ',
          minLength: { value: 5, message: 'Địa chỉ tối thiểu 5 ký tự' },
        })}
        error={errors.address?.message}
      />
      <Input
        id="store-phone"
        label="Số điện thoại cửa hàng"
        placeholder="0901234567"
        inputMode="numeric"
        {...register('phone', {
          validate: (v) => !v.trim() || /^\d{9,11}$/.test(v.trim()) || 'Số điện thoại phải gồm 9 đến 11 chữ số',
        })}
        error={errors.phone?.message}
      />
      <div>
        <label htmlFor="store-description" className="block text-sm font-semibold text-[#111827] mb-1.5">
          Giới thiệu ngắn
        </label>
        <textarea
          id="store-description"
          rows={3}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          placeholder="Cửa hàng bán gì, giờ mở cửa..."
          {...register('description')}
        />
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Gửi đăng ký
      </Button>
    </form>
  );
}

export default function StorePage() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    storeApi
      .getMyStore()
      .then((res) => {
        if (cancelled) return;
        setStore(res.data); // null nếu chưa đăng ký
        setLoadError('');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return <p className="text-center text-sm text-[#6B7280] py-16">Đang tải thông tin cửa hàng...</p>;
  }

  if (loadError) {
    return (
      <NoticeCard icon="⚠️" title="Không tải được thông tin cửa hàng" tone="red">
        <p>{loadError}</p>
        <Button onClick={reload}>Thử lại</Button>
      </NoticeCard>
    );
  }

  if (!store) {
    return <StoreRegisterForm onRegistered={reload} />;
  }

  if (store.status === 'pending') {
    return (
      <NoticeCard icon="⏳" title="Cửa hàng đang chờ admin duyệt">
        <p>
          Cửa hàng <strong>{store.name}</strong> đã được gửi đăng ký. Khi admin duyệt xong bạn sẽ đăng được món ăn.
        </p>
        <Button variant="outline" onClick={reload}>
          Kiểm tra lại trạng thái
        </Button>
      </NoticeCard>
    );
  }

  if (store.status === 'locked') {
    return (
      <NoticeCard icon="🔒" title="Cửa hàng đang bị khoá" tone="red">
        <p>
          Cửa hàng <strong>{store.name}</strong> hiện không thể đăng món. Vui lòng liên hệ admin để biết thêm chi tiết.
        </p>
      </NoticeCard>
    );
  }

  return <ListingList store={store} />;
}
