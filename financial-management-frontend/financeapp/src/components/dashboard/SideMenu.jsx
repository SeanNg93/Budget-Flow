import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import WalletIcon from '@mui/icons-material/Wallet';


const drawerWidth = 280;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1, 2),
  '&.Mui-selected': {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: 'rgba(0, 122, 255, 0.15)',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const SideMenu = ({ open, handleDrawerClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Transactions', icon: <AccountBalanceWalletIcon />, path: '/transactions' },
    { text: 'Wallets', icon: <WalletIcon />, path: '/wallets' }, 
    { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.05)',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main',
              mr: 2,
              fontWeight: 'bold'
            }}
          >
            {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {userData.username || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.email || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleDrawerClose} sx={{ color: 'text.secondary' }}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      
      <Divider sx={{ mx: 2 }} />
      
      <Box sx={{ px: 1, py: 2 }}>
        <Typography 
          variant="overline" 
          color="text.secondary" 
          sx={{ 
            px: 2, 
            fontSize: '0.75rem', 
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}
        >
          MENU
        </Typography>
        
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <StyledListItemButton 
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 500
                  }} 
                />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItem disablePadding>
          <StyledListItemButton 
            onClick={handleLogout}
            sx={{ 
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ 
                fontSize: '0.95rem',
                fontWeight: 500
              }} 
            />
          </StyledListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default SideMenu; 