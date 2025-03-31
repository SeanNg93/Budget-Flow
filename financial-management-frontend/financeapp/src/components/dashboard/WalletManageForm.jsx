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
  Tooltip, // Import Tooltip
  Fade,
  Slide,
  Zoom,
  Avatar
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import UserTransferForm from './UserTransferForm';
import ShareWalletForm from './ShareWalletForm';
import styles from '../../styles/walletManage.module.css';
import { WALLET_ICONS, WALLET_COLORS, getWalletIcon, saveWalletIcon, getWalletColorClass, saveWalletColor } from '../../utils/walletIcons';
import { formatCurrency } from '../../utils/moneyFormatter';
import MoneyInput from '../utils/MoneyInput';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook
import LockIcon from '@mui/icons-material/Lock';

// Map of icon names to components
const iconComponents = {
  wallet: <AccountBalanceWalletIcon />,
  creditCard: <CreditCardIcon />,
  savings: <SavingsIcon />,
  cash: <PaymentsIcon />,
  investment: <ShowChartIcon />,
  piggyBank: <SavingsOutlinedIcon />,
  bank: <AccountBalanceIcon />,
  shopping: <ShoppingBagIcon />
};

// Create transition components with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Create a FadeTransition component with forwardRef
const FadeTransition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

// Add onWalletDeleted prop
const WalletManageForm = ({ open, handleClose, onWalletUpdated, onWalletDeleted, embedded = false, initialOpenTransfer = false }) => {
  const { t } = useTranslation(); // Add translation hook
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Edit wallet states
  const [editMode, setEditMode] = useState(false);
  const [editWalletId, setEditWalletId] = useState(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [editWalletIcon, setEditWalletIcon] = useState('wallet');
  const [editWalletColor, setEditWalletColor] = useState(1);
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

  // Add state for shared wallets information
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});

  // Add refs for transitions
  const newWalletDialogRef = useRef(null);
  const transferDialogRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const transferErrorRef = useRef(null);
  const dialogRef = useRef(null);

  // Add canEditBalance state
  const [canEditBalance, setCanEditBalance] = useState(true);

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

      // Fetch shared wallets information
      fetchSharedWalletsInfo();

      // Calculate available balance
      calculateAvailableBalance(totalBalance, wallets, null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('wallets.errorLoadingWallets'));
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch shared wallets information
  const fetchSharedWalletsInfo = async () => {
    try {
      // Fetch shared wallets data in parallel
      const [sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getSharedWalletsWithMe(),
        FinanceService.getSharedWalletsByMe()
      ]);

      // Process shared wallets data
      const sharedInfo = {};
      const processSharedWallets = (wallets, isOwner) => {
        wallets.forEach(sharedWallet => {
          if (sharedWallet.accepted) {
            sharedInfo[sharedWallet.walletId] = {
              isShared: true,
              isOwner,
              ownerUsername: sharedWallet.ownerUsername,
              ownerId: sharedWallet.ownerId,
              sharedWithId: sharedWallet.sharedWithId,
              sharedWithUsername: sharedWallet.sharedWithUsername,
              walletName: sharedWallet.walletName,
              ownerProfilePictureUrl: sharedWallet.ownerProfilePictureUrl,
              sharedWithProfilePictureUrl: sharedWallet.sharedWithProfilePictureUrl
            };
          }
        });
      };

      processSharedWallets(sharedWithMeResponse.data || [], false);
      processSharedWallets(sharedByMeResponse.data || [], true);

      setSharedWalletsInfo(sharedInfo);
    } catch (err) {
      console.error('Error fetching shared wallet info:', err);
    }
  };

  // Helper function to update dialog states
  const updateDialogState = (dialogName, isOpen) => {
    switch (dialogName) {
      case 'shareWalletDialog':
        setShareWalletDialogOpen(isOpen);
        break;
      case 'transferDialog':
        setTransferDialogOpen(isOpen);
        break;
      case 'userTransferDialog':
        setUserTransferDialogOpen(isOpen);
        break;
      case 'newWalletDialog':
        setNewWalletFormOpen(isOpen);
        break;
      case 'deleteWalletDialog':
        setDeleteConfirmOpen(isOpen);
        break;
      default:
        break;
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

    // Get the current wallet icon and color, or set defaults
    const savedIcon = getWalletIcon(wallet.id);
    setEditWalletIcon(savedIcon || 'wallet');

    // Extract color index from the color class
    const colorClass = getWalletColorClass(wallet.id);
    const colorIndex = parseInt(colorClass.replace('walletColor', ''), 10);
    setEditWalletColor(isNaN(colorIndex) ? 1 : colorIndex);
    
    // Check if the wallet is shared and determine ownership status
    const isSharedWallet = sharedWalletsInfo && sharedWalletsInfo[wallet.id];
    let isNotOwner = false;
    
    if (isSharedWallet) {
      isNotOwner = !sharedWalletsInfo[wallet.id].isOwner;
      console.log(`Wallet ${wallet.id} is shared. User is ${isNotOwner ? 'not ' : ''}the owner`);
    }
    
    // Set a flag to disable balance editing for non-owners of shared wallets
    setCanEditBalance(!isNotOwner);

    // Calculate available balance excluding this wallet
    calculateAvailableBalance(totalBalance, wallets, wallet.id);
    setBalanceError('');
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditWalletId(null);
    setEditWalletName('');
    setEditWalletBalance('');
    setEditWalletIcon('wallet');
    setEditWalletColor(1);
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
      setBalanceError(t('wallets.balanceExceedsAvailable', { amount: formatCurrency(maxAllowed) })); 
      return false;
    }

    setBalanceError('');
    return true;
  };

  const handleBalanceChange = (value) => {
    setEditWalletBalance(value);

    // Calculate dynamic available balance as user types
    if (value && !isNaN(value) && parseFloat(value) >= 0) {
      const newBalance = parseFloat(value);
      const dynamicAvailable = availableBalance - (newBalance - originalBalance);
      setBalanceError('');

      // Only show error if exceeds available amount
      if (dynamicAvailable < 0) {
        const maxAllowed = availableBalance + originalBalance;
        setBalanceError(t('wallets.balanceExceedsAvailable', { amount: formatCurrency(maxAllowed) }));
      }
    } else {
      validateBalanceEdit(value);
    }
  };

  const handleEditSave = async () => {
    if (!editWalletName.trim()) {
      setError(t('wallets.nameRequired'));
      return;
    }

    // Log permission state
    console.log(`Saving wallet ${editWalletId} with canEditBalance: ${canEditBalance}`);

    if (canEditBalance && !validateBalanceEdit(editWalletBalance)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find the wallet to update
      const walletToUpdate = wallets.find(w => w.id === editWalletId);

      if (!walletToUpdate) {
        throw new Error(t('wallets.walletNotFound'));
      }

      // Create updated wallet data based on permissions
      const updatedWallet = {
        ...walletToUpdate,
        accountName: editWalletName.trim(),
        // Only update balance if user has permission (is owner)
        balance: canEditBalance ? parseFloat(editWalletBalance) : walletToUpdate.balance
      };
      
      // Log the update details
      console.log('Updating wallet with data:', {
        id: editWalletId,
        name: updatedWallet.accountName,
        oldBalance: walletToUpdate.balance,
        newBalance: updatedWallet.balance,
        balanceChanged: canEditBalance && updatedWallet.balance !== walletToUpdate.balance
      });

      // Update the wallet
      const response = await FinanceService.updateAccount(
        editWalletId,
        updatedWallet
      );

      // Update icon and color preferences in localStorage
      saveWalletIcon(editWalletId, editWalletIcon);
      saveWalletColor(editWalletId, editWalletColor);

      // Immediately update the UI with the new wallet data
      const updatedWalletWithCustomProperties = {
        ...response.data,
        _forceIconRefresh: Date.now(),
        _colorClass: `walletColor${editWalletColor}`,
        _icon: editWalletIcon
      };

      // Update the wallets state immediately before fetching from API
      setWallets(currentWallets => {
        return currentWallets.map(wallet => {
          if (wallet.id === editWalletId) {
            return updatedWalletWithCustomProperties;
          }
          return wallet;
        });
      });

      // Notify parent component with the updated wallet
      if (onWalletUpdated) {
        onWalletUpdated(updatedWalletWithCustomProperties);
      }

      // Reset edit mode
      setEditMode(false);
      setEditWalletId(null);
      setEditWalletName('');
      setEditWalletBalance('');
      setEditWalletIcon('wallet');
      setEditWalletColor(1);
      setCanEditBalance(true);

      // Refresh the wallets list in the background
      fetchFinancialData();
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError(err.response?.data?.message || t('wallets.errorUpdatingWallet'));
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

      // Notify parent component about the deletion
      if (onWalletDeleted) {
        onWalletDeleted(); // Call the new prop
      }
      // Also call the existing update prop if needed, maybe without forcing refresh
      if (onWalletUpdated) {
        onWalletUpdated(false);
      }
    } catch (err) {
      console.error('Error deleting wallet:', err);
      // Handle the specific case where the wallet is shared and user doesn't have permission
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(t('wallets.errorDeletingWallet'));
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

  const handleTransferAmountChange = (value) => {
    setTransferAmount(value);
    if (transferError) {
      setTransferError('');
    }
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
      setTransferError(t('wallets.transferSelectSource'));
      return false;
    }

    if (!destinationWalletId) {
      setTransferError(t('wallets.transferSelectDestination'));
      return false;
    }

    if (sourceWalletId === destinationWalletId) {
      setTransferError(t('wallets.transferSameSourceDestination'));
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
        setTransferError(`Insufficient available balance (available: ${formatCurrency(availableBalance)})`);
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
        setTransferError(`Insufficient funds in source wallet (available: ${formatCurrency(sourceWallet.balance)})`);
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

  // Render wallet list items with edit mode
  const renderWalletListItems = () => {
    return wallets.map((wallet) => {
      // Get wallet color class - force refresh based on recent edits
      const colorClass = editWalletId === wallet.id && editMode
        ? `walletColor${editWalletColor}`
        : getWalletColorClass(wallet.id);

      // Check if this is a shared wallet
      const isShared = sharedWalletsInfo[wallet.id] !== undefined;
      const isOwner = isShared ? sharedWalletsInfo[wallet.id].isOwner : false;
      const sharedInfo = isShared ? sharedWalletsInfo[wallet.id] : null;

      // Get saved icon - for the wallet being edited, use the current edit value
      const savedIcon = editWalletId === wallet.id && editMode
        ? editWalletIcon
        : getWalletIcon(wallet.id);
      const iconToUse = savedIcon || 'wallet';

      // Determine if icon is emoji or standard
      const isEmoji = WALLET_ICONS.find(icon => icon.value === iconToUse)?.type === 'emoji';

      return (
        <React.Fragment key={wallet.id}>
          {/* Show wallet editing form if this wallet is being edited */}
          {editMode && editWalletId === wallet.id ? (
            <ListItem className={`${styles.walletItem} ${styles.walletItemEditing}`}>
              <Box className={styles.editContainer}>
                <Typography variant="subtitle1" className={styles.editLabel}>
                  {t('wallets.editWallet')}
                </Typography>

                <TextField
                  fullWidth
                  label={t('wallets.walletName')}
                  value={editWalletName}
                  onChange={(e) => setEditWalletName(e.target.value)}
                  className={styles.textField}
                  margin="normal"
                  variant="outlined"
                  size="small"
                />

                <Typography variant="subtitle1" className={styles.fieldLabel} sx={{ mt: 2, mb: 1 }}>
                  {t('wallets.iconAndColor')}
                </Typography>
                <Box className={styles.iconSelection}>
                  {WALLET_ICONS.map(icon => (
                    <Tooltip key={icon.id} title={t(`wallets.iconNames.${icon.value}`) || icon.label}>
                      <Box
                        className={`${styles.iconOption} ${editWalletIcon === icon.value ? styles.selectedIcon : ''}`}
                        onClick={() => setEditWalletIcon(icon.value)}
                      >
                        {icon.type === 'emoji' ? (
                          <span style={{ fontSize: '20px' }}>{icon.value}</span>
                        ) : (
                          iconComponents[icon.value]
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>

                {/* Only show color selection for standard icons, not for emoji */}
                {(WALLET_ICONS.find(icon => icon.value === editWalletIcon)?.type !== 'emoji') && (
                  <>
                    <Typography variant="subtitle1" className={styles.fieldLabel} sx={{ mt: 2, mb: 1 }}>
                      {t('wallets.selectColor')}
                    </Typography>
                    <Box className={styles.colorSelection}>
                      {WALLET_COLORS.map(color => (
                        <Tooltip key={color.id} title={color.label}>
                          <Box
                            className={`${styles.colorOption} ${editWalletColor === color.value ? styles.selectedColor : ''}`}
                            sx={{ backgroundColor: color.hex }}
                            onClick={() => setEditWalletColor(color.value)}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </>
                )}

                <MoneyInput
                  fullWidth
                  label={t('wallets.balance')}
                  value={editWalletBalance}
                  onChange={handleBalanceChange}
                  className={styles.textField}
                  margin="normal"
                  error={balanceError}
                  size="small"
                  disabled={!canEditBalance}
                />

                {!canEditBalance && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      mb: 1.5, 
                      fontStyle: 'italic',
                      fontSize: '0.75rem'
                    }}
                  >
                    {t('wallets.cannotEditSharedBalance')}
                  </Typography>
                )}

                <Box className={styles.actionButtonsContainer}>
                  <Button
                    variant="outlined"
                    color="primary"
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                    onClick={handleEditCancel}
                    startIcon={<CancelIcon />}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    className={`${styles.actionButton} ${styles.saveButton}`}
                    onClick={handleEditSave}
                    startIcon={<SaveIcon />}
                  >
                    {t('common.save')}
                  </Button>
                </Box>
              </Box>
            </ListItem>
          ) : (
            // Standard wallet list item (not being edited)
            <ListItem className={styles.walletItem} sx={{ py: 1, px: 1.5 }}>
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  {isEmoji ? (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '24px',
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {iconToUse}
                    </Typography>
                  ) : (
                    <Box component="span" className={`${styles.iconContainer} ${styles[colorClass]}`} sx={{ width: '32px', height: '32px' }}>
                      {iconComponents[iconToUse] || iconComponents.wallet}
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle1" className={styles.walletName} sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      {wallet.accountName}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" className={styles.walletDetails} sx={{ fontSize: '0.8rem' }}>
                        {isShared
                          ? (isOwner ? 'Shared with User' : 'Shared by Owner')
                          : (wallet.accountType || "General Account")
                        }
                      </Typography>

                      {isShared && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Tooltip
                            title={isOwner
                              ? `Shared with: ${sharedInfo.sharedWithUsername}`
                              : `Owner: ${sharedInfo.ownerUsername} - ${t('wallets.cannotEditSharedBalance')}`
                            }
                          >
                            <Avatar
                              src={isOwner
                                ? sharedInfo.sharedWithProfilePictureUrl
                                : sharedInfo.ownerProfilePictureUrl
                              }
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.7rem',
                                marginLeft: '8px',
                                backgroundColor: isOwner ? '#1976d2' : '#ff9800',
                                border: '1px solid white'
                              }}
                            >
                              {isOwner
                                ? sharedInfo.sharedWithUsername?.charAt(0).toUpperCase()
                                : sharedInfo.ownerUsername?.charAt(0).toUpperCase()
                              }
                            </Avatar>
                          </Tooltip>
                          
                          {!isOwner && (
                            <Tooltip title={t('wallets.cannotEditSharedBalance')}>
                              <LockIcon 
                                fontSize="small" 
                                sx={{ 
                                  ml: 0.5, 
                                  color: 'warning.main', 
                                  fontSize: '0.9rem' 
                                }} 
                              />
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Typography variant="h6" className={styles.walletBalance} sx={{ fontSize: '1rem', mr: 1.5 }}>
                  {formatCurrency(wallet.balance)}
                </Typography>

                <Box className={styles.walletActions} sx={{ display: 'flex', gap: 0.5, borderLeft: '1px solid rgba(0,0,0,0.08)', pl: 1 }}>
                  <Tooltip title={t('wallets.sendMoneyToUser')} arrow>
                    <IconButton
                      size="small"
                      className={`${styles.iconButton} ${styles.sendIconButton}`}
                      onClick={() => handleOpenUserTransferDialog(wallet)}
                      aria-label={t('wallets.sendMoney')}
                      sx={{ width: '28px', height: '28px', color: 'info.main' }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('wallets.shareWallet')} arrow>
                    <IconButton
                      size="small"
                      className={`${styles.iconButton} ${styles.shareIconButton}`}
                      onClick={() => {
                        setWalletToShare(wallet);
                        updateDialogState('shareWalletDialog', true);
                      }}
                      aria-label={t('wallets.shareWallet')}
                      sx={{ width: '28px', height: '28px', color: 'secondary.main' }}
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('wallets.editWallet')} arrow>
                    <IconButton
                      size="small"
                      className={styles.iconButton}
                      onClick={() => handleEditClick(wallet)}
                      aria-label={t('wallets.editWallet')}
                      sx={{ width: '28px', height: '28px', color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('wallets.deleteWallet')} arrow>
                    <IconButton
                      size="small"
                      className={styles.deleteIconButton}
                      onClick={() => handleDeleteClick(wallet)}
                      aria-label={t('wallets.deleteWallet')}
                      sx={{ width: '28px', height: '28px', color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </ListItem>
          )}
          <Divider component="li" sx={{ m: 0 }} />
        </React.Fragment>
      );
    });
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box
          className={styles.balanceInfoBox}
          sx={{ flex: 1, p: 1, maxWidth: '70%' }}
        >
          <Grid container spacing={0.5}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }} className={styles.infoText}>
                <InfoIcon fontSize="small" sx={{ fontSize: '14px' }} className={styles.infoIcon} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {t('wallets.totalBalance')}: {formatCurrency(totalBalance)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }} className={styles.infoText}>
                <InfoIcon fontSize="small" sx={{ fontSize: '14px' }} className={styles.infoIcon} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {t('wallets.allocated')}: {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.balance, 0))}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ fontSize: '14px' }} className={styles.infoIcon} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {t('wallets.available')}: {formatCurrency(availableBalance)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Box className={styles.actionButtons} sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SwapHorizIcon />}
            onClick={handleOpenTransferDialog}
            disabled={editMode || loading || wallets.length < 1}
            className={styles.compactButton}
            sx={{ borderRadius: '10px', height: '32px', fontSize: '0.8rem' }}
          >
            {t('wallets.transferMoney')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewWalletForm}
            disabled={editMode || loading}
            className={styles.compactButton}
            sx={{ borderRadius: '10px', height: '32px', fontSize: '0.8rem' }}
          >
            {t('wallets.createWallet')}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box className={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      ) : wallets.length === 0 ? (
        <Typography variant="body1" className={styles.emptyMessage}>
          {t('wallets.noWallets')}
        </Typography>
      ) : (
        <List className={styles.walletList} sx={{ p: 0 }}>
          {renderWalletListItems()}
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
        <DialogTitle className={styles.confirmTitle}>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('wallets.deleteConfirmation', { name: deleteWalletName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions className={styles.confirmActions}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            className={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : null}
            className={`${styles.standardButton} ${styles.deleteButton}`}
          >
            {deleting ? t('common.deleting') : t('common.delete')}
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
        <DialogTitle>{t('wallets.createWallet')}</DialogTitle>
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
        <DialogTitle className={styles.transferTitle}>{t('wallets.transferMoney')}</DialogTitle>
        <DialogContent>
          {transferError && (
            <Fade in={!!transferError} timeout={300} nodeRef={transferErrorRef}>
              <Alert severity="error" sx={{ mb: 2 }} ref={transferErrorRef}>
                {transferError}
              </Alert>
            </Fade>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('wallets.transferDescription')}
          </Typography>

          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              {t('wallets.transferFrom')}
            </Typography>
            <Select
              value={sourceWalletId}
              onChange={(e) => setSourceWalletId(e.target.value)}
              displayEmpty
              size="small"
              className={styles.selectField}
            >
              <MenuItem value="total">
                {t('wallets.totalBalance')} ({t('wallets.available')}: {formatCurrency(availableBalance)})
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} ({formatCurrency(wallet.balance)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              {t('wallets.transferTo')}
            </Typography>
            <Select
              value={destinationWalletId}
              onChange={(e) => setDestinationWalletId(e.target.value)}
              displayEmpty
              size="small"
              className={styles.selectField}
            >
              <MenuItem value="total">
                {t('wallets.totalBalance')} ({t('wallets.available')}: {formatCurrency(availableBalance)})
              </MenuItem>
              {wallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.accountName} ({formatCurrency(wallet.balance)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <Typography variant="subtitle2" gutterBottom>
              {t('wallets.amount')}
            </Typography>
            <MoneyInput 
              value={transferAmount}
              onChange={handleTransferAmountChange}
              placeholder="0.00"
              fullWidth
              size="small"
              className={styles.moneyTextField}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {transferAmount ? formatCurrency(Number(transferAmount)) : ''}
            </Typography>
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
        <DialogActions className={styles.dialogActions}>
          <Button
            onClick={handleCloseTransferDialog}
            variant="outlined"
            className={styles.cancelButton}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleTransfer}
            color="primary"
            variant="contained"
            disabled={transferring}
            startIcon={transferring ? <CircularProgress size={20} color="inherit" /> : null}
            className={`${styles.standardButton} ${styles.transferButton}`}
          >
            {transferring ? t('wallets.transferring') : t('wallets.transfer')}
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
      disableScrollLock={true}
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
            {t('wallets.manageWallets')}
            <span className={styles.walletCount}>
              ({t('common.total')}: {wallets.length})
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
