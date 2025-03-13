import React from 'react';
import { Grid, Paper, Typography, Button, Box, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function RecentTransactions({ transactions, loading, openFinanceActionPanel }) {
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

  return (
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
                      sx={{ fontSize: '0.95rem', fontWeight: 600 }}
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
  );
} 