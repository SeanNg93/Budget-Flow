import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';

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

// Import CSS module for dashboard
import styles from '../styles/dashboard.module.css';

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
    marginRight: 0,
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    backgroundColor: theme.palette.mode === 'light' ? '#f8f9fa' : theme.palette.background.default,
    minHeight: '100vh',
    position: 'relative',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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

export default function Dashboard() {
  const { 
    profileData,
    financialSummary,
    wallets,
    transactions: contextTransactions,
    sharedWallets: contextSharedWallets,
    fetchWalletsAndShared,
    fetchTransactions,
    fetchInitialData,
    loading: contextLoading,
    error: contextError,
    fetchFinancialSummary,
  } = useUser();

  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [sharedWallets, setSharedWallets] = useState({});
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});
  const [error, setError] = useState(null);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

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

  const [timeRange, setTimeRange] = useState('all');
  const [timeRangeLoading, setTimeRangeLoading] = useState(false);

  // Timeout reference for debounced operations
  const timeout = useRef(null);

  // Reference to DialogManager methods
  const dialogManagerRef = useRef({
    openEditBalanceForm: null
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
    setLoading(contextLoading);
    if (profileData && profileData.userId) {
      setupLocalProfile(profileData);
    }
    fetchCategories();
  }, [contextLoading]);

  // Effect to react to changes in context data
  useEffect(() => {
    processContextData();
    if (!contextLoading) setLoading(false);
  }, [financialSummary, wallets, contextTransactions, contextSharedWallets, contextLoading]);

  // Effect to react to profile data changes from context
  useEffect(() => {
    if (profileData && profileData.userId) {
      setupLocalProfile(profileData);
    }
  }, [profileData]);

  // Function to process data received from context
  const processContextData = () => {
    let processedTxs = processTransactions(contextTransactions || []);
    processedTxs = sortTransactions(processedTxs);
    setTransactions(processedTxs.slice(0, 8));
    setAllTransactions(processedTxs);
    setFilteredTransactions(processedTxs.slice(0, 8));

    const { sharedMap, sharedInfo } = processSharedWalletsFromContext(contextSharedWallets);
    setSharedWallets(sharedMap);
    setSharedWalletsInfo(sharedInfo);

    setChartRefreshKey(prev => prev + 1);
  };

  // Helper function to setup local profile state from context profile data
  const setupLocalProfile = (ctxProfileData) => {
    setUserProfile({
      id: ctxProfileData.userId,
      fullName: ctxProfileData.fullName || 'User',
      joinDate: new Date().toISOString().split('T')[0],
      role: 'User',
      bio: '',
      profilePicturePath: ctxProfileData.profilePicture || '',
      currency: 'USD'
    });
  };

  // Helper function to process shared wallets received from context
  const processSharedWalletsFromContext = (ctxSharedWallets) => {
    const sharedMap = {};
    const sharedInfo = {};
    (ctxSharedWallets || []).forEach(sharedWallet => {
      if (sharedWallet.accepted) {
        sharedMap[sharedWallet.walletId] = true;
        sharedInfo[sharedWallet.walletId] = {
          isShared: true,
          isOwner: sharedWallet.ownerId === profileData?.userId,
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
    return { sharedMap, sharedInfo };
  };

  // Use the sorting logic in a separate function
  const sortTransactions = (transactionsToSort) => {
    return [...transactionsToSort].sort((a, b) => {
      const parseId = (id) => {
        if (typeof id === 'number') return id;
        if (typeof id === 'string') {
          if (id.includes(':')) return parseInt(id.split(':')[0], 10);
          return parseInt(id, 10);
        }
        return 0;
      };
      const idA = parseId(a.id);
      const idB = parseId(b.id);
      if (idA !== idB) return idB - idA;
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);
      return dateB - dateA;
    });
  };

  // Update local fetchTransactions to use context fetch and process results
  const fetchAndProcessTransactions = async (applyFilters = false, filterParams = {}, updateFiltered = true) => {
    try {
      let processedTxs = processTransactions(contextTransactions || []);
      processedTxs = sortTransactions(processedTxs);
      
      if (updateFiltered) {
        setFilteredTransactions(processedTxs);
      }
      setAllTransactions(processedTxs);
      setTransactions(processedTxs.slice(0, 8));

    } catch (error) {
      console.error('Error fetching/processing transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

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
      // setUser(JSON.parse(userData));
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
      if (!profileData?.userId) return;

      const response = await FinanceService.getUserProfile(profileData.userId);

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
    // Trigger context to refetch transactions and summary
    fetchTransactions();
    fetchFinancialSummary();
    fetchWalletsAndShared(); // Wallets might need updating too
    setChartRefreshKey(prev => prev + 1);
    toast.success(isUpdate ? 'Transaction updated successfully' : 'Transaction added successfully');
    updateDialogState('transactionForm', false);
  };

  const handleAccountAdded = (forceFullRefresh = false) => {
    // Trigger context to refetch wallets and summary
    fetchWalletsAndShared();
    fetchFinancialSummary();
    setChartRefreshKey(prev => prev + 1);
    updateDialogState('accountForm', false);
    toast.success('Wallet action completed successfully');
  };

  // Callback for when a wallet is deleted
  const handleWalletDeleted = () => {
    // Trigger context refetch
    fetchWalletsAndShared();
    fetchFinancialSummary();
    fetchTransactions(); // Transactions might be affected
    setChartRefreshKey(prev => prev + 1);
    toast.success('Wallet deleted successfully');
  };

  const handleCategoryAdded = () => {
    fetchCategories(); // Refetch local categories
    updateDialogState('categoryForm', false);
    updateDialogState('categoryManageForm', false);
    toast.success('Category action completed successfully');
  };

  const handleBalanceAdded = async () => {
    // Trigger context refetch
    fetchWalletsAndShared();
    fetchFinancialSummary();
    fetchTransactions(); 
    setChartRefreshKey(prev => prev + 1);
    updateDialogState('addBalanceForm', false);
    toast.success('Balance added successfully');
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('editTransactionOpen', true);
  };

  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('deleteConfirmOpen', true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;
    try {
      await FinanceService.deleteTransaction(selectedTransaction.id);
      // Trigger context refetch
      fetchTransactions();
      fetchFinancialSummary();
      fetchWalletsAndShared(); 
      setChartRefreshKey(prev => prev + 1);
      toast.success('Transaction deleted successfully');
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error(t('transactions.deleteError'));
    } finally {
      setSelectedTransaction(null);
      updateDialogState('deleteConfirmOpen', false);
    }
  };

  const handleProfileUpdated = () => {
    // UserContext handles profile fetching
    // Might trigger local processing if needed
  };

  const handleCategoryUpdated = async () => {
    fetchCategories(); // Refetch local categories
    // Also refetch transactions as they might be linked to categories
    fetchTransactions(); 
  };

  // Handle applying filters (processes local state, doesn't refetch from API)
  const handleApplyFilters = async (filterParams) => {
    // ... filter logic using allTransactions state ...
    // setFilteredTransactions(...) based on result
  };

  // Handle time range changes for chart data (assuming chart fetches its own data)
  const handleTimeRangeChange = async (newTimeRange) => {
    setTimeRange(newTimeRange);
    // Chart component likely handles fetching based on this prop change
    // Or trigger a manual refetch if needed
    setChartRefreshKey(prev => prev + 1); 
  };

  // Callback for general wallet updates (transfers, sending money etc.)
  const handleWalletUpdate = (event) => {
    // Trigger context to refetch necessary data
    fetchWalletsAndShared(); 
    fetchFinancialSummary(); 
    // Transactions might also be affected by transfers/sending
    fetchTransactions(); 

    // Refresh chart if needed
    setChartRefreshKey(prev => prev + 1);
    // Show success toast or handle UI updates
    toast.success(event?.message || 'Action completed successfully');
  };

  // Handle resetting filters
  const handleResetFilters = () => {
    // ... reset filter state ...
    // setFilteredTransactions(allTransactions.slice(0, 8)); // Reset to show all recent
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
      <Box sx={{ display: 'flex', margin: 0, padding: 0, width: '100%', maxWidth: '100%' }}>
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
          <Box className={styles.dashboardContainer}>
            <Box 
              className={styles.dashboardBackdrop}
            >
              <Grid container spacing={2.4}>
                {/* Welcome Section */}
                <Grid item xs={12}>
                  <WelcomeSection
                    userProfile={userProfile}
                    user={profileData}
                    openFinanceActionPanel={() => updateDialogState('financeActionPanel', true)}
                    walletCount={wallets?.length || 0}
                  />
                </Grid>
              </Grid>

              {/* Summary Cards */}
              <SummaryCards
                totalBalance={financialSummary.totalBalance}
                totalIncome={financialSummary.totalIncome}
                totalExpense={financialSummary.totalExpense}
                netSavings={financialSummary.netSavings}
                loading={loading || timeRangeLoading}
                handleEditBalance={(walletId) => {
                  if (dialogManagerRef.current.openEditBalanceForm) {
                    dialogManagerRef.current.openEditBalanceForm(walletId);
                  } else {
                    updateDialogState('editBalanceForm', true);
                  }
                }}
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
                onResetFilters={handleResetFilters}
                formatCurrency={(amount) => new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(amount)}
              />
              </Grid>
            </Box>
          </Box>
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
        fetchFinancialData={fetchAndProcessTransactions}
        onWalletDeleted={handleWalletDeleted}
      />
    </AppTheme>
  );
}
