// src/services/auth.service.js
import axiosInstance from './api';

export const login = async (email, password) => {
  try {
    // Create form data as required by OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);  // OAuth2 expects 'username' not 'email'
    formData.append('password', password);

    const response = await axiosInstance.post('/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error details:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (email, password) => {
  return axiosInstance.post('/register', { email, password });
};

export const logout = () => {
  localStorage.removeItem('token');
};


