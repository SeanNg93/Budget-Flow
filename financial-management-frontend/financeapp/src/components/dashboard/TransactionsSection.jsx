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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { subDays } from 'date-fns';
import styles from '../../styles/dashboard.module.css';

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
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Date Picker components for custom date range
const DateRangePickers = ({ customStartDate, customEndDate, handleStartDateChange, handleEndDateChange }) => (
  <>
    <Box sx={{ flex: 1 }}>
      <DatePicker 
        label="Start Date" 
        value={customStartDate}
        onChange={handleStartDateChange}
        className={styles.filterDateField}
        format='dd/MM/yyyy'
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            inputProps: { 'aria-label': 'Filter start date' }
          }
        }}
      />
    </Box>
    <Box sx={{ flex: 1 }}>
      <DatePicker 
        label="End Date" 
        value={customEndDate}
        onChange={handleEndDateChange}
        className={styles.filterDateField}
        format='dd/MM/yyyy'
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            inputProps: { 'aria-label': 'Filter end date' }
          }
        }}
      />
    </Box>
  </>
);

// Filter action buttons
const FilterActionButtons = ({ resetTransactionFilters, applyTransactionFilters, isFiltering }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
    width: '100%', 
    gap: 1,
    mt: { xs: 2, md: 0 }
  }}>
    <Button
      color="primary"
      onClick={resetTransactionFilters}
      className={styles.resetFilterButton}
      disabled={isFiltering}
      aria-label="Reset all filters"
    >
      Reset
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={applyTransactionFilters}
      className={styles.applyFilterButton}
      disabled={isFiltering}
      aria-label="Apply selected filters"
    >
      {isFiltering ? 'Loading...' : 'Apply Filters'}
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
    <TableCell className={styles.tableCell}>{formatDate(transaction.transactionDate)}</TableCell>
      
      {/* Description cell with special handling */}
      {descriptionExpanded ? (
        <TableCell 
          colSpan={6}
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
                  more
                </Typography>
              )}
            </Box>
          </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.category ? transaction.category.categoryName : 
       (transaction.categoryId ? `Category #${transaction.categoryId}` : 'Uncategorized')}
    </TableCell>
          
    <TableCell className={styles.tableCell}>
      {transaction.wallet ? (
        <>
          {transaction.wallet.accountName}
          {sharedWallets[transaction.wallet.id] && " (shared)"}
        </>
      ) : (
        transaction.account ? transaction.account.accountName : 
        'Unknown'
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
        <IconButton 
          size="small" 
          color="primary" 
          onClick={() => onEditTransaction(transaction)}
          className={styles.editButton}
          sx={{ mx: 0.5 }}
          aria-label={`Edit transaction: ${transaction.description}`}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          color="error" 
          onClick={() => onDeleteTransaction(transaction)}
          className={styles.deleteButton}
          sx={{ mx: 0.5 }}
          aria-label={`Delete transaction: ${transaction.description}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
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
  toggleSearch 
}) => (
  <Box className={styles.searchContainer}>
    <Fade in={searchOpen} timeout={300}>
      <Box className={`${styles.searchInputContainer} ${searchOpen ? styles.searchOpen : ''}`}>
        <InputBase
          placeholder="Search transactions..."
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
  formatCurrency
}) => {
  // Filter state
  const [filterState, setFilterState] = useState({
    open: false,
    timeframe: 'week',
    walletId: 'all',
    categoryId: 'all',
    minAmount: '',
    maxAmount: '',
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
    const { timeframe, showCustomDateRange, customStartDate, customEndDate, walletId, categoryId, minAmount, maxAmount } = filterState;
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
    
    // Get filter parameters and call parent component's filter handler
    const filterParams = calculateFilterParams();
    onApplyFilters(filterParams);
    
    // Reset loading state after filters are applied
    updateFilterState({ isLoading: false });
  }, [calculateFilterParams, onApplyFilters, updateFilterState]);
  
  // Function to reset filters
  const resetTransactionFilters = useCallback(() => {
    updateFilterState({
      timeframe: 'week',
      walletId: 'all',
      categoryId: 'all',
      minAmount: '',
      maxAmount: '',
      showCustomDateRange: false,
      customStartDate: subDays(new Date(), 7),
      customEndDate: new Date(),
      open: false
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
      
      return descriptionMatch || categoryMatch || amountMatch;
    });
    
    updateSearchState({ term: value, results: filtered });
  }, [allTransactions, updateSearchState]);

  // Toggle search input visibility
  const toggleSearch = useCallback(() => {
    console.log('Toggle search clicked');
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
  const getEmptyStateMessage = useMemo(() => {
    if (searchState.term) {
      return `No transactions found matching "${searchState.term}"`;
    }
    
    if (filterState.open) {
      return 'No transactions match your filter criteria.';
    }
    
    return 'No transactions to display. Start adding your financial data to see it here.';
  }, [searchState.term, filterState.open]);

  // Handle amount input
  const handleAmountChange = useCallback((field, event) => {
    const value = event.target.value;
    // Only allow valid number inputs (including decimal)
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      updateFilterState({ [field]: value });
    }
  }, [updateFilterState]);

  // Render filter controls
  const renderFilterControls = () => (
    <Collapse in={filterState.open}>
      <Box className={styles.filterControls}>
        <Grid container spacing={2} alignItems="flex-start">
          {/* First row - filters */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
          {/* Time Period filter */}
              <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="time-period-label">Time Period</InputLabel>
              <Select
                labelId="time-period-label"
                value={filterState.timeframe}
                label="Time Period"
                onChange={handleTimeframeChange}
                className={styles.filterSelect}
              >
                {TIME_PERIODS.map(period => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Wallet filter */}
              <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="wallet-filter-label">Wallet</InputLabel>
              <Select
                labelId="wallet-filter-label"
                value={filterState.walletId}
                label="Wallet"
                onChange={(e) => updateFilterState({ walletId: e.target.value })}
                className={styles.filterSelect}
              >
                <MenuItem value="all">All Wallets</MenuItem>
                {wallets.map((wallet) => (
                  <MenuItem key={wallet.id} value={wallet.id.toString()}>
                    {wallet.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Category filter */}
              <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={filterState.categoryId}
                label="Category"
                onChange={(e) => updateFilterState({ categoryId: e.target.value })}
                className={styles.filterSelect}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.categoryName} {category.type === 'INCOME' ? '(Income)' : '(Expense)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
              {/* Amount Range filters */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Min Amount"
                    value={filterState.minAmount}
                    onChange={(e) => handleAmountChange('minAmount', e)}
                    variant="outlined"
                    size="small"
                    className={styles.filterTextField}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                  />
                  <TextField
                    label="Max Amount"
                    value={filterState.maxAmount}
                    onChange={(e) => handleAmountChange('maxAmount', e)}
                    variant="outlined"
                    size="small"
                    className={styles.filterTextField}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="0.00"
                  />
                </Box>
              </Grid>
              
              {/* Custom date range */}
              {filterState.showCustomDateRange && (
                <Grid item xs={12} sm={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
              <DateRangePickers 
                customStartDate={filterState.customStartDate}
                customEndDate={filterState.customEndDate}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
              />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
          
          {/* Action buttons - always positioned on the right */}
          <Grid item xs={12} md={3} sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'flex-end',
            position: { md: 'sticky' },
            top: { md: 0 },
            alignSelf: { md: 'flex-start' }
          }}>
              <FilterActionButtons 
                resetTransactionFilters={resetTransactionFilters}
                applyTransactionFilters={applyTransactionFilters}
                isFiltering={filterState.isLoading}
              />
            </Grid>
        </Grid>
      </Box>
    </Collapse>
  );

  // Table headers definition
  const tableHeaders = useMemo(() => [
    { id: 'date', label: 'Date' },
    { id: 'description', label: 'Description' },
    { id: 'category', label: 'Category' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'type', label: 'Type' },
    { id: 'amount', label: 'Amount' },
    { id: 'actions', label: 'Actions', align: 'center' }
  ], []);

  // Render transactions table
  const renderTransactionsTable = () => {
    if (filterState.isLoading) {
      return (
        <Box className={styles.loadingBox}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (displayTransactions.length === 0) {
      return <TableStateMessage message={getEmptyStateMessage} />;
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
        </Table>
        
        {/* Show search results message if searching */}
        {searchState.term && (
          <Box className={styles.searchResultsInfo}>
            <Typography variant="body2" color="textSecondary">
              Found {searchState.results.length} {searchState.results.length === 1 ? 'transaction' : 'transactions'} 
              matching "{searchState.term}"
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
        Filter
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
        Add New
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
    onAddTransaction
  ]);

  return (
    <Grid item xs={12}>
      <Paper className={styles.transactionsCard}>
        <Box className={styles.transactionsHeader}>
          <Typography 
            component="h2" 
            variant="h5" 
            className={styles.sectionTitle}
          >
            Recent Transactions
          </Typography>
          {renderHeaderActions}
        </Box>
        
        {/* Filter Controls */}
        {renderFilterControls()}
        
        {/* Transactions Table */}
        {renderTransactionsTable()}
      </Paper>
    </Grid>
  );
};

export default TransactionsSection; 