import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    Box, 
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import styles from '../styles/delete-account.module.css';
import { useTranslation } from 'react-i18next';

export default function DeleteAccount() {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleDeleteRequest = () => {
        if (!password.trim()) {
            setError(t('settings.errors.passwordRequired', 'Please enter your password to confirm.'));
            return;
        }
        
        // Open the confirmation dialog instead of using window.confirm
        setConfirmDialogOpen(true);
    };
    
    const handleConfirmCancel = () => {
        setConfirmDialogOpen(false);
    };

    const handleDelete = async () => {
        setConfirmDialogOpen(false);
        setIsLoading(true);
        setError('');
        
        try {
            // Get token from localStorage and verify
            const token = localStorage.getItem('userToken');
            if (!token) {
                setError(t('auth.errors.sessionExpired', 'Your session has expired. Please log in again.'));
                navigate('/login');
                return;
            }

            console.log('Token being used:', token); // Debug log

            // Use fetch instead of axios
            const response = await fetch(
                `http://localhost:8080/api/user/delete-account?password=${encodeURIComponent(password)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            // Check status code
            if (response.status === 403) {
                throw new Error(t('auth.errors.accessDenied', 'Access denied. Please log in again.'));
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success === true || data.success === "true") {
                // Show success dialog instead of alert
                setSuccessMessage(data.message || t('settings.accountMarkedForDeletion', 'Account marked for deletion. You have 30 minutes to log back in if you change your mind.'));
                setSuccessDialogOpen(true);
            } else {
                setError(data.message || t('common.error', 'An error occurred.'));
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('log in again')) {
                localStorage.clear();
                navigate('/login');
            } else {
                setError(error.message || t('common.errorTryAgain', 'An error occurred, please try again later.'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessDialogOpen(false);
        localStorage.clear();
        navigate('/login');
    };

    return (
        <>
            <Container maxWidth="sm" className={styles.container}>
                <Paper elevation={3} className={styles.deleteAccountForm}>
                    <Typography variant="h4" component="h2" className={styles.title}>
                        {t('settings.deleteAccount', 'Delete Account')}
                    </Typography>
                    <Typography variant="body1" color="error" className={styles.warning}>
                        {t('settings.deleteAccountWarning', 'This action will mark your account for deletion. After 30 minutes, your account and all related information will be permanently deleted.')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                        {t('settings.deleteCancelInfo', 'If you change your mind, you can cancel the deletion by logging back in within the 30-minute period.')}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ my: 3 }}>
                        <TextField
                            type="password"
                            label={t('settings.enterPasswordToConfirm', 'Enter your password to confirm')}
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                        />
                    </Box>

                    <Box className={styles.buttonGroup}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard')}
                            disabled={isLoading}
                            className={styles.cancelButton}
                        >
                            {t('common.back', 'Back')}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteRequest}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} /> : null}
                            className={styles.deleteButton}
                        >
                            {isLoading ? t('common.processing', 'Processing...') : t('settings.deleteMyAccount', 'Delete My Account')}
                        </Button>
                    </Box>
                </Paper>
            </Container>
            
            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleConfirmCancel}
                maxWidth="sm"
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                        padding: '8px'
                    }
                }}
            >
                <DialogTitle>
                    {t('settings.confirmAccountDeletion', 'Confirm Account Deletion')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {t('settings.deleteConfirmMessage', 'Are you sure you want to delete your account? Your account will be marked for deletion and will be permanently deleted after 30 minutes. You can cancel this by logging back in within the 30-minute period.')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="outlined" 
                        onClick={handleConfirmCancel}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={handleDelete}
                        autoFocus
                    >
                        {t('settings.confirmDeleteAccount', 'Yes, Delete My Account')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog
                open={successDialogOpen}
                onClose={handleSuccessClose}
                maxWidth="sm"
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                        padding: '16px'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon color="success" />
                    <span>{t('settings.accountDeletionRequested', 'Account Deletion Requested')}</span>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        {successMessage}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSuccessClose}
                        autoFocus
                    >
                        {t('common.ok', 'OK')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 