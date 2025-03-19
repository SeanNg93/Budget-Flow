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

// Also add a response interceptor to log the API errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
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
  return axiosInstance.post('/wallets/add-to-balance', { amount });
};

export const updateTotalBalance = (amount) => {
  return axiosInstance.put('/wallets/update-balance', { amount });
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

// Shared Wallet services
export const shareWallet = (walletId, targetUserId) => {
  return axiosInstance.post('/shared-wallets/share', {
    walletId,
    targetUserId
  });
};

export const getSharedWalletsWithMe = () => {
  return axiosInstance.get('/shared-wallets/shared-with-me').catch(error => {
    // If we get a 403 or 404 or CORS error, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    throw error;
  });
};

export const getSharedWalletsByMe = () => {
  return axiosInstance.get('/shared-wallets/shared-by-me').catch(error => {
    // If we get a 403 or 404 or CORS error, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    throw error;
  });
};

export const getSharedWalletIdByNotification = async (notificationId, senderUsername, walletName) => {
  try {
    // First try to get shared wallets with the current user
    const response = await getSharedWalletsWithMe();
    const sharedWallets = response.data || [];
    
    // Look for a wallet that matches the sender username and wallet name
    const matchedWallet = sharedWallets.find(wallet => 
      wallet.ownerUsername === senderUsername && 
      wallet.walletName === walletName
    );
    
    if (matchedWallet) {
      return matchedWallet.id;
    }
    
    // If no match found, use the notification ID
    return notificationId;
  } catch (error) {
    return notificationId; // fallback to notification ID
  }
};

export const acceptSharedWallet = (sharedWalletId) => {
  return axiosInstance.put(`/shared-wallets/${sharedWalletId}/accept`);
};

export const removeSharedWallet = (sharedWalletId) => {
  return axiosInstance.delete(`/shared-wallets/${sharedWalletId}`);
};

// Notification services
export const getNotifications = () => {
  return axiosInstance.get('/notifications').catch(error => {
    // If we get a 403 or 404 or CORS error, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    // Also catch network errors or CORS errors which may not have a response object
    if (!error.response) {
      return { data: [] };
    }
    throw error;
  });
};

export const getUnreadNotifications = () => {
  return axiosInstance.get('/notifications/unread').catch(error => {
    // If we get a 403 or 404 or CORS error, return an empty array instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: [] };
    }
    // Also catch network errors or CORS errors which may not have a response object
    if (!error.response) {
      return { data: [] };
    }
    throw error;
  });
};

export const getUnreadNotificationCount = () => {
  return axiosInstance.get('/notifications/count').catch(error => {
    // If we get a 403 or 404 or CORS error, return a count of 0 instead of throwing an error
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { data: { unreadCount: 0 } };
    }
    // Also catch network errors or CORS errors which may not have a response object
    if (!error.response) {
      return { data: { unreadCount: 0 } };
    }
    throw error;
  });
};

export const markNotificationAsRead = (id) => {
  return axiosInstance.put(`/notifications/${id}/read`).catch(error => {
    // If we get any error, just return a default success response to allow UI to update
    if (error) {
      return { data: { id, read: true } };
    }
    throw error;
  });
};

export const markAllNotificationsAsRead = () => {
  return axiosInstance.put('/notifications/read-all').catch(error => {
    // If we get any error, just return a default success response to allow UI to update
    if (error) {
      return { data: { success: true } };
    }
    throw error;
  });
};

export const deleteAllNotifications = () => {
  return axiosInstance.delete('/notifications/all').catch(error => {
    // If we get any error, just return a default success response to allow UI to update
    if (error) {
      return { data: { success: true } };
    }
    throw error;
  });
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
  
  // Shared wallet functions
  shareWallet,
  getSharedWalletsWithMe,
  getSharedWalletsByMe,
  getSharedWalletIdByNotification,
  acceptSharedWallet,
  removeSharedWallet,
  
  // Notification functions
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
};

export default FinanceService; 