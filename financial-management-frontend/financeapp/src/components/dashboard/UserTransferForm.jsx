import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  InputAdornment,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon,
  Person as PersonIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

const UserTransferForm = ({ open, handleClose, onTransferCompleted }) => {
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
  
  // Load wallets when component mounts
  useEffect(() => {
    if (open) {
      loadWallets();
    }
  }, [open]);
  
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
      
      // Set first wallet as default if available
      if (response.data.length > 0) {
        setSourceWalletId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
      setError('Failed to load wallets. Please try again.');
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
      setError('Failed to search users. Please try again.');
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
      setError('Please select a source wallet');
      return;
    }
    
    if (!selectedUser) {
      setError('Please select a recipient');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Check if source wallet has enough balance
    const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
    if (!sourceWallet || parseFloat(amount) > sourceWallet.balance) {
      setError(`Insufficient funds in ${sourceWallet?.accountName}. Available: $${sourceWallet?.balance.toFixed(2)}`);
      return;
    }
    
    setError('');
    setTransferring(true);
    setSuccess(false);
    
    try {
      const result = await FinanceService.transferToUser(
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
      setError(error.response?.data?.error || 'Failed to transfer funds. Please try again.');
    } finally {
      setTransferring(false);
    }
  };
  
  const handleReset = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setAmount('');
    setError('');
    setSuccess(false);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '16px',
          padding: '8px'
        }
      }}
    >
      <DialogTitle 
        style={{ 
          fontWeight: 'bold', 
          fontSize: '1.5rem',
          textAlign: 'center',
          paddingBottom: 0
        }}
      >
        Transfer Money to Other User
      </DialogTitle>
      
      <DialogContent>
        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center" 
          style={{ marginBottom: '24px' }}
        >
          Transfer money from your wallet to another user's account.
          The recipient will receive the funds in their total balance.
        </Typography>
        
        {/* Error message */}
        {error && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            style={{ marginBottom: '16px' }}
          >
            {error}
          </Alert>
        )}
        
        {/* Success message */}
        {success && (
          <Alert 
            severity="success" 
            style={{ marginBottom: '16px' }}
          >
            Transfer completed successfully!
          </Alert>
        )}
        
        <Box sx={{ my: 3 }}>
          {/* Source wallet selector */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              From
            </Typography>
            <Select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <MenuItem value="" disabled>
                Select Wallet
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} (${wallet.balance.toFixed(2)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* User search */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              To
            </Typography>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for user by name or username"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }}
            />
            
            {/* Search results */}
            {searchResults.length > 0 && !selectedUser && (
              <Paper 
                elevation={3} 
                sx={{ 
                  mt: 1, 
                  maxHeight: '200px', 
                  overflow: 'auto',
                  borderRadius: '12px'
                }}
              >
                <List dense>
                  {searchResults.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        button 
                        onClick={() => handleSelectUser(user)}
                        sx={{ 
                          py: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={user.profilePicture} 
                            alt={user.username}
                            sx={{ backgroundColor: 'primary.main' }}
                          >
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.fullName || user.username} 
                          secondary={user.fullName ? `@${user.username}` : ''}
                        />
                      </ListItem>
                      {index < searchResults.length - 1 && <Divider component="li" />}
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
                  mt: 1, 
                  p: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }}
              >
                <Avatar 
                  src={selectedUser.profilePicture} 
                  alt={selectedUser.username}
                  sx={{ 
                    backgroundColor: 'primary.main',
                    mr: 1
                  }}
                >
                  {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : selectedUser.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {selectedUser.fullName || selectedUser.username}
                  </Typography>
                  {selectedUser.fullName && (
                    <Typography variant="body2" color="text.secondary">
                      @{selectedUser.username}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Button 
                    size="small" 
                    onClick={handleReset}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    Change
                  </Button>
                </Box>
              </Paper>
            )}
          </FormControl>
          
          {/* Amount input */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Amount
            </Typography>
            <TextField
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }}
            />
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            borderRadius: '12px',
            minWidth: '100px'
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleTransfer}
          variant="contained"
          color="primary"
          disabled={!sourceWalletId || !selectedUser || !amount || transferring}
          startIcon={transferring ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ 
            borderRadius: '12px',
            minWidth: '100px'
          }}
        >
          {transferring ? 'Sending...' : 'Send Money'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserTransferForm; 