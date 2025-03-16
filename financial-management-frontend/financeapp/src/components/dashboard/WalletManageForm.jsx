import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogTitle,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  DialogActions,
  DialogContentText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/walletManage.module.css';

const WalletManageForm = ({ open, handleClose, onWalletUpdated, embedded = false }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit wallet states
  const [editMode, setEditMode] = useState(false);
  const [editWalletId, setEditWalletId] = useState(null);
  const [editWalletName, setEditWalletName] = useState('');
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState(null);
  const [deleteWalletName, setDeleteWalletName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWallets();
    }
  }, [open]);

  const fetchWallets = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await FinanceService.getAccounts();
      setWallets(response.data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (wallet) => {
    setEditMode(true);
    setEditWalletId(wallet.id);
    setEditWalletName(wallet.accountName);
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditWalletId(null);
    setEditWalletName('');
  };

  const handleEditSave = async () => {
    if (!editWalletName.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Find the wallet to update
      const walletToUpdate = wallets.find(w => w.id === editWalletId);
      
      if (!walletToUpdate) {
        throw new Error('Wallet not found');
      }
      
      // Create updated wallet data
      const updatedWallet = {
        ...walletToUpdate,
        accountName: editWalletName
      };
      
      // Call API to update wallet
      await FinanceService.updateAccount(editWalletId, updatedWallet);
      
      // Reset edit mode
      setEditMode(false);
      setEditWalletId(null);
      setEditWalletName('');
      
      // Refresh wallets list
      fetchWallets();
      
      // Notify parent component
      if (onWalletUpdated) {
        onWalletUpdated();
      }
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError(err.response?.data?.message || 'Failed to update wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (wallet) => {
    setDeleteWalletId(wallet.id);
    setDeleteWalletName(wallet.accountName);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteWalletId(null);
    setDeleteWalletName('');
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError('');
    
    try {
      // Call API to delete wallet
      await FinanceService.deleteAccount(deleteWalletId);
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setDeleteWalletId(null);
      setDeleteWalletName('');
      
      // Refresh wallets list
      fetchWallets();
      
      // Notify parent component
      if (onWalletUpdated) {
        onWalletUpdated();
      }
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError(err.response?.data?.message || 'Failed to delete wallet. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box className={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      ) : wallets.length === 0 ? (
        <Typography variant="body1" className={styles.emptyMessage}>
          No wallets found. Create a wallet to get started.
        </Typography>
      ) : (
        <List className={styles.walletList}>
          {wallets.map((wallet, index) => (
            <React.Fragment key={wallet.id}>
              <ListItem 
                className={`${styles.walletItem} ${editWalletId === wallet.id ? styles.walletItemEditing : ''}`}
              >
                {editMode && editWalletId === wallet.id ? (
                  <Box className={styles.editContainer}>
                    <TextField
                      fullWidth
                      size="small"
                      value={editWalletName}
                      onChange={(e) => setEditWalletName(e.target.value)}
                      placeholder="Wallet name"
                      className={styles.textField}
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={handleEditSave}
                      disabled={loading}
                      className={`${styles.actionButton} ${styles.saveButton}`}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      size="small"
                      onClick={handleEditCancel}
                      className={styles.actionButton}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Typography variant="body1" className={styles.walletName}>
                          {wallet.accountName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" className={styles.walletDetails}>
                          {wallet.accountType} • ${wallet.balance.toFixed(2)}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditClick(wallet)}
                        disabled={editMode}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteClick(wallet)}
                        disabled={editMode}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
              {index < wallets.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          className: styles.confirmDialog
        }}
      >
        <DialogTitle className={styles.confirmTitle}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the wallet "{deleteWalletName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions className={styles.confirmActions}>
          <Button 
            onClick={handleDeleteCancel} 
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : null}
            className={styles.deleteButton}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // If embedded, just return the form content
  if (embedded) {
    return formContent;
  }

  // Otherwise, wrap in a Dialog
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>Manage Wallets</Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default WalletManageForm; 