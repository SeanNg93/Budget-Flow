import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Box,
  IconButton,
  Typography,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TransactionForm from './TransactionForm';
import styles from '../../styles/walletManage.module.css';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  onTransactionAdded
}) => {
  // Add ref for transition
  const dialogRef = useRef(null);

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
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
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