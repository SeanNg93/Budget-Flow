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
 * Individual SummaryCard component to reduce repetition
 */
const SummaryCard = ({ 
  title, 
  amount, 
  icon, 
  iconColor, 
  cardClass,
  amountClass, 
  amountColor,
  loading,
  extraHeader,
  extraContent
}) => (
  <Card className={`${styles.summaryCard} ${cardClass}`}>
    <CardHeader 
      title={
        <Box className={styles.cardHeaderContent}>
          <Box className={styles.cardTitleContainer}>
            {React.cloneElement(icon, { sx: { mr: 1, color: iconColor, fontSize: '1.33rem' } })}
            <Typography 
              variant="h6" 
              component="div" 
              className={styles.cardTitle}
            >
              {title}
            </Typography>
            {extraHeader}
          </Box>
        </Box>
      } 
    />
    <CardContent sx={{ pt: 0 }}>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Typography 
          variant="h4" 
          color={amountColor}
          className={amountClass}
        >
          {amount}
        </Typography>
      )}
      {extraContent}
    </CardContent>
  </Card>
);

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

  // Extra header content for balance card with add button and menu
  const balanceHeader = (
    <>
      <IconButton 
        color="primary" 
        size="small" 
        onClick={handleAddBalance}
        className={styles.addIconButton}
      >
        <AddIcon fontSize="small" />
      </IconButton>
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
    </>
  );

  // Extra content for balance card with menu
  const balanceMenu = (
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
  );

  // Card configurations
  const cardConfigs = [
    {
      title: 'Total Balance',
      icon: <AccountBalanceWalletIcon />,
      iconColor: '#007aff',
      amount: formatCurrency(financialData.totalBalance),
      cardClass: styles.balanceCard,
      amountClass: styles.balanceAmount,
      extraHeader: balanceHeader,
      extraContent: balanceMenu,
      gridSize: 3
    },
    {
      title: 'Income',
      icon: <TrendingUpIcon />,
      iconColor: '#34c759',
      amount: formatCurrency(financialData.totalIncome),
      cardClass: styles.incomeCard,
      amountClass: styles.incomeAmount,
      amountColor: 'success.main',
      gridSize: 3
    },
    {
      title: 'Expenses',
      icon: <TrendingDownIcon />,
      iconColor: '#ff3b30',
      amount: formatCurrency(financialData.totalExpense),
      cardClass: styles.expenseCard,
      amountClass: styles.expenseAmount,
      amountColor: 'error.main',
      gridSize: 3
    },
    {
      title: 'Net Savings',
      icon: <SavingsIcon />,
      iconColor: financialData.netSavings >= 0 ? '#34c759' : '#ff3b30',
      amount: formatCurrency(financialData.netSavings),
      cardClass: styles.savingsCard,
      amountClass: styles.savingsAmount,
      amountColor: financialData.netSavings >= 0 ? 'success.main' : 'error.main',
      gridSize: 3
    }
  ];

  return (
    <>
      {cardConfigs.map((config, index) => (
        <Grid item xs={12} md={config.gridSize} key={index}>
          <SummaryCard
            {...config}
            loading={loading}
          />
        </Grid>
      ))}
    </>
  );
};

export default SummaryCards; 