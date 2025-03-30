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
import { formatCurrency } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
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
      setError(t('wallets.errorLoadingBalanceData'));
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
      newErrors.accountName = t('validation.required');
    }
    
    if (!formData.balance || isNaN(formData.balance) || parseFloat(formData.balance) < 0) {
      newErrors.balance = t('validation.invalidAmount');
    } else {
      const balanceValue = parseFloat(formData.balance);
      if (isEditMode) {
        // In edit mode, check against available + original balance
        const maxAllowed = availableBalance;
        if (balanceValue > maxAllowed) {
          newErrors.balance = t('wallets.balanceExceedsAvailable', { 
            amount: formatCurrency(maxAllowed, i18n.language) 
          });
        }
      } else {
        // In create mode, just check against available balance
        if (balanceValue > availableBalance) {
          newErrors.balance = t('wallets.balanceExceedsAvailable', { 
            amount: formatCurrency(availableBalance, i18n.language) 
          });
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const walletData = {
      accountName: formData.accountName,
      balance: parseFloat(formData.balance),
      currency: formData.currency
    };
    
    try {
      let response;
      
      if (isEditMode && wallet) {
        // Update existing wallet
        response = await FinanceService.updateAccount(wallet.id, walletData);
        
        // Update icon and color
        saveWalletIcon(wallet.id, formData.iconName);
        saveWalletColor(wallet.id, formData.colorIndex);
      } else {
        // Create new wallet
        response = await FinanceService.createAccount(walletData);
        
        // Save icon and color preferences
        if (response.data && response.data.id) {
          saveWalletIcon(response.data.id, formData.iconName);
          saveWalletColor(response.data.id, formData.colorIndex);
        }
      }
      
      // Reset form after successful submission
      resetForm();
      
      // Notify parent component about the wallet addition/update
      if (onWalletAdded) {
        onWalletAdded(isEditMode, response.data);
      }
      
      // Close dialog if not embedded
      if (!embedded) {
        handleClose();
      }
    } catch (err) {
      console.error('Error submitting wallet:', err);
      setError(isEditMode 
        ? t('wallets.errorUpdatingWallet') 
        : t('wallets.errorCreatingWallet'));
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
  
  // Create the form content
  const formContent = (
    <Box className={styles.formContainer}>
      {error && (
        <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
          <Alert severity="error" className={styles.errorAlert} ref={errorAlertRef}>
            {error}
          </Alert>
        </Fade>
      )}
      
      {!compact && !isEditMode && !embedded && (
        <Fade in={true} timeout={600} nodeRef={infoAlertRef}>
          <Box sx={{ mb: 2 }} ref={infoAlertRef}>
            <Alert severity="info">
              {t('wallets.totalBalance')}: {formatCurrency(totalBalance, i18n.language)}
              <br />
              {t('wallets.usedAmount')}: {formatCurrency(usedBalance, i18n.language)}
              <br />
              {t('wallets.availableAmount')}: {formatCurrency(availableBalance, i18n.language)}
            </Alert>
          </Box>
        </Fade>
      )}
      
      <Grid container spacing={compact ? 1 : 2} sx={{ mt: compact ? 0 : 0.5 }}>
        {compact ? (
          // Compact layout - 2 fields per row
          <>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.accountName} size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.walletName')}
                </Typography>
                <TextField
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  placeholder={t('wallets.walletNamePlaceholder')}
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
                  {isEditMode 
                    ? t('wallets.balance') 
                    : t('wallets.initialBalanceMax', { amount: formatCurrency(availableBalance, i18n.language) })}
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
                  label=""
                />
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Compact */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.iconAndColor')}
                </Typography>
                <Box className={styles.compactIconSelector}>
                  {/* Icon Selector */}
                  <FormControl className={styles.iconSelectorCompact}>
                    <RadioGroup 
                      row 
                      value={formData.iconName}
                      onChange={(e) => handleChange({
                        target: { name: 'iconName', value: e.target.value }
                      })}
                      className={styles.iconRadioGroup}
                    >
                      {WALLET_ICONS.map((icon, index) => (
                        <Tooltip key={index} title={icon.label || ''} placement="top">
                          <FormControlLabel
                            value={icon.value}
                            control={<Radio className={styles.iconRadio} />}
                            label={icon.type === 'emoji' ? (
                              <span className={styles.emojiIcon}>{icon.value}</span>
                            ) : (
                              <Box className={styles.iconWrapper}>
                                {iconComponents[icon.value] || <AccountBalanceWalletIcon />}
                              </Box>
                            )}
                            className={styles.iconRadioLabel}
                          />
                        </Tooltip>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  
                  {/* Color Selector */}
                  <FormControl className={styles.colorSelectorCompact}>
                    <RadioGroup 
                      row 
                      value={formData.colorIndex}
                      onChange={(e) => handleChange({
                        target: { name: 'colorIndex', value: parseInt(e.target.value, 10) }
                      })}
                      className={styles.colorRadioGroup}
                    >
                      {WALLET_COLORS.map((color, index) => (
                        <FormControlLabel
                          key={index}
                          value={color.index}
                          control={<Radio className={styles.colorRadio} />}
                          label={<Box className={`${styles.colorSwatch} ${styles[`color${color.index}`]}`} />}
                          className={styles.colorRadioLabel}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
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
                  {t('wallets.walletName')}
                </Typography>
                <TextField
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  placeholder={t('wallets.walletNamePlaceholder')}
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
                  {isEditMode ? t('wallets.balance') : t('wallets.initialBalance')}
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
                  label=""
                />
                {!errors.balance && (
                  <FormHelperText>{t('wallets.maxAmount', { amount: formatCurrency(availableBalance, i18n.language) })}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Full Layout */}
            <Grid item xs={12}>
              <FormControl fullWidth className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.selectIcon')}
                </Typography>
                <RadioGroup 
                  row 
                  value={formData.iconName}
                  onChange={(e) => handleChange({
                    target: { name: 'iconName', value: e.target.value }
                  })}
                  className={styles.iconRadioGroup}
                >
                  {WALLET_ICONS.map((icon, index) => (
                    <Tooltip key={index} title={t(`wallets.iconNames.${icon.value}`) || ''} placement="top">
                      <FormControlLabel
                        value={icon.value}
                        control={<Radio className={styles.iconRadio} />}
                        label={icon.type === 'emoji' ? (
                          <span className={styles.emojiIcon}>{icon.value}</span>
                        ) : (
                          <Box className={styles.iconWrapper}>
                            {iconComponents[icon.value] || <AccountBalanceWalletIcon />}
                          </Box>
                        )}
                        className={styles.iconRadioLabel}
                      />
                    </Tooltip>
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth className={styles.formControl}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.selectColor')}
                </Typography>
                <RadioGroup 
                  row 
                  value={formData.colorIndex}
                  onChange={(e) => handleChange({
                    target: { name: 'colorIndex', value: parseInt(e.target.value, 10) }
                  })}
                  className={styles.colorRadioGroup}
                >
                  {WALLET_COLORS.map((color, index) => (
                    <FormControlLabel
                      key={index}
                      value={color.index}
                      control={<Radio className={styles.colorRadio} />}
                      label={<Box className={`${styles.colorSwatch} ${styles[`color${color.index}`]}`} />}
                      className={styles.colorRadioLabel}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>

      {/* Only show submit button if embedded */}
      {embedded && (
        <Box className={styles.actionButtons}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? <CircularProgress size={24} /> : 
              isEditMode ? t('wallets.updateWallet') : t('wallets.createWallet')}
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
      <DialogTitle>{wallet ? t('wallets.editWallet') : t('wallets.createWallet')}</DialogTitle>
      <DialogContent>
        {formContent}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>{t('common.cancel')}</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary" 
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 
           isEditMode ? t('wallets.updateWallet') : t('wallets.createWallet')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletForm; 