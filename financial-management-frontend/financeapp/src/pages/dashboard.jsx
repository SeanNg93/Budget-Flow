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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editTransactionOpen, setEditTransactionOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [addBalanceFormOpen, setAddBalanceFormOpen] = useState(false);
  const [editBalanceFormOpen, setEditBalanceFormOpen] = useState(false);
  const [walletManageFormOpen, setWalletManageFormOpen] = useState(false);
  const [balanceMenuAnchorEl, setBalanceMenuAnchorEl] = useState(null);
  const [error, setError] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [userTransferDialogOpen, setUserTransferDialogOpen] = useState(false);
  const [shareWalletDialogOpen, setShareWalletDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Finance action panel state
  const [financeActionPanelOpen, setFinanceActionPanelOpen] = useState(false);

  const [categoryManageFormOpen, setCategoryManageFormOpen] = useState(false);

  // Add new state variables for transaction filtering
  const [transactionFilterOpen, setTransactionFilterOpen] = useState(false);
  const [filterTimeframe, setFilterTimeframe] = useState('week');
  const [filterWalletId, setFilterWalletId] = useState('all');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  // Add state for custom date range
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 7));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

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
        setAccountFormOpen(true);
      }
      if (location.state.openTransactionForm) {
        setTransactionFormOpen(true);
      }
      if (location.state.openTransferDialog) {
        setTransferDialogOpen(true);
      }
      if (location.state.openUserTransferDialog) {
        setUserTransferDialogOpen(true);
      }
      if (location.state.openShareWalletDialog) {
        setShareWalletDialogOpen(true);
      }
      if (location.state.openCategoryForm) {
        setCategoryFormOpen(true);
      }
      
      // Handle selected items from search
      if (location.state.selectedWallet) {
        setSelectedWallet(location.state.selectedWallet);
        setWalletManageFormOpen(true);
      }
      if (location.state.selectedTransaction) {
        const transactionId = location.state.selectedTransaction;
        // Find and select the transaction from existing transactions
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          setSelectedTransaction(transaction);
          setEditTransactionOpen(true);
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
        setEditTransactionOpen(true);
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

      const response = await axios.get(`${API_BASE_URL}/api/user/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        setUserProfile(response.data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
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
      
      // Update financial data
      setFinancialData({
        totalBalance: summaryResponse.data.totalBalance || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
      
      // Update wallets
      setWallets(accountsResponse.data || []);
      
      // Update transactions
      setTransactions(transactionsResponse.data.slice(0, 5)); // Get only the 5 most recent
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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

  // Function to open the finance action panel
  const openFinanceActionPanel = () => {
    setFinanceActionPanelOpen(true);
  };

  const handleBalanceMenuOpen = (event) => {
    setBalanceMenuAnchorEl(event.currentTarget);
  };

  const handleBalanceMenuClose = () => {
    setBalanceMenuAnchorEl(null);
  };

  const handleEditBalance = () => {
    handleBalanceMenuClose();
    setEditBalanceFormOpen(true);
  };

  const handleManageWallets = () => {
    handleBalanceMenuClose();
    setWalletManageFormOpen(true);
  };

  // Function to handle editing a transaction
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditTransactionOpen(true);
  };

  // Function to handle closing the edit transaction dialog
  const handleEditTransactionClose = () => {
    setSelectedTransaction(null);
    setEditTransactionOpen(false);
  };

  // Function to handle confirming the edit
  const handleEditTransactionConfirm = () => {
    // Close the dialog, TransactionForm component will handle the API call
    setEditTransactionOpen(false);
    fetchFinancialData(); // Refresh data after edit
  };

  // Function to open delete confirmation dialog
  const handleDeleteTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setDeleteConfirmOpen(true);
  };

  // Function to close delete confirmation dialog
  const handleDeleteCancel = () => {
    setSelectedTransaction(null);
    setDeleteConfirmOpen(false);
  };

  // Function to confirm delete transaction
  const handleDeleteConfirm = async () => {
    try {
      await FinanceService.deleteTransaction(selectedTransaction.id);
      setDeleteConfirmOpen(false);
      setSelectedTransaction(null);
      fetchFinancialData(); // Refresh data after delete
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // Function to handle timeframe changes
  const handleTimeframeChange = (event) => {
    const value = event.target.value;
    setFilterTimeframe(value);
    setShowCustomDateRange(value === 'custom');
  };

  // Function to fetch transactions with filtering support
  const fetchTransactions = async (applyFilters = false) => {
    try {
      setIsFiltering(true);
      const transactionsResponse = await FinanceService.getTransactions();
      
      if (transactionsResponse.data && transactionsResponse.data.length > 0) {
        // If we're not filtering, just get recent transactions
        if (!applyFilters) {
          setTransactions(transactionsResponse.data.slice(0, 5));
          setFilteredTransactions(transactionsResponse.data.slice(0, 5));
          setIsFiltering(false);
          return;
        }
        
        // Apply time filter
        let filteredData = [...transactionsResponse.data];
        const currentDate = new Date();
        let startDate;
        
        if (filterTimeframe === 'custom') {
          // Use custom date range if selected
          startDate = new Date(customStartDate);
          currentDate.setTime(new Date(customEndDate).getTime());
        } else {
          // Use predefined date ranges
          switch (filterTimeframe) {
            case 'day':
              startDate = new Date(currentDate);
              startDate.setDate(currentDate.getDate() - 1);
              break;
            case 'week':
              startDate = new Date(currentDate);
              startDate.setDate(currentDate.getDate() - 7);
              break;
            case 'month':
              startDate = new Date(currentDate);
              startDate.setMonth(currentDate.getMonth() - 1);
              break;
            case 'quarter':
              startDate = new Date(currentDate);
              startDate.setMonth(currentDate.getMonth() - 3);
              break;
            case 'year':
              startDate = new Date(currentDate);
              startDate.setFullYear(currentDate.getFullYear() - 1);
              break;
            default:
              startDate = new Date(0); // Beginning of time
          }
        }
        
        // Filter by date
        filteredData = filteredData.filter(transaction => {
          const transactionDate = new Date(transaction.transactionDate);
          return transactionDate >= startDate && transactionDate <= currentDate;
        });
        
        // Filter by wallet if specified
        if (filterWalletId !== 'all') {
          filteredData = filteredData.filter(transaction => {
            // Check different possible formats of wallet/account ID
            if (transaction.wallet && transaction.wallet.id) {
              return transaction.wallet.id.toString() === filterWalletId;
            }
            if (transaction.account && transaction.account.id) {
              return transaction.account.id.toString() === filterWalletId;
            }
            if (transaction.accountId) {
              return transaction.accountId.toString() === filterWalletId;
            }
            return false;
          });
        }
        
        // Filter by category if specified
        if (filterCategoryId !== 'all') {
          filteredData = filteredData.filter(transaction => {
            // Check different possible formats of category ID
            if (transaction.category && transaction.category.id) {
              return transaction.category.id.toString() === filterCategoryId;
            }
            if (transaction.categoryId) {
              return transaction.categoryId.toString() === filterCategoryId;
            }
            return false;
          });
        }
        
        // Set the filtered transactions
        setFilteredTransactions(filteredData);
        
        // Also update the transactions to display
        setTransactions(filteredData.slice(0, 10)); // Show up to 10 when filtering
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  // Function to apply filters
  const applyTransactionFilters = () => {
    fetchTransactions(true);
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
    fetchTransactions(false);
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

  const handleTransfer = async () => {
    // ... existing code ...
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

  // Helper function to format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy');
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
          setProfileDialogOpen={setProfileDialogOpen}
          setCategoryManageFormOpen={setCategoryManageFormOpen} 
        />
        <PendingDeletionAlert />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="lg" className={styles.dashboardContainer}>
            <Box className={styles.dashboardBackdrop}>
              <Box className={styles.contentContainer}>
                <Grid container spacing={2.4}>
                  {/* Welcome Card */}
                  <Grid item xs={12}>
                    <Paper className={styles.welcomeCard}>
                      <Box className={styles.welcomeHeader}>
                        <DecryptedText
                          text={`Welcome, ${userProfile?.fullName || user?.username || 'User'}!`}
                          animateOn="view"
                          revealDirection="start"
                          speed={50}  // Higher speed value = slower animation
                          sequential={true}  // Change to true for more visible character-by-character effect
                          maxIterations={8}  // More iterations = longer animation
                          className={styles.welcomeTitle}
                          parentClassName={styles.welcomeTitleContainer}
                        />
                      </Box>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        className={styles.welcomeSubtitle}
                      >
                        <DecryptedText
                          text="This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget."
                          animateOn="view"
                          revealDirection="start"
                          speed={20} // Lower value = faster animation (reduced from 50 to 20)
                          sequential={true}
                          maxIterations={5} // Reduced iterations for faster completion
                        />
                        {' '} <br></br>
                        <DecryptedText
                          text="Click here"
                          animateOn="view"
                          revealDirection="start"
                          speed={50}
                          sequential={true}
                          maxIterations={8}
                          onClick={openFinanceActionPanel}
                          style={{ 
                            color: '#007aff', 
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 500
                          }}
                        />
                        {' '}
                        <DecryptedText
                          text="for quick navigation."
                          animateOn="view"
                          revealDirection="start"
                          speed={50}
                          sequential={true}
                          maxIterations={8}
                        />
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  {/* Summary Cards Row */}
                  <Grid item xs={12} md={3}>
                    <Card className={`${styles.summaryCard} ${styles.balanceCard}`}>
                      <CardHeader 
                        title={
                          <Box className={styles.cardHeaderContent}>
                            <Box className={styles.cardTitleContainer}>
                              <AccountBalanceWalletIcon 
                                sx={{ mr: 1, color: '#007aff', fontSize: '1.33rem' }} 
                              />
                              <Typography 
                                variant="h6" 
                                component="div" 
                                className={styles.cardTitle}
                              >
                                Total Balance
                              </Typography>
                              <IconButton 
                                color="primary" 
                                size="small" 
                                onClick={() => setAddBalanceFormOpen(true)}
                                className={styles.addIconButton}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <IconButton
                              aria-label="more options"
                              aria-controls="balance-menu"
                              aria-haspopup="true"
                              onClick={handleBalanceMenuOpen}
                              size="small"
                              className={styles.moreOptionsButton}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        } 
                      />
                      <Menu
                        id="balance-menu"
                        anchorEl={balanceMenuAnchorEl}
                        keepMounted
                        open={Boolean(balanceMenuAnchorEl)}
                        onClose={handleBalanceMenuClose}
                        PaperProps={{
                          className: styles.menuPaper
                        }}
                      >
                        <MenuItem onClick={handleEditBalance} className={styles.menuItem}>
                          <EditIcon fontSize="small" className={styles.menuIcon} />
                          Edit Balance
                        </MenuItem>
                        <MenuItem onClick={handleManageWallets} className={styles.menuItem}>
                          <SettingsIcon fontSize="small" className={styles.menuIcon} />
                          Manage Wallets
                        </MenuItem>
                      </Menu>
                      <CardContent sx={{ pt: 0 }}>
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography 
                            variant="h4" 
                            className={styles.balanceAmount}
                          >
                            {formatCurrency(financialData.totalBalance)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card className={`${styles.summaryCard} ${styles.incomeCard}`}>
                      <CardHeader 
                        title={
                          <Box className={styles.cardTitleContainer}>
                            <TrendingUpIcon 
                              sx={{ mr: 1, color: '#34c759', fontSize: '1.33rem' }} 
                            />
                            <Typography 
                              variant="h6" 
                              component="div" 
                              className={styles.cardTitle}
                            >
                              Income
                            </Typography>
                          </Box>
                        } 
                      />
                      <CardContent sx={{ pt: 0 }}>
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography 
                            variant="h4" 
                            color="success.main"
                            className={styles.incomeAmount}
                          >
                            {formatCurrency(financialData.totalIncome)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card className={`${styles.summaryCard} ${styles.expenseCard}`}>
                      <CardHeader 
                        title={
                          <Box className={styles.cardTitleContainer}>
                            <TrendingDownIcon 
                              sx={{ mr: 1, color: '#ff3b30', fontSize: '1.33rem' }} 
                            />
                            <Typography 
                              variant="h6" 
                              component="div" 
                              className={styles.cardTitle}
                            >
                              Expenses
                            </Typography>
                          </Box>
                        } 
                      />
                      <CardContent sx={{ pt: 0 }}>
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography 
                            variant="h4" 
                            color="error.main"
                            className={styles.expenseAmount}
                          >
                            {formatCurrency(financialData.totalExpense)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card className={`${styles.summaryCard} ${styles.savingsCard}`}>
                      <CardHeader 
                        title={
                          <Box className={styles.cardTitleContainer}>
                            <SavingsIcon 
                              sx={{ mr: 1, color: financialData.netSavings >= 0 ? '#34c759' : '#ff3b30', fontSize: '1.33rem' }} 
                            />
                            <Typography 
                              variant="h6" 
                              component="div" 
                              className={styles.cardTitle}
                            >
                              Net Savings
                            </Typography>
                          </Box>
                        } 
                      />
                      <CardContent sx={{ pt: 0 }}>
                        {loading ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Typography 
                            variant="h4" 
                            color={financialData.netSavings >= 0 ? "success.main" : "error.main"}
                            className={styles.savingsAmount}
                          >
                            {formatCurrency(financialData.netSavings)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Wallet Overview and Chart Side by Side */}
                  <Grid item xs={12}>
                    <Grid container spacing={2.4}>
                      {/* Wallet Overview */}
                      <Grid item xs={12} md={6}>
                        <WalletOverview 
                          onManageWallets={handleManageWallets} 
                          externalWallets={wallets}
                        />
                      </Grid>
                      
                      {/* Financial Chart */}
                      <Grid item xs={12} md={6}>
                        <FinanceChart />
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  {/* Recent Transactions Section with Filtering */}
                  <Grid item xs={12}>
                    <Paper 
                      className={styles.transactionsCard}
                    >
                      <Box className={styles.transactionsHeader}>
                        <Typography 
                          component="h2" 
                          variant="h5" 
                          className={styles.sectionTitle}
                        >
                          Recent Transactions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
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
                            onClick={() => setTransactionFormOpen(true)}
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
                      
                      {loading || isFiltering ? (
                        <Box className={styles.loadingBox}>
                          <CircularProgress />
                        </Box>
                      ) : transactions.length > 0 ? (
                        <TableContainer className={styles.tableContainer}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell className={styles.tableHeaderCell}>Date</TableCell>
                                <TableCell className={styles.tableHeaderCell}>Description</TableCell>
                                <TableCell className={styles.tableHeaderCell}>Category</TableCell>
                                <TableCell className={styles.tableHeaderCell}>Wallet</TableCell>
                                <TableCell className={styles.tableHeaderCell}>Type</TableCell>
                                <TableCell align="right" className={styles.tableHeaderCell}>Amount</TableCell>
                                <TableCell className={styles.tableHeaderCell}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {transactions.map((transaction) => (
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
                                    {transaction.wallet ? transaction.wallet.accountName : 
                                     (transaction.account ? transaction.account.accountName : 
                                      (transaction.accountId ? accounts.find(a => a.id === transaction.accountId)?.accountName || `Wallet #${transaction.accountId}` : 'Unknown'))}
                                  </TableCell>
                                  <TableCell className={styles.tableCell}>
                                    <Box
                                      className={transaction.transactionType === 'INCOME' 
                                        ? styles.incomeTag 
                                        : styles.expenseTag}
                                    >
                                      {transaction.transactionType}
                                    </Box>
                                  </TableCell>
                                  <TableCell 
                                    align="right" 
                                    className={transaction.transactionType === 'INCOME' 
                                      ? styles.incomeAmount 
                                      : styles.expenseAmount}
                                  >
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                  <TableCell className={styles.tableCell}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                      <IconButton 
                                        size="small" 
                                        color="primary" 
                                        onClick={() => handleEditTransaction(transaction)}
                                        className={styles.editButton}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={() => handleDeleteTransaction(transaction)}
                                        className={styles.deleteButton}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box className={styles.emptyTransactionsBox}>
                          <Typography variant="body1" color="text.secondary">
                            {transactionFilterOpen ? 'No transactions match your filter criteria.' : 'No transactions to display. Start adding your financial data to see it here.'}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Container>
        </Main>
      </Box>
      
      {/* Finance Action Panel */}
      <FinanceActionPanel 
        open={financeActionPanelOpen} 
        handleClose={() => setFinanceActionPanelOpen(false)} 
        setTransactionFormOpen={setTransactionFormOpen}
        setWalletManageFormOpen={setWalletManageFormOpen}
        setCategoryManageFormOpen={setCategoryManageFormOpen}
        setUserTransferDialogOpen={setUserTransferDialogOpen}
      />
      
      {/* Wallet Management Form */}
      <WalletManageForm 
        open={walletManageFormOpen} 
        handleClose={() => setWalletManageFormOpen(false)} 
        onWalletUpdated={handleAccountAdded}
      />
      
      {/* Keep the individual forms for backward compatibility if needed */}
      <TransactionForm 
        open={transactionFormOpen} 
        handleClose={() => setTransactionFormOpen(false)} 
        onTransactionAdded={handleTransactionAdded}
      />
      
      <WalletForm 
        open={accountFormOpen} 
        handleClose={() => setAccountFormOpen(false)} 
        onWalletAdded={handleAccountAdded}
      />
      
      <CategoryForm 
        open={categoryFormOpen} 
        handleClose={() => setCategoryFormOpen(false)} 
        onCategoryAdded={handleCategoryAdded}
      />
      
      <CategoryManageForm 
        open={categoryManageFormOpen} 
        handleClose={() => setCategoryManageFormOpen(false)}
        onCategoryUpdated={handleCategoryUpdated}
      />
      
      <AddBalanceForm 
        open={addBalanceFormOpen} 
        handleClose={() => setAddBalanceFormOpen(false)} 
        onBalanceAdded={handleBalanceAdded}
      />
      
      <EditBalanceForm 
        open={editBalanceFormOpen} 
        handleClose={() => setEditBalanceFormOpen(false)} 
        onBalanceEdited={handleBalanceAdded}
      />
      
      <ProfileDialog
        open={profileDialogOpen}
        handleClose={() => setProfileDialogOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {/* Additional dialogs for search features */}
      {selectedTransaction && (
        <TransactionForm 
          open={editTransactionOpen} 
          handleClose={() => {
            setEditTransactionOpen(false);
            setSelectedTransaction(null);
          }} 
          initialData={selectedTransaction}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
      
      <UserTransferForm
        open={userTransferDialogOpen}
        handleClose={() => setUserTransferDialogOpen(false)}
        onTransferCompleted={() => {
          setUserTransferDialogOpen(false);
          fetchFinancialData();
        }}
      />
      
      <ShareWalletForm
        open={shareWalletDialogOpen && selectedWallet}
        wallet={selectedWallet ? wallets.find(w => w.id === selectedWallet) : null}
        handleClose={() => {
          setShareWalletDialogOpen(false);
          setSelectedWallet(null);
        }}
        onWalletShared={() => {
          setShareWalletDialogOpen(false);
          setSelectedWallet(null);
          fetchFinancialData();
        }}
      />
      
      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
      >
        <DialogTitle>Transfer Money Between Wallets</DialogTitle>
        <DialogContent>
          <WalletManageForm
            open={true}
            handleClose={() => setTransferDialogOpen(false)}
            onWalletUpdated={handleAccountAdded}
            embedded={true}
            initialOpenTransfer={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Transaction Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px',
          }
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Transaction Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}