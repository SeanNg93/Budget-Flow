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
  Button,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import TransactionForm from './TransactionForm';
import WalletForm from './WalletForm';
import WalletManageForm from './WalletManageForm';
import CategoryForm from './CategoryForm';
import CategoryManageForm from './CategoryManageForm';
import styles from '../../styles/walletManage.module.css';

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  onTransactionAdded,
  onWalletAdded,
  onCategoryAdded
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showWalletManage, setShowWalletManage] = useState(false);
  const [showCategoryManage, setShowCategoryManage] = useState(false);

  const handleTransactionClose = () => {
    if (onTransactionAdded) onTransactionAdded();
    handleClose();
  };

  const handleWalletClose = () => {
    if (onWalletAdded) onWalletAdded();
    handleClose();
  };

  const handleCategoryClose = () => {
    if (onCategoryAdded) onCategoryAdded();
    handleClose();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setShowWalletManage(false);
    setShowCategoryManage(false);
  };

  const handleShowWalletManage = () => {
    setShowWalletManage(true);
  };

  const handleBackToWalletOptions = () => {
    setShowWalletManage(false);
  };

  const handleShowCategoryManage = () => {
    setShowCategoryManage(true);
  };

  const handleBackToCategoryOptions = () => {
    setShowCategoryManage(false);
  };

  const getDialogTitle = () => {
    if (activeTab === 0) return 'Add Transaction';
    if (activeTab === 1) return showWalletManage ? 'Manage Wallets' : 'Add Wallet';
    if (activeTab === 2) return showCategoryManage ? 'Manage Categories' : 'Add Category';
    return '';
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
            {getDialogTitle()}
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
          <Tab className={styles.tab} label="Category" />
        </Tabs>
      </Box>
      
      <DialogContent className={styles.dialogContent}>
        {/* Transaction Tab */}
        {activeTab === 0 && (
          <TransactionForm 
            open={true} 
            handleClose={handleTransactionClose}
            onTransactionAdded={onTransactionAdded}
            embedded={true}
          />
        )}
        
        {/* Wallet Tab */}
        {activeTab === 1 && !showWalletManage && (
          <Box className={styles.optionsContainer}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={() => setShowWalletManage(false)}
                  className={`${styles.optionButton} ${styles.primaryButton}`}
                  fullWidth
                  size="small"
                >
                  Add New Wallet
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SettingsIcon />}
                  onClick={handleShowWalletManage}
                  className={styles.optionButton}
                  fullWidth
                  size="small"
                >
                  Manage Wallets
                </Button>
              </Grid>
            </Grid>
            
            <Box>
              <WalletForm 
                open={true} 
                handleClose={handleWalletClose}
                onWalletAdded={onWalletAdded}
                embedded={true}
                compact={true}
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

        {/* Category Tab */}
        {activeTab === 2 && !showCategoryManage && (
          <Box className={styles.optionsContainer}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CategoryIcon />}
                  onClick={() => setShowCategoryManage(false)}
                  className={`${styles.optionButton} ${styles.primaryButton}`}
                  fullWidth
                  size="small"
                >
                  Add New Category
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SettingsIcon />}
                  onClick={handleShowCategoryManage}
                  className={styles.optionButton}
                  fullWidth
                  size="small"
                >
                  Manage Categories
                </Button>
              </Grid>
            </Grid>
            
            <Box>
              <CategoryForm 
                open={true} 
                handleClose={handleCategoryClose}
                onCategoryAdded={onCategoryAdded}
                embedded={true}
                compact={true}
              />
            </Box>
          </Box>
        )}
        
        {activeTab === 2 && showCategoryManage && (
          <Box>
            <Button
              variant="text"
              color="primary"
              onClick={handleBackToCategoryOptions}
              className={styles.backButton}
            >
              ← Back to category options
            </Button>
            
            <CategoryManageForm 
              open={true} 
              handleClose={handleCategoryClose}
              onCategoryUpdated={onCategoryAdded}
              embedded={true}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinanceActionPanel; 