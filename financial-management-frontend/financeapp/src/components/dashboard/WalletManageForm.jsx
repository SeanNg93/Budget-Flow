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
  DialogContentText,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import styles from '../../styles/walletManage.module.css';

const WalletManageForm = ({ open, handleClose, onWalletUpdated, embedded = false }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit wallet states
  const [editMode, setEditMode] = useState(false);
  const [editWalletId, setEditWalletId] = useState(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [originalBalance, setOriginalBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [balanceError, setBalanceError] = useState('');
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState(null);
  const [deleteWalletName, setDeleteWalletName] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // New wallet states
  const [newWalletFormOpen, setNewWalletFormOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFinancialData();
    }
  }, [open]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch financial summary to get total balance
      const summaryResponse = await FinanceService.getFinancialSummary();
      const totalBalance = summaryResponse.data.totalBalance || 0;
      setTotalBalance(totalBalance);
      
      // Fetch wallets
      const response = await FinanceService.getAccounts();
      setWallets(response.data || []);
      
      // Calculate available balance
      calculateAvailableBalance(totalBalance, response.data || [], null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableBalance = (total, walletsList, excludeWalletId = null) => {
    const usedBalance = walletsList.reduce((sum, wallet) => {
      // Skip the wallet being edited when calculating used balance
      if (wallet.id !== excludeWalletId) {
        return sum + wallet.balance;
      }
      return sum;
    }, 0);
    
    const available = total - usedBalance;
    setAvailableBalance(available);
    return available;
  };

  const handleEditClick = (wallet) => {
    setEditMode(true);
    setEditWalletId(wallet.id);
    setEditWalletName(wallet.accountName);
    setEditWalletBalance(wallet.balance.toString());
    setOriginalBalance(wallet.balance);
    
    // Calculate available balance excluding this wallet
    calculateAvailableBalance(totalBalance, wallets, wallet.id);
    setBalanceError('');
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditWalletId(null);
    setEditWalletName('');
    setEditWalletBalance('');
    setOriginalBalance(0);
    setBalanceError('');
    
    // Reset available balance calculation
    calculateAvailableBalance(totalBalance, wallets, null);
  };

  const validateBalanceEdit = (value) => {
    // Check if value is a valid number
    if (!value || isNaN(value) || parseFloat(value) < 0) {
      setBalanceError('Valid balance is required');
      return false;
    }
    
    const newBalance = parseFloat(value);
    const maxAllowed = availableBalance + originalBalance;
    
    if (newBalance > maxAllowed) {
      setBalanceError(`Balance exceeds available amount (max: ${maxAllowed.toFixed(2)})`);
      return false;
    }
    
    setBalanceError('');
    return true;
  };

  const handleBalanceChange = (e) => {
    const value = e.target.value;
    setEditWalletBalance(value);
    validateBalanceEdit(value);
  };

  const handleEditSave = async () => {
    if (!editWalletName.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }

    if (!validateBalanceEdit(editWalletBalance)) {
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
        accountName: editWalletName,
        balance: parseFloat(editWalletBalance)
      };
      
      // Call API to update wallet
      await FinanceService.updateAccount(editWalletId, updatedWallet);
      
      // Reset edit mode
      setEditMode(false);
      setEditWalletId(null);
      setEditWalletName('');
      setEditWalletBalance('');
      setOriginalBalance(0);
      setBalanceError('');
      
      // Refresh wallets list
      fetchFinancialData();
      
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
      fetchFinancialData();
      
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
  
  const handleOpenNewWalletForm = () => {
    setNewWalletFormOpen(true);
  };
  
  const handleCloseNewWalletForm = () => {
    setNewWalletFormOpen(false);
  };
  
  const handleWalletAdded = () => {
    handleCloseNewWalletForm();
    fetchFinancialData();
    
    // Notify parent component
    if (onWalletUpdated) {
      onWalletUpdated();
    }
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Alert severity="info" sx={{ flexGrow: 1 }}>
          Total Balance: {totalBalance.toFixed(2)}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewWalletForm}
          sx={{ ml: 2 }}
          disabled={editMode || loading}
          className={styles.addWalletButton}
        >
          New Wallet
        </Button>
      </Box>
      
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
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      value={editWalletBalance}
                      onChange={handleBalanceChange}
                      placeholder="Balance"
                      className={styles.textField}
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            $
                          </InputAdornment>
                        ),
                      }}
                      error={!!balanceError}
                      helperText={balanceError || `Available: ${(availableBalance + originalBalance).toFixed(2)}`}
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={handleEditSave}
                      disabled={loading || !!balanceError}
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
      
      {/* New Wallet Form Dialog */}
      <Dialog
        open={newWalletFormOpen}
        onClose={handleCloseNewWalletForm}
        maxWidth="sm"
        PaperProps={{
          className: styles.walletFormDialog
        }}
      >
        <DialogTitle>Add New Wallet</DialogTitle>
        <DialogContent>
          <WalletForm
            open={true}
            handleClose={handleCloseNewWalletForm}
            onWalletAdded={handleWalletAdded}
            embedded={true}
          />
        </DialogContent>
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