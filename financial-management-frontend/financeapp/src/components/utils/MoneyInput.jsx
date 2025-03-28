import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { formatNumberWithCommas, parseFormattedNumber, formatMoneyOnBlur } from '../../utils/moneyFormatter';

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
  ...rest
}) => {
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
  
  // Handle input changes and format with commas
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (!inputValue) {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    // Remove all commas before processing
    const valueWithoutCommas = inputValue.replace(/,/g, '');
    
    // Check if it's a valid number form (allowing for partial input like "." or "-")
    if (/^-?\d*\.?\d*$/.test(valueWithoutCommas) || valueWithoutCommas === '-' || valueWithoutCommas === '.') {
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
  
  // Merge Input props
  const mergedInputComponentProps = {
    startAdornment: <InputAdornment position="start">$</InputAdornment>,
    ...InputProps,
  };
  
  return (
    <TextField
      label={label}
      value={displayValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      error={!!error}
      helperText={error}
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