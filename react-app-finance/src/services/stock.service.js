// src/services/stock.service.js
import api from './api';

export const getStockQuote = async (symbol) => {
  try {
    const response = await api.get(`/market-info/${symbol}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStockPredictionLTSM = async (symbol) => {
  try {
    const response = await api.get(`/stock-prediction_using_LTSM/${symbol}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getWatchlist = async () => {
  try {
    const response = await api.get('/watchlist');
    return response.data; // Trả về danh sách mã cổ phiếu
  } catch (error) {
    throw error;
  }
};

export const getStockPredictionGRU = async (symbol) => {
  try {
    const response = await api.get(`/predict-using-gru/${symbol}`);
    return response.data; // Trả về dữ liệu dự đoán
  } catch (error) {
    throw error;
  }
};

export const getNewsSentiment = async (symbol, daysAgo) => {
    try {
        const response = await api.get(`/news-sentiment/${symbol}/${daysAgo}`);
        
        // Kiểm tra response
        if (!response.data) {
            throw new Error("Không có dữ liệu");
        }

        // Kiểm tra cấu trúc dữ liệu
        const { dates, positive_counts, negative_counts } = response.data;
        if (!dates || !positive_counts || !negative_counts) {
            throw new Error("Dữ liệu không đúng định dạng");
        }

        return response.data;
    } catch (error) {
        console.error("Error in getNewsSentiment:", error);
        throw error;
    }
};


export const getWatchlistName = async () => {
  try {
      const response = await api.get('/watchlist_name');
      return response.data; // Trả về danh sách mã cổ phiếu có tên công ty
  } catch (error) {
      throw error;
  }
};

export const getFinancialReport = async (symbol, freq) => {
  try {
    const response = await api.get(`/financial-reports/${symbol}`, {
      params: { freq }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Lấy tin tức theo ngày để hiển thị trên trang cá nhân

export const getNewsArticles = async (symbol, daysAgo, page = 1) => {
    try {
        const response = await api.get(`/news-articles/${symbol}/${daysAgo}`, {
            params: { page }
        });
        console.log('News Articles Response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error fetching news articles:', error);
        throw error;
    }
};



//lấy thông tin cổ phiếu S&P 500
export const getMarketIndices = async () => {
  try {
    const response = await api.get('/market-indices');
    return response.data;
  } catch (error) {
    throw error;
  }
};

//Lấy thông tin công ty
export const getCompanyInfo = async (symbol) => {
  try {
    const response = await api.get(`/company-info/${symbol}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

