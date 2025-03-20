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

const AddBalanceForm = ({ open, handleClose, onBalanceAdded }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  // Add refs for transition components
  const dialogRef = useRef(null);
  const alertErrorRef = useRef(null);
  const alertSuccessRef = useRef(null);
  const alertInfoRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setAmount('');
      setError('');
      setSuccess('');
      fetchBalanceData();
    }
  }, [open]);

  const fetchBalanceData = async () => {
    setLoading(true);
    try {
      // Fetch financial summary to get total balance
      const summaryResponse = await FinanceService.getFinancialSummary();
      const totalBalance = summaryResponse.data.totalBalance || 0;
      setCurrentBalance(totalBalance);
      
      // Fetch all wallets to calculate total wallet balance
      const accountsResponse = await FinanceService.getAccounts();
      const accounts = accountsResponse.data || [];
      const walletsTotal = accounts.reduce((sum, account) => sum + account.balance, 0);
      setTotalWalletBalance(walletsTotal);
    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError('Failed to load balance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAmount(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
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
        setError('You must be logged in to add to your balance');
        setLoading(false);
        return;
      }
      
      // Create a local variable to track success in this scope
      let isSuccess = false;
      
      // Add to total balance
      const response = await FinanceService.addToTotalBalance(parseFloat(amount));
      isSuccess = true;
      
      // Show a success message briefly before closing
      setSuccess('Balance updated successfully!');
      
      // Notify parent component to refresh data
      if (onBalanceAdded) {
        onBalanceAdded();
      }
      
      // Wait a moment to show the success message, then close
      setTimeout(() => {
        if (isSuccess) {
          handleClose();
        }
      }, 1000);
      
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('You are not authorized to add to the balance. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update balance. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle dialog close and reset form state
  const handleFormClose = () => {
    setSuccess('');
    setError('');
    setAmount('');
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleFormClose} 
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
      <DialogTitle>Add to Total Balance</DialogTitle>
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
                Current balance: {currentBalance.toFixed(2)}
                <br/>
                Wallet total: {totalWalletBalance.toFixed(2)}
                <br/>
                Available for allocation: {(currentBalance - totalWalletBalance).toFixed(2)}
              </Alert>
            </Fade>
          </Box>
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            disabled={loading}
            inputProps={{ step: "0.01", min: "0.01" }}
          />
          <FormHelperText>
            Enter the amount you want to add to your total balance
            <br/>
            New balance after addition: {(currentBalance + parseFloat(amount || 0)).toFixed(2)}
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Money'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddBalanceForm; 