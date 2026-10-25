import { useCallback, useEffect, useRef, useState } from 'react';

// Trì hoãn giá trị (dùng cho ô tìm kiếm để không gọi API mỗi lần gõ phím).
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Tải một danh sách có phân trang từ API admin.
// fetcher(params) trả { data, pagination }. onEmptyPage: gọi khi trang hiện tại trống
// (ví dụ vừa xoá phần tử cuối của trang 2) để quay về trang trước.
export default function useAdminList(fetcher, params, onEmptyPage) {
  const [state, setState] = useState({ items: [], pagination: null, loading: true, error: '' });
  const key = JSON.stringify(params);
  const latest = useRef(0);
  const emptyRef = useRef(onEmptyPage);
  emptyRef.current = onEmptyPage;

  const load = useCallback(async () => {
    const id = latest.current + 1;
    latest.current = id;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const p = JSON.parse(key);
      const res = await fetcher(p);
      if (id !== latest.current) return; // bỏ kết quả của yêu cầu cũ
      const items = res.data || [];
      setState({ items, pagination: res.pagination || null, loading: false, error: '' });
      if (items.length === 0 && p.page > 1 && emptyRef.current) emptyRef.current();
    } catch (err) {
      if (id !== latest.current) return;
      setState((s) => ({ ...s, loading: false, error: err.message || 'Không tải được dữ liệu' }));
    }
  }, [fetcher, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
