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
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionForm from '../components/dashboard/TransactionForm';
import AccountForm from '../components/dashboard/AccountForm';
import CategoryForm from '../components/dashboard/CategoryForm';

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
  const [dataLoading, setDataLoading] = useState(true);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
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
      setFinancialData({
        totalBalance: summaryResponse.data.totalBalance || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
      
      // Fetch accounts
      const accountsResponse = await FinanceService.getAccounts();
      
      // Fetch recent transactions
      const transactionsResponse = await FinanceService.getTransactions();
      
      setTransactions(transactionsResponse.data.slice(0, 5)); // Get only the 5 most recent
      
      setLoading(false);
    } catch (error) {
      setError('Failed to load financial data. Please try again later.');
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

  const handleTransactionAdded = () => {
    fetchFinancialData();
  };

  const handleAccountAdded = () => {
    fetchFinancialData();
  };

  const handleCategoryAdded = () => {
    // Refresh data if needed
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
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
        <SideMenu open={open} handleDrawerClose={handleDrawerClose} />
        <Main open={open}>
          <DrawerHeader />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Welcome Card */}
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography component="h1" variant="h4" color="primary" gutterBottom>
                      Welcome, {user?.username || 'User'}!
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => setTransactionFormOpen(true)}
                      >
                        Add Transaction
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => setAccountFormOpen(true)}
                      >
                        Add Account
                      </Button>
                      <IconButton 
                        color="primary"
                        onClick={handleMenuClick}
                        aria-label="more options"
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={() => {
                          setCategoryFormOpen(true);
                          handleMenuClose();
                        }}>
                          Add Category
                        </MenuItem>
                      </Menu>
                    </Stack>
                  </Box>
                  <Typography variant="body1">
                    This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget.
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader title="Total Balance" />
                  <CardContent>
                    {dataLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography variant="h4">{formatCurrency(financialData.totalBalance)}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader title="Income" />
                  <CardContent>
                    {dataLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography variant="h4" color="success.main">{formatCurrency(financialData.totalIncome)}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader title="Expenses" />
                  <CardContent>
                    {dataLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography variant="h4" color="error.main">{formatCurrency(financialData.totalExpense)}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardHeader title="Net Savings" />
                  <CardContent>
                    {dataLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography 
                        variant="h4" 
                        color={financialData.netSavings >= 0 ? "success.main" : "error.main"}
                      >
                        {formatCurrency(financialData.netSavings)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Recent Transactions */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography component="h2" variant="h6" color="primary">
                      Recent Transactions
                    </Typography>
                    <Button 
                      variant="text" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={() => setTransactionFormOpen(true)}
                    >
                      Add New
                    </Button>
                  </Box>
                  
                  {dataLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : transactions.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.category?.categoryName || 'Uncategorized'}</TableCell>
                              <TableCell>{transaction.transactionType}</TableCell>
                              <TableCell align="right" sx={{ 
                                color: transaction.transactionType === 'INCOME' ? 'success.main' : 'error.main' 
                              }}>
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      No transactions to display. Start adding your financial data to see it here.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Main>
      </Box>
      
      {/* Transaction Form Dialog */}
      <TransactionForm 
        open={transactionFormOpen} 
        handleClose={() => setTransactionFormOpen(false)} 
        onTransactionAdded={handleTransactionAdded}
      />
      
      {/* Account Form Dialog */}
      <AccountForm 
        open={accountFormOpen} 
        handleClose={() => setAccountFormOpen(false)} 
        onAccountAdded={handleAccountAdded}
      />
      
      {/* Category Form Dialog */}
      <CategoryForm 
        open={categoryFormOpen} 
        handleClose={() => setCategoryFormOpen(false)} 
        onCategoryAdded={handleCategoryAdded}
      />
    </AppTheme>
  );
}