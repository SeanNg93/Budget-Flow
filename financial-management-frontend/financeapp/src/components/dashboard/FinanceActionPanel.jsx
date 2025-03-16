import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Box,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import TransactionForm from './TransactionForm';
import WalletForm from './WalletForm';
import WalletManageForm from './WalletManageForm';
import styles from '../../styles/walletManage.module.css';

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  onTransactionAdded,
  onWalletAdded
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showWalletManage, setShowWalletManage] = useState(false);

  const handleTransactionClose = () => {
    if (onTransactionAdded) onTransactionAdded();
    handleClose();
  };

  const handleWalletClose = () => {
    if (onWalletAdded) onWalletAdded();
    handleClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setShowWalletManage(false);
  };

  const handleShowWalletManage = () => {
    setShowWalletManage(true);
  };

  const handleBackToWalletOptions = () => {
    setShowWalletManage(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>
            {activeTab === 0 ? 'Add Transaction' : 
             (showWalletManage ? 'Manage Wallets' : 'Add Wallet')}
          </Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box className={styles.tabsContainer}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="finance action tabs"
        >
          <Tab className={styles.tab} label="Transaction" />
          <Tab className={styles.tab} label="Wallet" />
        </Tabs>
      </Box>
      
      <DialogContent className={styles.dialogContent}>
        {activeTab === 0 && (
          <TransactionForm 
            open={true} 
            handleClose={handleTransactionClose}
            onTransactionAdded={onTransactionAdded}
            embedded={true}
          />
        )}
        
        {activeTab === 1 && !showWalletManage && (
          <Box className={styles.optionsContainer}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AccountBalanceWalletIcon />}
              onClick={() => setShowWalletManage(false)}
              className={`${styles.optionButton} ${styles.primaryButton}`}
            >
              Add New Wallet
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={handleShowWalletManage}
              className={styles.optionButton}
            >
              Manage Existing Wallets
            </Button>
            
            <Box sx={{ mt: 2 }}>
              <WalletForm 
                open={true} 
                handleClose={handleWalletClose}
                onWalletAdded={onWalletAdded}
                embedded={true}
              />
            </Box>
          </Box>
        )}
        
        {activeTab === 1 && showWalletManage && (
          <Box>
            <Button
              variant="text"
              color="primary"
              onClick={handleBackToWalletOptions}
              className={styles.backButton}
            >
              ← Back to wallet options
            </Button>
            
            <WalletManageForm 
              open={true} 
              handleClose={handleWalletClose}
              onWalletUpdated={onWalletAdded}
              embedded={true}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinanceActionPanel; 