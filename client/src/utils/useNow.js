// Hook trả về "bây giờ" (mili-giây) và tự cập nhật theo chu kỳ, để giao diện đếm ngược giờ nhận hàng
// và tự ẩn/khoá những suất đã hết giờ mà không cần tải lại trang.
import { useEffect, useState } from 'react';

export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    // Quay lại tab sau một lúc (máy ngủ, chuyển tab) thì cập nhật ngay.
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);

  return now;
}
