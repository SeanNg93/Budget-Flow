import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TransactionForm from './TransactionForm';

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  onTransactionAdded
}) => {
  const handleTransactionClose = () => {
    if (onTransactionAdded) onTransactionAdded();
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Add Transaction</Typography>
          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <TransactionForm 
          open={true} 
          handleClose={handleTransactionClose}
          onTransactionAdded={onTransactionAdded}
          embedded={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FinanceActionPanel; 