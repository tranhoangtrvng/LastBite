// client/src/pages/auth/AuthPage.jsx
// Đăng nhập / Đăng ký (giao diện thẻ gọn mới) + popup "Quên mật khẩu?".
// Server nhận { email, password } khi đăng nhập và { name, email, password, phone?, role } khi đăng ký
// (docs/api.md mục 3.2), nên form gửi đúng các tên trường này.
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homePathForRole } from '../../routes/ProtectedRoute';
import { Input, Button, ForgotPasswordModal } from '../../components/common';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Số điện thoại 9 đến 11 chữ số (quy tắc của server). Gõ "+84 901 234 567" hay "0901.234.567" đều được.
const PHONE_REGEX = /^\d{9,11}$/;
const normalizePhone = (value) => {
  const compact = value.replace(/[\s.\-()]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Người mua' },
  { value: 'store', label: 'Cửa hàng' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setError('Email không đúng định dạng (ví dụ: ten@gmail.com).');
      return;
    }
    if (!formData.password || formData.password.length < 6 || formData.password.length > 72) {
      setError('Mật khẩu phải từ 6 đến 72 ký tự.');
      return;
    }

    let phone;
    if (activeTab === 'register') {
      if (formData.name.trim().length < 2) {
        setError('Vui lòng nhập họ và tên (ít nhất 2 ký tự).');
        return;
      }
      if (formData.phone.trim()) {
        phone = normalizePhone(formData.phone.trim());
        if (!PHONE_REGEX.test(phone)) {
          setError('Số điện thoại phải gồm 9 đến 11 chữ số (ví dụ: 0987654321).');
          return;
        }
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const user =
        activeTab === 'login'
          ? await login({ email, password: formData.password })
          : await register({
              name: formData.name.trim(),
              email,
              password: formData.password,
              ...(phone ? { phone } : {}),
              role: formData.role,
            });

      // Về trang đang định vào trước khi bị bắt đăng nhập, nếu không thì về trang chủ của vai trò
      // (người mua: /foods, cửa hàng: /store, admin: /admin).
      navigate(location.state?.from || homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(err?.message || 'Thao tác không thành công.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col gap-5">
        {/* Brand */}
        <div className="text-center">
          <span className="text-2xl font-bold text-[#2563EB]">LastBite</span>
          <p className="text-xs text-[#6B7280] mt-1">Cứu món ngon – Tiết kiệm chi phí</p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full h-11 p-1 bg-[#F3F4F6] rounded-lg flex items-center">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition ${
              activeTab === 'login' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition ${
              activeTab === 'register' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div role="alert" className="text-xs text-red-600 font-medium text-left bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
          {activeTab === 'register' && (
            <Input
              id="name"
              label="Họ và tên"
              placeholder="Nhập họ và tên..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="ten@gmail.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />

          {activeTab === 'register' && (
            <Input
              id="phone"
              label="Số điện thoại (không bắt buộc)"
              placeholder="0987654321"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          )}

          {/* Chọn loại tài khoản khi đăng ký */}
          {activeTab === 'register' && (
            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-[#111827]">Bạn đăng ký với tư cách</span>
              <div className="h-11 w-full bg-[#F3F4F6] p-1 rounded-lg flex items-center gap-1 select-none">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('role', option.value)}
                    className={`flex-1 h-full rounded-md text-sm font-semibold transition cursor-pointer ${
                      formData.role === option.value ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {formData.role === 'store' && (
                <p className="text-xs text-[#6B7280]">
                  Sau khi đăng ký, bạn điền thông tin cửa hàng và chờ admin duyệt trước khi đăng món.
                </p>
              )}
            </div>
          )}

          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />

          {/* Nút mở popup quên mật khẩu */}
          {activeTab === 'login' && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs text-[#2563EB] hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          {activeTab === 'register' && (
            <Input
              id="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="mt-2">
            {activeTab === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </Button>
        </form>
      </div>

      {/* Popup quên mật khẩu */}
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
