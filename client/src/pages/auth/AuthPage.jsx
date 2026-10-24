// client/src/pages/auth/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  // Frontend chỉ validate các điều kiện cơ bản nhất
  const validateForm = () => {
    const cleanInput = formData.emailOrPhone.trim();

    if (!cleanInput) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return false;
    }

    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return false;
    }

    if (activeTab === 'register') {
      if (!formData.name.trim()) {
        setError('Vui lòng nhập họ và tên.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không trùng khớp.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Gửi đơn thuần đúng những gì người dùng nhập
      if (activeTab === 'login') {
        await login({
          emailOrPhone: formData.emailOrPhone.trim(),
          password: formData.password,
        });
      } else {
        await register({
          name: formData.name.trim(),
          emailOrPhone: formData.emailOrPhone.trim(),
          password: formData.password,
          role: 'buyer',
        });
      }

      navigate('/');
    } catch (err) {
      // In thẳng câu thông báo trả về từ Backend
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Thao tác không thành công, vui lòng thử lại.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 space-y-5">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold text-[#2563EB] tracking-tight">LastBite</h1>
          <p className="text-sm text-[#4B5563]">Cứu món ngon – Tiết kiệm chi phí</p>
        </div>

        {/* Chuyển tab Đăng nhập / Đăng ký */}
        <div className="flex h-11 bg-[#F3F4F6] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Thông báo lỗi từ Backend */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs leading-relaxed font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {activeTab === 'register' && (
            <Input
              label="Họ và tên"
              name="name"
              placeholder="Nhập họ và tên..."
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}

          <Input
            label="Email hoặc Số điện thoại"
            name="emailOrPhone"
            placeholder="Nhập email hoặc số điện thoại..."
            value={formData.emailOrPhone}
            onChange={handleChange}
            required
          />

          <Input
            label="Mật khẩu"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {activeTab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert('Vui lòng liên hệ Admin qua email admin@lastbite.vn để được cấp lại mật khẩu.')}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          {activeTab === 'register' && (
            <Input
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full h-12 text-sm font-bold rounded-lg cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'ĐANG XỬ LÝ...'
              : activeTab === 'login'
              ? 'ĐĂNG NHẬP'
              : 'TẠO TÀI KHOẢN'}
          </Button>
        </form>

        <div className="text-center text-sm text-[#6B7280]">
          {activeTab === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}