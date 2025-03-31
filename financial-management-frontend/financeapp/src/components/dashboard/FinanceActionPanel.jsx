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
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TransferIcon from '@mui/icons-material/SwapHoriz';
import SendIcon from '@mui/icons-material/Send';
import CategoryIcon from '@mui/icons-material/Category';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TransactionForm from './TransactionForm';
import styles from '../../styles/walletManage.module.css';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  setTransactionFormOpen,
  setWalletManageFormOpen,
  setCategoryManageFormOpen,
  setUserTransferDialogOpen
}) => {
  // Add ref for transition
  const dialogRef = useRef(null);

  const handleOption = (option) => {
    handleClose();
    
    // Open the selected dialog
    switch (option) {
      case 'transaction':
        setTransactionFormOpen(true);
        break;
      case 'wallet':
        setWalletManageFormOpen(true);
        break;
      case 'category':
        setCategoryManageFormOpen(true);
        break;
      case 'transfer':
        setUserTransferDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const financeOptions = [
    {
      id: 'transaction',
      title: 'Add Transaction',
      description: 'Record income or expense transactions',
      icon: <AddIcon fontSize="large" />,
      color: '#4CAF50',
      action: () => handleOption('transaction')
    },
    {
      id: 'wallet',
      title: 'Manage Wallets',
      description: 'Create, edit, and manage your wallets',
      icon: <AccountBalanceWalletIcon fontSize="large" />,
      color: '#2196F3',
      action: () => handleOption('wallet')
    },
    {
      id: 'category',
      title: 'Manage Categories',
      description: 'Create and edit categories with spending limits',
      icon: <CategoryIcon fontSize="large" />,
      color: '#FF9800',
      action: () => handleOption('category')
    },
    {
      id: 'transfer',
      title: 'Transfer Money',
      description: 'Send money to other users',
      icon: <SendIcon fontSize="large" />,
      color: '#9C27B0',
      action: () => handleOption('transfer')
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      disableScrollLock={true}
      PaperProps={{
        className: styles.dialogPaper,
        sx: {
          width: '500px',
          maxHeight: '85vh',
          margin: '16px',
          overflow: 'hidden'
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
            Finance Options
          </Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent} sx={{ py: 1.5, px: 2 }}>
        <Grid container spacing={2}>
          {financeOptions.map((option) => (
            <Grid item xs={12} sm={6} key={option.id}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                    borderColor: 'transparent'
                  }
                }}
                onClick={option.action}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${option.color}15`,
                      color: option.color,
                      mr: 2
                    }}
                  >
                    {option.icon}
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {option.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceActionPanel; 