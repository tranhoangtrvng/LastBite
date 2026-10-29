// client/src/api/storeApi.js — cửa hàng của tôi (docs/api.md mục 3.7)
import axiosClient from './axiosClient';

export const storeApi = {
  // Chưa đăng ký cửa hàng thì server trả data: null
  getMyStore: () => axiosClient.get('/stores/me'),

  // Đăng ký cửa hàng (trạng thái ban đầu: chờ admin duyệt)
  registerStore: (data) => axiosClient.post('/stores', data),
  
  // Sửa thông tin cửa hàng (PUT /stores/me)
  updateMyStore: (data) => axiosClient.put('/stores/me', data),
};
