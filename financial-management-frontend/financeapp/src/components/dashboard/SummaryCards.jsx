import React, { useState, useMemo, useCallback } from 'react';
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
  CircularProgress,
  Tooltip
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
 * CardHeader component for consistent header styling across cards
 */
const CardTitleWithIcon = React.memo(({ icon, iconColor, title, extraContent }) => (
  <Box className={styles.cardHeaderContent}>
    <Box className={styles.cardTitleContainer}>
      {React.cloneElement(icon, { 
        sx: { mr: 1, color: iconColor, fontSize: '1.33rem' },
        "aria-hidden": true 
      })}
      <Typography 
        variant="h6" 
        component="div" 
        className={styles.cardTitle}
      >
        {title}
      </Typography>
      {extraContent}
    </Box>
  </Box>
));

/**
 * Individual SummaryCard component to reduce repetition
 */
const SummaryCard = React.memo(({ 
  title, 
  amount, 
  icon, 
  iconColor, 
  cardClass,
  amountClass, 
  amountColor,
  loading,
  extraHeader,
  extraContent,
  accessibleLabel
}) => (
  <Card 
    className={`${styles.summaryCard} ${cardClass}`}
    aria-label={accessibleLabel || title}
  >
    <CardHeader 
      title={
        <CardTitleWithIcon 
          icon={icon}
          iconColor={iconColor}
          title={title}
          extraContent={extraHeader}
        />
      } 
    />
    <CardContent sx={{ pt: 0 }}>
      {loading ? (
        <CircularProgress size={24} aria-label={`Loading ${title.toLowerCase()} data`} />
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
));

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

  // Memoize event handlers
  const handleBalanceMenuOpen = useCallback((event) => {
    setBalanceMenuAnchorEl(event.currentTarget);
  }, []);

  const handleBalanceMenuClose = useCallback(() => {
    setBalanceMenuAnchorEl(null);
  }, []);

  const onEditBalance = useCallback(() => {
    handleBalanceMenuClose();
    handleEditBalance();
  }, [handleBalanceMenuClose, handleEditBalance]);

  const onManageWallets = useCallback(() => {
    handleBalanceMenuClose();
    handleManageWallets();
  }, [handleBalanceMenuClose, handleManageWallets]);

  // Memoize the currency formatter
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Extra header content for balance card with add button and menu
  const balanceHeader = useMemo(() => (
    <>
      <Tooltip title="Add balance">
        <IconButton 
          color="primary" 
          size="small" 
          onClick={handleAddBalance}
          className={styles.addIconButton}
          aria-label="Add balance"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Balance options">
        <IconButton
          aria-label="Balance options"
          aria-controls={Boolean(balanceMenuAnchorEl) ? "balance-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={Boolean(balanceMenuAnchorEl) ? "true" : undefined}
          onClick={handleBalanceMenuOpen}
          size="small"
          className={styles.moreOptionsButton}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  ), [handleAddBalance, handleBalanceMenuOpen, balanceMenuAnchorEl]);

  // Extra content for balance card with menu
  const balanceMenu = useMemo(() => (
    <Menu
      id="balance-menu"
      anchorEl={balanceMenuAnchorEl}
      keepMounted
      open={Boolean(balanceMenuAnchorEl)}
      onClose={handleBalanceMenuClose}
      PaperProps={{
        className: styles.menuPaper
      }}
      MenuListProps={{
        'aria-labelledby': 'balance-options-button',
        dense: true
      }}
    >
      <MenuItem onClick={onEditBalance} className={styles.menuItem}>
        <EditIcon fontSize="small" className={styles.menuIcon} aria-hidden="true" />
        Edit Balance
      </MenuItem>
      <MenuItem onClick={onManageWallets} className={styles.menuItem}>
        <SettingsIcon fontSize="small" className={styles.menuIcon} aria-hidden="true" />
        Manage Wallets
      </MenuItem>
    </Menu>
  ), [balanceMenuAnchorEl, handleBalanceMenuClose, onEditBalance, onManageWallets]);

  // Card configurations - Memoized to prevent unnecessary recalculations
  const cardConfigs = useMemo(() => {
    const { totalBalance, totalIncome, totalExpense, netSavings } = financialData;
    
    return [
      {
        title: 'Total Balance',
        icon: <AccountBalanceWalletIcon />,
        iconColor: '#007aff',
        amount: formatCurrency(totalBalance),
        cardClass: styles.balanceCard,
        amountClass: styles.balanceAmount,
        extraHeader: balanceHeader,
        extraContent: balanceMenu,
        gridSize: 3,
        accessibleLabel: `Total Balance: ${formatCurrency(totalBalance)}`
      },
      {
        title: 'Income',
        icon: <TrendingUpIcon />,
        iconColor: '#34c759',
        amount: formatCurrency(totalIncome),
        cardClass: styles.incomeCard,
        amountClass: styles.incomeAmount,
        amountColor: 'success.main',
        gridSize: 3,
        accessibleLabel: `Income: ${formatCurrency(totalIncome)}`
      },
      {
        title: 'Expenses',
        icon: <TrendingDownIcon />,
        iconColor: '#ff3b30',
        amount: formatCurrency(totalExpense),
        cardClass: styles.expenseCard,
        amountClass: styles.expenseAmount,
        amountColor: 'error.main',
        gridSize: 3,
        accessibleLabel: `Expenses: ${formatCurrency(totalExpense)}`
      },
      {
        title: 'Net Savings',
        icon: <SavingsIcon />,
        iconColor: netSavings >= 0 ? '#34c759' : '#ff3b30',
        amount: formatCurrency(netSavings),
        cardClass: styles.savingsCard,
        amountClass: styles.savingsAmount,
        amountColor: netSavings >= 0 ? 'success.main' : 'error.main',
        gridSize: 3,
        accessibleLabel: `Net Savings: ${formatCurrency(netSavings)}`
      }
    ];
  }, [
    financialData,
    formatCurrency,
    balanceHeader,
    balanceMenu
  ]);

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => (
    cardConfigs.map((config, index) => (
      <Grid item xs={12} md={config.gridSize} key={index}>
        <SummaryCard
          {...config}
          loading={loading}
        />
      </Grid>
    ))
  ), [cardConfigs, loading]);

  return <>{gridItems}</>;
};

export default React.memo(SummaryCards); 