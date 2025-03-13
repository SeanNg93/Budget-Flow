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

// Import dashboard components
import SideMenu from '../components/dashboard/SideMenu';
import AppNavbar from '../components/dashboard/AppNavbar';
import TransactionForm from '../components/dashboard/TransactionForm';
import AccountForm from '../components/dashboard/AccountForm';
import CategoryForm from '../components/dashboard/CategoryForm';
import FinanceActionPanel from '../components/dashboard/FinanceActionPanel';
import AddBalanceForm from '../components/dashboard/AddBalanceForm';
import EditBalanceForm from '../components/dashboard/EditBalanceForm';

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
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [addBalanceFormOpen, setAddBalanceFormOpen] = useState(false);
  const [editBalanceFormOpen, setEditBalanceFormOpen] = useState(false);
  const [balanceMenuAnchorEl, setBalanceMenuAnchorEl] = useState(null);
  const [error, setError] = useState(null);

  // New state for the unified finance action panel
  const [financeActionPanelOpen, setFinanceActionPanelOpen] = useState(false);

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
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    borderRadius: 4,
                    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      component="h1" 
                      variant="h4" 
                      color="text.primary" 
                      sx={{ 
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Welcome, {user?.username || 'User'}!
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={openFinanceActionPanel}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        boxShadow: 'none',
                      }}
                    >
                      Add Transaction
                    </Button>
                  </Box>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '1.05rem' }}
                  >
                    This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget.
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="h6" 
                            component="div" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            Total Balance
                          </Typography>
                          <IconButton 
                            color="primary" 
                            size="small" 
                            onClick={() => setAddBalanceFormOpen(true)}
                            sx={{ 
                              ml: 1,
                              backgroundColor: 'rgba(0, 122, 255, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                              }
                            }}
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
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
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
                      sx: {
                        borderRadius: 3,
                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
                        minWidth: 180,
                      }
                    }}
                  >
                    <MenuItem onClick={handleEditBalance} sx={{ py: 1.5 }}>
                      <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                      Edit Balance
                    </MenuItem>
                  </Menu>
                  <CardContent sx={{ pt: 0 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          color: 'text.primary',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatCurrency(financialData.totalBalance)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title={
                      <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        Income
                      </Typography>
                    } 
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography 
                        variant="h4" 
                        color="success.main"
                        sx={{ 
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatCurrency(financialData.totalIncome)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title={
                      <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        Expenses
                      </Typography>
                    } 
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography 
                        variant="h4" 
                        color="error.main"
                        sx={{ 
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatCurrency(financialData.totalExpense)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title={
                      <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        Net Savings
                      </Typography>
                    } 
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Typography 
                        variant="h4" 
                        color={financialData.netSavings >= 0 ? "success.main" : "error.main"}
                        sx={{ 
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatCurrency(financialData.netSavings)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Recent Transactions */}
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 4,
                    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography 
                      component="h2" 
                      variant="h5" 
                      color="text.primary" 
                      sx={{ 
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Recent Transactions
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={openFinanceActionPanel}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 600,
                        borderWidth: '1.5px',
                      }}
                    >
                      Add New
                    </Button>
                  </Box>
                  
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : transactions.length > 0 ? (
                    <TableContainer sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Type</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow 
                              key={transaction.id}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)' 
                                } 
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.95rem' }}>{formatDate(transaction.transactionDate)}</TableCell>
                              <TableCell sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{transaction.description}</TableCell>
                              <TableCell sx={{ fontSize: '0.95rem' }}>{transaction.category?.categoryName || 'Uncategorized'}</TableCell>
                              <TableCell sx={{ fontSize: '0.95rem' }}>
                                <Box
                                  sx={{
                                    display: 'inline-block',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    backgroundColor: transaction.transactionType === 'INCOME' 
                                      ? 'rgba(52, 199, 89, 0.1)' 
                                      : 'rgba(255, 59, 48, 0.1)',
                                    color: transaction.transactionType === 'INCOME' 
                                      ? 'success.main' 
                                      : 'error.main',
                                  }}
                                >
                                  {transaction.transactionType}
                                </Box>
                              </TableCell>
                              <TableCell 
                                align="right" 
                                sx={{ 
                                  color: transaction.transactionType === 'INCOME' ? 'success.main' : 'error.main',
                                  fontSize: '0.95rem',
                                  fontWeight: 600
                                }}
                              >
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 3
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No transactions to display. Start adding your financial data to see it here.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={openFinanceActionPanel}
                        sx={{
                          mt: 2,
                          borderRadius: 3,
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                          boxShadow: 'none',
                        }}
                      >
                        Add First Transaction
                      </Button>
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
    </AppTheme>
  );
}