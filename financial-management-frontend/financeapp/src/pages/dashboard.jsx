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
    error: contextError
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
    setLoading(true);
    if (financialSummary && contextTransactions.length > 0) {
      setLoading(false);
      processContextData();
    } else {
      // If context is still loading, wait for it (UserContext should ideally handle its own loading state)
      // Or trigger initial fetch if needed (though UserContext does this)
      // fetchInitialData();
    }
    if (profileData && profileData.userId) {
      setupLocalProfile(profileData);
    }

    // Fetch categories locally if not managed by context
    fetchCategories();
  }, []);

  // Effect to react to changes in context data
  useEffect(() => {
    console.log("Context data updated, processing...");
    processContextData();
    setLoading(false);
  }, [financialSummary, wallets, contextTransactions, contextSharedWallets]);

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
    // For updates, do a more thorough refresh to ensure sorting is consistent
    if (isUpdate) {
      // Complete refresh of financial data and transactions
      fetchAndProcessTransactions();
    } else {
      // For new transactions, lighter update
      updateFinancialSummary();
      fetchAndProcessTransactions();
      updateWallets();
      setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh
    }

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
      fetchAndProcessTransactions();
      fetchCategories();
      updateFinancialSummary();
    } else {
      updateLocalFinancialSummary();
      updateWallets();
      setChartRefreshKey(prevKey => prevKey + 1); // Trigger chart refresh
    }
  };

  // Add handler for wallet deletion
  const handleWalletDeleted = () => {
    // Refresh transactions to show updated names
    fetchAndProcessTransactions();
    // Refresh financial summary and wallets list
    updateFinancialSummary();
    updateWallets();
    // Refresh chart data
    setChartRefreshKey(prevKey => prevKey + 1);
    toast.success('Wallet deleted successfully');
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
        // setWallets(response.data);
      }
    } catch (error) {
      console.error("Error updating wallets:", error);
    }
  };

  const handleCategoryAdded = () => {
      fetchAndProcessTransactions();
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
      } : null,
      originalWalletName: transaction.originalWalletName // Include this
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
      
      // Show detailed error message from backend if available
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete transaction');
      }
      
      // Close the dialog to avoid confusing the user
      updateDialogState('deleteConfirmOpen', false);
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
    await fetchAndProcessTransactions();
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
        
        // Before setting the filtered transactions, ensure any IDs from shared wallets are preserved
        const updatedTransactions = processedTransactions.map(transaction => {
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
        
        setFilteredTransactions(updatedTransactions);
        setTransactions(updatedTransactions.slice(0, 8));
        setFilterLoading(false);
        return;
      }

      // Otherwise, make API call for server filtering
      const response = await FinanceService.getFilteredTransactions(filterParams);
      
      // Process the transactions to ensure proper ID formats
      const rawTransactions = response.data || [];
      
      // Map through the transactions and preserve ID formats from existing transactions
      const updatedTransactions = rawTransactions.map(transaction => {
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
      
      const processedTransactions = processTransactions(updatedTransactions);
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

  // Listen for wallet balance updates
  useEffect(() => {
    // Define the handler for the custom event
    const handleWalletUpdate = (event) => {
      const { walletId, newBalance } = event.detail;
      
      if (walletId && typeof newBalance === 'number') {
        // Update the wallet in our local state
        // setWallets(currentWallets => {
        //   return currentWallets.map(wallet => {
        //     if (wallet.id.toString() === walletId.toString()) {
        //       return {
        //         ...wallet,
        //         balance: newBalance
        //       };
        //     }
        //     return wallet;
        //   });
        // });
        
        // Update the financial summary to reflect the new balance
        updateFinancialSummary();
      }
    };
    
    // Add the event listener
    window.addEventListener('wallet-balance-updated', handleWalletUpdate);
    
    // Remove the event listener on cleanup
    return () => {
      window.removeEventListener('wallet-balance-updated', handleWalletUpdate);
    };
  }, []);

  // Component cleanup
  useEffect(() => {
    // No cleanup needed for now
    return () => {
      // Removed references to undefined variables
    };
  }, []);

  // Set up the theme components with scroll lock mitigation
  const themeComponents = useMemo(() => ({
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true
      }
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true
      }
    }
  }), []);

  // Store references to DialogManager methods
  const setDialogManagerMethods = useCallback((methods) => {
    if (methods && methods.openEditBalanceForm) {
      dialogManagerRef.current.openEditBalanceForm = methods.openEditBalanceForm;
    }
  }, []);

  // Handle filter reset specifically for dashboard
  const handleResetFilters = () => {
    // First, clear filtered transactions
    setFilteredTransactions([]);
    
    // Fetch all transactions and update them with the limit of 8
    // Pass false for updateFiltered to prevent overwriting empty filteredTransactions
    fetchAndProcessTransactions(false, {}, false);
    
    // No need for additional sorting since fetchTransactions now sorts consistently
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
        ref={setDialogManagerMethods}
      />
    </AppTheme>
  );
}
