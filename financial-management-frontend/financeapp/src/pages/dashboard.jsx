import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { alpha } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InputBase from '@mui/material/InputBase';
import Fade from '@mui/material/Fade';
import axios from 'axios';
import styles from '../styles/dashboard.module.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { toast } from 'react-toastify';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DatePicker } from '@mui/x-date-pickers';
import { subDays, format } from 'date-fns';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionForm from '../components/dashboard/TransactionForm';
import WalletForm from '../components/dashboard/WalletForm';
import WalletManageForm from '../components/dashboard/WalletManageForm';
import CategoryForm from '../components/dashboard/CategoryForm';
import CategoryManageForm from '../components/dashboard/CategoryManageForm';
import FinanceActionPanel from '../components/dashboard/FinanceActionPanel';
import AddBalanceForm from '../components/dashboard/AddBalanceForm';
import EditBalanceForm from '../components/dashboard/EditBalanceForm';
import PendingDeletionAlert from '../components/dashboard/PendingDeletionAlert';
import WalletOverview from '../components/dashboard/WalletOverview';
import ProfileDialog from '../components/user/ProfileDialog';
import UserTransferForm from '../components/dashboard/UserTransferForm';
import ShareWalletForm from '../components/dashboard/ShareWalletForm';
import FinanceChart from '../components/dashboard/FinanceChart';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DecryptedText from '../components/dashboard/DecryptedText';

// Import new dashboard components
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
  const [error, setError] = useState(null);

  // Dialog states - moved to a central place for better management
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

  // Helper to update dialog states
  const updateDialogState = (dialogName, isOpen) => {
    setDialogStates(prevState => ({
      ...prevState,
      [dialogName]: isOpen
    }));
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // Handle state passed from navigation/search
  useEffect(() => {
    if (location.state) {
      // Handle form openings from search
      if (location.state.openWalletForm) {
        updateDialogState('accountForm', true);
      }
      if (location.state.openTransactionForm) {
        updateDialogState('transactionForm', true);
      }
      if (location.state.openTransferDialog) {
        updateDialogState('transferDialog', true);
      }
      if (location.state.openUserTransferDialog) {
        updateDialogState('userTransferDialog', true);
      }
      if (location.state.openShareWalletDialog) {
        updateDialogState('shareWalletDialog', true);
      }
      if (location.state.openCategoryForm) {
        updateDialogState('categoryForm', true);
      }
      
      // Handle selected items from search
      if (location.state.selectedWallet) {
        setSelectedWallet(location.state.selectedWallet);
        updateDialogState('walletManageForm', true);
      }
      if (location.state.selectedTransaction) {
        const transactionId = location.state.selectedTransaction;
        // Find and select the transaction from existing transactions
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          setSelectedTransaction(transaction);
          updateDialogState('editTransactionOpen', true);
        } else {
          // If not found, try to fetch it
          fetchTransactionDetails(transactionId);
        }
      }
      
      // Clear the location state after processing
      navigate(location.pathname, { replace: true });
    }
  }, [location, transactions]);

  // Function to fetch a specific transaction
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

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token || !user || !user.id) return;

      const response = await FinanceService.getUserProfile(user.id);

      if (response.data) {
        setUserProfile(response.data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const processTransactions = (transactions) => {
    return transactions.map(transaction => {
      // Process user profile picture URL if it exists
      if (transaction.user && transaction.user.profilePicture) {
        // Make sure URL is absolute
        if (transaction.user.profilePicture && !transaction.user.profilePicture.startsWith('http')) {
          transaction.user.profilePicture = `${API_BASE_URL}${transaction.user.profilePicture}`;
        }
      }
      
      // Also handle user profile picture from UserProfile if available
      if (transaction.user && transaction.user.userProfile && transaction.user.userProfile.profilePicturePath) {
        const path = transaction.user.userProfile.profilePicturePath;
        if (!path.startsWith('http')) {
          transaction.user.profilePicture = `${API_BASE_URL}${path}`;
        } else {
          transaction.user.profilePicture = path;
        }
      }
      
      return transaction;
    });
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch financial summary
      const summaryResponse = await FinanceService.getFinancialSummary();
      
      // Fetch accounts
      const accountsResponse = await FinanceService.getAccounts();
      
      // Fetch recent transactions
      const transactionsResponse = await FinanceService.getTransactions();
      
      // Fetch shared wallets information
      const sharedWithMeResponse = await FinanceService.getSharedWalletsWithMe();
      const sharedByMeResponse = await FinanceService.getSharedWalletsByMe();
      
      // Process shared wallets info to create a lookup map
      const sharedWalletsMap = {};
      
      // Add wallets shared with me
      (sharedWithMeResponse.data || []).forEach(shared => {
        if (shared.accepted) {
          sharedWalletsMap[shared.walletId] = true;
        }
      });
      
      // Add wallets shared by me
      (sharedByMeResponse.data || []).forEach(shared => {
        if (shared.accepted) {
          sharedWalletsMap[shared.walletId] = true;
        }
      });
      
      setSharedWallets(sharedWalletsMap);
      
      // Update financial data
      setFinancialData({
        totalBalance: summaryResponse.data.totalBalance || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
      
      // Update wallets
      setWallets(accountsResponse.data || []);
      
      // Process transaction data to ensure profile picture URLs are correct
      const processedTransactions = processTransactions(transactionsResponse.data || []);
      
      // Update transactions
      setTransactions(processedTransactions.slice(0, 5)); // Get only the 5 most recent
      setFilteredTransactions(processedTransactions.slice(0, 5));
      
      // Store all transactions for search functionality
      setAllTransactions(processedTransactions || []);
    } catch (error) {
      setError('Failed to load financial data. Please try again later.');
      // Use placeholder data if API fails
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

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleTransactionAdded = (isUpdate = false) => {
    // Instead of fetching all data, selectively update what's needed
    updateFinancialSummary();
    fetchTransactions();
    // If a transaction might affect wallet balances, update them too
    updateWallets();
    
    // Add toast notification for successful transaction
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
    // If forceFullRefresh is true, refresh everything including transactions
    if (forceFullRefresh) {
      fetchFinancialData();
      fetchTransactions();
      fetchCategories();
      updateFinancialSummary();
    } else {
      // Otherwise just update the necessary parts
      // First update financial data locally
      updateLocalFinancialSummary();
      
      // Then update wallets list
      updateWallets();
    }
  };

  // Function to update financial summary without API call
  const updateLocalFinancialSummary = () => {
    // We need to maintain the same total balance
    // The real change is in the allocation between wallets and available funds
    
    setFinancialData(prevData => {
      // Keep the same total but recalculate components
      const walletBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
      return {
        ...prevData,
        // Total balance remains the same
        allocatedBalance: walletBalance,
        availableBalance: prevData.totalBalance - walletBalance
      };
    });
  };

  // Function to update only wallets
  const updateWallets = () => {
    FinanceService.getAccounts().then(response => {
      if (response && response.data) {
        setWallets(response.data);
      }
    }).catch(error => {
      console.error("Error updating wallets:", error);
    });
  };

  const handleCategoryAdded = () => {
    fetchFinancialData();
  };

  const handleBalanceAdded = async () => {
    // Instead of calling fetchFinancialData which fetches all data,
    // we'll selectively update only what changed
    try {
      // Fetch only the updated balance
      const summaryResponse = await FinanceService.getFinancialSummary();
      
      // Update financial data without refreshing everything
      setFinancialData(prevData => ({
        ...prevData,
        totalBalance: summaryResponse.data.totalBalance || 0,
        netSavings: summaryResponse.data.netSavings || 0
      }));
      
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  // Function to handle editing a transaction
  const handleEditTransaction = (transaction) => {
    // Create a clean copy of the transaction to avoid reference issues
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

  // Function to handle closing the edit transaction dialog
  const handleEditTransactionClose = () => {
    setSelectedTransaction(null);
    updateDialogState('editTransactionOpen', false);
  };

  // Function to handle confirming the edit
  const handleEditTransactionConfirm = () => {
    // Close the dialog, TransactionForm component will handle the API call
    updateDialogState('editTransactionOpen', false);
    fetchFinancialData(); // Refresh data after edit
  };

  // Function to handle delete transaction
  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    updateDialogState('deleteConfirmOpen', true);
  };

  // Function to confirm delete transaction
  const handleDeleteConfirm = async () => {
    try {
      await FinanceService.deleteTransaction(selectedTransaction.id);
      updateDialogState('deleteConfirmOpen', false);
      setAllTransactions(prevTransactions => 
        prevTransactions.filter(t => t.id !== selectedTransaction.id)
      );
      
      setFilteredTransactions(prevTransactions => {
        const updated = prevTransactions.filter(t => t.id !== selectedTransaction.id);
        return updated;
      });
      
      setTransactions(prevTransactions => {
        const updated = prevTransactions.filter(t => t.id !== selectedTransaction.id);
        if (updated.length < 5) {
          const allFiltered = allTransactions.filter(t => t.id !== selectedTransaction.id);
          return allFiltered.slice(0, 5);
        }
        return updated;
      });
      
      updateFinancialSummary();
      
      updateWallets();
      
      setSelectedTransaction(null);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // Function to fetch transactions with filtering support
  const fetchTransactions = async (applyFilters = false, filterParams = {}) => {
    try {
      let response;
      
      if (applyFilters) {
        // Get filtered transactions using the parameters passed from TransactionsSection
        response = await FinanceService.getFilteredTransactions(filterParams);
      } else {
        // Get all transactions without filters
        response = await FinanceService.getTransactions();
      }
      
      // Process the transactions to ensure profile picture URLs are correct
      const processedTransactions = processTransactions(response.data || []);
      
      // Update filtered transactions
      setFilteredTransactions(processedTransactions);
      setAllTransactions(processedTransactions);
      
      // Set dashboard transactions to top 5 of filtered transactions
      setTransactions(processedTransactions.slice(0, 5));
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      // Get both INCOME and EXPENSE categories from API
      const expenseCategoriesResponse = await FinanceService.getCategoriesByType('EXPENSE');
      const incomeCategoriesResponse = await FinanceService.getCategoriesByType('INCOME');
      
      // Combine both types of categories
      const allCategoriesData = [
        ...(expenseCategoriesResponse.data || []),
        ...(incomeCategoriesResponse.data || [])
      ];
      
      // Store all categories for reference
      setAllCategories(allCategoriesData);
      
      // Get transaction data to find used categories
      const transactionsResponse = await FinanceService.getTransactions();
      
      if (transactionsResponse.data && transactionsResponse.data.length > 0) {
        // Extract unique category IDs from transactions
        const usedCategoryIds = new Set();
        transactionsResponse.data.forEach(transaction => {
          if (transaction.category && transaction.category.id) {
            usedCategoryIds.add(transaction.category.id.toString());
          } else if (transaction.categoryId) {
            usedCategoryIds.add(transaction.categoryId.toString());
          }
        });
        
        // Filter to only categories that are used in transactions
        const usedCategories = allCategoriesData.filter(category => 
          usedCategoryIds.has(category.id.toString())
        );
        
        setCategories(usedCategories);
      } else {
        // If no transactions, just show an empty list
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Function to update financial summary
  const updateFinancialSummary = async () => {
    try {
      const summaryResponse = await FinanceService.getFinancialSummary();
      
      // Update financial data
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

  // Simplified one-liner function
  const handleProfileUpdated = () => { fetchUserProfile(); };

  // Add a handler for category updates
  const handleCategoryUpdated = async () => {
    toast.success('Categories updated successfully!');
    // Refresh data as needed
    await fetchCategories();
    // If you have transactions that need updating due to category changes
    await fetchTransactions();
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
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
          <Container maxWidth="lg" className={styles.dashboardContainer}>
            <Box className={styles.dashboardBackdrop}>
              <Box className={styles.contentContainer}>
                <Grid container spacing={2.4}>
                  {/* Welcome Section */}
                  <Grid item xs={12}>
                    <WelcomeSection 
                      userProfile={userProfile} 
                      user={user} 
                      openFinanceActionPanel={() => updateDialogState('financeActionPanel', true)} 
                    />
                  </Grid>
                  
                  {/* Summary Cards Row */}
                  <SummaryCards 
                    financialData={financialData}
                    loading={loading}
                    handleEditBalance={() => updateDialogState('editBalanceForm', true)}
                    handleManageWallets={() => updateDialogState('walletManageForm', true)}
                    handleAddBalance={() => updateDialogState('addBalanceForm', true)}
                  />
                  
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
                      
                      {/* Financial Chart */}
                      <Grid item xs={12} md={6}>
                        <FinanceChart />
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
                    onAddTransaction={() => updateDialogState('transactionForm', true)}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onApplyFilters={(filterParams) => fetchTransactions(true, filterParams)}
                    onResetFilters={() => fetchTransactions(false)}
                    formatCurrency={(amount) => new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(amount)}
                  />
                </Grid>
              </Box>
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
        fetchFinancialData={fetchFinancialData}
      />
    </AppTheme>
  );
}