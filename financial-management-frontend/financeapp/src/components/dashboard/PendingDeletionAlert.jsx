import { useState, useEffect } from 'react';
import { Alert, Snackbar, Button } from '@mui/material';

export default function PendingDeletionAlert() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkDeletionStatus = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) return;

                const response = await fetch('http://localhost:8080/api/user/deletion-status', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isPendingDeletion) {
                        setOpen(true);
                    }
                }
            } catch (error) {
                console.error('Error checking deletion status:', error);
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
                        onClick={() => {
                            // User has already logged in, which automatically cancels the deletion
                            // Just close the alert
                            handleClose();
                        }}
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