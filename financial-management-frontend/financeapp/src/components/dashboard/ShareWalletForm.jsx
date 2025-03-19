import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import SearchIcon from '@mui/icons-material/Search';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/shareWalletForm.module.css';

const ShareWalletForm = ({ open, handleClose, wallet, onWalletShared }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    setLoading(true);
    setError('');

    try {
      const response = await FinanceService.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
  };

  const handleShare = async () => {
    if (!selectedUser) {
      setError('Please select a user to share with');
      return;
    }

    setSharing(true);
    setError('');
    setSuccess('');

    try {
      const response = await FinanceService.shareWallet(wallet.id, selectedUser.id);
      
      setSuccess(`Wallet shared successfully with ${selectedUser.username}`);
      
      // Reset form
      setTimeout(() => {
        setSearchQuery('');
        setSelectedUser(null);
        setSuccess('');
        
        if (onWalletShared) {
          onWalletShared();
        }
        
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error sharing wallet:', err);
      setError(err.response?.data?.error || 'Failed to share wallet. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (!event.target.value) {
      setSelectedUser(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      classes={{ paper: styles.dialogPaper }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>
            Share Wallet: {wallet?.accountName}
          </Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert 
            severity="error" 
            className={styles.alert}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            className={styles.alert}
          >
            {success}
          </Alert>
        )}
        
        <Box className={styles.formContainer}>
          <Typography variant="body2" className={styles.description}>
            Share your wallet with another user. They will be able to view and manage this wallet.
          </Typography>
          
          <Box className={styles.searchContainer}>
            <TextField
              fullWidth
              label="Search users by username"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Enter username"
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <SearchIcon className={styles.searchIcon} />,
                className: styles.searchInput
              }}
              disabled={sharing}
            />
            
            {loading && (
              <Box className={styles.loadingContainer}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {searchResults.length > 0 && !selectedUser && (
              <List className={styles.userList}>
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
                          className={styles.avatar}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.username} 
                        secondary={user.fullName || 'User'} 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            
            {selectedUser && (
              <Box className={styles.selectedUserContainer}>
                <Typography variant="subtitle1" className={styles.selectedUserLabel}>
                  Share with:
                </Typography>
                <Box className={styles.selectedUser}>
                  <Avatar 
                    src={selectedUser.profilePicture || ''}
                    alt={selectedUser.username}
                    className={styles.selectedAvatar}
                  >
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{selectedUser.username}</Typography>
                    <Typography variant="caption">{selectedUser.fullName || 'User'}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <Button 
          onClick={handleClose} 
          className={styles.cancelButton}
          disabled={sharing}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleShare}
          disabled={!selectedUser || sharing}
          startIcon={sharing ? <CircularProgress size={20} /> : <ShareIcon />}
          className={styles.shareButton}
        >
          {sharing ? 'Sharing...' : 'Share Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareWalletForm; 