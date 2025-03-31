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
  IconButton,
  Card,
  CardContent,
  Stack,
  Chip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon,
  Close as CloseIcon,
  SwapHoriz as SwapIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  CurrencyExchange as CurrencyIcon
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
      const transferAmount = parseFloat(amount);
      const response = await FinanceService.transferToUser(
        parseInt(sourceWalletId),
        selectedUser.id.toString(),
        transferAmount
      );
      
      // Update local wallet state immediately - decrease the source wallet balance
      if (sourceWallet) {
        const updatedSourceWallet = {
          ...sourceWallet,
          balance: sourceWallet.balance - transferAmount
        };
        
        // Update the wallets state
        setWallets(prevWallets => 
          prevWallets.map(wallet => 
            wallet.id.toString() === sourceWalletId ? updatedSourceWallet : wallet
          )
        );
        
        // Update the selected wallet state as well
        setSourceWalletId(sourceWalletId);
        
        // Force a global refresh of financial data
        if (window.dispatchEvent) {
          // Create and dispatch a custom event that dashboard components can listen for
          const updateEvent = new CustomEvent('wallet-balance-updated', { 
            detail: { 
              walletId: sourceWalletId,
              newBalance: sourceWallet.balance - transferAmount,
              timestamp: new Date().getTime()
            } 
          });
          window.dispatchEvent(updateEvent);
        }
      }
      
      // Show success message and reset form
      setSuccess(true);
      setAmount('');
      setSelectedUser(null);
      setSearchQuery('');
      
      // Notify parent component with refresh flag and updated wallet data
      if (onTransferCompleted) {
        onTransferCompleted(true, {
          walletId: sourceWalletId,
          newBalance: sourceWallet.balance - transferAmount
        });
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

  // Find the selected wallet
  const selectedWallet = wallets.find(w => w.id.toString() === sourceWalletId);
  
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
      <DialogTitle 
        className={styles.dialogTitle}
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          pb: 1
        }}
      >
        <Box className={styles.headerContainer}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SwapIcon sx={{ mr: 1, color: '#007aff' }} />
            <Typography variant="h6" className={styles.title}>
              {t('transactions.transferMoney')}
            </Typography>
          </Box>
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
      
      <DialogContent className={styles.dialogContent} sx={{ px: 3, py: 2 }}>
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
        
        <Stack spacing={3.5}>
          {/* From Section */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WalletIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('transactions.from')}
                </Typography>
              </Box>
              
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  value={sourceWalletId}
                  onChange={(e) => setSourceWalletId(e.target.value)}
                  displayEmpty
                  disabled={transferring}
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    {t('transactions.selectWallet')}
                  </MenuItem>
                  {wallets.map((wallet) => (
                    <MenuItem key={wallet.id} value={wallet.id.toString()}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography>{wallet.accountName}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedWallet && (
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('transactions.availableBalance')}:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {formatCurrency(selectedWallet.balance, i18n.language)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* To Section */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('transactions.to')}
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                placeholder={t('wallets.searchUsersPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                disabled={transferring}
                size="small"
                sx={{ 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.15)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
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
                <Paper 
                  elevation={3} 
                  sx={{ 
                    mt: 1, 
                    borderRadius: 2, 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      borderRadius: '4px',
                    }
                  }}
                >
                  <List sx={{ p: 0 }}>
                    {searchResults.map((user) => (
                      <React.Fragment key={user.id}>
                        <ListItem 
                          button 
                          onClick={() => handleSelectUser(user)}
                          sx={{ 
                            py: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 122, 255, 0.08)'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              src={user.profilePicture || ''}
                              alt={user.username}
                              sx={{ bgcolor: 'primary.main' }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={user.username} 
                            secondary={user.fullName || t('common.user')}
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
              
              {selectedUser && (
                <Box sx={{ mt: 2 }}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2, 
                      bgcolor: 'rgba(0, 122, 255, 0.05)', 
                      borderColor: 'rgba(0, 122, 255, 0.3)'
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={selectedUser.profilePicture || ''}
                          alt={selectedUser.username}
                          sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                        >
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ ml: 1.5 }}>
                          <Typography variant="body1" fontWeight={600}>{selectedUser.username}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedUser.fullName || t('common.user')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Amount Section */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CurrencyIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t('transactions.amount')}
                </Typography>
              </Box>
              
              <TextField
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                variant="outlined"
                fullWidth
                disabled={transferring}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.15)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Button 
          onClick={handleClose}
          disabled={transferring}
          sx={{ 
            margin: '0 4px 0 0',
            color: '#666',
            textTransform: 'none',
            fontSize: '0.8rem',
            padding: '5px 12px',
            height: '36px',
            minWidth: '80px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedUser || !amount || transferring || !sourceWalletId || success}
          startIcon={transferring ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleTransfer}
          sx={{ 
            backgroundColor: '#007aff',
            color: 'white',
            borderRadius: '8px',
            padding: '6px 16px',
            fontWeight: '600',
            fontSize: '0.8rem',
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            height: '36px',
            transform: 'scale(0.98)',
            transformOrigin: 'right center',
            minWidth: '110px',
            '&:hover': {
              backgroundColor: '#0062cc',
              transform: 'scale(0.97)',
              boxShadow: '0 2px 4px rgba(0, 98, 204, 0.3)'
            },
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }}
        >
          {transferring ? t('transactions.transferring') : t('transactions.transfer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserTransferForm;
