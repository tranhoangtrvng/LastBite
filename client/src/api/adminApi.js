// VT4 - Gọi các API quản trị (docs/api.md, mục 3.13). axiosClient đã tự gắn token
// và trả về phần body: { success, data, pagination? }.
import axiosClient from './axiosClient';

export const adminApi = {
  getStats: () => axiosClient.get('/admin/stats'),

  getStores: (params) => axiosClient.get('/admin/stores', { params }),
  setStoreStatus: (id, status) => axiosClient.patch(`/admin/stores/${id}/status`, { status }),

  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  setUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }),

  getListings: (params) => axiosClient.get('/admin/listings', { params }),
  setListingStatus: (id, status) => axiosClient.patch(`/admin/listings/${id}/status`, { status }),
};
