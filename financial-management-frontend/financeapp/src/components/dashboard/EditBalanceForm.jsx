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
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  useEffect(() => {
    if (open && currentBalance) {
      setAmount(currentBalance.toString());
      fetchWalletsTotalBalance();
    }
  }, [open, currentBalance]);

  const fetchWalletsTotalBalance = async () => {
    setLoading(true);
    try {
      const response = await FinanceService.getAccounts();
      const accounts = response.data || [];
      const walletsTotal = accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalWalletBalance(walletsTotal);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to calculate wallet totals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAmount(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return false;
    }

    const newBalance = parseFloat(amount);
    if (newBalance < totalWalletBalance) {
      setError(`Total balance can't be less than the sum of your wallets (${totalWalletBalance.toFixed(2)})`);
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
      // Make sure we have a token in localStorage
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('You must be logged in to update your balance');
        setLoading(false);
        return;
      }
      
      const response = await FinanceService.updateTotalBalance(parseFloat(amount));
      
      // Notify parent component to refresh data
      if (onBalanceUpdated) {
        onBalanceUpdated();
      }
      
      // Close the dialog immediately
      handleClose();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('You are not authorized to update the balance. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update balance. Please try again.');
      }
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
          
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">
              Wallet total: {totalWalletBalance.toFixed(2)}
              <br/>
              Available for allocation: {(parseFloat(amount || 0) - totalWalletBalance).toFixed(2)}
            </Alert>
          </Box>
          
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
            inputProps={{ step: "0.01", min: totalWalletBalance }}
          />
          <FormHelperText>Enter the new total balance amount (min: {totalWalletBalance.toFixed(2)})</FormHelperText>
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