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
  Zoom,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import MoneyInput from '../utils/MoneyInput';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/walletForm.module.css';
import { WALLET_ICONS, WALLET_COLORS, saveWalletIcon, saveWalletColor, getWalletIcon, getWalletColorClass } from '../../utils/walletIcons';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import { formatCurrency } from '../../utils/moneyFormatter';

// Map of icon names to components
const iconComponents = {
  wallet: <AccountBalanceWalletIcon />,
  creditCard: <CreditCardIcon />,
  savings: <SavingsIcon />,
  cash: <PaymentsIcon />,
  investment: <ShowChartIcon />,
  piggyBank: <SavingsOutlinedIcon />,
  bank: <AccountBalanceIcon />,
  shopping: <ShoppingBagIcon />
};

const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WalletForm = ({ open, handleClose, onWalletAdded, embedded = false, compact = false, wallet = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountName: '',
    balance: '',
    currency: 'USD',  // Keeping this in the state but not showing in UI
    iconName: 'wallet',  // Default icon
    colorIndex: 1      // Default color (blue)
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [usedBalance, setUsedBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [originalBalance, setOriginalBalance] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Add refs for transitions
  const dialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const infoAlertRef = useRef(null);

  // Initialize with wallet data if editing
  useEffect(() => {
    if (wallet) {
      setIsEditMode(true);
      setOriginalBalance(wallet.balance);
      
      // Get the current wallet icon and color, or set defaults
      const savedIcon = getWalletIcon(wallet.id);
      
      // Extract color index from the color class
      const colorClass = getWalletColorClass(wallet.id);
      const colorIndex = parseInt(colorClass.replace('walletColor', ''), 10);
      
      setFormData({
        accountName: wallet.accountName || '',
        balance: wallet.balance.toString() || '',
        currency: 'USD',
        iconName: savedIcon || 'wallet',
        colorIndex: isNaN(colorIndex) ? 1 : colorIndex
      });
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [wallet]);

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
      
      // When editing, exclude the wallet being edited from used balance calculation
      const usedBalance = accounts.reduce((sum, account) => {
        // Skip the wallet being edited when calculating used balance
        if (isEditMode && wallet && account.id === wallet.id) {
          return sum;
        }
        return sum + account.balance;
      }, 0);
      
      // Calculate available balance
      const availableBalance = isEditMode 
        ? totalBalance - usedBalance + originalBalance
        : totalBalance - usedBalance;
      
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

  // Handle money input change
  const handleMoneyChange = (value) => {
    setFormData({
      ...formData,
      balance: value
    });
    
    // Clear error for this field
    if (errors.balance) {
      setErrors({
        ...errors,
        balance: ''
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
      if (isEditMode) {
        // In edit mode, check against available + original balance
        const maxAllowed = availableBalance;
        if (balanceValue > maxAllowed) {
          newErrors.balance = `Balance exceeds available amount (${maxAllowed.toFixed(2)})`;
        }
      } else {
        // In create mode, just check against available balance
        if (balanceValue > availableBalance) {
          newErrors.balance = `Balance exceeds available amount (${availableBalance.toFixed(2)})`;
        }
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
      
      let response;
      
      if (isEditMode && wallet) {
        // Update the wallet
        response = await FinanceService.updateAccount(
          wallet.id, 
          { ...wallet, ...accountData }
        );
      } else {
        // Create new wallet
        response = await FinanceService.createAccount(accountData);
      }
      
      // Get the wallet ID
      const walletId = isEditMode ? wallet.id : (response.data && response.data.id);
      
      if (walletId) {
        // Save color selection
        saveWalletColor(walletId, formData.colorIndex);
        
        // Save icon selection
        saveWalletIcon(walletId, formData.iconName);
        
        // Create an updated wallet object to pass back to the parent
        const updatedWallet = {
          ...(isEditMode ? wallet : response.data),
          accountName: formData.accountName,
          balance: parseFloat(formData.balance),
          // Add custom properties for immediate UI updates
          _icon: formData.iconName,
          _colorClass: `walletColor${formData.colorIndex}`,
          _forceIconRefresh: Date.now()
        };
        
        // Reset form
        resetForm();
        
        // Close dialog and notify parent with the updated wallet data
        if (onWalletAdded) {
          onWalletAdded(updatedWallet);
        }
        
        if (!embedded) {
          handleClose();
        }
      }
    } catch (err) {
      console.error('Error with wallet operation:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} wallet. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      accountName: '',
      balance: '',
      currency: 'USD',
      iconName: 'wallet',
      colorIndex: 1
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
                  Initial Balance (Max: {formatCurrency(availableBalance)})
                </Typography>
                <MoneyInput
                  name="balance"
                  value={formData.balance}
                  onChange={handleMoneyChange}
                  placeholder="0.00"
                  error={errors.balance}
                  disabled={loading || availableBalance <= 0}
                  size="small"
                  className={styles.textField}
                />
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Compact */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  Wallet Icon
                </Typography>
                <Box className={styles.iconSelection}>
                  {WALLET_ICONS.map(icon => (
                    <Tooltip key={icon.id} title={icon.label}>
                      <Box 
                        className={`${styles.iconOption} ${formData.iconName === icon.value ? styles.selectedIcon : ''}`}
                        onClick={() => handleChange({ target: { name: 'iconName', value: icon.value } })}
                      >
                        {icon.type === 'emoji' ? (
                          <span style={{ fontSize: '20px' }}>{icon.value}</span>
                        ) : (
                          iconComponents[icon.value]
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </FormControl>
            </Grid>
            
            {/* Color Selection - Compact */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  Wallet Color
                </Typography>
                <Box className={styles.colorSelection}>
                  {WALLET_COLORS.map(color => (
                    <Tooltip key={color.id} title={color.label}>
                      <Box 
                        className={`${styles.colorOption} ${formData.colorIndex === color.value ? styles.selectedColor : ''}`}
                        sx={{ backgroundColor: color.hex }}
                        onClick={() => handleChange({ target: { name: 'colorIndex', value: color.value } })}
                      />
                    </Tooltip>
                  ))}
                </Box>
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
                  {isEditMode ? 'Balance' : 'Initial Balance'}
                </Typography>
                <MoneyInput
                  name="balance"
                  value={formData.balance}
                  onChange={handleMoneyChange}
                  placeholder="0.00"
                  error={errors.balance || `Max: ${formatCurrency(availableBalance)}`}
                  disabled={loading || availableBalance <= 0}
                  size="small"
                  className={styles.textField}
                />
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Full Layout */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  Wallet Icon
                </Typography>
                <Box className={styles.iconSelection}>
                  {WALLET_ICONS.map(icon => (
                    <Tooltip key={icon.id} title={icon.label}>
                      <Box 
                        className={`${styles.iconOption} ${formData.iconName === icon.value ? styles.selectedIcon : ''}`}
                        onClick={() => handleChange({ target: { name: 'iconName', value: icon.value } })}
                      >
                        {icon.type === 'emoji' ? (
                          <span style={{ fontSize: '20px' }}>{icon.value}</span>
                        ) : (
                          iconComponents[icon.value]
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </FormControl>
            </Grid>
            
            {/* Only show color selection for standard icons, not emoji */}
            {(WALLET_ICONS.find(icon => icon.value === formData.iconName)?.type !== 'emoji') && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small" className={styles.formControl}>
                  <Typography variant="caption" className={styles.fieldLabel}>
                    Wallet Color
                  </Typography>
                  <Box className={styles.colorSelection}>
                    {WALLET_COLORS.map(color => (
                      <Tooltip key={color.id} title={color.label}>
                        <Box 
                          className={`${styles.colorOption} ${formData.colorIndex === color.value ? styles.selectedColor : ''}`}
                          sx={{ backgroundColor: color.hex }}
                          onClick={() => handleChange({ target: { name: 'colorIndex', value: color.value } })}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </FormControl>
              </Grid>
            )}
          </>
        )}
      </Grid>
      
      {/* Only show these buttons when embedded */}
      {embedded && (
        <Box className={compact ? `${styles.buttonContainer} ${styles.buttonContainerCompact}` : styles.buttonContainer}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={submitting || loading || availableBalance <= 0}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
            size={compact ? "small" : "medium"}
            className={`${styles.saveButton} ${compact ? styles.saveButtonSmall : ''}`}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Wallet' : 'Save Wallet'}
          </Button>
        </Box>
      )}
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
          {submitting ? <CircularProgress size={24} /> : isEditMode ? 'Update Wallet' : 'Create Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletForm; 