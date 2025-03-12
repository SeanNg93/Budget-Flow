import axios from 'axios';

// Make sure the API URL is correct
const API_URL = 'http://localhost:8080/api';

// Create axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Ensure credentials are not included for CORS requests
  withCredentials: false
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle error objects
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the error has a response with data
    if (error.response && error.response.data) {
      // If the data is an object, convert it to a string
      if (typeof error.response.data === 'object') {
        error.response.data = JSON.stringify(error.response.data);
      }
    }
    
    // Handle 401 Unauthorized errors (expired or invalid token)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if not already there
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const login = (username, password) => {
  // Make sure the URL is correct
  return axiosInstance.post('/auth/login', { username, password });
};

export const register = (username, email, password) => {
  return axiosInstance.post('/auth/register', { username, email, password });
};

// Password reset services
export const requestPasswordReset = (email) => {
  return axiosInstance.post('/password/reset-request', { email });
};

export const confirmPasswordReset = (token, newPassword) => {
  return axiosInstance.post('/password/reset-confirm', { token, newPassword });
};

// Account activation service
export const activateAccount = (token) => {
  return axiosInstance.post('/account/activate', { token });
};

export default axiosInstance;