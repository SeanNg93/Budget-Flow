import React from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, IconButton, CircularProgress, Box, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';

export default function SummaryCards({ financialData, loading, setAddBalanceFormOpen, handleBalanceMenuOpen, balanceMenuAnchorEl, handleBalanceMenuClose, handleEditBalance }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
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
    </>
  );
} 