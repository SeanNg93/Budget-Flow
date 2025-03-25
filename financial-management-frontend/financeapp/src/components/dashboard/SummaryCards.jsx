import React, { useState } from 'react';
import { 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  AccountBalanceWallet as AccountBalanceWalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import styles from '../../styles/dashboard.module.css';

/**
 * SummaryCards component displays the financial summary cards:
 * - Total Balance
 * - Income
 * - Expenses
 * - Net Savings
 */
const SummaryCards = ({ 
  financialData, 
  loading, 
  handleEditBalance, 
  handleManageWallets, 
  handleAddBalance 
}) => {
  const [balanceMenuAnchorEl, setBalanceMenuAnchorEl] = useState(null);

  const handleBalanceMenuOpen = (event) => {
    setBalanceMenuAnchorEl(event.currentTarget);
  };

  const handleBalanceMenuClose = () => {
    setBalanceMenuAnchorEl(null);
  };

  const onEditBalance = () => {
    handleBalanceMenuClose();
    handleEditBalance();
  };

  const onManageWallets = () => {
    handleBalanceMenuClose();
    handleManageWallets();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <Grid item xs={12} md={3}>
        <Card className={`${styles.summaryCard} ${styles.balanceCard}`}>
          <CardHeader 
            title={
              <Box className={styles.cardHeaderContent}>
                <Box className={styles.cardTitleContainer}>
                  <AccountBalanceWalletIcon 
                    sx={{ mr: 1, color: '#007aff', fontSize: '1.33rem' }} 
                  />
                  <Typography 
                    variant="h6" 
                    component="div" 
                    className={styles.cardTitle}
                  >
                    Total Balance
                  </Typography>
                  <IconButton 
                    color="primary" 
                    size="small" 
                    onClick={handleAddBalance}
                    className={styles.addIconButton}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <IconButton
                  aria-label="more options"
                  aria-controls="balance-menu"
                  aria-haspopup="true"
                  onClick={handleBalanceMenuOpen}
                  size="small"
                  className={styles.moreOptionsButton}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            } 
          />
          <Menu
            id="balance-menu"
            anchorEl={balanceMenuAnchorEl}
            keepMounted
            open={Boolean(balanceMenuAnchorEl)}
            onClose={handleBalanceMenuClose}
            PaperProps={{
              className: styles.menuPaper
            }}
          >
            <MenuItem onClick={onEditBalance} className={styles.menuItem}>
              <EditIcon fontSize="small" className={styles.menuIcon} />
              Edit Balance
            </MenuItem>
            <MenuItem onClick={onManageWallets} className={styles.menuItem}>
              <SettingsIcon fontSize="small" className={styles.menuIcon} />
              Manage Wallets
            </MenuItem>
          </Menu>
          <CardContent sx={{ pt: 0 }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography 
                variant="h4" 
                className={styles.balanceAmount}
              >
                {formatCurrency(financialData.totalBalance)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className={`${styles.summaryCard} ${styles.incomeCard}`}>
          <CardHeader 
            title={
              <Box className={styles.cardTitleContainer}>
                <TrendingUpIcon 
                  sx={{ mr: 1, color: '#34c759', fontSize: '1.33rem' }} 
                />
                <Typography 
                  variant="h6" 
                  component="div" 
                  className={styles.cardTitle}
                >
                  Income
                </Typography>
              </Box>
            } 
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography 
                variant="h4" 
                color="success.main"
                className={styles.incomeAmount}
              >
                {formatCurrency(financialData.totalIncome)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className={`${styles.summaryCard} ${styles.expenseCard}`}>
          <CardHeader 
            title={
              <Box className={styles.cardTitleContainer}>
                <TrendingDownIcon 
                  sx={{ mr: 1, color: '#ff3b30', fontSize: '1.33rem' }} 
                />
                <Typography 
                  variant="h6" 
                  component="div" 
                  className={styles.cardTitle}
                >
                  Expenses
                </Typography>
              </Box>
            } 
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography 
                variant="h4" 
                color="error.main"
                className={styles.expenseAmount}
              >
                {formatCurrency(financialData.totalExpense)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card className={`${styles.summaryCard} ${styles.savingsCard}`}>
          <CardHeader 
            title={
              <Box className={styles.cardTitleContainer}>
                <SavingsIcon 
                  sx={{ mr: 1, color: financialData.netSavings >= 0 ? '#34c759' : '#ff3b30', fontSize: '1.33rem' }} 
                />
                <Typography 
                  variant="h6" 
                  component="div" 
                  className={styles.cardTitle}
                >
                  Net Savings
                </Typography>
              </Box>
            } 
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography 
                variant="h4" 
                color={financialData.netSavings >= 0 ? "success.main" : "error.main"}
                className={styles.savingsAmount}
              >
                {formatCurrency(financialData.netSavings)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default SummaryCards; 