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
  CircularProgress,
  Alert
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const AccountForm = ({ open, handleClose, onAccountAdded, embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Checking',
    balance: '',
    currency: 'USD'
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    
    setSubmitting(true);
    setError('');
    
    try {
      const accountData = {
        ...formData,
        balance: parseFloat(formData.balance)
      };
      
      await FinanceService.createAccount(accountData);
      
      // Reset form
      resetForm();
      
      // Close dialog and notify parent
      if (onAccountAdded) {
        onAccountAdded();
      }
      
      if (!embedded) {
        handleClose();
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      accountName: '',
      accountType: 'Checking',
      balance: '',
      currency: 'USD'
    });
    setErrors({});
    setError('');
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Account Name"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            error={!!errors.accountName}
            helperText={errors.accountName}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.accountType}>
            <InputLabel id="account-type-label">Account Type</InputLabel>
            <Select
              labelId="account-type-label"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              label="Account Type"
              disabled={loading}
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
            <InputLabel id="currency-label">Currency</InputLabel>
            <Select
              labelId="currency-label"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              label="Currency"
              disabled={loading}
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="JPY">JPY (¥)</MenuItem>
              <MenuItem value="CAD">CAD ($)</MenuItem>
              <MenuItem value="AUD">AUD ($)</MenuItem>
              <MenuItem value="CHF">CHF (Fr)</MenuItem>
              <MenuItem value="CNY">CNY (¥)</MenuItem>
              <MenuItem value="INR">INR (₹)</MenuItem>
              <MenuItem value="VND">VND (₫)</MenuItem>
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
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {formData.currency === 'USD' ? '$' : 
                   formData.currency === 'EUR' ? '€' : 
                   formData.currency === 'GBP' ? '£' : 
                   formData.currency === 'JPY' ? '¥' : 
                   formData.currency === 'INR' ? '₹' : 
                   formData.currency === 'VND' ? '₫' : ''}
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {!embedded && (
          <Button onClick={handleClose} disabled={submitting} sx={{ mr: 1 }}>
            Cancel
          </Button>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Saving...' : 'Save Account'}
        </Button>
      </Box>
    </>
  );

  // If embedded, just return the form content
  if (embedded) {
    return formContent;
  }

  // Otherwise, wrap in a Dialog
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Account</DialogTitle>
      <DialogContent>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm; 