import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { 
  formatNumberWithCommas, 
  parseFormattedNumber, 
  formatMoneyOnBlur,
  getCurrencySymbol
} from '../../utils/moneyFormatter';
import { useTranslation } from 'react-i18next';

/**
 * A reusable money input component that automatically formats the input value with commas
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.value - The input value
 * @param {function} props.onChange - Function to call when value changes (receives numeric value)
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {Object} props.inputProps - Additional props for the input element
 * @param {Object} props.InputProps - Additional props for the MUI Input component
 * @param {Object} props.sx - Additional styles for the TextField
 * @param {string} props.currency - Currency code (defaults to USD)
 * @param {Object} props.rest - Any other props for the TextField component
 */
const MoneyInput = ({
  value,
  onChange,
  label = 'Amount',
  placeholder = '0.00',
  error,
  disabled = false,
  inputProps = {},
  InputProps = {},
  sx = {},
  currency = 'USD',
  ...rest
}) => {
  const { t, i18n } = useTranslation();
  
  // State to track the formatted display value
  const [displayValue, setDisplayValue] = useState('');
  
  // Update display value when input value changes from outside
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatNumberWithCommas(value.toString()));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Get currency symbol based on current language and currency code
  const getCurrencySymbolForInput = () => {
    return getCurrencySymbol(currency, i18n.language === 'vi' ? 'vi-VN' : 'en-US');
  };
  
  // Handle input changes and format with commas
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (!inputValue) {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    // Get decimal separator for the current locale
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const decimalSeparator = new Intl.NumberFormat(locale).format(1.1).substring(1, 2);
    
    // Remove all commas before processing
    const valueWithoutCommas = inputValue.replace(/,/g, '');
    
    // Create a regex pattern that accepts the locale's decimal separator
    const regexPattern = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`);
    
    // Check if it's a valid number form (allowing for partial input like "." or "-")
    if (
      regexPattern.test(valueWithoutCommas) || 
      valueWithoutCommas === '-' || 
      valueWithoutCommas === decimalSeparator
    ) {
      const formatted = formatNumberWithCommas(valueWithoutCommas);
      setDisplayValue(formatted);
      
      // Pass the numeric value to the parent's onChange handler
      onChange(parseFormattedNumber(formatted));
    }
  };
  
  // Format on blur to ensure proper decimal places
  const handleBlur = (e) => {
    if (displayValue) {
      const formattedValue = formatMoneyOnBlur(displayValue);
      setDisplayValue(formattedValue);
      onChange(parseFormattedNumber(formattedValue));
    }
    
    // Call original onBlur if provided
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };
  
  // Merge input props
  const mergedInputProps = {
    step: "0.01",
    min: "0",
    ...inputProps,
    inputMode: 'decimal',
  };
  
  // Merge Input props with locale-aware currency symbol
  const mergedInputComponentProps = {
    startAdornment: <InputAdornment position="start">{getCurrencySymbolForInput()}</InputAdornment>,
    ...InputProps,
  };
  
  return (
    <TextField
      label={t(label, label)}
      value={displayValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder={t(placeholder, placeholder)}
      error={!!error}
      helperText={error ? t(error, error) : undefined}
      disabled={disabled}
      fullWidth
      variant="outlined"
      inputProps={mergedInputProps}
      InputProps={mergedInputComponentProps}
      sx={{ ...sx }}
      type="text" // Use text type for the comma formatting
      {...rest}
    />
  );
};

export default MoneyInput; 