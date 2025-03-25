import React, { useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  DialogContentText,
  Button
} from '@mui/material';

// Import dialog components
import FinanceActionPanel from './FinanceActionPanel';
import WalletManageForm from './WalletManageForm';
import TransactionForm from './TransactionForm';
import WalletForm from './WalletForm';
import CategoryForm from './CategoryForm';
import CategoryManageForm from './CategoryManageForm';
import AddBalanceForm from './AddBalanceForm';
import EditBalanceForm from './EditBalanceForm';
import ProfileDialog from '../user/ProfileDialog';
import UserTransferForm from './UserTransferForm';
import ShareWalletForm from './ShareWalletForm';

/**
 * DialogComponent - A memo wrapper for dynamic dialog rendering
 */
const DialogComponent = React.memo(({ 
  Component, 
  open, 
  handleClose, 
  ...otherProps 
}) => {
  return (
    <Component
      open={open}
      handleClose={handleClose}
      {...otherProps}
    />
  );
});

// Ensure displayName is set for debugging
DialogComponent.displayName = 'DialogComponent';

/**
 * DialogManager centralizes the management of all dialogs and modals
 * This helps reduce complexity in the main Dashboard component
 */
const DialogManager = ({
  dialogStates,
  updateDialogState,
  userProfile,
  selectedTransaction,
  selectedWallet,
  wallets,
  handleTransactionAdded,
  handleAccountAdded,
  handleCategoryAdded,
  handleBalanceAdded,
  handleProfileUpdated,
  handleCategoryUpdated,
  handleDeleteConfirm,
  setSelectedTransaction,
  setSelectedWallet,
  fetchFinancialData
}) => {
  // Helper function to close dialogs - memoized to prevent unnecessary re-renders
  const closeDialog = useCallback((dialogName) => {
    updateDialogState(dialogName, false);
  }, [updateDialogState]);

  // Helper for delete dialog cancel - memoized
  const handleDeleteCancel = useCallback(() => {
    setSelectedTransaction(null);
    updateDialogState('deleteConfirmOpen', false);
  }, [setSelectedTransaction, updateDialogState]);
  
  // Memoized callbacks for dialog actions
  const openTransactionForm = useCallback(() => 
    updateDialogState('transactionForm', true), 
    [updateDialogState]
  );
  
  const openWalletManageForm = useCallback(() => 
    updateDialogState('walletManageForm', true),
    [updateDialogState]
  );
  
  const openCategoryManageForm = useCallback(() => 
    updateDialogState('categoryManageForm', true),
    [updateDialogState]
  );
  
  const openUserTransferDialog = useCallback(() => 
    updateDialogState('userTransferDialog', true),
    [updateDialogState]
  );
  
  const handleTransferCompleted = useCallback(() => {
    closeDialog('userTransferDialog');
    fetchFinancialData();
  }, [closeDialog, fetchFinancialData]);
  
  const handleShareWalletClose = useCallback(() => {
    closeDialog('shareWalletDialog');
    setSelectedWallet(null);
  }, [closeDialog, setSelectedWallet]);
  
  const handleWalletShared = useCallback(() => {
    closeDialog('shareWalletDialog');
    setSelectedWallet(null);
    fetchFinancialData();
  }, [closeDialog, setSelectedWallet, fetchFinancialData]);
  
  const handleEditTransactionClose = useCallback(() => {
    updateDialogState('editTransactionOpen', false);
    setSelectedTransaction(null);
  }, [updateDialogState, setSelectedTransaction]);

  // Standard dialog configurations - memoized to avoid recreating on every render
  const standardDialogs = useMemo(() => [
    {
      name: 'financeActionPanel',
      component: FinanceActionPanel,
      props: {
        setTransactionFormOpen: openTransactionForm,
        setWalletManageFormOpen: openWalletManageForm,
        setCategoryManageFormOpen: openCategoryManageForm,
        setUserTransferDialogOpen: openUserTransferDialog
      }
    },
    {
      name: 'walletManageForm',
      component: WalletManageForm,
      props: {
        onWalletUpdated: handleAccountAdded
      }
    },
    {
      name: 'transactionForm',
      component: TransactionForm,
      props: {
        onTransactionAdded: handleTransactionAdded
      }
    },
    {
      name: 'accountForm',
      component: WalletForm,
      props: {
        onWalletAdded: handleAccountAdded
      }
    },
    {
      name: 'categoryForm',
      component: CategoryForm,
      props: {
        onCategoryAdded: handleCategoryAdded
      }
    },
    {
      name: 'categoryManageForm',
      component: CategoryManageForm,
      props: {
        onCategoryUpdated: handleCategoryUpdated
      }
    },
    {
      name: 'addBalanceForm',
      component: AddBalanceForm,
      props: {
        onBalanceAdded: handleBalanceAdded
      }
    },
    {
      name: 'editBalanceForm',
      component: EditBalanceForm,
      props: {
        onBalanceEdited: handleBalanceAdded
      }
    },
    {
      name: 'profileDialog',
      component: ProfileDialog,
      props: {
        onProfileUpdated: handleProfileUpdated
      }
    },
    {
      name: 'userTransferDialog',
      component: UserTransferForm,
      props: {
        onTransferCompleted: handleTransferCompleted
      }
    }
  ], [
    openTransactionForm,
    openWalletManageForm,
    openCategoryManageForm,
    openUserTransferDialog,
    handleAccountAdded,
    handleTransactionAdded,
    handleCategoryAdded,
    handleBalanceAdded,
    handleProfileUpdated,
    handleCategoryUpdated,
    handleTransferCompleted
  ]);

  // Find the wallet to share - memoized
  const walletToShare = useMemo(() => {
    if (!selectedWallet) return null;
    return wallets.find(w => w.id === selectedWallet);
  }, [selectedWallet, wallets]);

  // Render standard dialogs - memoized to prevent unnecessary re-renders
  const standardDialogComponents = useMemo(() => 
    standardDialogs.map(dialog => (
      <DialogComponent
        key={dialog.name}
        Component={dialog.component}
        open={dialogStates[dialog.name]}
        handleClose={() => closeDialog(dialog.name)}
        {...dialog.props}
      />
    )),
    [standardDialogs, dialogStates, closeDialog]
  );

  return (
    <>
      {/* Render standard dialogs using the memoized components */}
      {standardDialogComponents}
      
      {/* Special case dialogs that need custom handling */}
      
      {/* Edit Transaction Form - special case with selected transaction */}
      {selectedTransaction && (
        <TransactionForm 
          key={`edit-transaction-${selectedTransaction.id}`}
          open={dialogStates.editTransactionOpen} 
          handleClose={handleEditTransactionClose}
          initialData={selectedTransaction}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
      
      {/* Share Wallet Form - special case with wallet selection */}
      <ShareWalletForm
        open={dialogStates.shareWalletDialog && Boolean(walletToShare)}
        wallet={walletToShare}
        handleClose={handleShareWalletClose}
        onWalletShared={handleWalletShared}
      />
      
      {/* Transfer Dialog - special embedded dialog */}
      <Dialog
        open={dialogStates.transferDialog}
        onClose={() => closeDialog('transferDialog')}
        aria-labelledby="transfer-dialog-title"
      >
        <DialogTitle id="transfer-dialog-title">Transfer Money Between Wallets</DialogTitle>
        <DialogContent>
          <WalletManageForm
            open={true}
            handleClose={() => closeDialog('transferDialog')}
            onWalletUpdated={handleAccountAdded}
            embedded={true}
            initialOpenTransfer={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Transaction Confirmation Dialog */}
      <Dialog
        open={dialogStates.deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px',
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Transaction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            autoFocus
            aria-label="Confirm delete transaction"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(DialogManager); 