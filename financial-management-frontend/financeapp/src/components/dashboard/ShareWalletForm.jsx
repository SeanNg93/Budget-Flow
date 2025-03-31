import React, { useState, useEffect, useRef } from 'react';
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
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import SearchIcon from '@mui/icons-material/Search';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/shareWalletForm.module.css';
import { useTranslation } from 'react-i18next';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ShareWalletForm = ({ open, handleClose, wallet, onWalletShared }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sharing, setSharing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Add refs for transitions
  const dialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const successAlertRef = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Modified close handler function with animation support
  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleClose();
    }, 400); // Match the transition timeout
  };

  const searchUsers = async (query) => {
    setLoading(true);
    setError('');

    try {
      const response = await FinanceService.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(t('wallets.errorSearchingUsers'));
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
      setError(t('wallets.selectUserToShare'));
      return;
    }

    setSharing(true);
    setError('');
    setSuccess('');

    try {
      const response = await FinanceService.shareWallet(wallet.id, selectedUser.id);
      
      setSuccess(t('wallets.sharedSuccessfully', { username: selectedUser.username }));
      
      // Reset form
      setTimeout(() => {
        setSearchQuery('');
        setSelectedUser(null);
        setSuccess('');
        
        if (onWalletShared) {
          onWalletShared();
        }
        
        closeWithAnimation();
      }, 2000);
    } catch (err) {
      console.error('Error sharing wallet:', err);
      setError(err.response?.data?.error || t('wallets.errorSharingWallet'));
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
      open={open && !isClosing} 
      onClose={closeWithAnimation}
      maxWidth="sm"
      fullWidth
      classes={{ paper: styles.dialogPaper }}
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
            {t('wallets.shareWalletTitle', { name: wallet?.accountName })}
          </Typography>
          <IconButton aria-label={t('common.close')} onClick={closeWithAnimation} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {error && (
          <Fade in={!!error} timeout={300} nodeRef={errorAlertRef}>
            <Alert 
              severity="error" 
              className={styles.alert}
              onClose={() => setError('')}
              ref={errorAlertRef}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {success && (
          <Fade in={!!success} timeout={300} nodeRef={successAlertRef}>
            <Alert 
              severity="success" 
              className={styles.alert}
              ref={successAlertRef}
            >
              {success}
            </Alert>
          </Fade>
        )}
        
        <Box className={styles.formContainer}>
          <Typography variant="body2" className={styles.description}>
            {t('wallets.shareWalletDescription')}
          </Typography>
          
          <Box className={styles.searchContainer}>
            <TextField
              fullWidth
              label={t('wallets.searchUsersLabel')}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('wallets.searchUsersPlaceholder')}
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
                        secondary={user.fullName || t('common.user')} 
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
                  {t('wallets.shareWith')}:
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
                    <Typography variant="caption">{selectedUser.fullName || t('common.user')}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <Button 
          onClick={closeWithAnimation} 
          className={styles.cancelButton}
          disabled={sharing}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleShare}
          disabled={!selectedUser || sharing}
          startIcon={sharing ? <CircularProgress size={20} /> : <ShareIcon />}
          className={styles.shareButton}
        >
          {sharing ? t('wallets.sharing') : t('wallets.shareWallet')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareWalletForm; 