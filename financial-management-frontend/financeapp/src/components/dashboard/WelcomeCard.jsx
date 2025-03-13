import React from 'react';
import { Grid, Paper, Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function WelcomeCard({ user, showAddTransaction, openFinanceActionPanel }) {
  return (
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
          {showAddTransaction && (
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
          )}
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
  );
} 