import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  FormHelperText,
  Box,
  CircularProgress,
  Alert,
  Fade,
  Slide
} from '@mui/material';
import MoneyInput from '../utils/MoneyInput';
import FinanceService from '../../services/FinanceService';
import { formatCurrency } from '../../utils/moneyFormatter';
import { useTranslation } from 'react-i18next';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditBalanceForm = ({ open, handleClose, onBalanceUpdated, currentBalance, walletId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);
  const [hasEditPermission, setHasEditPermission] = useState(true);
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});

  // Add refs for transition components
  const dialogRef = useRef(null);
  const alertErrorRef = useRef(null);
  const alertSuccessRef = useRef(null);
  const alertInfoRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchWalletsTotalBalance();
      fetchSharedWalletsInfo();
      // Initialize with current balance immediately
      if (currentBalance) {
        setAmount(currentBalance.toString());
      }
    }
  }, [open, currentBalance]);

  const fetchSharedWalletsInfo = async () => {
    try {
      // If we have a wallet ID, check if it's shared and if the current user has edit permission
      if (walletId) {
        const [sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
          FinanceService.getSharedWalletsWithMe(),
          FinanceService.getSharedWalletsByMe()
        ]);
        
        // Process shared wallets data
        const sharedInfo = {};
        
        // Helper function to process shared wallets
        const processSharedWallets = (wallets, isOwner) => {
          wallets.forEach(sharedWallet => {
            if (sharedWallet.accepted) {
              sharedInfo[sharedWallet.walletId] = {
                isShared: true,
                isOwner,
                ownerUsername: sharedWallet.ownerUsername,
                ownerId: sharedWallet.ownerId,
                sharedWithId: sharedWallet.sharedWithId,
                sharedWithUsername: sharedWallet.sharedWithUsername,
                walletName: sharedWallet.walletName
              };
            }
          });
        };
        
        processSharedWallets(sharedWithMeResponse.data || [], false);
        processSharedWallets(sharedByMeResponse.data || [], true);
        
        setSharedWalletsInfo(sharedInfo);
        
        // Check if the wallet is shared and the current user is not the owner
        const isSharedWallet = sharedInfo[walletId];
        const isNotOwner = isSharedWallet && !sharedInfo[walletId].isOwner;
        
        // Set edit permission based on ownership
        setHasEditPermission(!isNotOwner);
      }
    } catch (err) {
      console.error('Error fetching shared wallet info:', err);
    }
  };

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

  const handleChange = (value) => {
    setAmount(value);
    setError('');
  };

  const validateForm = () => {
    if (!hasEditPermission) {
      setError(t('wallets.cannotEditSharedBalance'));
      return false;
    }

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
          
          {!hasEditPermission && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('wallets.cannotEditSharedBalance')}
            </Alert>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Fade in={open} timeout={400} nodeRef={alertInfoRef}>
              <Alert severity="info" ref={alertInfoRef}>
                <strong>Required minimum:</strong> {formatCurrency(totalWalletBalance)} (sum of all wallets)
              </Alert>
            </Fade>
          </Box>
          
          <MoneyInput
            autoFocus
            margin="dense"
            label="New Balance"
            value={amount}
            onChange={handleChange}
            disabled={loading || !hasEditPermission}
            inputProps={{ 
              min: totalWalletBalance
            }}
            error={Boolean(amount && parseFloat(amount) < totalWalletBalance) 
              ? `Must be at least ${formatCurrency(totalWalletBalance)}` 
              : ''}
          />
          <FormHelperText>
            Enter the new total balance amount. It must be at least equal to the sum of all your wallets ({formatCurrency(totalWalletBalance)}).
          </FormHelperText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={Boolean(loading || !hasEditPermission || (amount && parseFloat(amount) < totalWalletBalance))}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Balance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBalanceForm;
