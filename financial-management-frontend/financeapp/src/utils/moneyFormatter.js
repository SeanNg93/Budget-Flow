import React, { useState } from 'react';

/**
 * Utility functions for money/currency formatting
 */

/**
 * Format a number as USD currency for display
 * @param {number|string} value - The numeric value to format
 * @returns {string} Formatted currency string (e.g., $1,234.56)
 */
export const formatCurrency = (value) => {
  // Ensure value is a number before formatting
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
};

/**
 * Format a number with commas for input fields (without currency symbol)
 * @param {string} value - The string value from input field
 * @returns {string} Formatted number with commas (e.g., 1,234.56)
 */
export const formatNumberWithCommas = (value) => {
  // Return empty string if value is empty
  if (!value) return '';
  
  // Remove existing commas and any non-numeric chars except decimal point and minus sign
  let numericString = value.toString().replace(/,/g, '').replace(/[^\d.-]/g, '');
  
  // Handle case with multiple decimal points - keep only the first one
  const decimalCount = numericString.split('.').length - 1;
  if (decimalCount > 1) {
    const parts = numericString.split('.');
    numericString = parts[0] + '.' + parts.slice(1).join('');
  }

  // If it's only a decimal point, return it
  if (numericString === '.') return numericString;
  
  // If it's a negative sign only, return it
  if (numericString === '-') return numericString;
  
  // Check if there's a decimal part
  const hasDecimal = numericString.includes('.');
  
  let formattedValue;
  if (hasDecimal) {
    // Split into whole and decimal parts
    const [wholePart, decimalPart] = numericString.split('.');
    
    // Format the whole part with commas
    const formattedWholePart = parseFloat(wholePart) ? 
      parseFloat(wholePart).toLocaleString('en-US') : 
      (wholePart === '-' ? '-' : '0');
      
    // Combine with decimal part
    formattedValue = `${formattedWholePart}.${decimalPart}`;
  } else {
    // No decimal, just format the whole number
    formattedValue = parseFloat(numericString) ? 
      parseFloat(numericString).toLocaleString('en-US') : 
      (numericString === '-' ? '-' : '0');
  }
  
  return formattedValue;
};

/**
 * Parse a formatted input value back to a number for calculations
 * @param {string} formattedValue - The formatted string with commas
 * @returns {number} Numeric value
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue) return 0;
  // Remove commas and convert to number
  return parseFloat(formattedValue.toString().replace(/,/g, ''));
};

/**
 * Custom React hook for handling money input fields
 * @param {string|number} initialValue - Initial value for the input
 * @returns {Array} [formattedValue, actualValue, handleChange]
 */
export const useMoneyInput = (initialValue = '') => {
  const [formattedValue, setFormattedValue] = useState(
    initialValue ? formatNumberWithCommas(initialValue.toString()) : ''
  );
  
  const [actualValue, setActualValue] = useState(
    initialValue ? parseFloat(initialValue) : ''
  );
  
  const handleChange = (e) => {
    const inputValue = e.target.value;
    // If it's empty, clear both values
    if (!inputValue) {
      setFormattedValue('');
      setActualValue('');
      return;
    }
    
    // Remove all commas first to prevent comma duplication
    const valueWithoutCommas = inputValue.replace(/,/g, '');
    
    // Check if the value (without commas) is a valid number form
    if (/^-?\d*\.?\d*$/.test(valueWithoutCommas) || valueWithoutCommas === '-') {
      const formatted = formatNumberWithCommas(valueWithoutCommas);
      setFormattedValue(formatted);
      setActualValue(parseFormattedNumber(formatted));
    }
  };
  
  return [formattedValue, actualValue, handleChange];
};

/**
 * Handle blur event for money input fields to ensure proper decimal formatting
 * @param {string} value - Current value of the input field
 * @returns {string} Value with proper decimal precision
 */
export const formatMoneyOnBlur = (value) => {
  if (!value) return '';
  
  // Parse the value and ensure it has 2 decimal places
  const numValue = parseFormattedNumber(value);
  if (isNaN(numValue)) return '';
  
  // Format with 2 decimal places and add commas
  return formatNumberWithCommas(numValue.toFixed(2));
}; 