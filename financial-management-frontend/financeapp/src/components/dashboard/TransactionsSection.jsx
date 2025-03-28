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

// Constants
const TIME_PERIODS = [
  { value: 'day', label: 'Last 24 Hours', days: 1 },
  { value: 'week', label: 'Last 7 Days', days: 7 },
  { value: 'month', label: 'Last 30 Days', days: 30 },
  { value: 'quarter', label: 'Last 3 Months', days: 90 },
  { value: 'year', label: 'Last Year', days: 365 },
  { value: 'all', label: 'All Time', days: null },
  { value: 'custom', label: 'Custom Range', days: null }
];

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString);
  // Use browser's locale for date formatting to respect user's language setting
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Date Picker components for custom date range
const DateRangePickers = ({ customStartDate, customEndDate, handleStartDateChange, handleEndDateChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={{ flex: 1 }}>
        <DatePicker 
          label={t('transactions.from', 'Start Date')} 
          value={customStartDate}
          onChange={handleStartDateChange}
          className={styles.filterDateField}
          format='dd/MM/yyyy'
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              inputProps: { 'aria-label': t('transactions.from', 'Filter start date') }
            }
          }}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <DatePicker 
          label={t('transactions.to', 'End Date')} 
          value={customEndDate}
          onChange={handleEndDateChange}
          className={styles.filterDateField}
          format='dd/MM/yyyy'
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              inputProps: { 'aria-label': t('transactions.to', 'Filter end date') }
            }
          }}
        />
      </Box>
    </>
  );
};

// Filter action buttons
const FilterActionButtons = ({ resetTransactionFilters, applyTransactionFilters, isFiltering }) => {
  const { t } = useTranslation();
  return (
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
        aria-label={t('transactions.reset', 'Reset all filters')}
        sx={{ 
          minWidth: '80px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {t('transactions.reset', 'Reset')}
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={applyTransactionFilters}
        className={styles.applyFilterButton}
        disabled={isFiltering}
        aria-label={t('transactions.apply', 'Apply selected filters')}
        sx={{ 
          minWidth: '120px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isFiltering ? t('common.loading', 'Loading...') : t('transactions.apply', 'Apply Filters')}
      </Button>
    </Box>
  );
};

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
  onDeleteTransaction 
}) => {
  // Local state to track expanded description
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
  // Character limit for description truncation
  const DESCRIPTION_CHAR_LIMIT = 25;
  
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
  
  const { t } = useTranslation();

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
                {t('transactions.collapse', 'Click to collapse')}
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
                  {t('common.more', 'more')}
                </Typography>
              )}
            </Box>
          </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.category ? transaction.category.categoryName : 
       (transaction.categoryId ? `${t('category.category', 'Category')} #${transaction.categoryId}` : t('category.uncategorized', 'Uncategorized'))}
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.wallet ? (
        // Wallet exists, display normally
        <>
          {transaction.wallet.accountName}
          {sharedWallets[transaction.wallet.id] && ` (${t('wallet.shared', 'shared')})`}
        </>
      ) : transaction.originalWalletName ? (
        // Wallet is null, but we have the original name
        <Typography variant="body2" component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          {transaction.originalWalletName} ({t('common.deleted', 'deleted')})
        </Typography>
      ) : (
        // Wallet is null and no original name (fallback)
        <Typography variant="body2" component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          ({t('wallet.deleted', 'deleted wallet')})
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
        {transaction.transactionType === 'INCOME' 
          ? t('transaction.income', 'INCOME') 
          : t('transaction.expense', 'EXPENSE')}
              </Typography>
              {transaction.wallet && sharedWallets[transaction.wallet.id] && transaction.user && (
          <Tooltip 
            title={`${t('transactions.createdBy', 'Created by')}: ${transaction.user.username}`}
            arrow
            placement="top"
            classes={{ tooltip: styles.creatorTooltip }}
          >
            <Avatar
                    src={getProfilePictureUrl() || undefined}
                    alt={transaction.user.username || t('common.user', 'User')}
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
        <Tooltip title={t('transaction.editTransaction', 'Edit transaction')} arrow placement="top">
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => onEditTransaction(transaction)}
            className={styles.editButton}
            sx={{ mx: 0.5 }}
            aria-label={`${t('transaction.editTransaction', 'Edit transaction')}: ${transaction.description}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('transaction.deleteTransaction', 'Delete transaction')} arrow placement="top">
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => onDeleteTransaction(transaction)}
            className={styles.deleteButton}
            sx={{ mx: 0.5 }}
            aria-label={`${t('transaction.deleteTransaction', 'Delete transaction')}: ${transaction.description}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
        </>
      )}
  </TableRow>
  );
});

// Empty or loading state component
const TableStateMessage = ({ message }) => {
  const { t } = useTranslation();
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            {message || t('common.noData', 'No data to display')}
          </Typography>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

// Search input component
const SearchInput = React.memo(({ 
  searchOpen, 
  searchTerm, 
  handleSearchChange, 
  searchInputRef, 
  resetSearch, 
  toggleSearch 
}) => {
  const { t } = useTranslation();
  return (
    <Box className={styles.searchContainer}>
      <Fade in={searchOpen} timeout={300}>
        <Box className={`${styles.searchInputContainer} ${searchOpen ? styles.searchOpen : ''}`}>
          <InputBase
            placeholder={t('transactions.searchPlaceholder', 'Search transactions...')}
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
                  aria-label={t('common.clear', 'Clear')}
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
        aria-label={searchOpen ? t('common.close', 'Close') : t('common.search', 'Search')}
      >
        {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
});

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
  formatCurrency
}) => {
  const { t } = useTranslation();
  
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
    if (showCustomDateRange) {
      filterParams.startDate = customStartDate.toISOString();
      filterParams.endDate = customEndDate.toISOString();
    } else if (timeframe !== 'all') {
      // Find the time period configuration
      const period = TIME_PERIODS.find(p => p.value === timeframe);
      
      if (period && period.days) {
        const now = new Date();
        filterParams.startDate = subDays(now, period.days).toISOString();
        filterParams.endDate = now.toISOString();
      }
    }
    
    // Add wallet and category filters if not "all"
    if (walletId !== 'all') filterParams.walletId = walletId;
    if (categoryId !== 'all') filterParams.categoryId = categoryId;
    
    // Add transaction type filter if not "all"
    if (transactionType !== 'all') filterParams.transactionType = transactionType;
    
    // Add user filter if not "all"
    if (userId !== 'all') filterParams.userId = userId;
    
    // Add amount range filters if provided
    if (minAmount && !isNaN(parseFloat(minAmount))) {
      filterParams.minAmount = parseFloat(minAmount);
    }
    if (maxAmount && !isNaN(parseFloat(maxAmount))) {
      filterParams.maxAmount = parseFloat(maxAmount);
    }
    
    return filterParams;
  }, [filterState]);

  // Function to apply filters
  const applyTransactionFilters = useCallback(() => {
    updateFilterState({ isLoading: true });
    
    // Get filter parameters
    const filterParams = calculateFilterParams();
    
    // Check if we need to apply client-side filtering
    const needsClientFilter = filterState.transactionType !== 'all' || 
                             filterState.userId !== 'all' ||
                             (filterState.minAmount && !isNaN(parseFloat(filterState.minAmount))) || 
                             (filterState.maxAmount && !isNaN(parseFloat(filterState.maxAmount)));
    
    // If we need client-side filtering, handle it directly
    if (needsClientFilter) {
      // Get all transactions first to ensure we have a complete dataset
      FinanceService.getTransactions()
        .then(response => {
          let transactions = response.data || [];
          
          // Apply all server-side filters first
          if (filterParams.startDate && filterParams.endDate) {
            transactions = transactions.filter(t => {
              const tDate = new Date(t.transactionDate);
              return tDate >= new Date(filterParams.startDate) && 
                     tDate <= new Date(filterParams.endDate);
            });
          }
          
          if (filterParams.walletId) {
            transactions = transactions.filter(t => 
              (t.wallet && t.wallet.id.toString() === filterParams.walletId) ||
              (t.account && t.account.id.toString() === filterParams.walletId)
            );
          }
          
          if (filterParams.categoryId) {
            transactions = transactions.filter(t => 
              (t.category && t.category.id.toString() === filterParams.categoryId) ||
              (t.categoryId && t.categoryId.toString() === filterParams.categoryId)
            );
          }
          
          // Apply client-side filters
          
          // Transaction type filter
          if (filterState.transactionType !== 'all') {
            transactions = transactions.filter(t => t.transactionType === filterState.transactionType);
          }
          
          // User filter
          if (filterState.userId !== 'all') {
            transactions = transactions.filter(t => t.user && t.user.id.toString() === filterState.userId);
          }
          
          // Apply amount range filters - FIXED LOGIC HERE
          const minAmount = filterState.minAmount ? parseFloat(filterState.minAmount) : null;
          const maxAmount = filterState.maxAmount ? parseFloat(filterState.maxAmount) : null;
          
          if (minAmount !== null || maxAmount !== null) {
            transactions = transactions.filter(transaction => {
              // Get the actual amount value 
              const transactionAmount = parseFloat(transaction.amount);
              
              // Use absolute value for comparison to handle both income and expenses
              const absAmount = Math.abs(transactionAmount);
              
              // Check min boundary if specified
              if (minAmount !== null && absAmount < minAmount) {
                return false;
              }
              
              // Check max boundary if specified
              if (maxAmount !== null && absAmount > maxAmount) {
                return false;
              }
              
              return true;
            });
          }
          
          // Send the client-filtered results to the parent component
          onApplyFilters({
            clientFiltered: transactions
          });
        })
        .finally(() => {
          updateFilterState({ isLoading: false });
        });
    } else {
      // Use the normal server-side approach for other types of filtering
      onApplyFilters(filterParams)
        .finally(() => {
          updateFilterState({ isLoading: false });
        });
    }
  }, [calculateFilterParams, onApplyFilters, updateFilterState, filterState]);
  
  // Function to reset filters
  const resetTransactionFilters = useCallback(() => {
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
      customEndDate: new Date()
    });
    onResetFilters();
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
    const { term, results } = searchState;
    return (term && results.length > 0) ? results : transactions;
  }, [searchState.term, searchState.results, transactions]);

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (searchState.open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchState.open]);

  // Generate empty state message based on current state
  const getEmptyStateMessage = useCallback(() => {
    if (searchState.term) {
      return `No transactions found matching "${searchState.term}"`;
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
      return t('transactions.noTransactions', 'No transactions match your filter criteria. Try adjusting your filters.');
    }
    
    if (filterState.open) {
      return 'Select filter criteria and click "Apply Filters" to find specific transactions.';
    }
    
    return t('transactions.noTransactions', 'No transactions to display. Start adding your financial data to see it here.');
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
              <InputLabel id="time-period-label">{t('transactions.timePeriod', 'Time Period')}</InputLabel>
              <Select
                labelId="time-period-label"
                value={filterState.timeframe}
                onChange={(e) => handleTimeframeChange(e)}
                label={t('transactions.timePeriod', 'Time Period')}
                disabled={filterState.isLoading}
              >
                {TIME_PERIODS.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {t(`transactions.timePeriods.${period.value}`, period.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Wallet */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small" className={styles.filterTextField}>
              <InputLabel id="wallet-label">{t('transaction.wallet', 'Wallet')}</InputLabel>
              <Select
                labelId="wallet-label"
                value={filterState.walletId}
                onChange={(e) => updateFilterState({ walletId: e.target.value })}
                label={t('transaction.wallet', 'Wallet')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.allWallets', 'All Wallets')}</MenuItem>
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
              <InputLabel id="category-label">{t('transaction.category', 'Category')}</InputLabel>
              <Select
                labelId="category-label"
                value={filterState.categoryId}
                onChange={(e) => updateFilterState({ categoryId: e.target.value })}
                label={t('transaction.category', 'Category')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.allCategories', 'All Categories')}</MenuItem>
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
              <InputLabel id="transaction-type-label">{t('transaction.type', 'Transaction Type')}</InputLabel>
              <Select
                labelId="transaction-type-label"
                value={filterState.transactionType}
                onChange={(e) => updateFilterState({ transactionType: e.target.value })}
                label={t('transaction.type', 'Transaction Type')}
                disabled={filterState.isLoading}
              >
                <MenuItem value="all">{t('transactions.allTypes', 'All Types')}</MenuItem>
                <MenuItem value="INCOME">{t('transaction.income', 'Income')}</MenuItem>
                <MenuItem value="EXPENSE">{t('transaction.expense', 'Expense')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Amount Range */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('transactions.minAmount', 'Min Amount')}
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
              label={t('transactions.maxAmount', 'Max Amount')}
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
                <InputLabel id="user-filter-label">{t('common.user', 'User')}</InputLabel>
                <Select
                  labelId="user-filter-label"
                  value={filterState.userId}
                  onChange={(e) => updateFilterState({ userId: e.target.value })}
                  label={t('common.user', 'User')}
                  disabled={filterState.isLoading}
                >
                  <MenuItem value="all">{t('transactions.allUsers', 'All Users')}</MenuItem>
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
                  label={t('transactions.from', 'Start Date')}
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
                  label={t('transactions.to', 'End Date')}
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
    filteredTransactions,
    t
  ]);

  // Table headers definition
  const tableHeaders = useMemo(() => [
    { id: 'transaction_id', label: t('transaction.id', 'ID') },
    { id: 'date', label: t('transaction.date', 'Date') },
    { id: 'description', label: t('transaction.description', 'Description') },
    { id: 'category', label: t('transaction.category', 'Category') },
    { id: 'wallet', label: t('transaction.wallet', 'Wallet') },
    { id: 'type', label: t('transaction.type', 'Type') },
    { id: 'amount', label: t('transaction.amount', 'Amount') },
    { id: 'actions', label: t('common.actions', 'Actions'), align: 'center' }
  ], [t]);

  // Render transactions table
  const renderTransactionsTable = () => {
    if (filterState.isLoading) {
      return (
        <Box className={styles.loadingBox}>
          <CircularProgress />
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
        <Table size="small" aria-label={t('dashboard.transactions', 'Recent Transactions')}>
          <TableHead>
            <TableRow>
              {tableHeaders.map(header => (
                <TableCell 
                  key={header.id}
                  className={styles.tableHeaderCell}
                  align={header.align || 'left'}
                >
                  {t(`transaction.${header.id}`, header.label)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          {displayTransactions.length === 0 ? (
            <TableStateMessage message={getEmptyStateMessage()} />
          ) : (
            <TableBody>
              {displayTransactions.map((transaction) => (
                <TransactionRow 
                  key={transaction.id}
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  sharedWallets={sharedWallets}
                  sharedWalletsInfo={sharedWalletsInfo}
                  onEditTransaction={onEditTransaction}
                  onDeleteTransaction={onDeleteTransaction}
                />
              ))}
            </TableBody>
          )}
        </Table>
        
        {/* Show search results message if searching */}
        {searchState.term && (
          <Box className={styles.searchResultsInfo}>
            <Typography variant="body2" color="textSecondary">
              {t('transactions.showingResults', {
                count: searchState.results.length,
                type: searchState.results.length === 1 ? 'transaction' : 'transactions',
                term: searchState.term
              })}
            </Typography>
          </Box>
        )}
      </TableContainer>
    );
  };

  // Render header actions
  const renderHeaderActions = useCallback(() => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {/* Search button and input */}
      <SearchInput 
        searchOpen={searchState.open}
        searchTerm={searchState.term}
        handleSearchChange={handleSearchChange}
        searchInputRef={searchInputRef}
        resetSearch={resetSearch}
        toggleSearch={toggleSearch}
      />
      
      {/* Export to Excel button - Moved before Filter button */}
      <Tooltip title={t('transactions.export', 'Export currently filtered transactions to Excel')} arrow placement="top">
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
              height: '36px', // Match height with other buttons
              '&:hover': { borderColor: 'success.dark', backgroundColor: 'rgba(76, 175, 80, 0.04)' },
              ...(filteredTransactions.length !== allTransactions.length && {
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                fontWeight: 500
              })
            }}
          >
            {filteredTransactions.length !== allTransactions.length 
              ? t('transactions.exportFiltered', { count: filteredTransactions.length }, `Export (${filteredTransactions.length})`)
              : t('transactions.export', 'Export')
            }
          </Button>
        </span>
      </Tooltip>
      
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon />}
        onClick={() => updateFilterState({ open: !filterState.open })}
        className={styles.filterButton}
        aria-expanded={filterState.open}
        aria-controls="filter-controls"
        sx={{ height: '36px' }} // Match height with other buttons
      >
        {t('transactions.filter', 'Filter')}
      </Button>
      
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={onAddTransaction}
        className={styles.addNewButton}
        elevation={3}
        size="small"
        sx={{ height: '36px' }} // Match height with other buttons
      >
        {t('common.addNew', 'Add New')}
      </Button>
    </Box>
  ), [
    searchState.open, 
    searchState.term, 
    handleSearchChange, 
    resetSearch, 
    toggleSearch, 
    filterState.open,
    filterState.walletId,
    filterState.categoryId,
    filterState.minAmount,
    filterState.maxAmount,
    filterState.timeframe,
    updateFilterState, 
    onAddTransaction,
    filteredTransactions,
    allTransactions,
    formatCurrency,
    sharedWallets,
    sharedWalletsInfo,
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
              {t('dashboard.recentTransactions', 'Recent Transactions')}
            </Typography>
          </Box>
          {renderHeaderActions()}
        </Box>
        
        {/* Filter Controls */}
        {renderFilterControls()}
        
        {/* Transactions Table */}
        {renderTransactionsTable()}
        
        {/* Note explaining limited transactions shown */}
        {displayTransactions.length > 0 && allTransactions.length > displayTransactions.length && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" className={styles.transactionsNote}>
              {t('transactions.showing', { count: 8 })} {' '}
              <Link 
                to="/transactions" 
                style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                {t('transactions.viewAllPage', 'View all on the transactions page.')}
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default TransactionsSection;
