import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  Tooltip,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from '@mui/icons-material/Share';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import UserTransferForm from './UserTransferForm';
import ShareWalletForm from './ShareWalletForm';
import styles from '../../styles/walletManage.module.css';

// Create transition components with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Create a FadeTransition component with forwardRef
const FadeTransition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const WalletManageForm = ({ open, handleClose, onWalletUpdated, embedded = false, initialOpenTransfer = false }) => {
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
  
  // Transfer money states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferring, setTransferring] = useState(false);
  
  // Add state for the user transfer dialog
  const [userTransferDialogOpen, setUserTransferDialogOpen] = useState(false);
  
  // Add state for wallet menu
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState(null);
  const [selectedWalletForMenu, setSelectedWalletForMenu] = useState(null);
  
  // Add state for share wallet dialog
  const [shareWalletDialogOpen, setShareWalletDialogOpen] = useState(false);
  const [walletToShare, setWalletToShare] = useState(null);

  // Add refs for transitions
  const newWalletDialogRef = useRef(null);
  const transferDialogRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const transferErrorRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchFinancialData();
    }
  }, [open]);
  
  // Open transfer dialog automatically if initialOpenTransfer is true
  useEffect(() => {
    if (open && initialOpenTransfer && wallets.length > 0) {
      handleOpenTransferDialog();
    }
  }, [open, initialOpenTransfer, wallets.length]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First get the total balance from the wallet API to ensure we have the latest data
      const balancesResponse = await FinanceService.getTotalBalance();
      const totalBalance = balancesResponse.data.totalBalance || 0;
      setTotalBalance(totalBalance);
      
      // Then fetch wallets
      const walletsResponse = await FinanceService.getAccounts();
      const wallets = walletsResponse.data || [];
      setWallets(wallets);
      
      // Calculate available balance
      calculateAvailableBalance(totalBalance, wallets, null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableBalance = (total, walletsList, excludeWalletId = null) => {
    const usedBalance = walletsList.reduce((sum, wallet) => {
      // Skip the wallet being edited or deleted when calculating used balance
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
    
    // Calculate dynamic available balance as user types
    if (value && !isNaN(value) && parseFloat(value) >= 0) {
      const newBalance = parseFloat(value);
      const dynamicAvailable = availableBalance - (newBalance - originalBalance);
      setBalanceError('');
      
      // Only show error if exceeds available amount
      if (dynamicAvailable < 0) {
        const maxAllowed = availableBalance + originalBalance;
        setBalanceError(`Balance exceeds available amount (max: ${maxAllowed.toFixed(2)})`);
      }
    } else {
      validateBalanceEdit(value);
    }
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
      // Find the wallet to be deleted to get its balance
      const deletedWallet = wallets.find(wallet => wallet.id === deleteWalletId);
      const deletedBalance = deletedWallet ? deletedWallet.balance : 0;
      
      // Call API to delete wallet
      await FinanceService.deleteAccount(deleteWalletId);
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      
      // Update local state immediately 
      const updatedWallets = wallets.filter(wallet => wallet.id !== deleteWalletId);
      
      // Recalculate the available balance based on updated wallets
      // No need to wait for API response - we can update our state directly
      const newAvailableBalance = totalBalance - updatedWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      
      // Update both states
      setWallets(updatedWallets);
      setAvailableBalance(newAvailableBalance);
      
      // Reset state
      setDeleteWalletId(null);
      setDeleteWalletName('');
      
      // Update parent component without triggering a full reload
      if (onWalletUpdated) {
        // Pass false to prevent full reload, but still notify parent of the change
        onWalletUpdated(false);
      }
    } catch (err) {
      console.error('Error deleting wallet:', err);
      // Handle the specific case where the wallet is shared and user doesn't have permission
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to delete wallet. Please try again.');
      }
      // Close the dialog to show the error
      setDeleteConfirmOpen(false);
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
  
  // Transfer money functions
  const handleOpenTransferDialog = () => {
    setTransferDialogOpen(true);
    // Default to first wallet as source if available
    if (wallets.length > 0) {
      setSourceWalletId(wallets[0].id.toString());
      // Default to "Total Balance" as destination if there's only one wallet
      if (wallets.length > 1) {
        setDestinationWalletId(wallets[1].id.toString());
      } else {
        setDestinationWalletId("total");
      }
    } else {
      // If no wallets, default to Total Balance as source
      setSourceWalletId("total");
    }
    setTransferAmount('');
    setTransferError('');
  };
  
  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    setSourceWalletId('');
    setDestinationWalletId('');
    setTransferAmount('');
    setTransferError('');
  };
  
  const validateTransfer = () => {
    // Reset error
    setTransferError('');
    
    // Check if source and destination are selected and different
    if (!sourceWalletId) {
      setTransferError('Please select a source');
      return false;
    }
    
    if (!destinationWalletId) {
      setTransferError('Please select a destination');
      return false;
    }
    
    if (sourceWalletId === destinationWalletId) {
      setTransferError('Source and destination must be different');
      return false;
    }
    
    // Check if amount is valid
    if (!transferAmount || isNaN(transferAmount) || parseFloat(transferAmount) <= 0) {
      setTransferError('Please enter a valid amount');
      return false;
    }
    
    const amount = parseFloat(transferAmount);
    
    // Check if source has enough balance
    if (sourceWalletId === "total") {
      // If source is total balance, check if there's enough available balance
      if (amount > availableBalance) {
        setTransferError(`Insufficient available balance (available: ${availableBalance.toFixed(2)})`);
        return false;
      }
    } else {
      // If source is a wallet, check if it has enough balance
      const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
      if (!sourceWallet) {
        setTransferError('Source wallet not found');
        return false;
      }
      
      if (amount > sourceWallet.balance) {
        setTransferError(`Insufficient funds in source wallet (available: ${sourceWallet.balance.toFixed(2)})`);
        return false;
      }
    }
    
    return true;
  };
  
  const handleTransfer = async () => {
    if (!validateTransfer()) {
      return;
    }
    
    setTransferring(true);
    
    try {
      const amount = parseFloat(transferAmount);
      
      // Handle different transfer scenarios
      if (sourceWalletId === "total" && destinationWalletId !== "total") {
        // Transfer from total balance to wallet
        const destinationWallet = wallets.find(w => w.id.toString() === destinationWalletId);
        const updatedDestinationWallet = {
          ...destinationWallet,
          balance: destinationWallet.balance + amount
        };
        
        // Update wallet balance
        await FinanceService.updateAccount(destinationWallet.id, updatedDestinationWallet);
      } 
      else if (sourceWalletId !== "total" && destinationWalletId === "total") {
        // Transfer from wallet to total balance
        const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
        const updatedSourceWallet = {
          ...sourceWallet,
          balance: sourceWallet.balance - amount
        };
        
        // Update wallet balance
        await FinanceService.updateAccount(sourceWallet.id, updatedSourceWallet);
      }
      else {
        // Transfer between wallets
        const sourceWallet = wallets.find(w => w.id.toString() === sourceWalletId);
        const destinationWallet = wallets.find(w => w.id.toString() === destinationWalletId);
        
        // Update source wallet
        const updatedSourceWallet = {
          ...sourceWallet,
          balance: sourceWallet.balance - amount
        };
        
        // Update destination wallet
        const updatedDestinationWallet = {
          ...destinationWallet,
          balance: destinationWallet.balance + amount
        };
        
        // Call API to update both wallets
        await FinanceService.updateAccount(sourceWallet.id, updatedSourceWallet);
        await FinanceService.updateAccount(destinationWallet.id, updatedDestinationWallet);
      }
      
      // Close dialog and refresh wallets
      handleCloseTransferDialog();
      fetchFinancialData();
      
      // Notify parent component
      if (onWalletUpdated) {
        onWalletUpdated();
      }
    } catch (err) {
      console.error('Error transferring funds:', err);
      setTransferError(err.response?.data?.message || 'Failed to transfer funds. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  // Add methods to handle opening and closing the user transfer dialog
  const handleOpenUserTransferDialog = () => {
    setUserTransferDialogOpen(true);
  };
  
  const handleCloseUserTransferDialog = () => {
    setUserTransferDialogOpen(false);
  };
  
  const handleUserTransferCompleted = () => {
    handleCloseUserTransferDialog();
    
    // Force a full refresh of all financial data
    fetchFinancialData();
    
    // Also refresh the parent dashboard component to update the total balance
    if (onWalletUpdated) {
      onWalletUpdated(true); // Pass true to indicate a balance change occurred
    }
  };

  // Add functions for wallet menu
  const handleWalletMenuOpen = (event, wallet) => {
    event.stopPropagation();
    setWalletMenuAnchorEl(event.currentTarget);
    setSelectedWalletForMenu(wallet);
  };
  
  const handleWalletMenuClose = () => {
    setWalletMenuAnchorEl(null);
  };
  
  // Add functions for share wallet
  const handleShareWallet = () => {
    setWalletToShare(selectedWalletForMenu);
    setShareWalletDialogOpen(true);
    handleWalletMenuClose();
  };
  
  const handleShareWalletClose = () => {
    setShareWalletDialogOpen(false);
    setWalletToShare(null);
  };
  
  const handleWalletShared = () => {
    // Refresh wallet list after sharing
    fetchFinancialData();
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box 
          className={styles.balanceInfoBox}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }} className={styles.infoText}>
            <InfoIcon fontSize="small" className={styles.infoIcon} />
            <Typography variant="body2" color="text.secondary">
              Total Balance: ${totalBalance.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }} className={styles.infoText}>
            <InfoIcon fontSize="small" className={styles.infoIcon} />
            <Typography variant="body2" color="text.secondary">
              Allocated in Wallets: ${wallets.reduce((sum, wallet) => sum + wallet.balance, 0).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon fontSize="small" className={styles.infoIcon} />
            <Typography variant="body2" color="text.secondary">
              Available for allocation: ${availableBalance.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Box className={styles.actionButtons}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SwapHorizIcon />}
            onClick={handleOpenTransferDialog}
            disabled={editMode || loading || wallets.length < 1}
            className={`${styles.transferButton} ${styles.compactButton}`}
          >
            Transfer
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewWalletForm}
            disabled={editMode || loading}
            className={`${styles.addWalletButton} ${styles.compactButton}`}
          >
            New Wallet
          </Button>
        </Box>
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
                      InputProps={{
                        className: styles.textField
                      }}
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
                        className: styles.textField
                      }}
                      FormHelperTextProps={{
                        sx: { fontSize: '0.75rem', mt: 0.5, ml: 1 }
                      }}
                      error={!!balanceError}
                      helperText={balanceError || `Available: ${(editWalletBalance && !isNaN(editWalletBalance) && parseFloat(editWalletBalance) >= 0) ? 
                        (availableBalance - (parseFloat(editWalletBalance) - originalBalance)).toFixed(2) : 
                        availableBalance.toFixed(2)}`}
                    />
                    <Box className={styles.actionButtonsContainer}>
                      <Button 
                        variant="outlined" 
                        color="inherit" 
                        size="small"
                        onClick={handleEditCancel}
                        className={styles.actionButton}
                      >
                        Cancel
                      </Button>
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
                    </Box>
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
                    <ListItemSecondaryAction className={styles.walletActions}>
                      {!editMode && (
                        <>
                          <Tooltip title="Share Wallet" arrow>
                            <IconButton
                              edge="end"
                              aria-label="share wallet"
                              onClick={() => {
                                setWalletToShare(wallet);
                                setShareWalletDialogOpen(true);
                              }}
                              className={styles.iconButton}
                              size="small"
                            >
                              <ShareIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Money" arrow>
                            <IconButton
                              edge="end"
                              aria-label="send money"
                              onClick={() => {
                                setSelectedWalletForMenu(wallet);
                                handleOpenUserTransferDialog();
                              }}
                              className={styles.iconButton}
                              size="small"
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Wallet" arrow>
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditClick(wallet)}
                              className={styles.iconButton}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Wallet" arrow>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteClick(wallet)}
                              className={styles.deleteIconButton}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
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
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: deleteDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 400
        }}
        ref={deleteDialogRef}
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
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: newWalletDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 400
        }}
        ref={newWalletDialogRef}
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
      
      {/* Transfer Money Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={handleCloseTransferDialog}
        maxWidth="xs"
        PaperProps={{
          className: styles.transferDialog
        }}
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: transferDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 400
        }}
        ref={transferDialogRef}
      >
        <DialogTitle className={styles.transferTitle}>Transfer Money</DialogTitle>
        <DialogContent>
          {transferError && (
            <Fade in={!!transferError} timeout={300} nodeRef={transferErrorRef}>
              <Alert severity="error" sx={{ mb: 2 }} ref={transferErrorRef}>
                {transferError}
              </Alert>
            </Fade>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Transfer money between your wallets or allocate funds from your available total balance.
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              From
            </Typography>
            <Select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              displayEmpty
              size="small"
              className={styles.selectField}
            >
              <MenuItem value="total">
                Total Balance (Available: ${availableBalance.toFixed(2)})
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} (${wallet.balance.toFixed(2)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              To
            </Typography>
            <Select
              value={destinationWalletId}
              onChange={(e) => setDestinationWalletId(e.target.value)}
              displayEmpty
              size="small"
              className={styles.selectField}
            >
              <MenuItem value="total">
                Total Balance (Available: ${availableBalance.toFixed(2)})
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} (${wallet.balance.toFixed(2)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              Amount
            </Typography>
            <TextField
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
          
          {/* Show contextual help text based on transfer type */}
          {sourceWalletId && destinationWalletId && sourceWalletId !== destinationWalletId && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {sourceWalletId === "total" && destinationWalletId !== "total" ? (
                  "Allocating funds from your available balance to a specific wallet."
                ) : destinationWalletId === "total" && sourceWalletId !== "total" ? (
                  "Unallocating funds from a wallet back to your available balance."
                ) : (
                  "Moving funds between wallets. Total balance remains unchanged."
                )}
              </Typography>
            </Box>
          )}
          
        </DialogContent>
        <DialogActions className={styles.transferActions}>
          <Button 
            onClick={handleCloseTransferDialog} 
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            color="primary" 
            variant="contained"
            disabled={transferring}
            startIcon={transferring ? <CircularProgress size={20} color="inherit" /> : null}
            className={styles.transferButton}
          >
            {transferring ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Transfer Dialog */}
      <UserTransferForm
        open={userTransferDialogOpen}
        handleClose={handleCloseUserTransferDialog}
        onTransferCompleted={handleUserTransferCompleted}
      />
      
      {/* Share Wallet Dialog */}
      {walletToShare && (
        <ShareWalletForm
          open={shareWalletDialogOpen}
          handleClose={handleShareWalletClose}
          wallet={walletToShare}
          onWalletShared={handleWalletShared}
        />
      )}
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
      onClose={embedded ? null : handleClose}
      maxWidth="sm"
      PaperProps={{
        className: styles.dialogPaper,
        style: { width: '65%', maxWidth: '650px' }
      }}
      TransitionComponent={FadeTransition}
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
            Manage Wallets
            <span className={styles.walletCount}>
              (Total: {wallets.length})
            </span>
          </Typography>
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