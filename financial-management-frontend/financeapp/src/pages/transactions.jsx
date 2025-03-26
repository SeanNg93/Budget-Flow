import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Grid, Paper, Typography, Divider, CircularProgress, Pagination, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

// Import components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionsSection from '../components/dashboard/TransactionsSection';
import DialogManager from '../components/dashboard/DialogManager';
import TransactionForm from '../components/dashboard/TransactionForm';
import CategoryManageForm from '../components/dashboard/CategoryManageForm';

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

const drawerWidth = 225;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(2.8),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    backgroundColor: theme.palette.mode === 'light' ? '#f8f9fa' : theme.palette.background.default,
    minHeight: '100vh',
    position: 'relative',
    overflowX: 'hidden', // Prevent horizontal scrollbar
    width: '100%', // Ensure it takes full width
    boxSizing: 'border-box', // Include padding in width calculation
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
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
    categoryManageForm: false
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
      
      processSharedWallets(sharedWithMeResponse.data || [], false);
      processSharedWallets(sharedByMeResponse.data || [], true);
      
      // Update state with fetched data
      setSharedWallets(sharedWalletsMap);
      setSharedWalletsInfo(sharedInfo);
      setWallets(walletsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      
      // Process and set transactions
      const processedTransactions = processTransactions(transactionsResponse.data || []);
      setAllTransactions(processedTransactions);
      setFilteredTransactions(processedTransactions);
      updateDisplayedTransactions(processedTransactions);
      
      // Calculate total pages
      setTotalPages(Math.ceil(processedTransactions.length / pageSize));
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load transactions. Please try again later.');
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
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page when changing page size
    setTotalPages(Math.ceil(filteredTransactions.length / parseInt(event.target.value, 10)));
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
    // Refresh data after transaction added/updated
    fetchData();
    
    // Show success toast
    toast.success(isUpdate ? 'Transaction updated successfully' : 'Transaction added successfully', {
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
      toast.success('Transaction deleted successfully', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Error deleting transaction', {
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppTheme themeComponents={themeComponents}>
      <Box sx={{ 
        display: 'flex',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <CssBaseline />
        <AppNavbar open={open} handleDrawerOpen={handleDrawerOpen} />
        <SideMenu 
          open={open} 
          handleDrawerClose={handleDrawerClose} 
          setProfileDialogOpen={() => updateDialogState('profileDialog', true)}
          setCategoryManageFormOpen={() => updateDialogState('categoryManageForm', true)}
        />
        <Main open={open}>
          <DrawerHeader />
          <Container 
            maxWidth="lg" 
            sx={{ 
              p: 2,
              maxWidth: '100%', // Prevent container from exceeding available space
              boxSizing: 'border-box'
            }}
          >
            <Paper sx={{ 
              p: 3, 
              borderRadius: '12px', 
              mb: 3,
              overflowX: 'hidden', // Prevent horizontal scrollbar
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
                Transactions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Pagination controls at top */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Rows per page:
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
              />
              
              {/* Pagination controls at bottom */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" sx={{ mr: 1.5 }}>
                    Rows per page:
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
      </Box>
      
      {/* Dialog Manager for Delete Confirmation */}
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
          Confirm Transaction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedTransaction(null);
            updateDialogState('deleteConfirmOpen', false);
          }} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            autoFocus
            aria-label="Confirm delete transaction"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Transaction Form Dialog */}
      <TransactionForm 
        open={dialogStates.transactionForm} 
        handleClose={() => updateDialogState('transactionForm', false)}
        onTransactionAdded={handleTransactionAdded}
      />
      
      {/* Edit Transaction Form Dialog */}
      {selectedTransaction && (
        <TransactionForm 
          key={`edit-transaction-${selectedTransaction.id}`}
          open={dialogStates.editTransactionOpen} 
          handleClose={() => {
            updateDialogState('editTransactionOpen', false);
            setSelectedTransaction(null);
          }}
          initialData={selectedTransaction}
          onTransactionAdded={handleTransactionAdded}
        />
      )}

      {/* Category Management Dialog */}
      <CategoryManageForm 
        open={dialogStates.categoryManageForm}
        handleClose={() => updateDialogState('categoryManageForm', false)}
        onCategoryUpdated={() => {
          // Refresh categories data
          FinanceService.getCategories().then(response => {
            setCategories(response.data || []);
          });
        }}
      />
    </AppTheme>
  );
};

export default TransactionsPage; 