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
  Alert,
  Typography
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const WalletForm = ({ open, handleClose, onAccountAdded, embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Checking',
    balance: '',
    currency: 'USD'  // Keeping this in the state but not showing in UI
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
      newErrors.accountName = 'Wallet name is required';
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Wallet type is required';
    }
    
    if (!formData.balance || isNaN(formData.balance) || parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Valid balance is required';
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
      console.error('Error creating wallet:', err);
      setError(err.response?.data?.message || 'Failed to create wallet. Please try again.');
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
      
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.accountName} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Wallet Name
            </Typography>
            <TextField
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="My Wallet"
              error={!!errors.accountName}
              helperText={errors.accountName}
              disabled={loading}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.accountType} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Wallet Type
            </Typography>
            <Select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              displayEmpty
              disabled={loading}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="Checking">Checking</MenuItem>
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit_Card">Credit Card</MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
              <MenuItem value="Digital_Wallet">Digital Wallet</MenuItem>
              <MenuItem value="Crypto">Cryptocurrency</MenuItem>
            </Select>
            {errors.accountType && <FormHelperText>{errors.accountType}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.balance} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Initial Balance
            </Typography>
            <TextField
              name="balance"
              value={formData.balance}
              onChange={handleChange}
              placeholder="0.00"
              error={!!errors.balance}
              helperText={errors.balance}
              disabled={loading}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </FormControl>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        {!embedded && (
          <Button 
            onClick={handleClose} 
            disabled={submitting} 
            sx={{ 
              mr: 1, 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none'
          }}
        >
          {submitting ? 'Saving...' : 'Save Wallet'}
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add Wallet</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default WalletForm; 