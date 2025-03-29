/**
 * Utility functions for formatting values in the application
 * with internationalization support
 */

/**
 * Format a number as currency for display based on user's locale
 * @param {number|string} value - The numeric value to format
 * @param {string} language - The language code (e.g., 'en', 'vi')
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, language, currency = 'USD') => {
  // Ensure value is a number before formatting
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  
  // Map language codes to locale codes for better formatting
  const localeMap = {
    'en': 'en-US',
    'vi': 'vi-VN',
    // Add more languages as needed
  };
  
  // Get the appropriate locale or default to en-US
  const locale = localeMap[language] || 'en-US';
  
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currency 
  }).format(numericValue);
};

/**
 * Format a date for display based on user's locale
 * @param {Date|string} date - The date to format
 * @param {string} language - The language code (e.g., 'en', 'vi')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, language, options = {}) => {
  if (!date) return '';
  
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Map language codes to locale codes
  const localeMap = {
    'en': 'en-US',
    'vi': 'vi-VN',
    // Add more languages as needed
  };
  
  // Get the appropriate locale or default to en-US
  const locale = localeMap[language] || 'en-US';
  
  // Default options for date format
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Format a number for display based on user's locale
 * @param {number|string} value - The numeric value to format
 * @param {string} language - The language code (e.g., 'en', 'vi')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, language, options = {}) => {
  // Ensure value is a number before formatting
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  
  // Map language codes to locale codes
  const localeMap = {
    'en': 'en-US',
    'vi': 'vi-VN',
    // Add more languages as needed
  };
  
  // Get the appropriate locale or default to en-US
  const locale = localeMap[language] || 'en-US';
  
  return new Intl.NumberFormat(locale, options).format(numericValue);
};

/**
 * Format a percentage for display
 * @param {number|string} value - The numeric value to format (e.g., 0.1 for 10%)
 * @param {string} language - The language code (e.g., 'en', 'vi')
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, language, decimals = 1) => {
  // Ensure value is a number
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  
  // Map language codes to locale codes
  const localeMap = {
    'en': 'en-US',
    'vi': 'vi-VN',
    // Add more languages as needed
  };
  
  // Get the appropriate locale or default to en-US
  const locale = localeMap[language] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue);
}; 