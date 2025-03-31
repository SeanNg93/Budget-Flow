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
      errors.currentPassword = t('validation.required', { field: t('settings.currentPassword') });
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = t('validation.required', { field: t('settings.newPassword') });
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = t('validation.minLength', { field: t('settings.newPassword'), length: 8 });
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = t('validation.required', { field: t('settings.confirmPassword') });
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = t('validation.passwordMatch');
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
      
      toast.success(t('settings.passwordChangedSuccess'), {
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
          currentPassword: t('settings.currentPasswordIncorrect')
        });
      } else {
        toast.error(t('settings.passwordChangeError'), {
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
      toast.error(t('settings.deleteConfirmRequired'), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      await FinanceService.deleteUserAccount();
      
      toast.success(t('settings.deleteAccountSuccess'), {
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
      toast.error(t('settings.deleteAccountError'), {
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
      toast.success(t('settings.resetDataSuccess'), {
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
      toast.error(t('settings.resetDataError'), {
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
              {t('settings.title')}
            </Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={handleClose} 
              aria-label={t('common.close')}
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
                {t('settings.resetSuccess')}
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
                      secondary={t('settings.changePasswordDesc')} 
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
                      secondary={t('settings.resetToDefaultDesc')} 
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
                      secondary={t('settings.deleteAccountDesc')} 
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
              {t('settings.confirmReset')}
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
              <ListItemText primary={t('settings.resetWarning1')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.resetWarning2')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.resetWarning3')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.resetWarning4')} />
            </ListItem>
          </List>
          
          <Alert severity="warning" className={styles.warningAlert}>
            {t('settings.resetWarningAlert')}
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
            {isResetting ? t('settings.resetting') : t('settings.resetData')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Password Change Dialog */}
      <Dialog
        open={passwordChangeOpen}
        onClose={handleClosePasswordChange}
        fullWidth
        maxWidth="sm"
        TransitionComponent={SlideTransition}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClosePasswordChange}
              aria-label={t('common.back')}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h6">
              {t('settings.changePassword')}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal" error={!!passwordErrors.currentPassword}>
              <TextField
                name="currentPassword"
                label={t('settings.currentPassword')}
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                error={!!passwordErrors.currentPassword}
                disabled={isChangingPassword}
                fullWidth
              />
              {passwordErrors.currentPassword && (
                <FormHelperText>{passwordErrors.currentPassword}</FormHelperText>
              )}
            </FormControl>
            
            <FormControl fullWidth margin="normal" error={!!passwordErrors.newPassword}>
              <TextField
                name="newPassword"
                label={t('settings.newPassword')}
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                error={!!passwordErrors.newPassword}
                disabled={isChangingPassword}
                fullWidth
              />
              {passwordErrors.newPassword && (
                <FormHelperText>{passwordErrors.newPassword}</FormHelperText>
              )}
            </FormControl>
            
            <FormControl fullWidth margin="normal" error={!!passwordErrors.confirmPassword}>
              <TextField
                name="confirmPassword"
                label={t('settings.confirmPassword')}
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                variant="outlined"
                error={!!passwordErrors.confirmPassword}
                disabled={isChangingPassword}
                fullWidth
              />
              {passwordErrors.confirmPassword && (
                <FormHelperText>{passwordErrors.confirmPassword}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClosePasswordChange}
            color="primary"
            disabled={isChangingPassword}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleChangePassword}
            color="primary"
            variant="contained"
            disabled={isChangingPassword}
            startIcon={isChangingPassword ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isChangingPassword ? t('settings.changing') : t('settings.changePassword')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog
        open={deleteAccountOpen}
        onClose={handleCloseDeleteAccount}
        fullWidth
        maxWidth="sm"
        TransitionComponent={SlideTransition}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#ffeeee' }}>
          <Box display="flex" alignItems="center">
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseDeleteAccount}
              aria-label={t('common.back')}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h6" color="error">
              {t('settings.deleteAccount')}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('settings.deleteAccountWarning')}
          </Alert>
          
          <Typography variant="body1" paragraph>
            {t('settings.deleteAccountConfirmMessage')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.typeToConfirm', { text: 'DELETE' })}
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder="DELETE"
            error={confirmDeleteText !== '' && confirmDeleteText !== 'DELETE'}
            disabled={isDeletingAccount}
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
            {isDeletingAccount ? t('settings.deleting') : t('settings.deleteAccount')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPanel; 