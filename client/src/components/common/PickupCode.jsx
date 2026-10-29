// src/components/common/PickupCode.jsx
import React, { useState } from 'react';

export default function PickupCode({ 
  code = '',
  expireTime = '',
  pickupToday = true, 
  pickupDateLabel = '', 
  className = '' 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dateText = pickupToday ? 'hôm nay' : (pickupDateLabel ? `ngày ${pickupDateLabel}` : 'ngày hẹn');

  return (
    <div className={`p-4 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-xl text-center space-y-1 relative group ${className}`}>
      <p className="text-[11px] font-bold tracking-wider text-[#6B7280] uppercase">
        MÃ NHẬN HÀNG
      </p>

      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-extrabold tracking-widest text-[#111827] font-sans">
          {code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#374151] px-2 py-0.5 rounded font-medium transition cursor-pointer"
        >
          {copied ? 'Đã chép ✓' : 'Sao chép'}
        </button>
      </div>

      <p className="text-xs text-[#DC2626] font-semibold pt-0.5">
        Hết hạn lúc: {expireTime} ({dateText})
      </p>
    </div>
  );
}
