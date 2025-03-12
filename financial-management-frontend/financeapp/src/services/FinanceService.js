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

// Account services
export const getAccounts = () => {
  return axiosInstance.get('/accounts');
};

export const getAccountById = (id) => {
  return axiosInstance.get(`/accounts/${id}`);
};

export const createAccount = (accountData) => {
  return axiosInstance.post('/accounts', accountData);
};

export const updateAccount = (id, accountData) => {
  return axiosInstance.put(`/accounts/${id}`, accountData);
};

export const deleteAccount = (id) => {
  return axiosInstance.delete(`/accounts/${id}`);
};

export const getTotalBalance = () => {
  return axiosInstance.get('/accounts/total-balance');
};

// Transaction services
export const getTransactions = () => {
  return axiosInstance.get('/transactions');
};

export const getTransactionById = (id) => {
  return axiosInstance.get(`/transactions/${id}`);
};

export const createTransaction = (transactionData, accountId) => {
  return axiosInstance.post(`/transactions?accountId=${accountId}`, transactionData);
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
  return axiosInstance.get('/categories');
};

export const getCategoryById = (id) => {
  return axiosInstance.get(`/categories/${id}`);
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
  return axiosInstance.get(`/categories/type/${type}`);
};

// Export the service as a default object
const FinanceService = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getTotalBalance,
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType,
};

export default FinanceService; 