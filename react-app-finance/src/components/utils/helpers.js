// src/utils/helpers.js
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  export const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };
  
  export const validateSymbol = (symbol) => {
    const regex = /^[A-Z]{1,5}$/;
    return regex.test(symbol);
  };
  
  export const calculateChange = (currentValue, previousValue) => {
    const change = currentValue - previousValue;
    const percentChange = (change / previousValue) * 100;
    return {
      change,
      percentChange
    };
  };