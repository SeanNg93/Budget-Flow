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
    // Log the error for debugging
    console.error('API Error:', error);
    
    // If the error has a response with data
    if (error.response && error.response.data) {
      // If the data is an object with a message property, preserve it
      if (typeof error.response.data === 'object' && error.response.data.message) {
        // Keep the structure as is, don't convert to string
        // This allows components to extract the specific message
      } 
      // If the data is a plain object without a message property, add a default message
      else if (typeof error.response.data === 'object' && !error.response.data.message) {
        error.response.data.message = `${error.response.statusText || 'Error'}: ${JSON.stringify(error.response.data)}`;
      }
      // If the data is a string, convert it to an object with a message property
      else if (typeof error.response.data === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(error.response.data);
          error.response.data = parsed;
        } catch (e) {
          // If it's not JSON, wrap the string in an object
          error.response.data = { message: error.response.data };
        }
      }
    } else if (error.response) {
      // If there is a response but no data, create a default data object
      error.response.data = { 
        message: `${error.response.status}: ${error.response.statusText || 'Unknown error'}` 
      };
    } else if (error.request) {
      // The request was made but no response was received
      error.response = { 
        data: { message: 'No response received from server. Please try again later.' }
      };
    } else {
      // Something happened in setting up the request
      error.response = { 
        data: { message: error.message || 'Unknown error occurred' }
      };
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

export const resetPassword = (token, newPassword) => {
  return axiosInstance.post('/password/reset-confirm', { token, newPassword });
};

export const verifyResetToken = (token) => {
  return axiosInstance.post('/password/verify-token', { token });
};

export const changePassword = (currentPassword, newPassword) => {
  // Get the username from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const username = userData.username || '';
  
  // Send the raw password without formatting
  return axiosInstance.post('/user/change-password', { 
    currentPassword, 
    newPassword,
    username // Send username as a separate field
  });
};

// Account activation service
export const activateAccount = (token) => {
  return axiosInstance.post('/account/activate', { token });
};

export default axiosInstance;