import React, { useState, useEffect, useRef } from 'react';
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
  Typography,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/walletForm.module.css';
import { generateRandomColorIndex, saveWalletColor } from '../../utils/colorUtils';

const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WalletForm = ({ open, handleClose, onWalletAdded, embedded = false, compact = false, wallet = null }) => {
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
  const [totalBalance, setTotalBalance] = useState(0);
  const [usedBalance, setUsedBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Add refs for transitions
  const dialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const infoAlertRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchBalanceData();
    }
  }, [open]);

  const fetchBalanceData = async () => {
    setLoading(true);
    try {
      // Fetch total balance from summary
      const summaryResponse = await FinanceService.getFinancialSummary();
      const totalBalance = summaryResponse.data.totalBalance || 0;
      
      // Fetch all accounts/wallets to calculate used balance
      const accountsResponse = await FinanceService.getAccounts();
      const accounts = accountsResponse.data || [];
      const usedBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Calculate available balance
      const availableBalance = totalBalance - usedBalance;
      
      setTotalBalance(totalBalance);
      setUsedBalance(usedBalance);
      setAvailableBalance(availableBalance);
    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError('Failed to load balance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    
    if (!formData.balance || isNaN(formData.balance) || parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Valid balance is required';
    } else {
      const balanceValue = parseFloat(formData.balance);
      if (balanceValue > availableBalance) {
        newErrors.balance = `Balance exceeds available amount (${availableBalance.toFixed(2)})`;
      }
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
      
      // Create the wallet
      const response = await FinanceService.createAccount(accountData);
      
      // If the wallet creation was successful and we have an ID, assign a random color
      if (response && response.data && response.data.id) {
        const colorIndex = generateRandomColorIndex();
        saveWalletColor(response.data.id, colorIndex);
      }
      
      // Reset form
      resetForm();
      
      // Close dialog and notify parent
      if (onWalletAdded) {
        onWalletAdded();
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
    <Box className={styles.formContainer}>
      {error && (
        <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
          <Alert severity="error" sx={{ mb: 2 }} ref={errorAlertRef}>{error}</Alert>
        </Fade>
      )}
      
      <Fade in={open} timeout={300} nodeRef={infoAlertRef}>
        <Box sx={{ mb: 2 }} ref={infoAlertRef}>
          <Alert severity="info">
            Total Balance: ${totalBalance.toFixed(2)}
            <br />
            Used: ${usedBalance.toFixed(2)}
            <br />
            Available: ${availableBalance.toFixed(2)}
          </Alert>
        </Box>
      </Fade>
      
      <Grid container spacing={compact ? 1 : 2} sx={{ mt: compact ? 0 : 0.5 }}>
        {compact ? (
          // Compact layout - 2 fields per row
          <>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.accountName} size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                  className={styles.textField}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.balance} size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  Initial Balance (Max: {availableBalance.toFixed(2)})
                </Typography>
                <TextField
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0.00"
                  error={!!errors.balance}
                  helperText={errors.balance}
                  disabled={loading || availableBalance <= 0}
                  size="small"
                  className={styles.textField}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        $
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </Grid>
          </>
        ) : (
          // Original layout - 1 field per row
          <>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.accountName} size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                  className={styles.textField}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.balance} size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  Initial Balance (Max: {availableBalance.toFixed(2)})
                </Typography>
                <TextField
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="0.00"
                  error={!!errors.balance}
                  helperText={errors.balance}
                  disabled={loading || availableBalance <= 0}
                  size="small"
                  className={styles.textField}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        $
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>
      
      <Box className={compact ? `${styles.buttonContainer} ${styles.buttonContainerCompact}` : styles.buttonContainer}>
        {!embedded && (
          <Button 
            onClick={handleClose} 
            disabled={submitting} 
            className={styles.cancelButton}
          >
            Cancel
          </Button>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting || loading || availableBalance <= 0}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          size={compact ? "small" : "medium"}
          className={`${styles.saveButton} ${compact ? styles.saveButtonSmall : ''}`}
        >
          {submitting ? 'Saving...' : 'Save Wallet'}
        </Button>
      </Box>
    </Box>
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
      fullWidth 
      maxWidth="sm"
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle>{wallet ? 'Edit Wallet' : 'New Wallet'}</DialogTitle>
      <DialogContent>
        {error && (
          <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
            <Alert severity="error" sx={{ mb: 2 }} ref={errorAlertRef}>{error}</Alert>
          </Fade>
        )}
        
        <Fade in={open} timeout={300} nodeRef={infoAlertRef}>
          <Box sx={{ mb: 2 }} ref={infoAlertRef}>
            <Alert severity="info">
              Total Balance: ${totalBalance.toFixed(2)}
              <br />
              Used: ${usedBalance.toFixed(2)}
              <br />
              Available: ${availableBalance.toFixed(2)}
            </Alert>
          </Box>
        </Fade>
        
        {formContent}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary" 
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : wallet ? 'Update Wallet' : 'Create Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletForm; 