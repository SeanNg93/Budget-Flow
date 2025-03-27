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
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import { 
  AccountBalanceWallet as AccountBalanceWalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon
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
  handleAddBalance,
  timeRange = 'all',
  onTimeRangeChange,
  timeRangeLoading = false
}) => {
  const [balanceMenuAnchorEl, setBalanceMenuAnchorEl] = useState(null);

  // Time range options
  const timeRangeOptions = useMemo(() => [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '3m', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' }
  ], []);
  
  // Get the current time range label
  const currentTimeRangeLabel = useMemo(() => {
    const option = timeRangeOptions.find(opt => opt.value === timeRange);
    return option ? option.label : 'All time';
  }, [timeRange, timeRangeOptions]);

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
  
  const handleTimeRangeChange = useCallback((value) => {
    handleBalanceMenuClose();
    if (onTimeRangeChange && value !== timeRange) {
      onTimeRangeChange(value);
    }
  }, [handleBalanceMenuClose, onTimeRangeChange, timeRange]);

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
      {timeRangeLoading && (
        <CircularProgress 
          size={16} 
          thickness={4}
          sx={{ mr: 1 }}
          aria-label="Loading financial data"
        />
      )}
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
          <Badge
            color="primary"
            variant="dot"
            invisible={timeRange === 'all'}
            overlap="circular"
          >
            <MoreVertIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
    </>
  ), [handleAddBalance, handleBalanceMenuOpen, balanceMenuAnchorEl, timeRange, timeRangeLoading]);

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
        <ListItemIcon>
          <EditIcon fontSize="small" className={styles.menuIcon} aria-hidden="true" />
        </ListItemIcon>
        <ListItemText>Edit Balance</ListItemText>
      </MenuItem>
      <MenuItem onClick={onManageWallets} className={styles.menuItem}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" className={styles.menuIcon} aria-hidden="true" />
        </ListItemIcon>
        <ListItemText>Manage Wallets</ListItemText>
      </MenuItem>
      
      {onTimeRangeChange && (
        <>
          <Divider sx={{ my: 1 }} />
          
          <Typography 
            variant="caption" 
            color="textSecondary" 
            sx={{ px: 2, py: 0.5, display: 'flex', alignItems: 'center' }}
          >
            <TimeIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
            Time Range for Income, Expenses & Savings
          </Typography>
          
          {timeRangeOptions.map((option) => (
            <MenuItem 
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value)}
              selected={timeRange === option.value}
              className={styles.menuItem}
            >
              <ListItemIcon sx={{ minWidth: '32px' }}>
                {timeRange === option.value && (
                  <CheckIcon fontSize="small" color="primary" />
                )}
              </ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
            </MenuItem>
          ))}
        </>
      )}
    </Menu>
  ), [
    balanceMenuAnchorEl, 
    handleBalanceMenuClose, 
    onEditBalance, 
    onManageWallets, 
    onTimeRangeChange,
    timeRange,
    timeRangeOptions,
    handleTimeRangeChange
  ]);

  // Card configurations - Memoized to prevent unnecessary recalculations
  const cardConfigs = useMemo(() => {
    const { totalBalance, totalIncome, totalExpense, netSavings } = financialData;
    
    return [
      {
        title: `Total Balance${timeRange !== 'all' ? '' : ''}`,
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
        title: `Income${timeRange !== 'all' ? ` (${currentTimeRangeLabel})` : ''}`,
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
        title: `Expenses${timeRange !== 'all' ? ` (${currentTimeRangeLabel})` : ''}`,
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
        title: `Net Savings${timeRange !== 'all' ? ` (${currentTimeRangeLabel})` : ''}`,
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
    balanceMenu,
    timeRange,
    currentTimeRangeLabel
  ]);

  // Memoize grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => (
    cardConfigs.map((config, index) => (
      <Grid item xs={12} sm={6} md={config.gridSize} key={index}>
        <SummaryCard
          {...config}
          loading={loading}
        />
      </Grid>
    ))
  ), [cardConfigs, loading]);

  return <Grid container spacing={2.4}>{gridItems}</Grid>;
};

export default React.memo(SummaryCards); 