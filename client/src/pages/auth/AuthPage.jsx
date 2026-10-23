// client/src/pages/auth/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homePathForRole } from '../../routes/ProtectedRoute';
import { Button, Input } from '../../components/common';

// 1. Biểu thức phát hiện ký tự tiếng Việt có dấu
const VIETNAMESE_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

// 2. Biểu thức Regex Email chuẩn quốc tế (chỉ chứa chữ cái không dấu a-z, chữ số 0-9, dấu chấm/gạch)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 3. Số điện thoại: 9 đến 11 chữ số (đúng quy tắc của server, docs/api.md mục 3.2).
//    Người dùng gõ "+84 901 234 567" hoặc "0901.234.567" đều được: bỏ dấu cách/chấm/gạch, đổi +84 thành 0.
const PHONE_REGEX = /^\d{9,11}$/;
const normalizePhone = (value) => {
  const compact = value.replace(/[\s.\-()]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Tab hiện tại: 'login' (Đăng nhập) hoặc 'register' (Đăng ký)
  const [tab, setTab] = useState('login');

  // Dữ liệu biểu mẫu
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'buyer', // 'buyer' (Người mua) hoặc 'store' (Cửa hàng)
    password: '',
    confirmPassword: '',
  });
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Trạng thái xử lý và thông báo lỗi
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Cập nhật giá trị khi người dùng gõ phím (giữ nguyên chuỗi để Unikey gõ dấu mượt mà)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Tự động xóa lỗi khi người dùng bắt đầu chỉnh sửa lại trường đó
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Chuyển tab và reset lỗi
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMessage('');
    setFieldErrors({});
    setShowForgotNotice(false);
  };

  // Kiểm tra tính hợp lệ dữ liệu chặt chẽ phía Client trước khi gửi API
  const validateForm = () => {
    const errors = {};
    const cleanEmail = formData.email.trim();

    // 1. Kiểm tra Họ tên (chỉ khi Đăng ký): 2 đến 100 ký tự
    if (tab === 'register') {
      const name = formData.fullName.trim();
      if (!name) {
        errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
      } else if (name.length < 2 || name.length > 100) {
        errors.fullName = 'Họ và tên phải từ 2 đến 100 ký tự.';
      }
    }

    // 2. Kiểm tra Email (server đăng nhập bằng email)
    if (!cleanEmail) {
      errors.email = 'Vui lòng nhập Email.';
    } else if (VIETNAMESE_DIACRITICS_REGEX.test(cleanEmail)) {
      errors.email = 'Email không được chứa dấu tiếng Việt.';
    } else if (cleanEmail.includes(' ')) {
      errors.email = 'Email không được chứa khoảng trắng.';
    } else if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 150) {
      errors.email = 'Email không đúng định dạng (vd: user@gmail.com).';
    }

    // 3. Số điện thoại (chỉ khi Đăng ký, không bắt buộc)
    if (tab === 'register' && formData.phone.trim()) {
      if (!PHONE_REGEX.test(normalizePhone(formData.phone.trim()))) {
        errors.phone = 'Số điện thoại phải gồm 9 đến 11 chữ số (vd: 0987654321).';
      }
    }

    // 4. Kiểm tra Mật khẩu: 6 đến 72 ký tự
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự.';
    } else if (formData.password.length > 72) {
      errors.password = 'Mật khẩu tối đa 72 ký tự.';
    } else if (VIETNAMESE_DIACRITICS_REGEX.test(formData.password)) {
      errors.password = 'Mật khẩu không được chứa dấu tiếng Việt. Vui lòng nhập lại.';
    }

    // 5. Kiểm tra Xác nhận mật khẩu (chỉ khi Đăng ký)
    if (tab === 'register') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Vui lòng nhập lại mật khẩu xác nhận.';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Nếu dữ liệu không hợp lệ -> dừng lại ngay, không gửi request lên máy chủ
    if (!validateForm()) return;

    setLoading(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      let user;
      if (tab === 'login') {
        user = await login({
          email: cleanEmail,
          password: formData.password,
        });
      } else {
        const phone = formData.phone.trim() ? normalizePhone(formData.phone.trim()) : undefined;
        user = await register({
          name: formData.fullName.trim(),
          email: cleanEmail,
          password: formData.password,
          ...(phone ? { phone } : {}),
          role: formData.role, // 'buyer' hoặc 'store'
        });
      }

      // Đăng nhập / Đăng ký thành công -> quay lại trang đang xem dở, hoặc về trang chủ theo vai trò
      navigate(location.state?.from || homePathForRole(user.role), { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Thao tác không thành công, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      {/* Khung Form: Rộng 440px, Bo góc 12px, Padding 32px chuẩn Figma */}
      <div className="w-full max-w-[440px] bg-white rounded-xl border border-[#E5E7EB] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] p-8 flex flex-col gap-5">
        
        {/* Tiêu đề & Thương hiệu */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#2563EB] tracking-tight">
            LastBite
          </h1>
          <p className="text-sm text-[#4B5563]">
            Cứu món ngon – Tiết kiệm chi phí
          </p>
        </div>

        {/* Thanh chuyển đổi Tab: [ Đăng nhập ] | [ Đăng ký ] */}
        <div className="h-11 w-full bg-[#F3F4F6] p-1 rounded-lg flex items-center gap-1 select-none">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Thông báo lỗi trả về từ máy chủ Backend */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Biểu mẫu Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Ô Họ tên (Chỉ hiển thị khi Đăng ký) */}
          {tab === 'register' && (
            <Input
              label="Họ và tên"
              id="fullName"
              name="fullName"
              placeholder="Nhập họ và tên..."
              value={formData.fullName}
              onChange={handleChange}
              error={fieldErrors.fullName}
            />
          )}

          {/* Ô Email (đăng nhập bằng email) */}
          <Input
            label="Email"
            id="email"
            name="email"
            placeholder="Nhập email..."
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          {/* Ô Số điện thoại (Chỉ hiển thị khi Đăng ký, không bắt buộc) */}
          {tab === 'register' && (
            <Input
              label="Số điện thoại (không bắt buộc)"
              id="phone"
              name="phone"
              placeholder="VD: 0987654321"
              value={formData.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
            />
          )}

          {/* Chọn loại tài khoản (Chỉ hiển thị khi Đăng ký) */}
          {tab === 'register' && (
            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-[#111827]">Bạn đăng ký với tư cách</span>
              <div className="h-11 w-full bg-[#F3F4F6] p-1 rounded-lg flex items-center gap-1 select-none">
                {[
                  { value: 'buyer', label: 'Người mua' },
                  { value: 'store', label: 'Cửa hàng' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: option.value }))}
                    className={`flex-1 h-full rounded-md text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      formData.role === option.value
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {formData.role === 'store' && (
                <p className="text-xs text-[#6B7280]">
                  Sau khi đăng ký bạn điền thông tin cửa hàng và chờ admin duyệt trước khi đăng món.
                </p>
              )}
            </div>
          )}

          {/* Ô Mật khẩu */}
          <Input
            label="Mật khẩu"
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />

          {/* Ô Xác nhận mật khẩu (Chỉ hiển thị khi Đăng ký) */}
          {tab === 'register' && (
            <Input
              label="Xác nhận mật khẩu"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
            />
          )}

          {/* Link Quên mật khẩu (Chỉ hiển thị ở tab Đăng nhập) */}
          {tab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotNotice((prev) => !prev)}
                className="text-[13px] text-[#2563EB] hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}
          {tab === 'login' && showForgotNotice && (
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-900 rounded-lg text-xs leading-relaxed">
              Vui lòng liên hệ quản trị viên qua email admin@lastbite.vn để được hỗ trợ cấp lại mật khẩu.
            </div>
          )}

          {/* Nút hành động chính (CTA) */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              {tab === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
            </Button>
          </div>
        </form>

        {/* Điều hướng chuyển tab ở chân trang */}
        <div className="text-center pt-1 text-sm text-[#6B7280]">
          {tab === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className="font-bold text-[#2563EB] hover:underline cursor-pointer"
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
                className="font-bold text-[#2563EB] hover:underline cursor-pointer"
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