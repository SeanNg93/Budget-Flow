import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with auth token
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Wallet services (previously Account services)
export const getWallets = () => {
  return axiosInstance.get('/wallets');
};

export const getWalletById = (id) => {
  return axiosInstance.get(`/wallets/${id}`);
};

export const createWallet = (walletData) => {
  return axiosInstance.post('/wallets', walletData);
};

export const updateWallet = (id, walletData) => {
  return axiosInstance.put(`/wallets/${id}`, walletData);
};

export const deleteWallet = (id) => {
  return axiosInstance.delete(`/wallets/${id}`);
};

export const getTotalBalance = () => {
  return axiosInstance.get('/wallets/total-balance');
};

export const addToTotalBalance = (amount) => {
  const token = localStorage.getItem('userToken');
  return axios.post(`${API_URL}/wallets/add-to-balance`, 
    { amount }, 
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } 
    }
  );
};

export const updateTotalBalance = (amount) => {
  const token = localStorage.getItem('userToken');
  return axios.put(`${API_URL}/wallets/update-balance`, 
    { amount }, 
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } 
    }
  );
};

// For backward compatibility - renamed functions to maintain API
export const getAccounts = getWallets;
export const getAccountById = getWalletById;
export const createAccount = createWallet;
export const updateAccount = updateWallet;
export const deleteAccount = deleteWallet;

// Transaction services
export const getTransactions = () => {
  return axiosInstance.get('/transactions');
};

export const getTransactionById = (id) => {
  return axiosInstance.get(`/transactions/${id}`);
};

export const createTransaction = (transactionData, walletId) => {
  return axiosInstance.post(`/transactions?walletId=${walletId}`, transactionData);
};

export const updateTransaction = (id, transactionData) => {
  return axiosInstance.put(`/transactions/${id}`, transactionData);
};

export const deleteTransaction = (id) => {
  return axiosInstance.delete(`/transactions/${id}`);
};

export const getFinancialSummary = () => {
  return axiosInstance.get('/transactions/summary');
};

// Category services
export const getCategories = () => {
  return axiosInstance.get('/categories').catch(error => {
    // If we get a 403 or 404, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    throw error;
  });
};

export const getCategoryById = (id) => {
  return axiosInstance.get(`/categories/${id}`).catch(error => {
    // If we get a 403 or 404, return null instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: null };
    }
    throw error;
  });
};

export const createCategory = (categoryData) => {
  return axiosInstance.post('/categories', categoryData);
};

export const updateCategory = (id, categoryData) => {
  return axiosInstance.put(`/categories/${id}`, categoryData);
};

export const deleteCategory = (id) => {
  return axiosInstance.delete(`/categories/${id}`);
};

export const getCategoriesByType = (type) => {
  return axiosInstance.get(`/categories/type/${type}`).catch(error => {
    // If we get a 403 or 404, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    throw error;
  });
};

// User Transfer services
export const searchUsers = (query) => {
  return axiosInstance.get(`/wallets/search-users?query=${encodeURIComponent(query)}`);
};

export const transferToUser = (sourceWalletId, targetUserId, amount) => {
  return axiosInstance.post('/wallets/transfer-to-user', {
    sourceWalletId,
    targetUserId,
    amount
  });
};

// Notification services
export const getNotifications = () => {
  return axiosInstance.get('/notifications');
};

export const getUnreadNotifications = () => {
  return axiosInstance.get('/notifications/unread');
};

export const getUnreadNotificationCount = () => {
  return axiosInstance.get('/notifications/count');
};

export const markNotificationAsRead = (id) => {
  return axiosInstance.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return axiosInstance.put('/notifications/read-all');
};

// Export the service as a default object
const FinanceService = {
  // New wallet functions
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  
  // Legacy account functions for backward compatibility
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  
  // Balance functions
  getTotalBalance,
  addToTotalBalance,
  updateTotalBalance,
  
  // Transaction functions
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  
  // Category functions
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType,
  
  // User transfer functions
  searchUsers,
  transferToUser,
  
  // Notification functions
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

export default FinanceService; 