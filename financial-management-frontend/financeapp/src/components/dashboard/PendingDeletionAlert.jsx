import { useState, useEffect } from 'react';
import { Alert, Snackbar, Button } from '@mui/material';

export default function PendingDeletionAlert() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkDeletionStatus = async () => {
            try {
                const token = localStorage.getItem('userToken');
                // If no token exists, user is not logged in, so no need to check deletion status
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:8080/api/user/deletion-status', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // If we get a 403 error, just silently fail - the user might not have permission
                // or the endpoint might not be properly configured yet
                if (response.status === 403) {
                    console.debug('Permission denied for deletion status check');
                    setLoading(false);
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.isPendingDeletion) {
                        setOpen(true);
                    }
                }
            } catch (error) {
                // Silently handle errors to avoid console spam
                console.debug('Error checking deletion status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkDeletionStatus();
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    if (loading || !open) return null;

    return (
        <Snackbar
            open={open}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert 
                severity="warning" 
                variant="filled"
                onClose={handleClose}
                action={
                    <Button 
                        color="inherit" 
                        size="small" 
                        onClick={handleClose}
                    >
                        Dismiss
                    </Button>
                }
            >
                Your account deletion has been cancelled because you logged back in.
            </Alert>
        </Snackbar>
    );
} 