// client/src/api/categoryApi.js — danh sách loại món (công khai)
import axiosClient from './axiosClient';

export const categoryApi = {
  getCategories: () => axiosClient.get('/categories'),
};
