// client/src/api/orderApi.js — đơn đặt chỗ phía người mua (docs/api.md mục 3.8)
import axiosClient from './axiosClient';

export const orderApi = {
  // Đặt chỗ: { listing_id, quantity (1-5) } -> { data: Order có pickup_code }
  createOrder: (listingId, quantity) =>
    axiosClient.post('/orders', { listing_id: listingId, quantity }),

  // Lịch sử đơn của tôi (mới nhất trước). params: status, page, limit
  getMyOrders: (params = { limit: 50 }) => axiosClient.get('/orders/my', { params }),

  // Huỷ đơn đang chờ nhận (trả suất lại cho cửa hàng)
  cancelOrder: (orderId) => axiosClient.patch(`/orders/${orderId}/cancel`),
};
