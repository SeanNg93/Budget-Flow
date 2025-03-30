import React, { useState, useEffect, useRef } from 'react';
import FinanceService from '../../services/FinanceService';
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
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';

// Create transition components with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UserTransferForm = ({ open, handleClose, onTransferCompleted, defaultSourceWallet = null }) => {
  const { t, i18n } = useTranslation();
  
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
      setError(t('wallets.errorLoadingWallets'));
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
      setError(t('wallets.errorSearchingUsers'));
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
      setError(t('transactions.selectSourceWallet'));
      return;
    }
    
    if (!selectedUser) {
      setError(t('transactions.selectRecipient'));
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError(t('validation.invalidAmount'));
      return;
    }
    
    // Check if source wallet has enough balance
    const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
    if (!sourceWallet || parseFloat(amount) > sourceWallet.balance) {
      setError(t('transactions.insufficientFunds', { 
        wallet: sourceWallet?.accountName,
        balance: formatCurrency(sourceWallet?.balance, i18n.language)
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
      setError(error.response?.data?.error || t('transactions.errorTransferringFunds'));
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
            {t('transactions.transferMoney')}
          </Typography>
          <IconButton 
            aria-label={t('common.close')} 
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
        {error && (
          <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
            <Alert 
              severity="error" 
              className={styles.alert}
              sx={{ mb: 2, mt: 1 }}
              onClose={() => setError('')}
              ref={errorAlertRef}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {success && (
          <Fade in={success} timeout={300} nodeRef={successAlertRef}>
            <Alert 
              severity="success" 
              className={styles.alert}
              sx={{ mb: 2, mt: 1 }}
              ref={successAlertRef}
            >
              {t('transactions.transferSuccess', { recipient: selectedUser?.username })}
            </Alert>
          </Fade>
        )}
        
        <Box className={styles.formContainer}>
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('transactions.from')}
            </Typography>
            <Select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              displayEmpty
              variant="outlined"
              disabled={transferring}
              className={styles.formSelect}
            >
              <MenuItem value="" disabled>
                {t('transactions.selectWallet')}
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography>{wallet.accountName}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: '500' }}>
                      {formatCurrency(wallet.balance, i18n.language)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('transactions.to')}
            </Typography>
            
            <TextField
              fullWidth
              placeholder={t('wallets.searchUsersPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              disabled={transferring}
              className={styles.formInput}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: selectedUser && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={handleReset}
                      disabled={transferring}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {searching && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {searchResults.length > 0 && !selectedUser && (
              <Paper className={styles.searchResults} elevation={3}>
                <List sx={{ maxHeight: '200px', overflow: 'auto' }}>
                  {searchResults.map((user) => (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        button 
                        onClick={() => handleSelectUser(user)}
                        className={styles.userItem}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={user.profilePicture || ''}
                            alt={user.username}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.username} 
                          secondary={user.fullName || t('common.user')} 
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
            
            {selectedUser && (
              <Box sx={{ mt: 1 }}>
                <Paper className={styles.selectedUserPaper} elevation={1}>
                  <Box className={styles.selectedUser}>
                    <Avatar 
                      src={selectedUser.profilePicture || ''}
                      alt={selectedUser.username}
                    >
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1">{selectedUser.username}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedUser.fullName || t('common.user')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('transactions.amount')}
            </Typography>
            <TextField
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              variant="outlined"
              fullWidth
              disabled={transferring}
              className={styles.formInput}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <Button 
          onClick={handleClose}
          disabled={transferring}
          className={styles.cancelButton}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          className={styles.submitButton}
          disabled={!selectedUser || !amount || transferring || !sourceWalletId || success}
          startIcon={transferring ? <CircularProgress size={20} /> : <SendIcon />}
          onClick={handleTransfer}
        >
          {transferring ? t('transactions.transferring') : t('transactions.transfer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserTransferForm;
