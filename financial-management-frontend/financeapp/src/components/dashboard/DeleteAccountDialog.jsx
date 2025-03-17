import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography, 
    TextField, 
    Button, 
    Box, 
    CircularProgress,
    Alert
} from '@mui/material';
import styles from '../../styles/delete-account.module.css';

export default function DeleteAccountDialog({ open, handleClose }) {
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!password.trim()) {
            setError("Please enter your password to confirm.");
            return;
        }

        const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (!confirmed) return;

        setIsLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                setError("Your session has expired. Please log in again.");
                navigate('/login');
                return;
            }

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

            if (response.status === 403) {
                throw new Error('Access denied. Please log in again.');
            }

            const data = await response.json();

            if (data.success === true || data.success === "true") {
                alert("Account deleted successfully!");
                localStorage.clear();
                navigate('/register');
            } else {
                setError(data.message || "An error occurred.");
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('log in again')) {
                localStorage.clear();
                navigate('/login');
            } else {
                setError(error.message || "An error occurred, please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setPassword('');
        setError('');
        handleClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                className: styles.deleteAccountDialog
            }}
        >
            <DialogTitle className={styles.title}>
                Delete Account
            </DialogTitle>
            
            <DialogContent>
                <Typography variant="body1" color="error" className={styles.warning}>
                    This action will delete all your related information and cannot be undone.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ my: 3 }}>
                    <TextField
                        type="password"
                        label="Enter your password to confirm"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                    />
                </Box>
            </DialogContent>

            <DialogActions className={styles.buttonGroup}>
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className={styles.cancelButton}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    className={styles.deleteButton}
                >
                    {isLoading ? 'Processing...' : 'Delete My Account'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 