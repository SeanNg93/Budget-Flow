import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Grid, Paper, Typography, Divider, CircularProgress, Pagination, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Import components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionsSection from '../components/dashboard/TransactionsSection';
import DialogManager from '../components/dashboard/DialogManager';
import TransactionForm from '../components/dashboard/TransactionForm';
import CategoryManageForm from '../components/dashboard/CategoryManageForm';
import ProfileDialog from '../components/user/ProfileDialog';
import TransactionSummaryCards from '../components/dashboard/TransactionSummaryCards';

// Import services
import FinanceService from '../services/FinanceService';

// Import theme
import AppTheme from '../shared-theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';

// Define the backend API base URL
const API_BASE_URL = "http://localhost:8080";

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    paddingLeft: open ? theme.spacing(3) : theme.spacing(2.5),
    paddingRight: theme.spacing(3),
    transition: theme.transitions.create(['margin', 'width', 'padding'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    backgroundColor: theme.palette.mode === 'light' ? '#f8f9fa' : theme.palette.background.default,
    minHeight: '100vh',
    position: 'relative',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    ...(open && {
      transition: theme.transitions.create(['margin', 'width', 'padding'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
  minHeight: '48px !important',
}));

// Combined theme customizations
const themeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [sharedWallets, setSharedWallets] = useState({});
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});
  const [error, setError] = useState(null);
  const [dialogStates, setDialogStates] = useState({
    transactionForm: false,
    editTransactionOpen: false,
    deleteConfirmOpen: false,
    profileDialog: false,
    categoryManageForm: false,
    accountForm: false,
    categoryForm: false,
    addBalanceForm: false,
    editBalanceForm: false,
    walletManageForm: false,
    financeActionPanel: false,
    userTransferDialog: false,
    shareWalletDialog: false,
    transferDialog: false
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  // Add selectedWallet state for DialogManager to use
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState({
    totalExpense: 0,
    totalIncome: 0,
    netSavings: 0
  });

  // Helper to update dialog states
  const updateDialogState = (dialogName, isOpen) => {
    setDialogStates(prevState => ({
      ...prevState,
      [dialogName]: isOpen
    }));
  };

  // Initial setup
  useEffect(() => {
    checkAuth();
  }, []);

  // Load user data
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Update displayed transactions when pagination changes
  useEffect(() => {
    if (filteredTransactions.length > 0) {
      updateDisplayedTransactions();
    }
  }, [page, pageSize, filteredTransactions]);

  // Authentication check
  const checkAuth = async () => {
    const token = localStorage.getItem('userToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userData = localStorage.getItem('userData');
      setUser(JSON.parse(userData));
    } catch (err) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Process transaction data for profile pictures
  const processTransactions = (transactions) => {
    return transactions.map(transaction => {
      // Skip processing if no transaction data
      if (!transaction) return transaction;
      
      // For shared wallets, ensure proper user data and profile pictures
      if (transaction.wallet && sharedWallets[transaction.wallet.id]) {
        const walletInfo = sharedWalletsInfo[transaction.wallet.id];
        
        // If no wallet info available, skip additional processing
        if (!walletInfo) return transaction;
        
        // If no user at all, create one with wallet owner info
        if (!transaction.user) {
          const isOwnerTransaction = transaction.userId === walletInfo.ownerId;
          
          if (isOwnerTransaction) {
            transaction.user = {
              id: walletInfo.ownerId,
              username: walletInfo.ownerUsername,
              profilePicture: walletInfo.ownerProfilePictureUrl
            };
          } else {
            transaction.user = {
              id: walletInfo.sharedWithId,
              username: walletInfo.sharedWithUsername,
              profilePicture: walletInfo.sharedWithProfilePictureUrl
            };
          }
        } 
        // If user exists but no profile picture, try to add from wallet info
        else if (!transaction.user.profilePicture) {
          if (transaction.user.id === walletInfo.ownerId) {
            transaction.user.profilePicture = walletInfo.ownerProfilePictureUrl;
          } else if (transaction.user.id === walletInfo.sharedWithId) {
            transaction.user.profilePicture = walletInfo.sharedWithProfilePictureUrl;
          }
        }
      }
      
      // Ensure all profile picture URLs have the API base URL if they're relative paths
      if (transaction.user && transaction.user.profilePicture) {
        if (!transaction.user.profilePicture.startsWith('http') && 
            !transaction.user.profilePicture.startsWith('data:')) {
          transaction.user.profilePicture = `${API_BASE_URL}${transaction.user.profilePicture}`;
        }
      }
      
      return transaction;
    });
  };

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel API calls for better performance
      const [transactionsResponse, categoriesResponse, walletsResponse, 
             sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getTransactions(),
        FinanceService.getCategories(),
        FinanceService.getAccounts(),
        FinanceService.getSharedWalletsWithMe(),
        FinanceService.getSharedWalletsByMe()
      ]);
      
      // Process shared wallets
      const sharedWalletsMap = {};
      const sharedInfo = {};
      
      // Process shared wallets
      const processSharedWallets = (wallets, isOwner) => {
        wallets.forEach(sharedWallet => {
          if (sharedWallet.accepted) {
            sharedWalletsMap[sharedWallet.walletId] = true;
            sharedInfo[sharedWallet.walletId] = {
              isShared: true,
              isOwner,
              ownerUsername: sharedWallet.ownerUsername,
              ownerId: sharedWallet.ownerId,
              sharedWithId: sharedWallet.sharedWithId,
              sharedWithUsername: sharedWallet.sharedWithUsername,
              walletName: sharedWallet.walletName,
              ownerProfilePictureUrl: sharedWallet.ownerProfilePictureUrl,
              sharedWithProfilePictureUrl: sharedWallet.sharedWithProfilePictureUrl
            };
          }
        });
      };
      
      // Process shared wallets data
      processSharedWallets(sharedWithMeResponse.data, false);
      processSharedWallets(sharedByMeResponse.data, true);
      
      // Save shared wallets data
      setSharedWallets(sharedWalletsMap);
      setSharedWalletsInfo(sharedInfo);
      
      // Get transactions data
      let transactionsData = transactionsResponse.data || [];
      
      // Sort transactions by ID in descending order (highest/latest ID first)
      transactionsData = transactionsData.sort((a, b) => {
        // Parse IDs to handle different ID formats
        const parseId = (id) => {
          if (typeof id === 'number') return id;
          if (typeof id === 'string') {
            if (id.includes(':')) {
              return parseInt(id.split(':')[0], 10);
            }
            return parseInt(id, 10);
          }
          return 0; // Fallback
        };
        
        const idA = parseId(a.id);
        const idB = parseId(b.id);
        
        // Higher ID values are typically newer transactions
        return idB - idA;
      });
      
      // Process transactions to add profile pictures where needed
      transactionsData = processTransactions(transactionsData);
      
      // Set all states
      setAllTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
      setTransactions(transactionsData.slice(0, pageSize));
      
      // Calculate total pages
      setTotalPages(Math.ceil(transactionsData.length / pageSize));
      
      // Set categories
      setCategories(categoriesResponse.data || []);
      
      // Set wallets
      setWallets(walletsResponse.data || []);
      
      // Calculate financial summary
      calculateFinancialSummary(transactionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      toast.error(t('transactions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Update transactions based on current page and page size
  const updateDisplayedTransactions = (allTransactionsData = filteredTransactions) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setTransactions(allTransactionsData.slice(start, end));
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    // Force update of displayed transactions immediately
    const start = (newPage - 1) * pageSize;
    const end = start + pageSize;
    setTransactions(filteredTransactions.slice(start, end));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    
    // Update total pages based on new page size
    setTotalPages(Math.ceil(filteredTransactions.length / newPageSize));
    
    // Immediately update displayed transactions
    const start = 0; // Start at first page
    const end = newPageSize;
    setTransactions(filteredTransactions.slice(start, end));
  };

  // Apply filters from transaction section
  const applyFilters = async (filterParams) => {
    try {
      // Store the amount filters for client-side filtering after server response
      const minAmount = filterParams.minAmount;
      const maxAmount = filterParams.maxAmount;
      const walletId = filterParams.walletId;
      const categoryId = filterParams.categoryId;
      
      // Create a copy of params without amount filters for server request
      // (assuming the backend doesn't support amount filtering yet)
      const serverFilterParams = { ...filterParams };
      delete serverFilterParams.minAmount;
      delete serverFilterParams.maxAmount;
      
      const response = await FinanceService.getFilteredTransactions(serverFilterParams);
      let processedTransactions = processTransactions(response.data || []);
      
      // Apply client-side filtering as a fallback for when the server doesn't filter correctly
      // First check if we need to apply client-side wallet filtering
      if (walletId && walletId !== 'all' && processedTransactions.length > 0) {
        // Check if server filtered correctly by checking if all transactions match the wallet ID
        const allMatchWallet = processedTransactions.every(transaction => 
          transaction.wallet?.id.toString() === walletId.toString() || 
          transaction.account?.id.toString() === walletId.toString()
        );
        
        // If not all transactions match the wallet, apply client-side filtering
        if (!allMatchWallet) {
          processedTransactions = processedTransactions.filter(transaction => 
            transaction.wallet?.id.toString() === walletId.toString() || 
            transaction.account?.id.toString() === walletId.toString()
          );
        }
      }
      
      // Apply category filtering on the client side if needed
      if (categoryId && categoryId !== 'all' && processedTransactions.length > 0) {
        // Check if server filtered correctly
        const allMatchCategory = processedTransactions.every(transaction => 
          transaction.category?.id.toString() === categoryId.toString() ||
          transaction.categoryId?.toString() === categoryId.toString()
        );
        
        // If not all transactions match the category, apply client-side filtering
        if (!allMatchCategory) {
          processedTransactions = processedTransactions.filter(transaction => 
            transaction.category?.id.toString() === categoryId.toString() ||
            transaction.categoryId?.toString() === categoryId.toString()
          );
        }
      }
      
      // Apply amount filters on the client side if needed
      if (minAmount !== undefined || maxAmount !== undefined) {
        processedTransactions = processedTransactions.filter(transaction => {
          const amount = parseFloat(transaction.amount);
          
          // If min amount is set and transaction amount is less than min, filter out
          if (minAmount !== undefined && amount < minAmount) {
            return false;
          }
          
          // If max amount is set and transaction amount is more than max, filter out
          if (maxAmount !== undefined && amount > maxAmount) {
            return false;
          }
          
          return true;
        });
      }
      
      setFilteredTransactions(processedTransactions);
      setTotalPages(Math.ceil(processedTransactions.length / pageSize));
      setPage(1); // Reset to first page when applying filters
      
      // Update the displayed transactions based on page size
      const start = 0; // Start at first page
      const end = pageSize;
      setTransactions(processedTransactions.slice(start, end));

      // Update financial summary based on filtered transactions
      calculateFinancialSummary(processedTransactions);
    } catch (err) {
      console.error('Error applying filters:', err);
    }
  };

  // Reset filters
  const resetFilters = async () => {
    try {
      const response = await FinanceService.getTransactions();
      const processedTransactions = processTransactions(response.data || []);
      setFilteredTransactions(processedTransactions);
      setAllTransactions(processedTransactions);
      setTotalPages(Math.ceil(processedTransactions.length / pageSize));
      setPage(1); // Reset to first page when clearing filters
      
      // Update the displayed transactions based on page size
      const start = 0; // Start at first page
      const end = pageSize;
      setTransactions(processedTransactions.slice(start, end));
      
      // Update financial summary based on all transactions
      calculateFinancialSummary(processedTransactions);
    } catch (err) {
      console.error('Error resetting filters:', err);
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('editTransactionOpen', true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('deleteConfirmOpen', true);
  };

  // Handle transaction added/updated
  const handleTransactionAdded = (isUpdate = false) => {
    if (isUpdate) {
      // For updates, just refresh the data but keep the same page
      const currentPage = page;
      fetchData().then(() => {
        // Restore the same page after data is refreshed
        setPage(currentPage);
      });
    } else {
      // For new transactions, do a full data refresh
      fetchData();
    }
    
    // Show success toast
    toast.success(isUpdate ? t('transactions.updateSuccess') : t('transactions.addSuccess'), {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      await FinanceService.deleteTransaction(selectedTransaction.id);
      
      // Update transactions
      const updatedTransactions = allTransactions.filter(t => t.id !== selectedTransaction.id);
      setAllTransactions(updatedTransactions);
      setFilteredTransactions(updatedTransactions);
      
      // Recalculate total pages
      setTotalPages(Math.ceil(updatedTransactions.length / pageSize));
      
      // Update current page transactions
      updateDisplayedTransactions(updatedTransactions);
      
      // Reset state and close dialog
      setSelectedTransaction(null);
      updateDialogState('deleteConfirmOpen', false);
      
      // Show success toast
      toast.success(t('transactions.deleteSuccess'), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(t('transactions.deleteError'), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Handle drawer open/close
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  // Format currency helper
  const formatCurrency = (amount) => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate financial summary from transactions
  const calculateFinancialSummary = (transactions) => {
    const summary = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transactionType === 'EXPENSE') {
        acc.totalExpense += amount;
      } else if (transaction.transactionType === 'INCOME') {
        acc.totalIncome += amount;
      }
      return acc;
    }, { totalExpense: 0, totalIncome: 0 });
    
    summary.netSavings = summary.totalIncome - summary.totalExpense;
    setFinancialSummary(summary);
  };

  // Wrap the DialogManager to ensure consistent dialog rendering across pages
  const handleDialogTransactionAdded = (isUpdate = false) => {
    handleTransactionAdded(isUpdate);
  };

  // Include the DialogManager that's used in the dashboard for consistent TransactionForm handling
  const renderDialogManager = () => (
    <DialogManager
      dialogStates={dialogStates}
      updateDialogState={updateDialogState}
      userProfile={user}
      selectedTransaction={selectedTransaction}
      selectedWallet={selectedWallet}
      setSelectedTransaction={setSelectedTransaction}
      setSelectedWallet={setSelectedWallet}
      wallets={wallets}
      handleTransactionAdded={handleDialogTransactionAdded}
      handleAccountAdded={() => fetchData()} 
      handleCategoryAdded={() => fetchData()} 
      handleBalanceAdded={() => fetchData()} 
      handleProfileUpdated={() => fetchData()} 
      handleCategoryUpdated={() => fetchData()} 
      handleDeleteConfirm={handleDeleteConfirm}
      onWalletDeleted={() => fetchData()} 
      fetchFinancialData={() => fetchData()} 
    />
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', margin: 0, padding: 0, width: '100%', maxWidth: '100%' }}>
      <CssBaseline />
      <AppTheme components={themeComponents}>
        <AppNavbar open={open} handleDrawerOpen={handleDrawerOpen} />
        <SideMenu 
          open={open} 
          handleDrawerClose={handleDrawerClose} 
          setProfileDialogOpen={() => updateDialogState('profileDialog', true)}
          setCategoryManageFormOpen={() => updateDialogState('categoryManageForm', true)}
        />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="xl" disableGutters sx={{ mt: 2 }}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('transactions.title')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Financial Summary Cards */}
              <TransactionSummaryCards
                totalExpense={financialSummary.totalExpense}
                totalIncome={financialSummary.totalIncome}
                netSavings={financialSummary.netSavings}
                formatCurrency={formatCurrency}
              />
              
              {/* Pagination controls at top */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    {t('pagination.rowsPerPage')}:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 65, maxWidth: 65 }}>
                    <Select
                      value={pageSize}
                      onChange={handleRowsPerPageChange}
                      displayEmpty
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 200,
                            width: 65,
                            '& .MuiMenuItem-root': {
                              minHeight: 'auto',
                              py: 0.75,
                              px: 1.5,
                              fontSize: '0.875rem'
                            }
                          }
                        }
                      }}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 0.75, 
                          px: 1.5, 
                          fontSize: '0.875rem' 
                        }
                      }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
              
              {/* Transaction table */}
              <TransactionsSection 
                transactions={transactions}
                allTransactions={allTransactions}
                filteredTransactions={filteredTransactions}
                categories={categories}
                wallets={wallets}
                sharedWallets={sharedWallets}
                sharedWalletsInfo={sharedWalletsInfo}
                onAddTransaction={() => updateDialogState('transactionForm', true)}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
                formatCurrency={formatCurrency}
                isDashboard={false}
              />
              
              {/* Pagination controls at bottom */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1.5 }}>
                    {t('pagination.rowsPerPage')}:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 65, maxWidth: 65 }}>
                    <Select
                      value={pageSize}
                      onChange={handleRowsPerPageChange}
                      displayEmpty
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 200,
                            width: 65,
                            '& .MuiMenuItem-root': {
                              minHeight: 'auto',
                              py: 0.75,
                              px: 1.5,
                              fontSize: '0.875rem'
                            }
                          }
                        }
                      }}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 0.75, 
                          px: 1.5, 
                          fontSize: '0.875rem' 
                        }
                      }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Paper>
          </Container>
        </Main>
      </AppTheme>
      
      {/* Use DialogManager for consistency with dashboard, replacing direct TransactionForm */}
      {renderDialogManager()}
      
      {/* Delete Transaction Confirmation Dialog - keep this separate as it's already established */}
      <Dialog
        open={dialogStates.deleteConfirmOpen}
        onClose={() => {
          setSelectedTransaction(null);
          updateDialogState('deleteConfirmOpen', false);
        }}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px',
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          {t('transactions.deleteDialog.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('transactions.deleteDialog.message')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedTransaction(null);
            updateDialogState('deleteConfirmOpen', false);
          }} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            autoFocus
            aria-label={t('transactions.deleteDialog.confirmAriaLabel')}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage; 