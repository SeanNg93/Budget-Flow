import React from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function SelectedWalletDetails({ selectedWallet, handleEditWallet, handleDeleteWallet }) {
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
          mt: 3
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
          Chi tiết ví: {selectedWallet.walletName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Số dư: {selectedWallet.balance} {selectedWallet.currency}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mô tả: {selectedWallet.description || 'Không có mô tả'}
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={() => handleEditWallet(selectedWallet?.id)}
          sx={{ mt: 2 }}
        >
          Sửa ví
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={() => handleDeleteWallet(selectedWallet?.id)}
          sx={{
            mt: 2,
            borderRadius: 3,
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: 'none',
          }}
        >
          Xóa ví
        </Button>
      </Paper>
    </Grid>
  );
} 