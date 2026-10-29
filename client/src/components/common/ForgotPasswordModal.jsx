// client/src/components/common/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { authApi } from '../../api/authApi';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập mã 6 số & mật khẩu mới

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Server tìm tài khoản theo EMAIL (POST /api/auth/forgot-password nhận { email }).
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleModalClose = () => {
    setStep(1);
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  // Bước 1: Gửi yêu cầu nhận OTP từ Backend
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMessage('Vui lòng nhập email của tài khoản.');
      return;
    }
    if (!emailRegex.test(cleanInput)) {
      setErrorMessage('Email không đúng định dạng.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email: cleanInput });

      setStep(2);
      setSuccessMessage(res?.message || 'Mã xác thực đã được gửi! Vui lòng kiểm tra hộp thư hoặc tin nhắn.');
    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Gửi OTP và mật khẩu mới lên Backend để lưu vào Database
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Mã xác thực gồm 6 chữ số.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    try {
      setLoading(true);
      // Đúng tên trường của server: { email, code, new_password }
      const res = await authApi.resetPassword({
        email: identifier.trim(),
        code: cleanOtp,
        new_password: newPassword,
      });

      setSuccessMessage(res?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      
      // Tự động đóng popup sau 1.5 giây
      setTimeout(() => {
        handleModalClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={step === 1 ? 'Quên mật khẩu' : 'Xác thực & Đặt lại mật khẩu'}
      maxWidth="max-w-[440px]"
    >
      <div className="space-y-4 text-left">
        {/* Banner thông báo lỗi từ Backend */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Banner thông báo thành công */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium leading-relaxed">
            ✓ {successMessage}
          </div>
        )}

        {/* Form Giai đoạn 1: Gửi OTP */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Nhập email đã đăng ký để nhận mã 6 chữ số khôi phục mật khẩu (hiệu lực 15 phút).
            </p>

            <Input
              id="forgot-identifier"
              label="Email"
              type="email"
              placeholder="ten@gmail.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="flex-1"
                onClick={handleModalClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8]"
                isLoading={loading}
              >
                {loading ? 'Đang gửi...' : 'GỬI MÃ'}
              </Button>
            </div>
          </form>
        ) : (
          /* Form Giai đoạn 2: Nhập OTP & Đặt mật khẩu mới */
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Nhập mã 6 chữ số và mật khẩu mới cho tài khoản:
              <span className="font-semibold text-gray-800 ml-1">{identifier}</span>
            </p>
            {/* Bản demo chạy local chưa gửi được email thật: mã được in ở cửa sổ backend */}
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              Bản demo: mã được in ở cửa sổ chạy backend (dòng "[Quên mật khẩu] Mã đặt lại cho ...").
            </p>

            <Input
              id="otp-code"
              label="Mã xác thực (6 chữ số)"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
            />

            <Input
              id="new-password"
              label="Mật khẩu mới"
              type="password"
              placeholder="Tối thiểu 6 ký tự..."
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
            />

            <Input
              id="confirm-new-password"
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới..."
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => {
                  setStep(1);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8]"
                isLoading={loading}
              >
                {loading ? 'Đang lưu...' : 'XÁC NHẬN ĐỔI'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}