import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/dashboard.module.css';

const WalletOverview = ({ onManageWallets }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await FinanceService.getWallets();
      setWallets(response.data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get the appropriate icon based on account type
  const getWalletIcon = (accountType) => {
    switch(accountType?.toLowerCase()) {
      case 'savings':
        return <SavingsIcon className={styles.walletIcon} />;
      case 'credit card':
        return <CreditCardIcon className={styles.walletIcon} />;
      case 'cash':
        return <PaymentsIcon className={styles.walletIcon} />;
      default:
        return <AccountBalanceWalletIcon className={styles.walletIcon} />;
    }
  };

  return (
    <Paper className={styles.walletOverviewCard}>
      <Box className={styles.walletOverviewHeader}>
        <Typography 
          component="h2" 
          variant="h5" 
          color="text.primary" 
          className={styles.sectionTitle}
        >
          Your Wallets
          {wallets.length > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}>
              ({wallets.length})
            </Typography>
          )}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onManageWallets}
          className={styles.manageWalletsButton}
          size="small"
          startIcon={<SettingsIcon />}
        >
          Manage Wallets
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      ) : wallets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You don't have any wallets yet. Create one to get started!
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onManageWallets}
            size="small"
          >
            Create Wallet
          </Button>
        </Box>
      ) : (
        <Box className={styles.walletsList}>
          {wallets.map((wallet) => (
            <Box key={wallet.id} className={styles.walletItem}>
              <Typography variant="h6" className={styles.walletName}>
                {getWalletIcon(wallet.accountType)}
                {wallet.accountName}
              </Typography>
              <Typography variant="h4" className={styles.walletBalance}>
                ${wallet.balance.toFixed(2)}
              </Typography>
              <Divider sx={{ my: 1, opacity: 0.6 }} />
              <Typography variant="body2" className={styles.walletType}>
                {wallet.accountType || "General Account"}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default WalletOverview; 