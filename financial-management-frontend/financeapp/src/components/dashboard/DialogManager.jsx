import React from 'react';
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
  // Helper function to close dialogs
  const closeDialog = (dialogName) => {
    updateDialogState(dialogName, false);
  };

  // Helper for delete dialog cancel
  const handleDeleteCancel = () => {
    setSelectedTransaction(null);
    updateDialogState('deleteConfirmOpen', false);
  };

  // Standard dialog configurations
  const standardDialogs = [
    {
      name: 'financeActionPanel',
      component: FinanceActionPanel,
      props: {
        setTransactionFormOpen: () => updateDialogState('transactionForm', true),
        setWalletManageFormOpen: () => updateDialogState('walletManageForm', true),
        setCategoryManageFormOpen: () => updateDialogState('categoryManageForm', true),
        setUserTransferDialogOpen: () => updateDialogState('userTransferDialog', true)
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
        onTransferCompleted: () => {
          closeDialog('userTransferDialog');
          fetchFinancialData();
        }
      }
    }
  ];

  return (
    <>
      {/* Render standard dialogs using the configuration array */}
      {standardDialogs.map(dialog => {
        const DialogComponent = dialog.component;
        return (
          <DialogComponent
            key={dialog.name}
            open={dialogStates[dialog.name]}
            handleClose={() => closeDialog(dialog.name)}
            {...dialog.props}
          />
        );
      })}
      
      {/* Special case dialogs that need custom handling */}
      
      {/* Edit Transaction Form - special case with selected transaction */}
      {selectedTransaction && (
        <TransactionForm 
          key={`edit-transaction-${selectedTransaction.id}`}
          open={dialogStates.editTransactionOpen} 
          handleClose={() => {
            updateDialogState('editTransactionOpen', false);
            setSelectedTransaction(null);
          }} 
          initialData={selectedTransaction}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
      
      {/* Share Wallet Form - special case with wallet selection */}
      <ShareWalletForm
        open={dialogStates.shareWalletDialog && selectedWallet}
        wallet={selectedWallet ? wallets.find(w => w.id === selectedWallet) : null}
        handleClose={() => {
          closeDialog('shareWalletDialog');
          setSelectedWallet(null);
        }}
        onWalletShared={() => {
          closeDialog('shareWalletDialog');
          setSelectedWallet(null);
          fetchFinancialData();
        }}
      />
      
      {/* Transfer Dialog - special embedded dialog */}
      <Dialog
        open={dialogStates.transferDialog}
        onClose={() => closeDialog('transferDialog')}
      >
        <DialogTitle>Transfer Money Between Wallets</DialogTitle>
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
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px',
          }
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Transaction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DialogManager; 