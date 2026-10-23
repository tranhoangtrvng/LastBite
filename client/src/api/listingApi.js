// client/src/api/listingApi.js
// Dùng chung axiosClient (cùng địa chỉ server VITE_API_URL, tự gắn token, tự đổi lỗi thành Error có message).
// Mọi hàm trả về đúng phần thân phản hồi của server: { success, data, pagination? }.
import axiosClient from './axiosClient';

export const listingApi = {
  // --- Phía người mua (công khai) ---
  // params: q, category_id, min_price, max_price, pickup_from, pickup_to, store_id, sort, page, limit
  getListings: (params = {}) => axiosClient.get('/listings', { params }),

  getListingById: (id) => axiosClient.get(`/listings/${id}`),

  // --- Phía cửa hàng ---
  // 1. Upload ảnh (JPG/PNG, tối đa 2MB)
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosClient.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2. Lấy danh sách món của cửa hàng đang đăng nhập (server phân trang, tối đa 50 mỗi trang)
  getMyListings: (params = { limit: 50 }) => axiosClient.get('/stores/me/listings', { params }),

  // 3. Đăng món mới
  createListing: (data) => axiosClient.post('/listings', data),

  // 4. Sửa món
  updateListing: (id, data) => axiosClient.put(`/listings/${id}`, data),

  // 5. Xoá món
  deleteListing: (id) => axiosClient.delete(`/listings/${id}`),
};
