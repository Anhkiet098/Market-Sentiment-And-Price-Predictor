// src/services/api.js
import axios from 'axios';

// Cấu hình URL API
const API_URL = 'http://localhost:8000';  // Đảm bảo đúng URL của backend

// Tạo một instance của axios với cấu hình cơ bản
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,  // Thiết lập thời gian timeout cho mỗi yêu cầu
});

// Interceptor cho các yêu cầu để thêm token nếu có
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho các phản hồi để xử lý lỗi chung
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Nếu có phản hồi từ server nhưng là lỗi (4xx, 5xx)
      console.error('Server Error:', error.response.status, error.response.data);
      
      // Kiểm tra xem mã lỗi là 401 để tự động điều hướng hoặc xử lý token hết hạn
      if (error.response.status === 401) {
        console.warn("Unauthorized: Redirecting to login.");
        // Xóa token và điều hướng về trang đăng nhập hoặc thực hiện hành động khác
        localStorage.removeItem('token');
        window.location.href = '/login'; // Thay đổi URL nếu cần thiết
      }
    } else if (error.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi
      console.error("No response from server:", error.request);
    } else {
      // Có lỗi khi cấu hình yêu cầu
      console.error("Error in request configuration:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


