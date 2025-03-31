import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  InputBase,
  Fade,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Avatar,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { subDays } from 'date-fns';
import styles from '../../styles/dashboard.module.css';
import { exportTransactionsToExcel } from '../../utils/excelExport';
import FinanceService from '../../services/FinanceService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Constants with translation
const getTimePeriods = (t) => [
  { value: 'day', label: t('timeRanges.last24Hours'), days: 1 },
  { value: 'week', label: t('timeRanges.last7Days'), days: 7 },
  { value: 'month', label: t('timeRanges.last30Days'), days: 30 },
  { value: 'quarter', label: t('timeRanges.last3Months'), days: 90 },
  { value: 'year', label: t('timeRanges.lastYear'), days: 365 },
  { value: 'all', label: t('timeRanges.allTime'), days: null },
  { value: 'custom', label: t('timeRanges.customRange'), days: null }
];

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Date Picker components for custom date range
const DateRangePickers = ({ customStartDate, customEndDate, handleStartDateChange, handleEndDateChange, t }) => (
  <>
    <Box sx={{ flex: 1 }}>
      <DatePicker 
        label={t('transactions.filters.startDate')}
        value={customStartDate}
        onChange={handleStartDateChange}
        className={styles.filterDateField}
        format='dd/MM/yyyy'
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            inputProps: { 'aria-label': t('transactions.filters.startDateAriaLabel') }
          }
        }}
      />
    </Box>
    <Box sx={{ flex: 1 }}>
      <DatePicker 
        label={t('transactions.filters.endDate')}
        value={customEndDate}
        onChange={handleEndDateChange}
        className={styles.filterDateField}
        format='dd/MM/yyyy'
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            inputProps: { 'aria-label': t('transactions.filters.endDateAriaLabel') }
          }
        }}
      />
    </Box>
  </>
);

// Filter action buttons
const FilterActionButtons = ({ resetTransactionFilters, applyTransactionFilters, isFiltering, t }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
    width: '100%', 
    gap: 2,
    mt: { xs: 2, md: 0 }
  }}>
    <Button
      color="primary"
      onClick={resetTransactionFilters}
      className={styles.resetFilterButton}
      disabled={isFiltering}
      aria-label={t('transactions.filters.resetAriaLabel')}
      sx={{ 
        minWidth: '80px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {t('transactions.filters.reset')}
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={applyTransactionFilters}
      className={styles.applyFilterButton}
      disabled={isFiltering}
      aria-label={t('transactions.filters.applyAriaLabel')}
      sx={{ 
        minWidth: '120px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {isFiltering ? t('transactions.filters.loading') : t('transactions.filters.apply')}
    </Button>
  </Box>
);

// Transaction amount display component
const TransactionAmount = ({ transaction, formatCurrency }) => {
  const isIncome = transaction.transactionType === 'INCOME';
  return (
    <Typography 
      variant="body2" 
      color={isIncome ? "success.main" : "error.main"} 
      sx={{ fontWeight: 600 }}
    >
      {isIncome ? '+' : '-'}
      {formatCurrency(transaction.amount, transaction.currency)}
    </Typography>
  );
};

// Transaction table row component
const TransactionRow = React.memo(({ 
  transaction, 
  formatCurrency, 
  sharedWallets, 
  sharedWalletsInfo,
  onEditTransaction, 
  onDeleteTransaction,
  t
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.id;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };
  
  // Check if current user is the creator of the transaction
  const isCreator = useMemo(() => {
    const currentUserId = getCurrentUserId();
    return currentUserId && transaction.user && currentUserId === transaction.user.id;
  }, [transaction.user]);
  
  const DESCRIPTION_CHAR_LIMIT = 40;
  
  // Toggle description expansion
  const toggleDescription = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setDescriptionExpanded(prev => !prev);
  };
  
  // Format description with truncation if needed
  const formattedDescription = useMemo(() => {
    if (!transaction.description) return '';
    
    // If expanded or description is shorter than limit, show full description
    if (descriptionExpanded || transaction.description.length <= DESCRIPTION_CHAR_LIMIT) {
      return transaction.description;
    }
    
    // Otherwise truncate with ellipsis
    return `${transaction.description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`;
  }, [transaction.description, descriptionExpanded, DESCRIPTION_CHAR_LIMIT]);
  
  // Get the appropriate profile picture URL for the transaction author in a shared wallet
  const getProfilePictureUrl = () => {
    if (!transaction.user || !transaction.wallet || !sharedWallets[transaction.wallet.id]) {
      return null;
    }
    
    const walletInfo = sharedWalletsInfo[transaction.wallet.id];
    if (!walletInfo) return transaction.user.profilePicture;
    
    // Check if this user is the owner or the shared user
    if (transaction.user.id === walletInfo.ownerId) {
      return walletInfo.ownerProfilePictureUrl || transaction.user.profilePicture;
    } else if (transaction.user.id === walletInfo.sharedWithId) {
      return walletInfo.sharedWithProfilePictureUrl || transaction.user.profilePicture;
    }
    
    return transaction.user.profilePicture;
  };
  
  return (
  <TableRow 
    key={transaction.id}
    className={styles.tableRow}
      sx={{ 
        backgroundColor: descriptionExpanded ? 'rgba(0, 0, 0, 0.01)' : 'inherit',
        '& > td': {
          borderBottom: descriptionExpanded ? 'none' : '1px solid rgba(224, 224, 224, 0.5)'
        }
      }}
  >
    {/* ID cell */}
    <TableCell className={styles.tableCell}>{transaction.id}</TableCell>
    <TableCell className={styles.tableCell}>{formatDate(transaction.transactionDate)}</TableCell>
      
      {/* Description cell with special handling */}
      {descriptionExpanded ? (
        <TableCell 
          colSpan={7}
          sx={{ 
            padding: '8px 16px',
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderLeft: '1px solid rgba(224, 224, 224, 0.5)',
            borderRight: '1px solid rgba(224, 224, 224, 0.5)',
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
            borderTop: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
                fontSize: '14px',
                width: '100%',
                mb: 1
              }}
            >
              {transaction.description}
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                width: '100%', 
                mt: 0.5 
              }}
            >
              <Button
                size="small"
                variant="text"
                color="primary"
                onClick={toggleDescription}
                sx={{
                  minWidth: 'auto',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                Click to collapse
              </Button>
            </Box>
          </Box>
        </TableCell>
      ) : (
        <>
          <TableCell 
            className={styles.tableCellBold}
            onClick={toggleDescription}
            sx={{ 
              cursor: 'pointer',
              position: 'relative',
              maxWidth: '250px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}
            >
              <Typography
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {formattedDescription}
              </Typography>
              {transaction.description && transaction.description.length > DESCRIPTION_CHAR_LIMIT && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1,
                    backgroundColor: 'rgba(0, 122, 255, 0.08)',
                    borderRadius: '4px',
                    padding: '1px 4px',
                    fontSize: '10px',
                    color: '#007aff',
                    fontWeight: 500,
                    flexShrink: 0
                  }}
                >
                  {t('transactions.more')}
                </Typography>
              )}
            </Box>
          </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.category ? transaction.category.categoryName : 
       (transaction.categoryId ? `${t('transactions.category')} #${transaction.categoryId}` : t('transactions.uncategorized'))}
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.wallet ? (
        // Wallet exists, display normally
        <>
          {transaction.wallet.accountName}
          {sharedWallets[transaction.wallet.id] && ` (${t('transactions.shared')})`}
        </>
      ) : transaction.originalWalletName ? (
        // Wallet is null, but we have the original name
        <Typography variant="body2" component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          {transaction.originalWalletName} ({t('transactions.deleted')})
        </Typography>
      ) : (
        // Wallet is null and no original name (fallback)
        <Typography variant="body2" component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          ({t('transactions.deletedWallet')})
        </Typography>
      )}
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      <Box
        className={transaction.transactionType === 'INCOME' 
          ? styles.incomeTag 
          : styles.expenseTag}
        sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Typography 
                component="span"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: 'inherit'
                }}
      >
        {transaction.transactionType}
              </Typography>
              {transaction.wallet && sharedWallets[transaction.wallet.id] && transaction.user && (
          <Tooltip 
            title={`Created by: ${transaction.user.username}`}
            arrow
            placement="top"
            classes={{ tooltip: styles.creatorTooltip }}
          >
            <Avatar
                    src={getProfilePictureUrl() || undefined}
                    alt={transaction.user.username || 'User'}
              className={styles.creatorAvatar}
                    imgProps={{
                      loading: "eager",
                      onError: (e) => {
                        console.log("Profile image failed to load for", transaction.user.username, "profilePicture:", getProfilePictureUrl());
                        e.target.onerror = null;
                        e.target.src = '';
                      }
                    }}
                    sx={{
                      bgcolor: getProfilePictureUrl() ? 'transparent' : '#1976d2',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
            >
              {transaction.user.username ? transaction.user.username.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      <TransactionAmount 
        transaction={transaction} 
        formatCurrency={formatCurrency} 
      />
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {isCreator ? (
          // Edit button for transaction creator
          <Tooltip title={t('transactions.editTransaction')} arrow placement="top">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => onEditTransaction(transaction)}
              className={styles.editButton}
              sx={{ mx: 0.5 }}
              aria-label={`${t('transactions.editTransaction')}: ${transaction.description}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          // Disabled edit button for non-creators with explanatory tooltip
          <Tooltip title={t('transactions.cannotEditOthersTransaction')} arrow placement="top">
            <span>
              <IconButton 
                size="small" 
                color="primary" 
                disabled={true}
                className={styles.editButtonDisabled}
                sx={{ mx: 0.5, opacity: 0.5 }}
                aria-label={`${t('transactions.cannotEditTransaction')}: ${transaction.description}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        
        {isCreator ? (
          // Delete button for transaction creator
          <Tooltip title={t('transactions.deleteTransaction')} arrow placement="top">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDeleteTransaction(transaction)}
              className={styles.deleteButton}
              sx={{ mx: 0.5 }}
              aria-label={`${t('transactions.deleteTransaction')}: ${transaction.description}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          // Disabled delete button for non-creators with explanatory tooltip
          <Tooltip title={t('transactions.cannotDeleteOthersTransaction')} arrow placement="top">
            <span>
              <IconButton 
                size="small" 
                color="error" 
                disabled={true}
                className={styles.deleteButtonDisabled}
                sx={{ mx: 0.5, opacity: 0.5 }}
                aria-label={`${t('transactions.cannotDeleteTransaction')}: ${transaction.description}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </TableCell>
        </>
      )}
  </TableRow>
  );
});

// Empty or loading state component
const TableStateMessage = ({ message }) => (
  <Box className={styles.emptyTransactionsBox}>
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Search input component
const SearchInput = React.memo(({ 
  searchOpen, 
  searchTerm, 
  handleSearchChange, 
  searchInputRef, 
  resetSearch, 
  toggleSearch,
  t 
}) => (
  <Box className={styles.searchContainer}>
    <Fade in={searchOpen} timeout={300}>
      <Box className={`${styles.searchInputContainer} ${searchOpen ? styles.searchOpen : ''}`}>
        <InputBase
          placeholder={t('transactions.searchPlaceholder')}
          className={styles.searchInput}
          value={searchTerm}
          onChange={handleSearchChange}
          inputRef={searchInputRef}
          endAdornment={
            searchTerm && (
              <IconButton 
                size="small" 
                onClick={resetSearch}
                className={styles.clearSearchButton}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          }
        />
      </Box>
    </Fade>
    <IconButton 
      size="small"
      onClick={toggleSearch}
      color={searchOpen ? "primary" : "default"}
      className={styles.searchButton}
    >
      {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
    </IconButton>
  </Box>
));

/**
 * TransactionsSection displays the transactions list with filtering and search functionality
 */
const TransactionsSection = ({
  transactions,
  allTransactions,
  filteredTransactions,
  categories,
  wallets,
  sharedWallets,
  sharedWalletsInfo,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onApplyFilters,
  onResetFilters,
  formatCurrency,
  isDashboard = true // New prop to indicate if this is the dashboard view (defaults to true for backward compatibility)
}) => {
  const { t } = useTranslation();
  const TIME_PERIODS = getTimePeriods(t);
  
  // Filter state
  const [filterState, setFilterState] = useState({
    open: false,
    timeframe: 'week',
    walletId: 'all',
    categoryId: 'all',
    minAmount: '',
    maxAmount: '',
    transactionType: 'all',
    userId: 'all',
    isLoading: false,
    showCustomDateRange: false,
    customStartDate: subDays(new Date(), 7),
    customEndDate: new Date()
  });
  
  // Search state
  const [searchState, setSearchState] = useState({
    open: false,
    term: '',
    results: []
  });
  
  const searchInputRef = useRef(null);

  // Update filter state with a single setter
  const updateFilterState = useCallback((updates) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update search state with a single setter
  const updateSearchState = useCallback((updates) => {
    setSearchState(prev => ({ ...prev, ...updates }));
  }, []);

  // Function to handle timeframe changes
  const handleTimeframeChange = useCallback((event) => {
    const value = event.target.value;
    updateFilterState({ 
      timeframe: value, 
      showCustomDateRange: value === 'custom' 
    });
  }, [updateFilterState]);

  // Helper to calculate filter parameters
  const calculateFilterParams = useCallback(() => {
    const { timeframe, showCustomDateRange, customStartDate, customEndDate, walletId, categoryId, minAmount, maxAmount, transactionType, userId } = filterState;
    const filterParams = {};
    
    // Calculate date range
    if (showCustomDateRange && customStartDate && customEndDate) {
      // For custom date range, use the exact dates selected
      filterParams.startDate = new Date(customStartDate);
      filterParams.startDate.setHours(0, 0, 0, 0); // Start of day
      
      filterParams.endDate = new Date(customEndDate);
      filterParams.endDate.setHours(23, 59, 59, 999); // End of day
      
      // Convert to ISO string for API
      filterParams.startDate = filterParams.startDate.toISOString();
      filterParams.endDate = filterParams.endDate.toISOString();
    } else if (timeframe !== 'all') {
      // Find the time period configuration
      const period = TIME_PERIODS.find(p => p.value === timeframe);
      
      if (period && period.days) {
        // Calculate proper date range from now
        const now = new Date();
        now.setHours(23, 59, 59, 999); // End of today
        
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - period.days);
        startDate.setHours(0, 0, 0, 0); // Start of the day
        
        filterParams.startDate = startDate.toISOString();
        filterParams.endDate = now.toISOString();
      }
    }
    
    // Add wallet filter if not "all"
    if (walletId !== 'all') {
      filterParams.walletId = walletId;
    }
    
    // Add category filter if not "all"
    if (categoryId !== 'all') {
      filterParams.categoryId = categoryId;
    }
    
    // Add transaction type filter if not "all"
    if (transactionType !== 'all') {
      filterParams.transactionType = transactionType;
    }
    
    // Add user filter if not "all"
    if (userId !== 'all') {
      filterParams.userId = userId;
    }
    
    // Add amount range filters if provided and valid
    if (minAmount && !isNaN(parseFloat(minAmount))) {
      filterParams.minAmount = parseFloat(minAmount);
    }
    
    if (maxAmount && !isNaN(parseFloat(maxAmount))) {
      filterParams.maxAmount = parseFloat(maxAmount);
    }
    
    return filterParams;
  }, [filterState, TIME_PERIODS]);

  // Function to apply filters
  const applyTransactionFilters = useCallback(() => {
    updateFilterState({ isLoading: true });
    
    // Get filter parameters
    const filterParams = calculateFilterParams();
    
    // We'll use client-side filtering for all filters to ensure consistent behavior
    // Get all transactions first to ensure we have a complete dataset
    FinanceService.getTransactions()
      .then(response => {
        let transactions = response.data || [];
        
        // Apply date range filter
        if (filterParams.startDate && filterParams.endDate) {
          const startDate = new Date(filterParams.startDate);
          const endDate = new Date(filterParams.endDate);
          
          // Set hours to ensure full day coverage
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          transactions = transactions.filter(t => {
            const tDate = new Date(t.transactionDate);
            return tDate >= startDate && tDate <= endDate;
          });
        }
        
        // Apply wallet filter - Fix for wallet filter not working
        if (filterParams.walletId && filterParams.walletId !== 'all') {
          const targetWalletId = filterParams.walletId.toString();
          transactions = transactions.filter(t => {
            // Check both possible wallet ID storage locations
            if (t.wallet && t.wallet.id) {
              return t.wallet.id.toString() === targetWalletId;
            }
            if (t.account && t.account.id) {
              return t.account.id.toString() === targetWalletId;
            }
            // If using just walletId property
            if (t.walletId) {
              return t.walletId.toString() === targetWalletId;
            }
            return false;
          });
        }
        
        // Apply category filter - Fix for category filter not working
        if (filterParams.categoryId && filterParams.categoryId !== 'all') {
          const targetCategoryId = filterParams.categoryId.toString();
          transactions = transactions.filter(t => {
            // Check both possible category ID storage locations
            if (t.category && t.category.id) {
              return t.category.id.toString() === targetCategoryId;
            }
            if (t.categoryId) {
              return t.categoryId.toString() === targetCategoryId;
            }
            return false;
          });
        }
        
        // Apply transaction type filter
        if (filterState.transactionType !== 'all') {
          transactions = transactions.filter(t => t.transactionType === filterState.transactionType);
        }
        
        // Apply user filter
        if (filterState.userId !== 'all') {
          transactions = transactions.filter(t => {
            // Handle both normal user IDs and potentially shared wallet transactions
            if (!t.user) return false;
            
            // Check numeric part of ID for shared wallet transactions
            const userId = t.user.id.toString();
            const targetId = filterState.userId.toString();
            
            if (userId === targetId) return true;
            
            // For special ID formats like "123:string", compare just the numeric part
            if (userId.includes(':')) {
              const numericPart = userId.split(':')[0];
              return numericPart === targetId;
            }
            
            return false;
          });
        }
        
        // Apply amount range filters - Fix for min/max amount filtering
        const minAmount = filterState.minAmount ? parseFloat(filterState.minAmount) : null;
        const maxAmount = filterState.maxAmount ? parseFloat(filterState.maxAmount) : null;
        
        if (minAmount !== null || maxAmount !== null) {
          transactions = transactions.filter(transaction => {
            // Get the actual amount value (always positive for proper comparison)
            const transactionAmount = parseFloat(transaction.amount);
            const isExpense = transaction.transactionType === 'EXPENSE';
            
            // For display purposes, expenses show as negative values and income as positive
            // Calculate the display amount as it appears to the user
            const displayAmount = isExpense ? -Math.abs(transactionAmount) : transactionAmount;
            
            // Check if the display amount is within the min-max range
            if (minAmount !== null && displayAmount < minAmount) {
              return false; // Exclude transactions below min amount
            }
            
            if (maxAmount !== null && displayAmount > maxAmount) {
              return false; // Exclude transactions above max amount
            }
            
            return true;
          });
        }
        
        // Ensure any transactions with special ID formats are preserved
        const processedTransactions = transactions.map(transaction => {
          // Check if we have this transaction in allTransactions with a different ID format
          const existingTransaction = allTransactions.find(t => {
            // For normal transactions, simple equality check
            if (t.id === transaction.id) return true;
            
            // For shared wallet transactions, check numeric part of ID if formatted as "number:string"
            if (typeof t.id === 'string' && t.id.includes(':') && 
                (typeof transaction.id === 'number' || typeof transaction.id === 'string')) {
              const existingIdParts = t.id.toString().split(':');
              return existingIdParts[0] === transaction.id.toString();
            }
            
            return false;
          });
          
          // If we found a match with a different format, preserve the original format
          if (existingTransaction && existingTransaction.id !== transaction.id) {
            return {
              ...transaction,
              id: existingTransaction.id
            };
          }
          
          return transaction;
        });
        
        // Send the client-filtered results to the parent component
        onApplyFilters({
          clientFiltered: processedTransactions
        });
      })
      .catch(error => {
        console.error('Error fetching transactions for filtering:', error);
        // Show error message to user
        // In case of error, try server-side filtering as fallback
        onApplyFilters(filterParams);
      })
      .finally(() => {
        updateFilterState({ isLoading: false });
      });
  }, [calculateFilterParams, onApplyFilters, updateFilterState, filterState, allTransactions]);
  
  // Function to reset filters
  const resetTransactionFilters = useCallback(() => {
    // Reset all filter state values to defaults
    updateFilterState({
      timeframe: 'week',
      walletId: 'all',
      categoryId: 'all',
      minAmount: '',
      maxAmount: '',
      transactionType: 'all',
      userId: 'all',
      showCustomDateRange: false,
      customStartDate: subDays(new Date(), 7),
      customEndDate: new Date(),
      // Don't set isLoading here as we don't want the loading state
    });
    
    try {
      // Call the parent's reset function immediately
      onResetFilters();
    } catch (error) {
      console.error('Error resetting filters:', error);
    }
  }, [updateFilterState, onResetFilters]);

  // Date picker handlers
  const handleStartDateChange = useCallback((date) => {
    updateFilterState(prev => {
      // If end date is before start date, update end date too
      const updates = { customStartDate: date };
      if (date && prev.customEndDate && date > prev.customEndDate) {
        updates.customEndDate = date;
      }
      return updates;
    });
  }, [updateFilterState]);

  const handleEndDateChange = useCallback((date) => {
    updateFilterState(prev => {
      // Ensure end date is not before start date
      if (date && prev.customStartDate && date < prev.customStartDate) {
        return { customEndDate: prev.customStartDate };
      }
      return { customEndDate: date };
    });
  }, [updateFilterState]);

  // Function to handle search input changes
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    
    // Early return if empty search
    if (!value.trim()) {
      updateSearchState({ term: value, results: [] });
      return;
    }
    
    // Filter transactions based on search term
    const searchTermLower = value.toLowerCase();
    const filtered = allTransactions.filter(transaction => {
      // Search in transaction ID
      const idMatch = transaction.id && 
        transaction.id.toString().includes(value);
        
      // Search in description
      const descriptionMatch = transaction.description && 
        transaction.description.toLowerCase().includes(searchTermLower);
      
      // Search in category
      const categoryMatch = 
        (transaction.category?.categoryName || '').toLowerCase().includes(searchTermLower) ||
        (transaction.categoryName || '').toLowerCase().includes(searchTermLower);
      
      // Search in amount
      const amountStr = transaction.amount ? transaction.amount.toString() : '';
      const amountMatch = amountStr.includes(value);
      
      return idMatch || descriptionMatch || categoryMatch || amountMatch;
    });
    
    updateSearchState({ term: value, results: filtered });
  }, [allTransactions, updateSearchState]);

  // Toggle search input visibility
  const toggleSearch = useCallback(() => {
    if (searchState.open) {
      // If search is open, close it and reset everything
      updateSearchState({ 
        open: false, 
        term: '', 
        results: [] 
      });
    } else {
      // If search is closed, open it
      updateSearchState({ 
        ...searchState, 
        open: true 
      });
      
      // Focus the input after the animation completes
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
    }
  }, [searchState, updateSearchState]);

  // Reset search function
  const resetSearch = useCallback(() => {
    // Just clear the term and results, but keep search open
    updateSearchState({ 
      ...searchState, 
      term: '', 
      results: [] 
    });
  }, [searchState, updateSearchState]);

  // Determine which transactions to display based on search or filters
  const displayTransactions = useMemo(() => {
    // If we have a search term and results, show search results
    if (searchState.term && searchState.results.length > 0) {
      return searchState.results;
    }
    
    // If we have filtered transactions and they're not empty, show the filtered transactions
    if (filteredTransactions && filteredTransactions.length > 0) {
      // In non-dashboard mode, the parent component is already handling pagination,
      // so we should use the transactions array directly as it's already sliced
      if (!isDashboard) {
        return transactions || [];
      }
      
      // In dashboard mode, limit to 8 transactions
      return filteredTransactions.length > 8 
        ? filteredTransactions.slice(0, 8) 
        : filteredTransactions;
    }
    
    // When in dashboard mode, limit to 8 transactions, otherwise use the transactions array
    // which is already paginated by the parent component
    if (!isDashboard) {
      return transactions || [];
    }
    
    return transactions?.length > 8 
      ? transactions.slice(0, 8) 
      : transactions || [];
  }, [searchState.term, searchState.results, filteredTransactions, transactions, isDashboard]);

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (searchState.open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchState.open]);

  // Generate empty state message based on current state
  const getEmptyStateMessage = useMemo(() => {
    if (searchState.term) {
      return t('transactions.emptyStateMessages.noMatchingSearch', { term: searchState.term });
    }
    
    // Check if filters have been applied
    const filtersApplied = 
      filterState.walletId !== 'all' || 
      filterState.categoryId !== 'all' || 
      filterState.transactionType !== 'all' ||
      filterState.userId !== 'all' ||
      filterState.minAmount || 
      filterState.maxAmount ||
      filterState.timeframe !== 'week';
    
    if (filtersApplied) {
      return t('transactions.emptyStateMessages.noMatchingFilters');
    }
    
    if (filterState.open) {
      return t('transactions.emptyStateMessages.selectFilters');
    }
    
    return t('transactions.emptyStateMessages.noTransactions');
  }, [searchState.term, filterState, t]);

  // Handle amount input
  const handleAmountChange = useCallback((field, event) => {
    const value = event.target.value;
    // Allow negative numbers and decimals
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      updateFilterState({ [field]: value });
    }
  }, [updateFilterState]);

  // Render Filter Controls
  const renderFilterControls = useCallback(() => (
    <Collapse in={filterState.open} timeout="auto" unmountOnExit>
      <Box className={styles.filterControls}>
        <Grid container spacing={2} alignItems="center">
          {/* Time Period */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
              <InputLabel id="time-period-label">{t('transactions.filters.timePeriod')}</InputLabel>
              <Select
                labelId="time-period-label"
                value={filterState.timeframe}
                onChange={(e) => handleTimeframeChange(e)}
                label={t('transactions.filters.timePeriod')}
                disabled={filterState.isLoading}
              >
                {TIME_PERIODS.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Wallet */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
              <InputLabel id="wallet-label">{t('transactions.wallet')}</InputLabel>
              <Select
                labelId="wallet-label"
                value={filterState.walletId}
                onChange={(e) => updateFilterState({ walletId: e.target.value })}
                label={t('transactions.wallet')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.filters.allWallets')}</MenuItem>
                {wallets.map((wallet) => (
                  <MenuItem key={wallet.id} value={wallet.id.toString()}>
                    {wallet.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
              <InputLabel id="category-label">{t('transactions.category')}</InputLabel>
              <Select
                labelId="category-label"
                value={filterState.categoryId}
                onChange={(e) => updateFilterState({ categoryId: e.target.value })}
                label={t('transactions.category')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.filters.allCategories')}</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.categoryName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Transaction Type - New filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
              <InputLabel id="transaction-type-label">{t('transactions.transactionType')}</InputLabel>
              <Select
                labelId="transaction-type-label"
                value={filterState.transactionType}
                onChange={(e) => updateFilterState({ transactionType: e.target.value })}
                label={t('transactions.transactionType')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.filters.allTypes')}</MenuItem>
                <MenuItem value="INCOME">{t('transactions.income')}</MenuItem>
                <MenuItem value="EXPENSE">{t('transactions.expense')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Amount Range */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('transactions.filters.minAmount')}
              variant="outlined"
              size="small"
              value={filterState.minAmount || ''}
              onChange={(e) => handleAmountChange('minAmount', e)}
              disabled={filterState.isLoading}
              className={styles.filterTextField}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('transactions.filters.maxAmount')}
              variant="outlined"
              size="small"
              value={filterState.maxAmount || ''}
              onChange={(e) => handleAmountChange('maxAmount', e)}
              disabled={filterState.isLoading}
              className={styles.filterTextField}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          {/* User Filter - Only show if shared wallets exist */}
          {(sharedWallets && Object.keys(sharedWallets).length > 0) && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
                <InputLabel id="user-filter-label">{t('common.user')}</InputLabel>
                <Select
                  labelId="user-filter-label"
                  value={filterState.userId}
                  onChange={(e) => updateFilterState({ userId: e.target.value })}
                  label={t('common.user')}
                  disabled={filterState.isLoading}
                >
                  <MenuItem value="all">{t('transactions.filters.allUsers')}</MenuItem>
                  {/* Get unique users from shared wallet transactions */}
                  {Array.from(new Set(
                    filteredTransactions
                      .filter(t => t.user && t.wallet && sharedWallets[t.wallet.id])
                      .map(t => JSON.stringify({ id: t.user.id, username: t.user.username }))
                  ))
                    .map(userString => JSON.parse(userString))
                    .map(user => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Custom Date Range (conditionally rendered) */}
          {filterState.showCustomDateRange && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label={t('transactions.filters.startDate')}
                  value={filterState.customStartDate}
                  onChange={handleStartDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      disabled: filterState.isLoading,
                      className: styles.filterTextField
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label={t('transactions.filters.endDate')}
                  value={filterState.customEndDate}
                  onChange={handleEndDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      disabled: filterState.isLoading,
                      className: styles.filterTextField
                    }
                  }}
                />
              </Grid>
            </>
          )}
          
          {/* Action buttons - now in their own full-width row, aligned right */}
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <FilterActionButtons 
              resetTransactionFilters={resetTransactionFilters}
              applyTransactionFilters={applyTransactionFilters}
              isFiltering={filterState.isLoading}
              t={t}
            />
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  ), [
    filterState,
    handleTimeframeChange,
    handleAmountChange,
    handleStartDateChange,
    handleEndDateChange,
    resetTransactionFilters,
    applyTransactionFilters,
    categories, 
    wallets,
    sharedWallets,
    filteredTransactions
  ]);

  // Table headers now with translations
  const tableHeaders = useMemo(() => [
    { id: 'transaction_id', label: t('transactions.headers.id') },
    { id: 'date', label: t('transactions.headers.date') },
    { id: 'description', label: t('transactions.headers.description') },
    { id: 'category', label: t('transactions.headers.category') },
    { id: 'wallet', label: t('transactions.headers.wallet') },
    { id: 'type', label: t('transactions.headers.type') },
    { id: 'amount', label: t('transactions.headers.amount') },
    { id: 'actions', label: t('transactions.headers.actions'), align: 'center' }
  ], [t]);

  // Sort transactions by ID in descending order (most recent first)
  // We'll only sort the displayTransactions array if it's not already sorted
  const sortedTransactions = useMemo(() => {
    // Create a copy of the display transactions for sorting
    return [...displayTransactions].sort((a, b) => {
      // More robust parsing of transaction IDs
      const parseId = (id) => {
        if (typeof id === 'number') return id;
        
        // Handle string IDs (including those with ':' format for shared wallets)
        if (typeof id === 'string') {
          if (id.includes(':')) {
            return parseInt(id.split(':')[0], 10);
          }
          return parseInt(id, 10);
        }
        
        return 0; // Fallback
      };
      
      // Primary sort: Sort by ID in descending order (highest/latest ID first)
      const idA = parseId(a.id);
      const idB = parseId(b.id);
      
      if (idA !== idB) {
        // Higher ID values are typically newer transactions
        return idB - idA;
      }
      
      // Secondary sort: If same ID (unlikely but possible), use date as tiebreaker
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);
      
      // Sort by date in descending order (newest first)
      return dateB - dateA;
    });
  }, [displayTransactions]);

  const renderTransactionsTable = () => {
    if (filterState.isLoading) {
      return (
        <Box className={styles.loadingBox}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (displayTransactions.length === 0) {
      return (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <TableStateMessage message={getEmptyStateMessage} />
          {/* Show count of filtered transactions */}
          {filteredTransactions.length === 0 && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mt: 1, fontStyle: 'italic' }}
            >
              {t('transactions.noMatches')}
            </Typography>
          )}
        </Box>
      );
    }
    
    return (
      <TableContainer 
        className={styles.tableContainer}
        component={Paper}
        elevation={0}
        sx={{ 
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid rgba(224, 224, 224, 0.7)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaders.map(header => (
                <TableCell 
                  key={header.id}
                  className={styles.tableHeaderCell}
                  align={header.align || 'left'}
                >
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TransactionRow 
                key={transaction.id}
                transaction={transaction}
                formatCurrency={formatCurrency}
                sharedWallets={sharedWallets}
                sharedWalletsInfo={sharedWalletsInfo}
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={onDeleteTransaction}
                t={t}
              />
            ))}
          </TableBody>
        </Table>
        
        {/* Show search results message if searching */}
        {searchState.term && (
          <Box className={styles.searchResultsInfo}>
            <Typography variant="body2" color="textSecondary">
              {t('transactions.searchResults', {
                count: searchState.results.length,
                term: searchState.term
              })}
            </Typography>
          </Box>
        )}
      </TableContainer>
    );
  };

  // Render header actions
  const renderHeaderActions = useMemo(() => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {/* Search button and input */}
      <SearchInput 
        searchOpen={searchState.open}
        searchTerm={searchState.term}
        handleSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        resetSearch={resetSearch}
        toggleSearch={toggleSearch}
        t={t}
      />
      
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon />}
        onClick={() => updateFilterState({ open: !filterState.open })}
        className={styles.filterButton}
        aria-expanded={filterState.open}
        aria-controls="filter-controls"
      >
        {t('transactions.filter')}
      </Button>
      
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={onAddTransaction}
        className={styles.addNewButton}
        elevation={3}
        size="small"
      >
        {t('transactions.addNew')}
      </Button>
    </Box>
  ), [
    searchState.open, 
    searchState.term, 
    handleSearchChange, 
    resetSearch, 
    toggleSearch, 
    filterState.open, 
    updateFilterState, 
    onAddTransaction,
    t
  ]);

  return (
    <Grid item xs={12}>
      <Paper className={styles.transactionsCard}>
        <Box className={styles.transactionsHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              component="h2" 
              variant="h5" 
              className={styles.sectionTitle}
            >
              {t('transactions.recentTransactions')}
            </Typography>
            
            {/* Export to Excel button - now positioned next to the title */}
            <Tooltip title={t('transactions.exportTooltip')} arrow placement="top">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                    // Use the current filtered transactions (respecting applied filters)
                    const dataToExport = filteredTransactions.map(transaction => {
                      // Determine if this wallet is shared
                      const isSharedWallet = transaction.wallet && 
                                           sharedWallets && 
                                           transaction.wallet.id && 
                                           sharedWallets[transaction.wallet.id];
                      
                      // Get shared wallet info if available
                      const walletInfo = isSharedWallet && sharedWalletsInfo && 
                                       transaction.wallet.id && 
                                       sharedWalletsInfo[transaction.wallet.id];
                      
                      // Ensure user information is present for shared wallets
                      let user = transaction.user || {};
                      
                      // If no user info but we have wallet info, try to add user details
                      if (isSharedWallet && walletInfo && !user.username) {
                        const isOwnerTransaction = transaction.userId === walletInfo.ownerId;
                        
                        if (isOwnerTransaction) {
                          user = {
                            id: walletInfo.ownerId,
                            username: walletInfo.ownerUsername,
                            profilePicture: walletInfo.ownerProfilePictureUrl
                          };
                        } else {
                          user = {
                            id: walletInfo.sharedWithId,
                            username: walletInfo.sharedWithUsername,
                            profilePicture: walletInfo.sharedWithProfilePictureUrl
                          };
                        }
                      }
                      
                      return {
                        ...transaction,
                        // Add explicit flags for export function
                        isShared: isSharedWallet,
                        sharedWallets,
                        sharedWalletsInfo,
                        user
                      };
                    });
                    
                    // Create a more descriptive filename that indicates if filters are applied
                    const isFiltered = filterState.open && (
                      filterState.walletId !== 'all' || 
                      filterState.categoryId !== 'all' || 
                      filterState.minAmount || 
                      filterState.maxAmount || 
                      filterState.timeframe !== 'all'
                    );
                    
                    const filename = isFiltered 
                      ? `filtered-transactions-${new Date().toISOString().split('T')[0]}`
                      : `all-transactions-${new Date().toISOString().split('T')[0]}`;
                    
                    exportTransactionsToExcel(
                      dataToExport,
                      formatCurrency,
                      filename
                    );
                  }}
                  className={styles.exportButton}
                  color="success"
                  disabled={filteredTransactions.length === 0}
                  sx={{ 
                    borderColor: 'success.main',
                    marginLeft: '12px',
                    '&:hover': { borderColor: 'success.dark', backgroundColor: 'rgba(76, 175, 80, 0.04)' },
                    ...(filteredTransactions.length !== allTransactions.length && {
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      fontWeight: 500
                    })
                  }}
                >
                  {filteredTransactions.length !== allTransactions.length 
                    ? t('transactions.exportFiltered', { count: filteredTransactions.length })
                    : t('transactions.export')
                  }
                </Button>
              </span>
            </Tooltip>
          </Box>
          {renderHeaderActions}
        </Box>
        
        {/* Filter Controls */}
        {renderFilterControls()}
        
        {/* Transactions Table */}
        {renderTransactionsTable()}
        
        {/* Note explaining limited transactions shown - only display on dashboard */}
        {isDashboard && displayTransactions.length > 0 && allTransactions.length > displayTransactions.length && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" className={styles.transactionsNote}>
              {t('transactions.limitedView')}{' '}
              <Link 
                to="/transactions" 
                style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                {t('transactions.viewAllLink')}
              </Link>.
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default TransactionsSection;
