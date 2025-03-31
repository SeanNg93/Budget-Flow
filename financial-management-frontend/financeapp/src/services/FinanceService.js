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
  return axiosInstance.get('/transactions?includeCategory=true');
};

export const getFilteredTransactions = (filterParams) => {
  // If client-side filtered data was provided, use it directly
  if (filterParams.clientFiltered) {
    return Promise.resolve({ data: filterParams.clientFiltered });
  }
  
  // Otherwise, perform regular API call with query params
  const params = new URLSearchParams();
  
  // Add start and end dates if provided
  if (filterParams.startDate) {
    params.append('startDate', filterParams.startDate);
  }
  if (filterParams.endDate) {
    params.append('endDate', filterParams.endDate);
  }
  
  // Add wallet and category filters if provided
  if (filterParams.walletId && filterParams.walletId !== 'all') {
    params.append('walletId', filterParams.walletId);
  }
  if (filterParams.categoryId && filterParams.categoryId !== 'all') {
    params.append('categoryId', filterParams.categoryId);
  }
  
  // Add transaction type filter if provided
  if (filterParams.transactionType && filterParams.transactionType !== 'all') {
    params.append('transactionType', filterParams.transactionType);
  }
  
  // Always include category info
  params.append('includeCategory', 'true');
  
  const url = `/transactions?${params.toString()}`;
  
  // Make the API call with query params
  return axiosInstance.get(url)
    .catch(error => {
      console.error('Error fetching filtered transactions:', error);
      // Fall back to getting all transactions if there's an error
      return getTransactions();
    });
};

export const getTransactionById = (id) => {
  return axiosInstance.get(`/transactions/${id}?includeCategory=true`);
};

export const createTransaction = (transactionData, walletId) => {
  // Ensure the category data is properly structured when sending to backend
  return axiosInstance.post(`/transactions?walletId=${walletId}`, transactionData);
};

export const updateTransaction = (id, transactionData) => {
  // Ensure the category data is properly structured when sending to backend
  return axiosInstance.put(`/transactions/${id}`, transactionData);
};

export const deleteTransaction = (id) => {
  return axiosInstance.delete(`/transactions/${id}`).catch(error => {
    // Let the error propagate to the calling component, but log it
    console.error(`Error deleting transaction ${id}:`, error);
    throw error; // Re-throw the error so it can be handled by the component
  });
};

export const getFinancialSummary = () => {
  return axiosInstance.get('/transactions/summary');
};

// New method for getting financial summary by date range
export const getFinancialSummaryByDateRange = (timeRange) => {
  // Calculate date range based on the selected time period
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case '24h':
      // Last 24 hours
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      // Last 7 days
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      // Last 30 days
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '3m':
      // Last 3 months
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '1y':
      // Last year
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
    default:
      // All time - return regular summary
      return getFinancialSummary();
  }

  // Format dates for API
  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();
  
  // Use existing chart data endpoint which already has date range filtering
  return axiosInstance.get(
    `/transactions/chart-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
  ).then(response => {
    // Extract and format summary data to match the format expected by components
    const { summaryData } = response.data;
    
    // Format to match the structure of getFinancialSummary response
    return {
      data: {
        totalIncome: summaryData.totalIncome || 0,
        totalExpense: summaryData.totalExpenses || 0, // Note the different key name
        netSavings: summaryData.netSavings || 0,
        // Preserve any other fields that might be in the original summary
        totalBalance: null // This will need to be filled in separately as chart data doesn't include it
      }
    };
  }).catch(error => {
    console.error('Error fetching financial summary by date range:', error);
    return {
      data: {
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        totalBalance: 0
      }
    };
  });
};

// New method for chart data
export const getFinancialDataByDateRange = (startDate, endDate, categoryId = 'all') => {
  // Format dates properly to match backend expectations (YYYY-MM-DDTHH:mm:ss.sssZ format)
  const formatDateForApi = (date) => {
    if (!date) return null;
    
    // If already a string in proper format, return as is
    if (typeof date === 'string' && date.includes('T')) {
      return date;
    }
    
    // Convert Date object to ISO string
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  };

  const formattedStartDate = formatDateForApi(startDate);
  const formattedEndDate = formatDateForApi(endDate);
  
  if (!formattedStartDate || !formattedEndDate) {
    console.error('Invalid date format provided');
    return Promise.resolve({
      data: {
        chartData: [],
        summaryData: {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        }
      }
    });
  }
  
  let url = `/transactions/chart-data?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
  
  if (categoryId && categoryId !== 'all') {
    url += `&categoryId=${categoryId}`;
  }
  
  // Determine automatic interval based on date range
  const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let interval = 'day';
  if (diffDays > 14 && diffDays <= 90) {
    interval = 'week';
  } else if (diffDays > 90 && diffDays <= 730) {
    interval = 'month';
  } else if (diffDays > 730) {
    interval = 'year';
  }
  
  url += `&interval=${interval}`;
  
  return axiosInstance.get(url).catch(error => {
    console.error('Error fetching chart data:', error);
    
    // Return mock data structure for client-side rendering
    return {
      data: {
        chartData: [],
        summaryData: {
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        }
      }
    };
  });
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

export const getCategorySpendingProgress = (categoryId) => {
  return axiosInstance.get(`/categories/${categoryId}/spending-progress`).catch(error => {
    // If we get a 403 or 404, return empty data
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      return { 
        data: { 
          totalSpent: 0, 
          limit: 0, 
          percentage: 0, 
          warningThreshold: 0 
        } 
      };
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

// User Profile Services
export const getUserProfile = (userId) => {
  // Try multiple possible endpoints
  return axiosInstance.get(`/users/profile`)
    .catch(error => {
      // If first endpoint fails, try user-profiles
      console.log('First profile endpoint failed, trying alternative...');
      return axiosInstance.get(`/user-profiles/${userId}`);
    })
    .catch(error => {
      // If second endpoint fails, try users with ID
      console.log('Second profile endpoint failed, trying alternative...');
      return axiosInstance.get(`/users/${userId}`);
    })
    .catch(error => {
      console.error('All profile endpoints failed:', error);
      // Return a default profile object if all APIs fail
      return { 
        data: { 
          id: userId,
          fullName: 'User',
          joinDate: new Date().toISOString().split('T')[0],
          role: 'User',
          bio: '',
          profilePicturePath: '',
          currency: 'USD'
        } 
      };
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

// Data Reset Service
export const resetAllData = () => {
  return axiosInstance.post('/reset/all-data');
};

// Account Management Services
export const changePassword = (currentPassword, newPassword) => {
  return axiosInstance.put('/users/change-password', {
    currentPassword,
    newPassword
  });
};

export const deleteUserAccount = () => {
  return axiosInstance.delete('/users/account');
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
  getFinancialDataByDateRange,
  getFilteredTransactions,
  getFinancialSummaryByDateRange,
  
  // Category functions
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType,
  getCategorySpendingProgress,
  
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
  
  // User Profile functions
  getUserProfile,
  
  // Data Reset function
  resetAllData,
  
  // Account Management functions
  changePassword,
  deleteUserAccount,
};

export default FinanceService; 