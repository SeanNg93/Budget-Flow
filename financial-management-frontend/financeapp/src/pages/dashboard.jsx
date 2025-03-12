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

  useEffect(() => {
    checkAuth();
  }, []);

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

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
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
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Total Balance" />
                  <CardContent>
                    <Typography variant="h4">$5,240.00</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Income" />
                  <CardContent>
                    <Typography variant="h4" color="success.main">$8,350.00</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Expenses" />
                  <CardContent>
                    <Typography variant="h4" color="error.main">$3,110.00</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Recent Transactions */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Recent Transactions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No transactions to display. Start adding your financial data to see it here.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Main>
      </Box>
    </AppTheme>
  );
}