import React, { useState } from 'react';
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
import styles from '../../styles/walletManage.module.css';

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
      maxWidth="sm"
      PaperProps={{
        className: styles.dialogPaper,
        sx: {
          width: '450px',
          maxHeight: '85vh',
          margin: '16px'
        }
      }}
    >
      <DialogTitle className={styles.dialogTitle} sx={{ py: 1.5 }}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>
            Add Transaction
          </Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent} sx={{ py: 1.5, px: 2 }}>
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