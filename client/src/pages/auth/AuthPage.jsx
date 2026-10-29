// client/src/pages/auth/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, ForgotPasswordModal } from '../../components/common';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = formData.emailOrPhone.trim();

    if (!cleanInput) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    if (activeTab === 'register') {
      if (!formData.name.trim()) {
        setError('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (activeTab === 'login') {
        await login({
          emailOrPhone: cleanInput,
          password: formData.password,
        });
      } else {
        await register({
          name: formData.name.trim(),
          emailOrPhone: cleanInput,
          password: formData.password,
          role: 'buyer',
        });
      }

      navigate('/foods');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Thao tác không thành công.');
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
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition ${
              activeTab === 'login' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition ${
              activeTab === 'register' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {error && <div className="text-xs text-red-500 font-medium text-left">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            id="emailOrPhone"
            label="Email hoặc Số điện thoại"
            placeholder="Nhập email hoặc SĐT..."
            value={formData.emailOrPhone}
            onChange={(e) => handleInputChange('emailOrPhone', e.target.value)}
          />

          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />

          {/* Nút bấm mở popup */}
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
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="mt-2"
          >
            {activeTab === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </Button>
        </form>
      </div>

      {/* Gọi Component Popup độc lập */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
}