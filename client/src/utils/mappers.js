// Chuyển dữ liệu API (docs/api.md mục 4) sang dạng mà các component giao diện của VT2 đang dùng,
// để FoodCard, BookingModal, PickupSuccessModal, trang Lịch sử đơn... giữ nguyên giao diện.
import {
  resolveImageUrl,
  formatPickupRange,
  formatDateTime,
  isoTime,
  isToday,
  shortDate,
} from './format';

// Listing (API) -> "món ăn" cho FoodCard / FoodDetailPage / BookingModal
export function toFoodItem(listing) {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    storeId: listing.store?.id ?? listing.store_id,
    storeName: listing.store?.name || '',
    address: listing.store?.address || '',
    originalPrice: listing.original_price,
    discountPrice: listing.sale_price,
    discountPercent: listing.discount_percent,
    quantity: listing.remaining, // số suất CÒN LẠI
    pickupStart: listing.pickup_start,
    pickupEnd: listing.pickup_end,
    pickupTimeRange: formatPickupRange(listing.pickup_start, listing.pickup_end),
    pickupToday: isToday(listing.pickup_start),
    pickupDateLabel: shortDate(listing.pickup_start),
    category: listing.category?.name || '',
    categoryId: listing.category?.id ?? null,
    imageUrl: resolveImageUrl(listing.image_url),
    isAvailable: listing.is_available,
    bookingOpensAt: listing.booking_opens_at || null, // người mua đặt được từ mốc này
    isBookingOpen: listing.is_booking_open !== false,
    createdAt: listing.created_at,
  };
}

// Trạng thái đơn của server -> mã trạng thái dùng trong giao diện (Badge, các tab ở trang Đơn hàng)
const ORDER_STATUS_UI = {
  pending: 'PENDING',
  picked_up: 'COMPLETED',
  cancelled: 'CANCELLED',
  no_show: 'NO_SHOW',
};

// Order (API) -> thẻ đơn hàng ở trang Lịch sử đơn
export function toOrderItem(order) {
  const end = order.listing?.pickup_end;
  return {
    id: order.id,
    code: order.pickup_code,
    storeName: order.store?.name || '',
    address: order.store?.address || '',
    foodId: order.listing?.id,
    title: order.listing?.title || '',
    quantity: order.quantity,
    pickupStart: order.listing?.pickup_start || null,
    pickupEnd: end || null,
    pickupTime: end ? `${isoTime(end)} ${isToday(end) ? 'hôm nay' : `ngày ${shortDate(end)}`}` : '',
    completedTime: formatDateTime(order.picked_up_at),
    totalPrice: order.total_price,
    status: ORDER_STATUS_UI[order.status] || 'NO_SHOW',
    imageUrl: resolveImageUrl(order.listing?.image_url),
  };
}

// Order vừa tạo -> dữ liệu cho PickupSuccessModal (hiện mã nhận hàng 6 ký tự)
export function toPickupModalData(order) {
  return {
    pickupCode: order.pickup_code,
    title: order.listing?.title || '',
    selectedQuantity: order.quantity,
    storeAddress: `${order.store?.name || ''} - ${order.store?.address || ''}`,
    totalPrice: order.total_price,
    pickupTimeRange: formatPickupRange(order.listing?.pickup_start, order.listing?.pickup_end),
    pickupToday: isToday(order.listing?.pickup_end),
    pickupDateLabel: shortDate(order.listing?.pickup_end),
  };
}
