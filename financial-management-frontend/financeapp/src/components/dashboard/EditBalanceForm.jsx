import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Fade,
  Slide
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditBalanceForm = ({ open, handleClose, onBalanceUpdated, currentBalance }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  // Add refs for transition components
  const dialogRef = useRef(null);
  const alertErrorRef = useRef(null);
  const alertSuccessRef = useRef(null);
  const alertInfoRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchWalletsTotalBalance();
      // Initialize with current balance immediately
      if (currentBalance) {
        setAmount(currentBalance.toString());
      }
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

  // Calculate the available amount for allocation
  const availableForAllocation = Math.max(0, parseFloat(amount || 0) - totalWalletBalance);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="xs"
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle>Edit Total Balance</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Fade in={!!error} timeout={300} nodeRef={alertErrorRef}>
              <Alert severity="error" sx={{ mb: 2 }} ref={alertErrorRef}>{error}</Alert>
            </Fade>
          )}
          {success && (
            <Fade in={!!success} timeout={300} nodeRef={alertSuccessRef}>
              <Alert severity="success" sx={{ mb: 2 }} ref={alertSuccessRef}>{success}</Alert>
            </Fade>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Fade in={open} timeout={400} nodeRef={alertInfoRef}>
              <Alert severity="info" ref={alertInfoRef}>
                <strong>Required minimum:</strong> ${totalWalletBalance.toFixed(2)} (sum of all wallets)
              </Alert>
            </Fade>
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
            inputProps={{ 
              step: "0.01", 
              min: totalWalletBalance
            }}
            error={Boolean(amount && parseFloat(amount) < totalWalletBalance)}
            helperText={amount && parseFloat(amount) < totalWalletBalance 
              ? `Must be at least $${totalWalletBalance.toFixed(2)}` 
              : ''}
          />
          <FormHelperText>
            Enter the new total balance amount. It must be at least equal to the sum of all your wallets (${totalWalletBalance.toFixed(2)}).
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={Boolean(loading || (amount && parseFloat(amount) < totalWalletBalance))}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Balance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBalanceForm; 