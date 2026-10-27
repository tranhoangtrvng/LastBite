// Thông báo nhỏ góc phải màn hình (thay cho alert() của trình duyệt), tự tắt sau vài giây.
// Cách dùng:  const toast = useToast();  toast.success('Đã lưu');  toast.error('Có lỗi');  toast.warning('...');
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TONES = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: '✓' },
  error: { box: 'border-red-200 bg-red-50 text-red-700', icon: '✕' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: '!' },
  info: { box: 'border-blue-200 bg-blue-50 text-blue-800', icon: 'i' },
};

const DURATION_MS = { success: 3500, info: 3500, warning: 5000, error: 6000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, message }]); // tối đa 4 thông báo cùng lúc
      setTimeout(() => dismiss(id), DURATION_MS[type] || 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      warning: (m) => push('warning', m),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const tone = TONES[t.type] || TONES.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${tone.box}`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
                {tone.icon}
              </span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Đóng thông báo"
                className="cursor-pointer font-bold opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  return ctx;
}
