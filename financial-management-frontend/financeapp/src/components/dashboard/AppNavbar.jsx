import React, { useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import ChangePassword from '../user/ChangePassword';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';

const drawerWidth = 280;

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  color: theme.palette.text.primary,
  boxShadow: 'none',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    fontSize: 10,
    height: 16,
    minWidth: 16,
    padding: '0 4px',
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 12,
    marginTop: theme.spacing(1),
    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
    minWidth: 180,
  },
  '& .MuiMenuItem-root': {
    padding: theme.spacing(1.5, 2),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  },
  '& .MuiDivider-root': {
    margin: theme.spacing(1, 0),
  },
}));

const AppNavbar = ({ open, handleDrawerOpen }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    handleMenuClose();
    navigate('/account/delete');
  };

  const handleChangePassword = () => {
    handleMenuClose();
    setChangePasswordOpen(true);
  };

  const handleChangePasswordClose = () => {
    setChangePasswordOpen(false);
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <StyledMenu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {userData.username || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userData.email || 'user@example.com'}
        </Typography>
      </Box>
      <Divider />
      <MenuItem onClick={handleProfile}>Profile</MenuItem>
      <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
      <Divider />
      <MenuItem onClick={handleDeleteAccount} sx={{ color: 'error.main' }}>
        Delete Account
      </MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </StyledMenu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <StyledMenu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton
          size="medium"
          aria-label="show new notifications"
          color="inherit"
        >
          <StyledBadge badgeContent={5} color="error">
            <NotificationsIcon />
          </StyledBadge>
        </IconButton>
        <Typography variant="body1" sx={{ ml: 1 }}>Notifications</Typography>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="medium"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        </IconButton>
        <Typography variant="body1" sx={{ ml: 1 }}>Profile</Typography>
      </MenuItem>
    </StyledMenu>
  );

  return (
    <>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Budget Flow
          </Typography>
          
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <IconButton
              size="large"
              aria-label="show new notifications"
              color="inherit"
              sx={{ 
                borderRadius: 2,
                mx: 1,
                '&:hover': {
                  backgroundColor: alpha('#000', 0.04)
                }
              }}
            >
              <StyledBadge badgeContent={5} color="error">
                <NotificationsIcon />
              </StyledBadge>
            </IconButton>
            
            <Box 
              onClick={handleProfileMenuOpen}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                ml: 1,
                cursor: 'pointer',
                borderRadius: 2,
                p: 0.5,
                '&:hover': {
                  backgroundColor: alpha('#000', 0.04)
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <KeyboardArrowDownIcon sx={{ ml: 0.5, color: 'text.secondary', fontSize: 20 }} />
            </Box>
          </Box>
          
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBarStyled>
      {renderMobileMenu}
      {renderMenu}
      <ChangePassword open={changePasswordOpen} onClose={handleChangePasswordClose} />
    </>
  );
};

export default AppNavbar;
