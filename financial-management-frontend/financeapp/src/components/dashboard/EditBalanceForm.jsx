import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  TextField,
  FormHelperText,
  Box,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const EditBalanceForm = ({ open, handleClose, onBalanceUpdated, currentBalance }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && currentBalance) {
      setAmount(currentBalance.toString());
    }
  }, [open, currentBalance]);

  const handleChange = (e) => {
    setAmount(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // We'll implement this method in FinanceService
      const response = await FinanceService.updateTotalBalance(parseFloat(amount));
      console.log('Balance update response:', response.data);
      
      // Notify parent component to refresh data
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
      
      // Close the dialog immediately
      handleClose();
    } catch (err) {
      console.error('Error updating balance:', err);
      setError(err.response?.data?.message || 'Failed to update balance. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit Total Balance</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            label="New Balance"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            disabled={loading}
            inputProps={{ step: "0.01", min: "0" }}
          />
          <FormHelperText>Enter the new total balance amount</FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Balance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBalanceForm; 