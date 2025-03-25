import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Avatar
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
import { subDays, format } from 'date-fns';
import styles from '../../styles/dashboard.module.css';

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
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onApplyFilters,
  onResetFilters,
  formatCurrency
}) => {
  // State for filtering
  const [transactionFilterOpen, setTransactionFilterOpen] = useState(false);
  const [filterTimeframe, setFilterTimeframe] = useState('week');
  const [filterWalletId, setFilterWalletId] = useState('all');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [isFiltering, setIsFiltering] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 7));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  
  // State for search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  // Function to handle timeframe changes
  const handleTimeframeChange = (event) => {
    const value = event.target.value;
    setFilterTimeframe(value);
    setShowCustomDateRange(value === 'custom');
  };

  // Function to apply filters
  const applyTransactionFilters = () => {
    setIsFiltering(true);
    
    let filterParams = {};
    
    // Calculate date range
    if (showCustomDateRange) {
      filterParams.startDate = customStartDate.toISOString();
      filterParams.endDate = customEndDate.toISOString();
    } else {
      // Calculate date range based on timeframe
      const now = new Date();
      let startDate;
      
      switch (filterTimeframe) {
        case 'day':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        case 'year':
          startDate = subDays(now, 365);
          break;
        case 'all':
          // Don't set dates for "all" timeframe
          break;
        default:
          startDate = subDays(now, 7); // Default to a week
      }
      
      if (startDate) {
        filterParams.startDate = startDate.toISOString();
        filterParams.endDate = now.toISOString();
      }
    }
    
    // Add wallet and category filters
    if (filterWalletId !== 'all') {
      filterParams.walletId = filterWalletId;
    }
    
    if (filterCategoryId !== 'all') {
      filterParams.categoryId = filterCategoryId;
    }
    
    // Call the parent component's filter handler
    onApplyFilters(filterParams);
    setIsFiltering(false);
  };
  
  // Function to reset filters
  const resetTransactionFilters = () => {
    setFilterTimeframe('week');
    setFilterWalletId('all');
    setFilterCategoryId('all');
    setShowCustomDateRange(false);
    setCustomStartDate(subDays(new Date(), 7));
    setCustomEndDate(new Date());
    setTransactionFilterOpen(false);
    onResetFilters();
  };

  // Helper function to format dates for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Update to ensure end date is always after start date
  const handleStartDateChange = (date) => {
    setCustomStartDate(date);
    // If end date is before start date, update end date
    if (date && customEndDate && date > customEndDate) {
      setCustomEndDate(date);
    }
  };

  const handleEndDateChange = (date) => {
    // Ensure end date is not before start date
    if (date && customStartDate && date < customStartDate) {
      setCustomEndDate(customStartDate);
    } else {
      setCustomEndDate(date);
    }
  };

  // Function to handle search input changes
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Filter transactions based on search term
    const filtered = allTransactions.filter(transaction => {
      const searchTermLower = value.toLowerCase();
      
      // Search in description
      const descriptionMatch = transaction.description && 
        transaction.description.toLowerCase().includes(searchTermLower);
      
      // Search in category - handle different category data structures
      let categoryMatch = false;
      if (transaction.category && transaction.category.categoryName) {
        categoryMatch = transaction.category.categoryName.toLowerCase().includes(searchTermLower);
      } else if (transaction.categoryName) {
        categoryMatch = transaction.categoryName.toLowerCase().includes(searchTermLower);
      }
      
      // Search in amount - convert amount to string
      const amountStr = transaction.amount ? transaction.amount.toString() : '';
      const amountMatch = amountStr.includes(value);
      
      // Return true if any field matches
      return descriptionMatch || categoryMatch || amountMatch;
    });
    
    setSearchResults(filtered);
  };

  // Function to toggle search input visibility
  const toggleSearch = () => {
    if (searchOpen) {
      // If search is open, close it properly
      closeSearch();
    } else {
      // If search is closed, open it
      setSearchOpen(true);
      // Clear previous search when opening
      setSearchTerm('');
      setSearchResults([]);
      // Focus the input field when it appears
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300); // Delay to wait for animation
    }
  };

  // Function to close search
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Determine which transactions to display
  const displayTransactions = useMemo(() => {
    if (searchTerm && searchResults.length > 0) {
      return searchResults;
    }
    return transactions;
  }, [searchTerm, searchResults, transactions]);

  // Focus the search input when it becomes visible
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Search button and input */}
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
                          onClick={() => {
                            setSearchTerm('');
                            setSearchResults([]);
                          }}
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
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setTransactionFilterOpen(!transactionFilterOpen)}
              className={styles.filterButton}
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
        </Box>
        
        {/* Filter Controls - Shown when filter button is clicked */}
        <Collapse in={transactionFilterOpen}>
          <Box className={styles.filterControls}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="time-period-label">Time Period</InputLabel>
                  <Select
                    labelId="time-period-label"
                    value={filterTimeframe}
                    label="Time Period"
                    onChange={handleTimeframeChange}
                    className={styles.filterSelect}
                  >
                    <MenuItem value="day">Last 24 Hours</MenuItem>
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">Last 30 Days</MenuItem>
                    <MenuItem value="quarter">Last 3 Months</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="wallet-filter-label">Wallet</InputLabel>
                  <Select
                    labelId="wallet-filter-label"
                    value={filterWalletId}
                    label="Wallet"
                    onChange={(e) => setFilterWalletId(e.target.value)}
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
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={filterCategoryId}
                    label="Category"
                    onChange={(e) => setFilterCategoryId(e.target.value)}
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
              
              {/* Custom Date Range Fields */}
              <Grid item xs={12} sm={showCustomDateRange ? 12 : 6} md={showCustomDateRange ? 6 : 3} sx={{ display: 'flex', gap: 1 }}>
                {showCustomDateRange ? (
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
                            size: "small"
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
                            size: "small"
                          }
                        }}
                      />
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <Button
                      color="primary"
                      onClick={resetTransactionFilters}
                      className={styles.resetFilterButton}
                      disabled={isFiltering}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={applyTransactionFilters}
                      className={styles.applyFilterButton}
                      disabled={isFiltering}
                    >
                      {isFiltering ? 'Loading...' : 'Apply Filters'}
                    </Button>
                  </Box>
                )}
              </Grid>
              
              {showCustomDateRange && (
                <Grid item xs={12} sm={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    color="primary"
                    onClick={resetTransactionFilters}
                    className={styles.resetFilterButton}
                    disabled={isFiltering}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={applyTransactionFilters}
                    className={styles.applyFilterButton}
                    disabled={isFiltering}
                  >
                    {isFiltering ? 'Loading...' : 'Apply Filters'}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
        
        {isFiltering ? (
          <Box className={styles.loadingBox}>
            <CircularProgress />
          </Box>
        ) : displayTransactions.length > 0 ? (
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
                  <TableCell className={styles.tableHeaderCell}>Date</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Description</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Category</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Wallet</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Type</TableCell>
                  <TableCell className={styles.tableHeaderCell}>Amount</TableCell>
                  <TableCell className={styles.tableHeaderCell} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className={styles.tableRow}
                  >
                    <TableCell className={styles.tableCell}>{formatDate(transaction.transactionDate)}</TableCell>
                    <TableCell className={styles.tableCellBold}>{transaction.description}</TableCell>
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
                        {transaction.transactionType}
                        {transaction.user && transaction.wallet && sharedWallets[transaction.wallet.id] && (
                          <Tooltip 
                            title={`Created by: ${transaction.user.username}`}
                            arrow
                            placement="top"
                            classes={{ tooltip: styles.creatorTooltip }}
                          >
                            <Avatar
                              src={transaction.user.profilePicture || undefined}
                              alt={transaction.user.username}
                              className={styles.creatorAvatar}
                            >
                              {transaction.user.username ? transaction.user.username.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      {transaction.transactionType === 'INCOME' ? (
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          +{formatCurrency(transaction.amount, transaction.currency)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                          -{formatCurrency(transaction.amount, transaction.currency)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => onEditTransaction(transaction)}
                          className={styles.editButton}
                          sx={{ mx: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => onDeleteTransaction(transaction)}
                          className={styles.deleteButton}
                          sx={{ mx: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Show search results message if searching */}
            {searchTerm && (
              <Box className={styles.searchResultsInfo}>
                <Typography variant="body2" color="textSecondary">
                  Found {searchResults.length} {searchResults.length === 1 ? 'transaction' : 'transactions'} 
                  matching "{searchTerm}"
                </Typography>
              </Box>
            )}
          </TableContainer>
        ) : (
          <Box className={styles.emptyTransactionsBox}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? `No transactions found matching "${searchTerm}"` : 
               (transactionFilterOpen ? 'No transactions match your filter criteria.' : 
               'No transactions to display. Start adding your financial data to see it here.')}
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default TransactionsSection; 