import React, { useState, useEffect } from 'react';
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

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionForm from '../components/dashboard/TransactionForm';
import WalletForm from '../components/dashboard/WalletForm';
import WalletManageForm from '../components/dashboard/WalletManageForm';
import CategoryForm from '../components/dashboard/CategoryForm';
import FinanceActionPanel from '../components/dashboard/FinanceActionPanel';
import AddBalanceForm from '../components/dashboard/AddBalanceForm';
import EditBalanceForm from '../components/dashboard/EditBalanceForm';
import PendingDeletionAlert from '../components/dashboard/PendingDeletionAlert';
import WalletOverview from '../components/dashboard/WalletOverview';
import ProfileDialog from '../components/user/ProfileDialog';
import UserTransferForm from '../components/dashboard/UserTransferForm';
import ShareWalletForm from '../components/dashboard/ShareWalletForm';

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

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
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

  // New state for the unified finance action panel
  const [financeActionPanelOpen, setFinanceActionPanelOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchUserProfile();
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  // Function to fetch transactions
  const fetchTransactions = async () => {
    try {
      const transactionsResponse = await FinanceService.getTransactions();
      console.log('Fetched transactions:', transactionsResponse.data); // Log to check response data
      
      // Ensure we're getting complete transaction data with categories
      if (transactionsResponse.data && transactionsResponse.data.length > 0) {
        // Store the transactions with full details
        setTransactions(transactionsResponse.data.slice(0, 5)); // Get only the 5 most recent
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      await FinanceService.getCategories();
      // No need to set state as we're just ensuring the data is refreshed
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
        />
        <PendingDeletionAlert />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="lg" className={styles.dashboardContainer}>
            <Grid container spacing={3}>
              {/* Welcome Card */}
              <Grid item xs={12}>
                <Paper className={styles.welcomeCard}>
                  <Box className={styles.welcomeHeader}>
                    <Typography 
                      component="h1" 
                      variant="h4" 
                      color="text.primary" 
                      className={styles.welcomeTitle}
                    >
                      Welcome, {userProfile?.fullName || user?.username || 'User'}!
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    className={styles.welcomeSubtitle}
                  >
                    This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget.
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                <Card className={`${styles.summaryCard} ${styles.balanceCard}`}>
                  <CardHeader 
                    title={
                      <Box className={styles.cardHeaderContent}>
                        <Box className={styles.cardTitleContainer}>
                          <AccountBalanceWalletIcon 
                            sx={{ mr: 1, color: '#007aff' }} 
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
                          sx={{ mr: 1, color: '#34c759' }} 
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
                          sx={{ mr: 1, color: '#ff3b30' }} 
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
                          sx={{ mr: 1, color: financialData.netSavings >= 0 ? '#34c759' : '#ff3b30' }} 
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
              
              {/* Wallet Overview */}
              <Grid item xs={12}>
                <WalletOverview 
                  onManageWallets={handleManageWallets} 
                  externalWallets={wallets}
                />
              </Grid>
              
              {/* Recent Transactions */}
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
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={openFinanceActionPanel}
                      className={styles.addNewButton}
                      elevation={3}
                    >
                      Add New
                    </Button>
                  </Box>
                  
                  {loading ? (
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
                        No transactions to display. Start adding your financial data to see it here.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Main>
      </Box>
      
      {/* Finance Action Panel */}
      <FinanceActionPanel 
        open={financeActionPanelOpen} 
        handleClose={() => setFinanceActionPanelOpen(false)} 
        onTransactionAdded={handleTransactionAdded}
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
          transaction={selectedTransaction}
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