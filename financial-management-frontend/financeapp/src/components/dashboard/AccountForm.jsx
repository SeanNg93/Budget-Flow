import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const AccountForm = ({ open, handleClose, onAccountAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Checking',
    balance: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.accountName) {
      newErrors.accountName = 'Account name is required';
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }
    
    if (!formData.balance || isNaN(formData.balance) || parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Valid balance is required';
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format the data for the API
      const accountData = {
        accountName: formData.accountName,
        accountType: formData.accountType,
        balance: parseFloat(formData.balance),
        currency: formData.currency
      };
      
      // Call the API to create the account
      await FinanceService.createAccount(accountData);
      
      // Reset form and close dialog
      setFormData({
        accountName: '',
        accountType: 'Checking',
        balance: '',
        currency: 'USD'
      });
      handleClose();
      
      // Notify parent component
      if (onAccountAdded) {
        onAccountAdded();
      }
    } catch (error) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Account</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                error={!!errors.accountName}
                helperText={errors.accountName}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.accountType}>
                <InputLabel>Account Type</InputLabel>
                <Select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  label="Account Type"
                >
                  <MenuItem value="Checking">Checking</MenuItem>
                  <MenuItem value="Savings">Savings</MenuItem>
                  <MenuItem value="Credit_Card">Credit Card</MenuItem>
                  <MenuItem value="Investment">Investment</MenuItem>
                </Select>
                {errors.accountType && <FormHelperText>{errors.accountType}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.currency}>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="JPY">JPY</MenuItem>
                  <MenuItem value="VND">VND</MenuItem>
                </Select>
                {errors.currency && <FormHelperText>{errors.currency}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Initial Balance"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                error={!!errors.balance}
                helperText={errors.balance}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.currency === 'USD' ? '$' : 
                       formData.currency === 'EUR' ? '€' : 
                       formData.currency === 'GBP' ? '£' : 
                       formData.currency === 'JPY' ? '¥' : 
                       formData.currency === 'VND' ? '₫' : '$'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountForm; 