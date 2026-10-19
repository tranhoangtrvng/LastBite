import axios from 'axios';

// Cấu hình axios mặc định
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Trỏ đúng về Backend của bạn
});

// Tự động đính kèm token của cửa hàng vào header nếu có
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const listingApi = {
  // 1. Upload ảnh
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 2. Lấy danh sách món của cửa hàng đang đăng nhập
  getMyListings: async () => {
    const response = await apiClient.get('/stores/me/listings');
    return response.data;
  },

  // 3. Đăng món mới
  createListing: async (data) => {
    const response = await apiClient.post('/listings', data);
    return response.data;
  },

  // 4. Sửa món
  updateListing: async (id, data) => {
    const response = await apiClient.put(`/listings/${id}`, data);
    return response.data;
  },

  // 5. Xoá món
  deleteListing: async (id) => {
    const response = await apiClient.delete(`/listings/${id}`);
    return response.data;
  }
};