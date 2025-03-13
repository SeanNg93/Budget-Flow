import React from 'react';
import { Grid, Paper, Typography, Button, IconButton, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

export default function WalletList({ wallets, setCreateWalletFormOpen, handleWalletMenuOpen }) {
  const navigate = useNavigate();

  const handleEditWallet = (walletId) => {
    navigate(`/wallets/edit/${walletId}`);
  };

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
        <Typography 
          component="h2" 
          variant="h5" 
          color="text.primary" 
          sx={{ 
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Danh sách ví
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Danh sách ví của bạn sẽ hiển thị ở đây.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setCreateWalletFormOpen(true)}
          sx={{
            mt: 2,
            borderRadius: 3,
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: 'none',
          }}
        >
          Create Wallet
        </Button>
        <Grid container spacing={3}>
          {wallets.map((wallet) => (
            <Grid item xs={12} md={6} key={wallet.id}>
              <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWalletIcon sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{wallet.walletName}</Typography>
                    <Typography variant="body2" color="text.secondary">Balance: {wallet.balance} VND</Typography>
                  </Box>
                </Box>
                <Box>
                  <IconButton
                    aria-label="wallet options"
                    onClick={(event) => handleWalletMenuOpen(event, wallet)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <IconButton
                    aria-label="edit wallet"
                    onClick={() => handleEditWallet(wallet.id)}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Grid>
  );
} 