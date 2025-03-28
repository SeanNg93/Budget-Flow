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
import { useTranslation } from 'react-i18next';

// Slide transition for dialog
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SettingsPanel = ({ open, handleClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      errors.currentPassword = t('settings.passwordErrors.currentRequired');
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = t('settings.passwordErrors.newRequired');
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = t('settings.passwordErrors.minLength');
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = t('settings.passwordErrors.confirmRequired');
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = t('settings.passwordErrors.noMatch');
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
      
      toast.success(t('settings.toasts.passwordSuccess'), {
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
          currentPassword: t('settings.passwordErrors.currentIncorrect')
        });
      } else {
        toast.error(t('settings.toasts.passwordError'), {
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
      toast.error(t('settings.toasts.deleteConfirmError'), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      await FinanceService.deleteUserAccount();
      
      toast.success(t('settings.toasts.accountDeleted'), {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Clear user data, token, etc.
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeletingAccount(false);
      handleCloseDeleteAccount();
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
      toast.success(t('settings.toasts.resetSuccess', 'All financial data has been reset to default'), {
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
      toast.error(t('settings.toasts.resetError', 'Failed to reset data. Please try again later.'), {
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
              {t('settings.settingsTitle')}
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
                {t('settings.resetSuccessMessage')}
              </Alert>
            </Box>
          ) : (
            <>
              {/* Password Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle}>
                {t('settings.passwordManagement')}
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
                      primary={t('settings.changePassword')} 
                      secondary={t('settings.updatePassword')} 
                      primaryTypographyProps={{ className: styles.settingOptionText }}
                      secondaryTypographyProps={{ className: styles.settingOptionDescription }}
                    />
                    <ArrowRightIcon color="action" fontSize="small" />
                  </ListItem>
                </List>
              </Paper>
              
              {/* Data Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle} sx={{ mt: 3 }}>
                {t('settings.dataManagement')}
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
                      primary={t('settings.resetToDefault')} 
                      secondary={t('settings.resetDescription')} 
                      primaryTypographyProps={{ className: styles.resetOptionText }}
                      secondaryTypographyProps={{ className: styles.resetOptionDescription }}
                    />
                  </ListItem>
                </List>
              </Paper>
              
              {/* Account Management Section */}
              <Typography variant="subtitle1" className={styles.sectionTitle} sx={{ mt: 3 }}>
                {t('settings.accountManagement')}
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
                      primary={t('settings.deleteAccount')} 
                      secondary={t('settings.deleteAccountDescription')} 
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
              {t('settings.resetConfirmTitle')}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.resetConfirmContent}>
          <Typography variant="body1" className={styles.resetConfirmMessage}>
            {t('settings.resetConfirmMessage')}
          </Typography>
          
          <List className={styles.resetList}>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.allTransactions')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.allWallets')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.allCategories')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.allBudgets')} />
            </ListItem>
          </List>
          
          <Alert severity="warning" className={styles.warningAlert}>
            {t('settings.cannotUndo')}
          </Alert>
        </DialogContent>
        
        <DialogActions className={styles.resetConfirmActions}>
          <Button 
            onClick={handleCloseResetConfirm} 
            color="primary"
            className={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleResetData} 
            color="error" 
            variant="contained"
            disabled={isResetting}
            startIcon={isResetting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            className={styles.resetButton}
          >
            {isResetting ? t('settings.resetting') : t('settings.resetAllData')}
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
              {t('settings.changePassword')}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.passwordChangeContent}>
          <FormControl fullWidth margin="normal" error={!!passwordErrors.currentPassword}>
            <TextField
              name="currentPassword"
              label={t('settings.currentPassword')}
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
              label={t('settings.newPassword')}
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
              label={t('settings.confirmNewPassword')}
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
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary" 
            variant="contained"
            disabled={isChangingPassword}
            startIcon={isChangingPassword ? <CircularProgress size={18} color="inherit" /> : null}
            className={styles.saveButton}
          >
            {isChangingPassword ? t('settings.updating') : t('settings.updatePassword')}
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
              {t('settings.deleteAccount')}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.deleteAccountConfirmContent}>
          <Typography variant="body1" className={styles.deleteAccountConfirmMessage}>
            {t('settings.deleteAccountConfirm')}
          </Typography>
          
          <Alert severity="error" className={styles.deleteAccountWarningAlert} sx={{ mt: 2, mb: 2 }}>
            {t('settings.deleteAccountWarning')}
          </Alert>
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            {t('settings.typeDeleteToConfirm')}
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder={t('settings.typeDeletePlaceholder')}
            error={confirmDeleteText !== '' && confirmDeleteText !== 'DELETE'}
            helperText={confirmDeleteText !== '' && confirmDeleteText !== 'DELETE' ? t('settings.incorrectDeleteConfirmation') : ''}
          />
        </DialogContent>
        
        <DialogActions className={styles.deleteAccountConfirmActions}>
          <Button 
            onClick={handleCloseDeleteAccount} 
            color="primary"
            className={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            variant="contained"
            disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
            startIcon={isDeletingAccount ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            className={styles.deleteButton}
          >
            {isDeletingAccount ? t('settings.deleting') : t('settings.deleteMyAccount')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPanel; 