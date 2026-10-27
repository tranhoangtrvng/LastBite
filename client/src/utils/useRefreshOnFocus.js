// Gọi onRefresh khi người dùng quay lại tab / cửa sổ (nếu đã rời đi quá minGapMs), và định kỳ mỗi everyMs
// khi tab đang hiển thị. Dùng để danh sách suất ăn, đơn hàng luôn gần với dữ liệu thật trên server.
import { useEffect, useRef } from 'react';

export default function useRefreshOnFocus(onRefresh, { everyMs = 60000, minGapMs = 15000 } = {}) {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    let last = Date.now();
    const run = () => {
      last = Date.now();
      callbackRef.current();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last >= minGapMs) run();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') run();
    }, everyMs);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [everyMs, minGapMs]);
}
