/**
 * Định dạng tiền tệ VND an toàn, không gây crash nếu giá trị truyền vào là null/undefined
 */
export const formatCurrency = (amount) => {
  return (Number(amount) || 0).toLocaleString('vi-VN') + 'đ';
};

/**
 * Định dạng thời gian hiển thị (ví dụ: 19:30 - 20:30)
 */
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return 'Trong ngày';
  return `${startTime} - ${endTime}`;
};