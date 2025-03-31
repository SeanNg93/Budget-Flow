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
import LockIcon from '@mui/icons-material/Lock';
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
  const [success, setSuccess] = useState('');
  // Add state for shared wallet permissions
  const [canEditBalance, setCanEditBalance] = useState(true);
  const [sharedWalletInfo, setSharedWalletInfo] = useState(null);

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

      // Check if this is a shared wallet and get permission info
      if (wallet.id) {
        checkWalletPermissions(wallet.id);
      }
    } else {
      setIsEditMode(false);
      resetForm();
      setCanEditBalance(true); // Reset permissions for new wallets
    }
  }, [wallet]);

  useEffect(() => {
    if (open) {
      fetchBalanceData();
    }
  }, [open]);

  // Add function to check wallet sharing permissions
  const checkWalletPermissions = async (walletId) => {
    try {
      // Fetch shared wallets data in parallel
      const [sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getSharedWalletsWithMe(),
        FinanceService.getSharedWalletsByMe()
      ]);

      // Process shared wallets data
      let isSharedWallet = false;
      let isOwner = true;
      let sharedInfo = null;

      // Helper function to process shared wallets
      const processSharedWallets = (wallets, isWalletOwner) => {
        wallets.forEach(sharedWallet => {
          if (sharedWallet.accepted && sharedWallet.walletId === walletId) {
            isSharedWallet = true;
            isOwner = isWalletOwner;
            sharedInfo = {
              isShared: true,
              isOwner: isWalletOwner,
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

      // Set permission based on ownership - only owners can edit balance
      setCanEditBalance(!isSharedWallet || isOwner);
      setSharedWalletInfo(sharedInfo);
      
      console.log(`Wallet ${walletId} is ${isSharedWallet ? 'shared' : 'not shared'}, user is ${isOwner ? '' : 'not '}the owner`);
    } catch (err) {
      console.error('Error checking wallet permissions:', err);
      // Default to allowing edits if we can't check permissions
      setCanEditBalance(true);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const walletData = {
        accountName: formData.accountName,
        // Only update balance if user has permission to edit it
        balance: isEditMode && wallet && !canEditBalance 
          ? wallet.balance  // Keep original balance if user can't edit
          : parseFloat(formData.balance),
        currency: formData.currency
      };

      // Log permission state
      if (isEditMode && wallet) {
        console.log(`Saving wallet ${wallet.id} with canEditBalance: ${canEditBalance}`);
        console.log('Updating wallet with data:', {
          id: wallet.id,
          name: walletData.accountName,
          oldBalance: wallet ? wallet.balance : 0,
          newBalance: walletData.balance,
          balanceChanged: canEditBalance && wallet && walletData.balance !== wallet.balance
        });
      }

      let response;
      if (isEditMode && wallet) {
        // Update existing wallet
        response = await FinanceService.updateAccount(wallet.id, walletData);
        
        // Update icon and color preferences in localStorage
        saveWalletIcon(wallet.id, formData.iconName);
        if (formData.colorIndex) {
          saveWalletColor(wallet.id, formData.colorIndex);
        }
        
        // Create a modified wallet object with all necessary UI properties
        const updatedWallet = {
          ...response.data,
          _forceIconRefresh: Date.now(),
          _colorClass: formData.colorIndex ? `walletColor${formData.colorIndex}` : 'walletColor1',
          _icon: formData.iconName // Directly use the selected icon
        };
        
        // Show success message
        setSuccess(t('wallets.updateSuccess'));
        
        // Call the callback with the updated wallet immediately
        if (onWalletAdded) {
          onWalletAdded(updatedWallet);
        }
        
        // Close the form after successful submission if not embedded
        if (!embedded) {
          // Wait briefly to show success message
          await new Promise(resolve => setTimeout(resolve, 800));
          handleClose();
        }
      } else {
        // Create new wallet
        response = await FinanceService.createAccount(walletData);
        
        // Save icon and color to localStorage for the new wallet
        saveWalletIcon(response.data.id, formData.iconName);
        if (formData.colorIndex) {
          saveWalletColor(response.data.id, formData.colorIndex);
        }
        
        // Create a modified wallet object with all necessary UI properties
        const newWallet = {
          ...response.data,
          _forceIconRefresh: Date.now(),
          _colorClass: formData.colorIndex ? `walletColor${formData.colorIndex}` : 'walletColor1',
          _icon: formData.iconName // Directly use the selected icon
        };
        
        // Show success message
        setSuccess(t('wallets.createSuccess'));
        
        // Call the callback with the created wallet immediately
        if (onWalletAdded) {
          onWalletAdded(newWallet);
        }
        
        // Close the form after successful submission if not embedded
        if (!embedded) {
          // Wait briefly to show success message
          await new Promise(resolve => setTimeout(resolve, 800));
          handleClose();
        }
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
      setError(error.response?.data?.message || 'Failed to save wallet. Please try again.');
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
  
  // Helper function to check if the selected icon is an emoji
  const isEmojiIcon = (iconName) => {
    const selectedIcon = WALLET_ICONS.find(icon => icon.value === iconName);
    return selectedIcon && selectedIcon.type === 'emoji';
  };
  
  const handleIconChange = (iconName) => {
    // For emoji icons, we don't need color selection
    if (isEmojiIcon(iconName)) {
      setFormData({
        ...formData,
        iconName,
        colorIndex: null // Reset color when emoji is selected
      });
    } else {
      // For regular icons, keep color selection
      setFormData({
        ...formData,
        iconName,
        colorIndex: formData.colorIndex || 1 // Default to blue if no color was selected
      });
    }
  };
  
  // Create the form content
  const formContent = (
    <Box className={styles.formContainer}>
      {error && (
        <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
          <Alert severity="error" className={styles.alertContainer} ref={errorAlertRef}>
            {error}
          </Alert>
        </Fade>
      )}
      
      {!isEditMode && (
        <Fade in={true} timeout={600} nodeRef={infoAlertRef}>
          <Box sx={{ mb: 1 }} ref={infoAlertRef}>
            <Box className={styles.balanceInfoBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box className={styles.circleIcon}>1</Box>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  Total: {formatCurrency(totalBalance, i18n.language)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box className={styles.circleIcon}>2</Box>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  Allocated: {formatCurrency(usedBalance, i18n.language)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box className={styles.circleIcon}>3</Box>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  Available: {formatCurrency(availableBalance, i18n.language)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}
      
      <Grid container spacing={1} sx={{ mt: 0 }}>
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
                  sx={{ marginBottom: 0 }}
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
                  disabled={loading || availableBalance <= 0 || (isEditMode && !canEditBalance)}
                  size="small"
                  className={styles.textField}
                  label=""
                  InputProps={{
                    sx: (isEditMode && !canEditBalance) ? {
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      color: 'text.secondary'
                    } : {}
                  }}
                />
                {isEditMode && !canEditBalance && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LockIcon fontSize="small" sx={{ fontSize: '0.9rem', mr: 0.5, color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                      {t('wallets.cannotEditSharedBalance')}
                    </Typography>
                  </Box>
                )}
                {!errors.balance && !isEditMode && (
                  <FormHelperText sx={{ mt: 0 }}>{t('wallets.maxAmount', { amount: formatCurrency(availableBalance, i18n.language) })}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Compact */}
            <Grid item xs={12}>
              <Typography variant="caption" className={styles.fieldLabel}>
                {t('wallets.selectIcon')}
              </Typography>
              <Box className={styles.iconSelectionCompact}>
                {WALLET_ICONS.slice(0, 10).map((icon, index) => (
                  <Tooltip key={index} title={t(`wallets.iconNames.${icon.value}`) || icon.label || ''} placement="top">
                    <Box
                      onClick={() => handleIconChange(icon.value)}
                      className={`${styles.iconOptionCompact} ${formData.iconName === icon.value ? styles.selectedIcon : ''}`}
                    >
                      {icon.type === 'emoji' ? (
                        <span className={styles.emojiIcon}>{icon.value}</span>
                      ) : (
                        iconComponents[icon.value] || <AccountBalanceWalletIcon />
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Grid>
            
            {/* Color Selection - Compact - Only show for non-emoji icons */}
            {!isEmojiIcon(formData.iconName) && (
              <Grid item xs={12}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.selectColor')}
                </Typography>
                <Box className={styles.colorSelectionCompact}>
                  {WALLET_COLORS.map((color) => (
                    <Tooltip key={color.id} title={color.label} placement="top">
                      <Box
                        onClick={() => handleChange({ target: { name: 'colorIndex', value: color.value }})}
                        className={`${styles.colorOptionCompact} ${formData.colorIndex === color.value ? styles.selectedColor : ''}`}
                        sx={{ backgroundColor: color.hex }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Grid>
            )}
          </>
        ) : (
          // Original layout - more compact than before
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
                  disabled={loading || availableBalance <= 0 || (isEditMode && !canEditBalance)}
                  size="small"
                  className={styles.textField}
                  label=""
                  InputProps={{
                    sx: (isEditMode && !canEditBalance) ? {
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      color: 'text.secondary'
                    } : {}
                  }}
                />
                {isEditMode && !canEditBalance && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LockIcon fontSize="small" sx={{ fontSize: '0.9rem', mr: 0.5, color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                      {t('wallets.cannotEditSharedBalance')}
                    </Typography>
                  </Box>
                )}
                {!errors.balance && !isEditMode && (
                  <FormHelperText sx={{ mt: 0 }}>{t('wallets.maxAmount', { amount: formatCurrency(availableBalance, i18n.language) })}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Icon Selection - Compact Layout */}
            <Grid item xs={12}>
              <FormControl fullWidth className={styles.formControlCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  {t('wallets.selectIcon')}
                </Typography>
                <Box className={styles.iconSelectionCompact}>
                  {WALLET_ICONS.map((icon, index) => (
                    <Tooltip key={index} title={t(`wallets.iconNames.${icon.value}`) || icon.label || ''} placement="top">
                      <Box
                        onClick={() => handleIconChange(icon.value)}
                        className={`${styles.iconOptionCompact} ${formData.iconName === icon.value ? styles.selectedIcon : ''}`}
                      >
                        {icon.type === 'emoji' ? (
                          <span className={styles.emojiIcon}>{icon.value}</span>
                        ) : (
                          iconComponents[icon.value] || <AccountBalanceWalletIcon />
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </FormControl>
            </Grid>
            
            {/* Color Selection - Only show for non-emoji icons */}
            {!isEmojiIcon(formData.iconName) && (
              <Grid item xs={12}>
                <FormControl fullWidth className={styles.formControlCompact}>
                  <Typography variant="caption" className={styles.fieldLabel}>
                    {t('wallets.selectColor')}
                  </Typography>
                  <Box className={styles.colorSelectionCompact}>
                    {WALLET_COLORS.map((color) => (
                      <Tooltip key={color.id} title={color.label} placement="top">
                        <Box
                          onClick={() => handleChange({ target: { name: 'colorIndex', value: color.value }})}
                          className={`${styles.colorOptionCompact} ${formData.colorIndex === color.value ? styles.selectedColor : ''}`}
                          sx={{ backgroundColor: color.hex }}
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
      maxWidth="xs"
      PaperProps={{ className: styles.dialogPaper }}
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle sx={{ pb: 1 }}>{wallet ? t('wallets.editWallet') : t('wallets.createWallet')}</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 1 }}>
        {formContent}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting} size="small" className={styles.cancelButton}>{t('common.cancel')}</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary" 
          size="small"
          disabled={submitting}
          className={styles.submitButton}
        >
          {submitting ? <CircularProgress size={20} /> : 
           isEditMode ? t('wallets.updateWallet') : t('wallets.createWallet')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletForm; 