import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper, 
  Switch, 
  Alert, 
  CircularProgress,
  Slide,
  IconButton,
  TextField,
  FormControl,
  FormHelperText
} from '@mui/material';
import { 
  RestartAlt as ResetIcon,
  DeleteForever as DeleteIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Password as PasswordIcon,
  AccountCircle as AccountIcon,
  KeyboardArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import styles from '../../styles/settings.module.css';
import FinanceService from '../../services/FinanceService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Slide transition for dialog
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SettingsPanel = ({ open, handleClose }) => {
  const navigate = useNavigate();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  // Password change states
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account states
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Function to handle opening reset confirmation dialog
  const handleOpenResetConfirm = () => {
    setResetConfirmOpen(true);
  };

  // Function to handle closing reset confirmation dialog
  const handleCloseResetConfirm = () => {
    setResetConfirmOpen(false);
  };
  
  // Functions for password change
  const handleOpenPasswordChange = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setPasswordChangeOpen(true);
  };
  
  const handleClosePasswordChange = () => {
    setPasswordChangeOpen(false);
  };
  
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  const handleChangePassword = async () => {
    // Validate form
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await FinanceService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      toast.success('Password changed successfully', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Close the password change dialog
      setPasswordChangeOpen(false);
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response && error.response.status === 401) {
        setPasswordErrors({
          currentPassword: 'Current password is incorrect'
        });
      } else {
        toast.error('Failed to change password. Please try again later.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Functions for delete account
  const handleOpenDeleteAccount = () => {
    setConfirmDeleteText('');
    setDeleteAccountOpen(true);
  };
  
  const handleCloseDeleteAccount = () => {
    setDeleteAccountOpen(false);
  };
  
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      await FinanceService.deleteUserAccount();
      
      toast.success('Your account has been deleted', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Clear user data and redirect to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      
      // Close dialogs
      setDeleteAccountOpen(false);
      handleClose();
      
      // Navigate to login page
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again later.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Function to reset all financial data
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      // Call the backend service to reset data
      await FinanceService.resetAllData();
      
      // Set reset complete and notify user
      setResetComplete(true);
      toast.success('All financial data has been reset to default', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Close the reset confirmation dialog
      setResetConfirmOpen(false);
      
      // Reset state after a delay to show success message
      setTimeout(() => {
        setResetComplete(false);
        // Refresh the page or reload data
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Failed to reset data. Please try again later.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        TransitionComponent={SlideTransition}
        PaperProps={{
          className: styles.dialogPaper
        }}
      >
        <DialogTitle className={styles.dialogTitle}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" component="div" className={styles.dialogTitleText}>
              Settings
            </Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={handleClose} 
              aria-label="close"
              className={styles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent className={styles.dialogContent}>
          {resetComplete ? (
            <Box className={styles.resetSuccessContainer}>
              <Alert severity="success" className={styles.resetSuccessAlert}>
                All financial data has been reset to default. The page will reload shortly.
              </Alert>
            </Box>
          ) : (
            <>
              {/* Password Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle}>
                Password Management
              </Typography>
              
              <Paper elevation={0} className={styles.settingsSection}>
                <List>
                  <ListItem 
                    button 
                    className={styles.settingOption}
                    onClick={handleOpenPasswordChange}
                  >
                    <ListItemIcon className={styles.settingIcon}>
                      <PasswordIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Change Password" 
                      secondary="Update your account password" 
                      primaryTypographyProps={{ className: styles.settingOptionText }}
                      secondaryTypographyProps={{ className: styles.settingOptionDescription }}
                    />
                    <ArrowRightIcon color="action" fontSize="small" />
                  </ListItem>
                </List>
              </Paper>
              
              {/* Data Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle} sx={{ mt: 3 }}>
                Data Management
              </Typography>
              
              <Paper elevation={0} className={styles.settingsSection}>
                <List>
                  <ListItem 
                    button 
                    className={styles.resetOption}
                    onClick={handleOpenResetConfirm}
                  >
                    <ListItemIcon className={styles.resetIcon}>
                      <ResetIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Reset to Default" 
                      secondary="Reset all financial data including transactions, wallets, categories, and settings to default values." 
                      primaryTypographyProps={{ className: styles.resetOptionText }}
                      secondaryTypographyProps={{ className: styles.resetOptionDescription }}
                    />
                  </ListItem>
                </List>
              </Paper>
              
              {/* Account Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle} sx={{ mt: 3 }}>
                Account Management
              </Typography>
              
              <Paper elevation={0} className={styles.settingsSection}>
                <List>
                  <ListItem 
                    button 
                    className={styles.deleteAccountOption}
                    onClick={handleOpenDeleteAccount}
                  >
                    <ListItemIcon className={styles.deleteAccountIcon}>
                      <DeleteIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Delete Account" 
                      secondary="Permanently delete your account and all associated data" 
                      primaryTypographyProps={{ className: styles.deleteAccountText }}
                      secondaryTypographyProps={{ className: styles.deleteAccountDescription }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetConfirmOpen}
        onClose={handleCloseResetConfirm}
        maxWidth="sm"
        PaperProps={{
          className: styles.resetConfirmPaper
        }}
      >
        <DialogTitle className={styles.resetConfirmTitle}>
          <Box display="flex" alignItems="center">
            <WarningIcon color="warning" className={styles.warningIcon} />
            <Typography variant="h6" className={styles.resetConfirmTitleText}>
              Reset All Financial Data
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.resetConfirmContent}>
          <Typography variant="body1" className={styles.resetConfirmMessage}>
            You are about to reset <strong>all financial data</strong> including:
          </Typography>
          
          <List className={styles.resetList}>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All transactions" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All wallets and accounts" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All categories" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All budget settings" />
            </ListItem>
          </List>
          
          <Alert severity="warning" className={styles.warningAlert}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
        </DialogContent>
        
        <DialogActions className={styles.resetConfirmActions}>
          <Button 
            onClick={handleCloseResetConfirm} 
            color="primary"
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetData} 
            color="error" 
            variant="contained"
            disabled={isResetting}
            startIcon={isResetting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            className={styles.resetButton}
          >
            {isResetting ? "Resetting..." : "Reset All Data"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Password Change Dialog */}
      <Dialog
        open={passwordChangeOpen}
        onClose={handleClosePasswordChange}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          className: styles.passwordChangePaper
        }}
      >
        <DialogTitle className={styles.passwordChangeTitle}>
          <Box display="flex" alignItems="center">
            <PasswordIcon className={styles.passwordIcon} />
            <Typography variant="h6" className={styles.passwordChangeTitleText}>
              Change Password
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.passwordChangeContent}>
          <FormControl fullWidth margin="normal" error={!!passwordErrors.currentPassword}>
            <TextField
              name="currentPassword"
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>
          
          <FormControl fullWidth margin="normal" error={!!passwordErrors.newPassword}>
            <TextField
              name="newPassword"
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword}
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>
          
          <FormControl fullWidth margin="normal" error={!!passwordErrors.confirmPassword}>
            <TextField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword}
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>
        </DialogContent>
        
        <DialogActions className={styles.passwordChangeActions}>
          <Button 
            onClick={handleClosePasswordChange} 
            color="primary"
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary" 
            variant="contained"
            disabled={isChangingPassword}
            startIcon={isChangingPassword ? <CircularProgress size={18} color="inherit" /> : null}
            className={styles.saveButton}
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog
        open={deleteAccountOpen}
        onClose={handleCloseDeleteAccount}
        maxWidth="sm"
        PaperProps={{
          className: styles.deleteAccountConfirmPaper
        }}
      >
        <DialogTitle className={styles.deleteAccountConfirmTitle}>
          <Box display="flex" alignItems="center">
            <WarningIcon color="warning" className={styles.warningIcon} />
            <Typography variant="h6" className={styles.deleteAccountConfirmTitleText}>
              Delete Account
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.deleteAccountConfirmContent}>
          <Typography variant="body1" className={styles.deleteAccountConfirmMessage}>
            You are about to <strong>permanently delete</strong> your account and all associated data. This action cannot be undone.
          </Typography>
          
          <Alert severity="error" className={styles.deleteAccountWarningAlert} sx={{ mt: 2, mb: 2 }}>
            All your personal information, financial data, and settings will be permanently removed from our servers.
          </Alert>
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            To confirm, please type <strong>DELETE</strong> in the field below:
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder="Type DELETE to confirm"
            error={confirmDeleteText !== '' && confirmDeleteText !== 'DELETE'}
            helperText={confirmDeleteText !== '' && confirmDeleteText !== 'DELETE' ? 'Please type DELETE to confirm' : ''}
          />
        </DialogContent>
        
        <DialogActions className={styles.deleteAccountConfirmActions}>
          <Button 
            onClick={handleCloseDeleteAccount} 
            color="primary"
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
            startIcon={isDeletingAccount ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            className={styles.deleteButton}
          >
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPanel; 