import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-toastify';

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import PendingDeletionAlert from '../components/dashboard/PendingDeletionAlert';
import WalletOverview from '../components/dashboard/WalletOverview';
import FinanceChart from '../components/dashboard/FinanceChart';

// Import new dashboard components - modular architecture
import WelcomeSection from '../components/dashboard/WelcomeSection';
import SummaryCards from '../components/dashboard/SummaryCards';
import TransactionsSection from '../components/dashboard/TransactionsSection';
import DialogManager from '../components/dashboard/DialogManager';

// Import theme
import AppTheme from '../shared-theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';

// Import services
import FinanceService from '../services/FinanceService';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [financialData, setFinancialData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [sharedWallets, setSharedWallets] = useState({});
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});
  const [error, setError] = useState(null);
  const [chartRefreshKey, setChartRefreshKey] = useState(0); // State to trigger chart refresh

  // Dialog states centralized
  const [dialogStates, setDialogStates] = useState({
    transactionForm: false,
    accountForm: false,
    categoryForm: false,
    addBalanceForm: false,
    editBalanceForm: false,
    walletManageForm: false,
    financeActionPanel: false,
    categoryManageForm: false,
    profileDialog: false,
    userTransferDialog: false,
    shareWalletDialog: false,
    transferDialog: false,
    editTransactionOpen: false,
    deleteConfirmOpen: false
  });

  const [selectedWallet, setSelectedWallet] = useState(null);

  const [timeRange, setTimeRange] = useState('all'); // Default to 'all' time
  const [timeRangeLoading, setTimeRangeLoading] = useState(false);

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
      fetchFinancialData();

      // Set a default userProfile from existing user data to avoid API call
      setUserProfile({
        id: user.id,
        fullName: user.username || 'User',
        joinDate: new Date().toISOString().split('T')[0],
        role: user.roles?.includes('ROLE_ADMIN') ? 'Administrator' : 'User',
        bio: '',
        profilePicturePath: user.profilePicture || '',
        currency: 'USD'
      });

      // Only try to fetch user profile if we already have the data
      if (user.hasProfile) {
      fetchUserProfile();
    }

      fetchCategories();
    }
  }, [user]);

  // Handle location state for navigation/search
  useEffect(() => {
    // Check if location state exists
    if (!location.state) {
      // Check if there's a persisted dialog state in localStorage
      try {
        const persistedState = sessionStorage.getItem('dashboardDialogState');
        if (persistedState) {
          // Clear it immediately to prevent reappearing on refresh
          sessionStorage.removeItem('dashboardDialogState');
        }
      } catch (err) {
        console.error('Error handling persisted dialog state:', err);
      }
      return;
    }

    // Store current state in sessionStorage before processing
    try {
      sessionStorage.setItem('dashboardDialogState', JSON.stringify(location.state));
    } catch (err) {
      console.error('Error storing dialog state:', err);
    }

    // Extract dialog actions from location state
    const dialogMappings = {
      openWalletForm: 'accountForm',
      openTransactionForm: 'transactionForm',
      openTransferDialog: 'transferDialog',
      openUserTransferDialog: 'userTransferDialog',
      openShareWalletDialog: 'shareWalletDialog',
      openCategoryForm: 'categoryForm'
    };

    // Open dialogs based on location state
    Object.entries(dialogMappings).forEach(([stateKey, dialogKey]) => {
      if (location.state[stateKey]) {
        updateDialogState(dialogKey, true);
      }
    });

    // Handle item selection from search
    if (location.state.selectedWallet) {
      setSelectedWallet(location.state.selectedWallet);
      updateDialogState('walletManageForm', true);
    }

    if (location.state.selectedTransaction) {
      const transactionId = location.state.selectedTransaction;
      const transaction = transactions.find(t => t.id === transactionId);

      if (transaction) {
        setSelectedTransaction(transaction);
        updateDialogState('editTransactionOpen', true);
      } else {
        fetchTransactionDetails(transactionId);
      }
    }

    // Clear location state
    navigate(location.pathname, { replace: true, state: {} });

    // Also clear from sessionStorage when processed
    try {
      sessionStorage.removeItem('dashboardDialogState');
    } catch (err) {
      console.error('Error removing dialog state:', err);
    }
  }, [location, transactions, navigate]);

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

  // API Calls grouped by functionality
  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;

      const response = await FinanceService.getUserProfile(user.id);

      if (response.data) {
        setUserProfile(prevProfile => ({
          ...prevProfile,
          ...response.data
        }));
      }
    } catch (err) {
      // Just log the error - we already have default values set
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchTransactionDetails = async (transactionId) => {
    try {
      const response = await FinanceService.getTransaction(transactionId);
      if (response.data) {
        setSelectedTransaction(response.data);
        updateDialogState('editTransactionOpen', true);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setError('Failed to fetch transaction details');
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Parallel API calls for better performance
      const [summaryResponse, accountsResponse, transactionsResponse,
             sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getFinancialSummary(),
        FinanceService.getAccounts(),
        FinanceService.getTransactions(),
        FinanceService.getSharedWalletsWithMe(),
        FinanceService.getSharedWalletsByMe()
      ]);

      // Process shared wallets
      const sharedWalletsMap = {};
      const sharedInfo = {};

      // Process shared wallets similar to WalletOverview component
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
      setFinancialData({
        totalBalance: summaryResponse.data.totalBalance || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
      setWallets(accountsResponse.data || []);

      // Process and set transactions
      const processedTransactions = processTransactions(transactionsResponse.data || []);
      setTransactions(processedTransactions.slice(0, 8));
      setFilteredTransactions(processedTransactions.slice(0, 8));
      setAllTransactions(processedTransactions || []);

      // If a time range other than 'all' is selected, apply the filter after setting initial data
      if (timeRange !== 'all') {
        await fetchFinancialDataByTimeRange(timeRange);
      }
      // Trigger chart refresh after initial full data load
      setChartRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      setError('Failed to load financial data. Please try again later.');
      setFinancialData({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (applyFilters = false, filterParams = {}) => {
    try {
      const response = applyFilters
        ? await FinanceService.getFilteredTransactions(filterParams)
        : await FinanceService.getTransactions();

      const processedTransactions = processTransactions(response.data || []);
      setFilteredTransactions(processedTransactions);
      setAllTransactions(processedTransactions);
      setTransactions(processedTransactions.slice(0, 8));
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const [expenseCategoriesResponse, incomeCategoriesResponse, transactionsResponse] =
        await Promise.all([
          FinanceService.getCategoriesByType('EXPENSE'),
          FinanceService.getCategoriesByType('INCOME'),
          FinanceService.getTransactions()
        ]);

      // Combine categories
      const allCategoriesData = [
        ...(expenseCategoriesResponse.data || []),
        ...(incomeCategoriesResponse.data || [])
      ];

      setAllCategories(allCategoriesData);

      // Find used categories
      if (transactionsResponse.data?.length > 0) {
        const usedCategoryIds = new Set();
        transactionsResponse.data.forEach(transaction => {
          const categoryId = transaction.category?.id || transaction.categoryId;
          if (categoryId) usedCategoryIds.add(categoryId.toString());
        });

        setCategories(allCategoriesData.filter(category =>
          usedCategoryIds.has(category.id.toString())
        ));
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Event handlers with optimized implementation

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleTransactionAdded = (isUpdate = false) => {
    // Update only what's needed
    updateFinancialSummary();
    fetchTransactions();
    updateWallets();
    setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh

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

  const handleAccountAdded = (forceFullRefresh = false) => {
    if (forceFullRefresh) {
      fetchFinancialData(); // This already triggers chart refresh
      fetchTransactions();
      fetchCategories();
      updateFinancialSummary();
    } else {
      updateLocalFinancialSummary();
      updateWallets();
      setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh
    }
  };

  const updateLocalFinancialSummary = () => {
    setFinancialData(prevData => {
      const walletBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
      return {
        ...prevData,
        allocatedBalance: walletBalance,
        availableBalance: prevData.totalBalance - walletBalance
      };
    });
  };

  const updateWallets = async () => {
    try {
      const response = await FinanceService.getAccounts();
      if (response?.data) {
        setWallets(response.data);
      }
    } catch (error) {
      console.error("Error updating wallets:", error);
    }
  };

  const handleCategoryAdded = () => {
      fetchFinancialData(); // This already triggers chart refresh
  };

  const handleBalanceAdded = async () => {
    try {
      const summaryResponse = await FinanceService.getFinancialSummary();

      setFinancialData(prevData => ({
        ...prevData,
        totalBalance: summaryResponse.data.totalBalance || 0,
        netSavings: summaryResponse.data.netSavings || 0
      }));
      setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const handleEditTransaction = (transaction) => {
    // Create a clean copy with only needed properties
    const transactionToEdit = {
      id: transaction.id,
      transactionType: transaction.transactionType,
      amount: transaction.amount,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      wallet: transaction.wallet ? {
        id: transaction.wallet.id,
        accountName: transaction.wallet.accountName
      } : null,
      category: transaction.category ? {
        id: transaction.category.id,
        categoryName: transaction.category.categoryName,
        type: transaction.category.type
      } : null
    };

    setSelectedTransaction(transactionToEdit);
    updateDialogState('editTransactionOpen', true);
  };

  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('deleteConfirmOpen', true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await FinanceService.deleteTransaction(selectedTransaction.id);

      // Update all affected transaction lists
      const filterPredicate = t => t.id !== selectedTransaction.id;
      setAllTransactions(prev => prev.filter(filterPredicate));
      setFilteredTransactions(prev => prev.filter(filterPredicate));

      setTransactions(prev => {
        const updated = prev.filter(filterPredicate);
        return updated.length < 8 ? allTransactions.filter(filterPredicate).slice(0, 8) : updated;
      });

      // Update financial data
      updateFinancialSummary();
      updateWallets();
      setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh

      // Reset state and show confirmation
      setSelectedTransaction(null);
      updateDialogState('deleteConfirmOpen', false);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const updateFinancialSummary = async () => {
    try {
      const summaryResponse = await FinanceService.getFinancialSummary();

      setFinancialData({
        totalBalance: summaryResponse.data.totalBalance || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
    } catch (error) {
      console.error('Error updating financial summary:', error);
    }
  };

  const handleProfileUpdated = () => fetchUserProfile();

  const handleCategoryUpdated = async () => {
    toast.success('Categories updated successfully!');
    await fetchCategories();
    await fetchTransactions();
    setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh
  };

  // Handle transaction filter application
  const handleApplyFilters = async (filterParams) => {
    try {
      setFilterLoading(true);

      // Check if client-filtered data was provided directly
      if (filterParams.clientFiltered) {
        // If we have client-filtered data, use it directly
        const processedTransactions = processTransactions(filterParams.clientFiltered);
        setFilteredTransactions(processedTransactions);
        setTransactions(processedTransactions.slice(0, 8));
        setFilterLoading(false);
        return;
      }

      // Otherwise, make API call for server filtering
      const response = await FinanceService.getFilteredTransactions(filterParams);
      const processedTransactions = processTransactions(response.data || []);

      setFilteredTransactions(processedTransactions);
      setTransactions(processedTransactions.slice(0, 8));

      // Return the processed transactions for potential client-side filtering
      return processedTransactions;
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setFilterLoading(false);
    }
  };

  // New function to handle time range changes
  const handleTimeRangeChange = async (newTimeRange) => {
    if (newTimeRange === timeRange) return;

    setTimeRangeLoading(true);
    setTimeRange(newTimeRange);

    try {
      // Fetch financial data with the new time range
      await fetchFinancialDataByTimeRange(newTimeRange);
      // Chart refresh is handled by its internal useEffect watching startDate/endDate
    } catch (error) {
      console.error('Error fetching data for time range:', error);

      // Show error toast
      toast.error('Failed to load data for the selected time range', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setTimeRangeLoading(false);
    }
  };

  // New function to fetch financial data by time range
  const fetchFinancialDataByTimeRange = async (selectedTimeRange) => {
    try {
      // Get financial summary by date range for the selected time range
      const summaryResponse = await FinanceService.getFinancialSummaryByDateRange(selectedTimeRange);

      // For time-filtered data, we need to preserve the total balance from the original data
      // as the chart data endpoint doesn't include balance information
      setFinancialData((prevData) => ({
        ...prevData,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
        // Preserve total balance from previous state
      }));
    } catch (error) {
      console.error('Error fetching financial data by time range:', error);
      // Don't reset financial data on error, keep the last valid state
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppTheme themeComponents={themeComponents}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppNavbar open={open} handleDrawerOpen={handleDrawerOpen} />
        <SideMenu
          open={open}
          handleDrawerClose={handleDrawerClose}
          setProfileDialogOpen={() => updateDialogState('profileDialog', true)}
          setCategoryManageFormOpen={() => updateDialogState('categoryManageForm', true)}
        />
        <PendingDeletionAlert />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="lg" sx={{ p: 2 }}>
            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                <Grid container spacing={2.4}>
                  {/* Welcome Section */}
                  <Grid item xs={12}>
                    <WelcomeSection
                      userProfile={userProfile}
                      user={user}
                      openFinanceActionPanel={() => updateDialogState('financeActionPanel', true)}
                    />
                  </Grid>
                </Grid>

                {/* Summary Cards */}
                <SummaryCards
                  financialData={financialData}
                  loading={loading || timeRangeLoading}
                  handleEditBalance={() => updateDialogState('editBalanceForm', true)}
                  handleManageWallets={() => updateDialogState('walletManageForm', true)}
                  handleAddBalance={() => updateDialogState('addBalanceForm', true)}
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                  timeRangeLoading={timeRangeLoading}
                />

                <Grid container spacing={2.4} sx={{ mt: 1.2 }}>
                  {/* Wallet Overview and Chart Side by Side */}
                  <Grid item xs={12}>
                    <Grid container spacing={2.4}>
                      {/* Wallet Overview */}
                      <Grid item xs={12} md={6}>
                        <WalletOverview
                        onManageWallets={() => updateDialogState('walletManageForm', true)}
                          externalWallets={wallets}
                        />
                      </Grid>

                      {/* Financial Chart - Pass refreshKey */}
                      <Grid item xs={12} md={6}>
                        <FinanceChart refreshKey={chartRefreshKey} />
                      </Grid>
                    </Grid>
                  </Grid>

                {/* Transactions Section */}
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
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={() => fetchTransactions(false)}
                  formatCurrency={(amount) => new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(amount)}
                />
                </Grid>
            </Box>
          </Container>
        </Main>
      </Box>

      {/* All dialogs and forms managed in DialogManager */}
      <DialogManager
        dialogStates={dialogStates}
        updateDialogState={updateDialogState}
        userProfile={userProfile}
        selectedTransaction={selectedTransaction}
        selectedWallet={selectedWallet}
        wallets={wallets}
        handleTransactionAdded={handleTransactionAdded}
        handleAccountAdded={handleAccountAdded}
        handleCategoryAdded={handleCategoryAdded}
        handleBalanceAdded={handleBalanceAdded}
        handleProfileUpdated={handleProfileUpdated}
        handleCategoryUpdated={handleCategoryUpdated}
        handleDeleteConfirm={handleDeleteConfirm}
        setSelectedTransaction={setSelectedTransaction}
        setSelectedWallet={setSelectedWallet}
        fetchFinancialData={fetchFinancialData} // Pass fetchFinancialData if needed by DialogManager
      />
    </AppTheme>
  );
}
