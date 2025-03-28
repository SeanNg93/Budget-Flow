import React, { useState, useEffect, useRef } from 'react';
import FinanceService from '../../services/FinanceService';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Typography,
  Box,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Fade,
  Slide,
  IconButton
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import styles from '../../styles/walletManage.module.css';

// Helper to format currency
const formatCurrency = (value) => {
  // Ensure value is a number before formatting
  const numericValue = typeof value === 'number' ? value : parseFloat(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
};

// Create transition components with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UserTransferForm = ({ open, handleClose, onTransferCompleted, defaultSourceWallet = null }) => {
  const { t } = useTranslation();
  // Wallets state
  const [wallets, setWallets] = useState([]);
  const [sourceWalletId, setSourceWalletId] = useState('');
  
  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  
  // Transfer state
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [success, setSuccess] = useState(false);

  // Add refs for transitions
  const dialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const successAlertRef = useRef(null);
  
  // Load wallets when component mounts
  useEffect(() => {
    if (open) {
      loadWallets();
      // Reset form
      setSearchQuery('');
      setSelectedUser(null);
      setAmount('');
      setError('');
      setSuccess(false);
    }
  }, [open]);
  
  // Set default wallet if provided
  useEffect(() => {
    if (defaultSourceWallet && open) {
      setSourceWalletId(defaultSourceWallet.id.toString());
    }
  }, [defaultSourceWallet, open]);
  
  // When search query changes, search for users
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  
  const loadWallets = async () => {
    try {
      const response = await FinanceService.getWallets();
      setWallets(response.data);
      
      // Set default wallet if provided, otherwise use first wallet
      if (defaultSourceWallet) {
        setSourceWalletId(defaultSourceWallet.id.toString());
      } else if (response.data.length > 0) {
        setSourceWalletId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      setError(t('wallet.errors.failedToLoadWallets'));
    }
  };
  
  const searchUsers = async (query) => {
    if (!query || query.length < 2) return;
    
    setSearching(true);
    setError('');
    
    try {
      const response = await FinanceService.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setError(t('userTransfer.errors.searchFailed'));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };
  
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  };
  
  const handleTransfer = async () => {
    // Validate input
    if (!sourceWalletId) {
      setError(t('userTransfer.errors.selectSourceWallet'));
      return;
    }
    
    if (!selectedUser) {
      setError(t('userTransfer.errors.selectRecipient'));
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError(t('userTransfer.errors.enterValidAmount'));
      return;
    }
    
    // Check if source wallet has enough balance
    const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
    if (!sourceWallet || parseFloat(amount) > sourceWallet.balance) {
      setError(t('userTransfer.errors.insufficientFunds', { 
        walletName: sourceWallet?.accountName, 
        available: sourceWallet?.balance.toFixed(2) 
      }));
      return;
    }
    
    setError('');
    setTransferring(true);
    setSuccess(false);
    
    try {
      await FinanceService.transferToUser(
        parseInt(sourceWalletId),
        selectedUser.id.toString(),
        parseFloat(amount)
      );
      
      // Show success message and reset form
      setSuccess(true);
      setAmount('');
      setSelectedUser(null);
      setSearchQuery('');
      
      // Notify parent component with refresh flag
      if (onTransferCompleted) {
        onTransferCompleted(true);
      }
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        if (open) handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error transferring funds:', error);
      setError(error.response?.data?.error || t('userTransfer.errors.transferFailed'));
    } finally {
      setTransferring(false);
    }
  };
  
  const handleReset = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper,
        style: { width: '450px', maxWidth: '95vw' }
      }}
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>
            {t('userTransfer.title')}
          </Typography>
          <IconButton 
            aria-label="close" 
            onClick={handleClose} 
            size="small"
            sx={{
              color: 'rgba(0, 0, 0, 0.54)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#007aff'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent} sx={{ px: 2, py: 1 }}>
        {/* Error message */}
        {error && (
          <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              style={{ marginBottom: '12px' }}
              ref={errorAlertRef}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {/* Success message */}
        {success && (
          <Fade in={success} timeout={300} nodeRef={successAlertRef}>
            <Alert 
              severity="success" 
              style={{ marginBottom: '12px' }}
              ref={successAlertRef}
            >
              {t('userTransfer.transferSuccess')}
            </Alert>
          </Fade>
        )}
        
        <Box sx={{ pt: 1 }}>
          {/* Source wallet selector */}
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {t('userTransfer.fromWallet')}
            </Typography>
            <Select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              displayEmpty
              size="small"
              sx={{
                borderRadius: '8px',
                fontSize: '0.9rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <MenuItem value="" disabled>
                {t('userTransfer.selectWallet')}
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} ({formatCurrency(wallet.balance)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* User search */}
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {t('userTransfer.toUser')}
            </Typography>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('userTransfer.searchUserPlaceholder')}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }}
            />
            
            {/* Search results */}
            {searchResults.length > 0 && !selectedUser && (
              <Paper 
                elevation={2} 
                sx={{ 
                  mt: 0.5, 
                  maxHeight: '180px', 
                  overflow: 'auto',
                  borderRadius: '8px'
                }}
              >
                <List dense sx={{ py: 0.5 }}>
                  {searchResults.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        button 
                        onClick={() => handleSelectUser(user)}
                        dense
                        sx={{ 
                          py: 0.5,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 122, 255, 0.08)'
                          }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar 
                            src={user.profilePicture} 
                            alt={user.username}
                            sx={{ 
                              width: 30, 
                              height: 30,
                              backgroundColor: 'primary.main',
                              fontSize: '0.85rem'
                            }}
                          >
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.fullName || user.username}
                          secondary={user.fullName ? `@${user.username}` : ''}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </ListItem>
                      {index < searchResults.length - 1 && <Divider component="li" variant="middle" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
            
            {/* Selected user */}
            {selectedUser && (
              <Paper 
                elevation={1} 
                sx={{ 
                  mt: 0.5, 
                  p: 0.75, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 122, 255, 0.05)',
                  border: '1px solid rgba(0, 122, 255, 0.1)'
                }}
              >
                <Avatar 
                  src={selectedUser.profilePicture} 
                  alt={selectedUser.username}
                  sx={{ 
                    backgroundColor: 'primary.main',
                    mr: 1,
                    width: 28,
                    height: 28,
                    fontSize: '0.85rem'
                  }}
                >
                  {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : selectedUser.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedUser.fullName || selectedUser.username}
                  </Typography>
                  {selectedUser.fullName && (
                    <Typography variant="caption" color="text.secondary">
                      @{selectedUser.username}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Button 
                    size="small" 
                    onClick={handleReset}
                    sx={{ 
                      minWidth: 'auto', 
                      p: 0.5, 
                      fontSize: '0.75rem',
                      color: 'primary.main'
                    }}
                  >
                    {t('common.change')}
                  </Button>
                </Box>
              </Paper>
            )}
          </FormControl>
          
          {/* Amount input */}
          <FormControl fullWidth sx={{ mb: 1 }} size="small">
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {t('transaction.amount')}
            </Typography>
            <TextField
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }}
            />
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, pb: 2, pt: 0.5, justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          className={styles.cancelButton}
          size="small"
          sx={{ mr: 1 }}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleTransfer}
          variant="contained"
          color="primary"
          disabled={!sourceWalletId || !selectedUser || !amount || transferring}
          startIcon={transferring ? <CircularProgress size={16} /> : <SendIcon />}
          className={`${styles.standardButton} ${styles.transferButton}`}
          size="small"
        >
          {transferring ? t('userTransfer.sending') : t('userTransfer.sendMoney')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserTransferForm;
