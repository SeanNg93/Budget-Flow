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

  return (
    <>
      {/* Finance Action Panel */}
      <FinanceActionPanel 
        open={dialogStates.financeActionPanel} 
        handleClose={() => closeDialog('financeActionPanel')} 
        setTransactionFormOpen={() => updateDialogState('transactionForm', true)}
        setWalletManageFormOpen={() => updateDialogState('walletManageForm', true)}
        setCategoryManageFormOpen={() => updateDialogState('categoryManageForm', true)}
        setUserTransferDialogOpen={() => updateDialogState('userTransferDialog', true)}
      />
      
      {/* Wallet Management Form */}
      <WalletManageForm 
        open={dialogStates.walletManageForm} 
        handleClose={() => closeDialog('walletManageForm')} 
        onWalletUpdated={handleAccountAdded}
      />
      
      {/* Transaction Form */}
      <TransactionForm 
        open={dialogStates.transactionForm} 
        handleClose={() => closeDialog('transactionForm')} 
        onTransactionAdded={handleTransactionAdded}
      />
      
      {/* Wallet Form */}
      <WalletForm 
        open={dialogStates.accountForm} 
        handleClose={() => closeDialog('accountForm')} 
        onWalletAdded={handleAccountAdded}
      />
      
      {/* Category Form */}
      <CategoryForm 
        open={dialogStates.categoryForm} 
        handleClose={() => closeDialog('categoryForm')} 
        onCategoryAdded={handleCategoryAdded}
      />
      
      {/* Category Management Form */}
      <CategoryManageForm 
        open={dialogStates.categoryManageForm} 
        handleClose={() => closeDialog('categoryManageForm')}
        onCategoryUpdated={handleCategoryUpdated}
      />
      
      {/* Add Balance Form */}
      <AddBalanceForm 
        open={dialogStates.addBalanceForm} 
        handleClose={() => closeDialog('addBalanceForm')} 
        onBalanceAdded={handleBalanceAdded}
      />
      
      {/* Edit Balance Form */}
      <EditBalanceForm 
        open={dialogStates.editBalanceForm} 
        handleClose={() => closeDialog('editBalanceForm')} 
        onBalanceEdited={handleBalanceAdded}
      />
      
      {/* Profile Dialog */}
      <ProfileDialog
        open={dialogStates.profileDialog}
        handleClose={() => closeDialog('profileDialog')}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {/* Edit Transaction Form */}
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
      
      {/* User Transfer Form */}
      <UserTransferForm
        open={dialogStates.userTransferDialog}
        handleClose={() => closeDialog('userTransferDialog')}
        onTransferCompleted={() => {
          closeDialog('userTransferDialog');
          fetchFinancialData();
        }}
      />
      
      {/* Share Wallet Form */}
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
      
      {/* Transfer Dialog */}
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