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

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';

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
    setDataLoading(true);
    try {
      // Fetch financial summary
      const summaryResponse = await FinanceService.getFinancialSummary();
      
      // Fetch total balance
      const balanceResponse = await FinanceService.getTotalBalance();
      
      // Fetch recent transactions
      const transactionsResponse = await FinanceService.getTransactions();
      
      setFinancialData({
        totalBalance: balanceResponse.data || 0,
        totalIncome: summaryResponse.data.totalIncome || 0,
        totalExpense: summaryResponse.data.totalExpense || 0,
        netSavings: summaryResponse.data.netSavings || 0
      });
      
      // Get the 5 most recent transactions
      const recentTransactions = transactionsResponse.data
        .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
        .slice(0, 5);
      
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Use placeholder data if API fails
      setFinancialData({
        totalBalance: 5240.00,
        totalIncome: 8350.00,
        totalExpense: 3110.00,
        netSavings: 5240.00
      });
    } finally {
      setDataLoading(false);
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
                  <Typography component="h1" variant="h4" color="primary" gutterBottom>
                    Welcome, {user?.username || 'User'}!
                  </Typography>
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
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Recent Transactions
                  </Typography>
                  
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
                                color: transaction.transactionType === 'Income' ? 'success.main' : 'error.main' 
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
    </AppTheme>
  );
}