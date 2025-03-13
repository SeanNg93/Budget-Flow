import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DeleteIcon from '@mui/icons-material/Delete';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionForm from '../components/dashboard/TransactionForm';
import AccountForm from '../components/dashboard/AccountForm';
import CategoryForm from '../components/dashboard/CategoryForm';
import FinanceActionPanel from '../components/dashboard/FinanceActionPanel';
import AddBalanceForm from '../components/dashboard/AddBalanceForm';
import EditBalanceForm from '../components/dashboard/EditBalanceForm';
import CreateWallet from '../pages/wallet/CreateWallet';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import SummaryCards from '../components/dashboard/SummaryCards';
import WalletList from '../components/dashboard/WalletList';
import SelectedWalletDetails from '../components/dashboard/SelectedWalletDetails';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import EditWallet from '../pages/wallet/EditWallet';

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
  const [open, setOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [addBalanceFormOpen, setAddBalanceFormOpen] = useState(false);
  const [editBalanceFormOpen, setEditBalanceFormOpen] = useState(false);
  const [balanceMenuAnchorEl, setBalanceMenuAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  // New state for the unified finance action panel
  const [financeActionPanelOpen, setFinanceActionPanelOpen] = useState(false);

  // State to manage wallet list visibility
  const [showWallets, setShowWallets] = useState(false);

  // State to manage add transaction button visibility
  const [showAddTransaction, setShowAddTransaction] = useState(true);

  // State to manage create wallet form visibility
  const [createWalletFormOpen, setCreateWalletFormOpen] = useState(false);

  // State to manage wallet menu anchor
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState(null);

  const toggleWallets = () => {
    setShowWallets(true);
    setShowAddTransaction(false);
  };

  const toggleTransactions = () => {
    setShowWallets(false);
    setShowAddTransaction(true);
  };

  const handleCreateWallet = () => {
    setCreateWalletFormOpen(true);
  };

  const handleTransactionAdded = () => {
    fetchFinancialData();
  };

  const handleWalletCreated = () => {
    setCreateWalletFormOpen(false);
    setShowWallets(true);
    fetchWallets();
  };

  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
    setShowWallets(false);
    setShowAddTransaction(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchWallets();
    }
  }, [user]);

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

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        alert('Bạn chưa đăng nhập!');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8080/api/wallets', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWallets(response.data);
    } catch (error) {
      console.error('Lỗi tải danh sách ví:', error);
      alert('Không thể tải danh sách ví. Vui lòng thử lại.');
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

  const handleAccountAdded = () => {
    fetchFinancialData();
  };

  const handleCategoryAdded = () => {
    fetchFinancialData();
  };

  const handleBalanceAdded = () => {
    fetchFinancialData();
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

  const handleWalletMenuOpen = (event, wallet) => {
    setWalletMenuAnchorEl(event.currentTarget);
    setSelectedWallet(wallet);
  };

  const handleWalletMenuClose = () => {
    setWalletMenuAnchorEl(null);
  };

  // 🔄 **Reset số dư về 0**
  const handleResetBalance = async (walletId) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.put(`http://localhost:8080/api/wallets/${walletId}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchWallets();
      alert('Số dư đã được đặt lại về 0!');
    } catch (error) {
      console.error('Lỗi reset số dư:', error);
      alert('Không thể đặt lại số dư. Vui lòng thử lại.');
    }
  };

  // ❌ **Xóa ví và toàn bộ giao dịch**
  const handleDeleteWallet = async (walletId) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa ví này không?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`http://localhost:8080/api/wallets/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchWallets();
      alert('Ví và tất cả giao dịch liên quan đã bị xóa.');
    } catch (error) {
      console.error('Lỗi xóa ví:', error);
      alert('Không thể xóa ví. Vui lòng thử lại.');
    }
  };

  const handleEditWallet = (walletId) => {
    navigate(`/wallets/edit/${walletId}`);
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
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppNavbar open={open} handleDrawerOpen={handleDrawerOpen} />
        <SideMenu 
          open={open} 
          handleDrawerClose={handleDrawerClose} 
          onWalletsToggle={toggleWallets} 
          onTransactionsToggle={toggleTransactions} 
        />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <WelcomeCard 
                user={user} 
                showAddTransaction={showAddTransaction} 
                openFinanceActionPanel={openFinanceActionPanel} 
              />
              <SummaryCards 
                financialData={financialData} 
                loading={loading} 
                setAddBalanceFormOpen={setAddBalanceFormOpen} 
                handleBalanceMenuOpen={handleBalanceMenuOpen} 
                balanceMenuAnchorEl={balanceMenuAnchorEl} 
                handleBalanceMenuClose={handleBalanceMenuClose} 
                handleEditBalance={handleEditBalance} 
              />
              {showWallets && (
                <WalletList 
                  wallets={wallets} 
                  setCreateWalletFormOpen={setCreateWalletFormOpen} 
                  handleWalletMenuOpen={handleWalletMenuOpen} 
                />
              )}
              {selectedWallet && (
                <SelectedWalletDetails 
                  selectedWallet={selectedWallet} 
                  handleEditWallet={handleEditWallet} 
                  handleDeleteWallet={handleDeleteWallet} 
                />
              )}
              {createWalletFormOpen && (
                <Grid item xs={12}>
                  <CreateWallet 
                    open={createWalletFormOpen} 
                    handleClose={() => setCreateWalletFormOpen(false)} 
                    onWalletCreated={handleWalletCreated}
                  />
                </Grid>
              )}
              {showAddTransaction && (
                <RecentTransactions 
                  transactions={transactions} 
                  loading={loading} 
                  openFinanceActionPanel={openFinanceActionPanel} 
                />
              )}
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
      
      {/* Keep the individual forms for backward compatibility if needed */}
      <TransactionForm 
        open={transactionFormOpen} 
        handleClose={() => setTransactionFormOpen(false)} 
        onTransactionAdded={handleTransactionAdded}
      />
      
      <AccountForm 
        open={accountFormOpen} 
        handleClose={() => setAccountFormOpen(false)} 
        onAccountAdded={handleAccountAdded}
      />
      
      <CategoryForm 
        open={categoryFormOpen} 
        handleClose={() => setCategoryFormOpen(false)} 
        onCategoryAdded={handleCategoryAdded}
      />
      
      {/* Add Balance Form */}
      <AddBalanceForm 
        open={addBalanceFormOpen}
        handleClose={() => setAddBalanceFormOpen(false)}
        onBalanceAdded={handleBalanceAdded}
      />
      
      {/* Edit Balance Form */}
      <EditBalanceForm 
        open={editBalanceFormOpen}
        handleClose={() => setEditBalanceFormOpen(false)}
        onBalanceUpdated={handleBalanceAdded}
        currentBalance={financialData.totalBalance}
      />

      {/* Wallet Actions Menu */}
      <Menu
        anchorEl={walletMenuAnchorEl}
        keepMounted
        open={Boolean(walletMenuAnchorEl)}
        onClose={handleWalletMenuClose}
      >
        <MenuItem onClick={() => handleEditWallet(selectedWallet?.id)}>
          <EditIcon sx={{ mr: 1 }} /> Edit Wallet
        </MenuItem>
        <MenuItem onClick={() => handleResetBalance(selectedWallet?.id)}>
          <MoneyOffIcon sx={{ mr: 1 }} /> Reset Balance
        </MenuItem>
        <MenuItem onClick={() => handleDeleteWallet(selectedWallet?.id)}>
          <DeleteIcon sx={{ mr: 1 }} color="error" /> Delete Wallet
        </MenuItem>
      </Menu>
    </AppTheme>
  );
}