import React, { useState, useEffect, useRef } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import axios from 'axios';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NotificationMenu from './NotificationMenu';
import ProfileDialog from '../user/ProfileDialog';
import FinanceService from '../../services/FinanceService';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SendIcon from '@mui/icons-material/Send';
import ShareIcon from '@mui/icons-material/Share';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CategoryIcon from '@mui/icons-material/Category';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import styles from '../../styles/appNavbar.module.css';
import { useUser } from '../../context/UserContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = "http://localhost:8080";
const DEFAULT_AVATAR = "/default-avatar.svg";

const drawerWidth = 280;

const AppNavbar = ({ open, handleDrawerOpen }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);
  
  // Use our context to get the profile data
  const { profileData } = useUser();
  const { t } = useTranslation();

  const searchActions = [
    { 
      id: 'new-wallet', 
      name: t('search.actions.newWallet.title'),
      description: t('search.actions.newWallet.description'),
      icon: <AddIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openWalletForm: true } })
    },
    { 
      id: 'transfer-money', 
      name: t('search.actions.transferMoney.title'),
      description: t('search.actions.transferMoney.description'),
      icon: <SwapHorizIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openTransferDialog: true } }) 
    },
    { 
      id: 'send-money', 
      name: t('search.actions.sendMoney.title'),
      description: t('search.actions.sendMoney.description'),
      icon: <SendIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openUserTransferDialog: true } }) 
    },
    { 
      id: 'share-wallet', 
      name: t('search.actions.shareWallet.title'),
      description: t('search.actions.shareWallet.description'),
      icon: <ShareIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openShareWalletDialog: true } }) 
    },
    { 
      id: 'new-transaction', 
      name: t('search.actions.newTransaction.title'),
      description: t('search.actions.newTransaction.description'),
      icon: <ReceiptIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openTransactionForm: true } }) 
    },
    { 
      id: 'manage-categories', 
      name: t('search.actions.manageCategories.title'),
      description: t('search.actions.manageCategories.description'),
      icon: <CategoryIcon color="primary" />,
      action: () => navigate('/dashboard', { state: { openCategoryForm: true } }) 
    }
  ];

  useEffect(() => {
    fetchSearchData();
  }, []);

  const fetchSearchData = async () => {
    try {
      // Fetch wallets
      const walletsResponse = await FinanceService.getAccounts();
      if (walletsResponse.data) {
        setWallets(walletsResponse.data);
      }
      
      // Fetch recent transactions
      const transactionsResponse = await FinanceService.getTransactions();
      if (transactionsResponse.data) {
        // Limit to most recent 20 transactions for performance
        setTransactions(transactionsResponse.data.slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching search data:', error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Search across different data sources
    const results = [];
    const lowerCaseQuery = value.toLowerCase();
    
    // Search in predefined actions
    const matchingActions = searchActions.filter(action => 
      action.name.toLowerCase().includes(lowerCaseQuery) || 
      action.description.toLowerCase().includes(lowerCaseQuery)
    );
    results.push(...matchingActions.map(action => ({
      type: 'action',
      item: action
    })));
    
    // Search in wallets
    const matchingWallets = wallets.filter(wallet => 
      wallet.accountName && wallet.accountName.toLowerCase().includes(lowerCaseQuery)
    );
    results.push(...matchingWallets.map(wallet => ({
      type: 'wallet',
      item: wallet
    })));
    
    // Search in transactions
    const matchingTransactions = transactions.filter(transaction => 
      (transaction.description && transaction.description.toLowerCase().includes(lowerCaseQuery)) ||
      (transaction.category && transaction.category.name && transaction.category.name.toLowerCase().includes(lowerCaseQuery))
    );
    results.push(...matchingTransactions.map(transaction => ({
      type: 'transaction',
      item: transaction
    })));
    
    setSearchResults(results);
    setShowSearchResults(true);
  };
  
  const handleSearchFocus = () => {
    setSearchFocused(true);
    setShowSearchResults(true);
  };
  
  const handleSearchBlur = () => {
    // Don't hide results immediately to allow clicking on them
    setTimeout(() => {
      if (!searchFocused) {
        setShowSearchResults(false);
      }
    }, 200);
  };
  
  const handleResultClick = (result) => {
    setShowSearchResults(false);
    
    if (result.type === 'action') {
      // Execute the action function
      result.item.action();
    } else if (result.type === 'wallet') {
      // Navigate to wallet details or show wallet management dialog
      navigate('/dashboard', { state: { selectedWallet: result.item.id } });
    } else if (result.type === 'transaction') {
      // Navigate to transaction details or show transaction dialog
      navigate('/dashboard', { state: { selectedTransaction: result.item.id } });
    }
    
    // Clear search after selection
    setSearchValue('');
  };
  
  const handleClickAway = () => {
    setSearchFocused(false);
    setShowSearchResults(false);
  };

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
    setProfileDialogOpen(true);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleOpenSettings = () => {
    handleMenuClose();
    // Use the same mechanism as the SideMenu component to open settings
    if (window.openSettingsPanel) {
      window.openSettingsPanel();
    }
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
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
      classes={{
        paper: styles.menuPaper
      }}
      disableScrollLock={true}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {profileData.fullName || userData.username || t('common.user')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userData.email || 'user@example.com'}
        </Typography>
      </Box>
      <Divider className={styles.menuDivider} />
      <MenuItem onClick={handleProfile} className={styles.menuItem}>{t('navbar.profile')}</MenuItem>
      <MenuItem onClick={handleOpenSettings} className={styles.menuItem}>{t('navbar.settings')}</MenuItem>
      <Divider className={styles.menuDivider} />
      <MenuItem onClick={handleLogout} className={styles.menuItem}>{t('navbar.logout')}</MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <Menu
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
      classes={{
        paper: styles.menuPaper
      }}
      disableScrollLock={true}
    >
      <MenuItem className={styles.menuItem}>
        <NotificationMenu />
        <Typography variant="body1" sx={{ ml: 1 }}>{t('navbar.notifications')}</Typography>
      </MenuItem>
      <MenuItem className={styles.menuItem}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LanguageSwitcher />
        </Box>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen} className={styles.menuItem}>
        <IconButton
          size="medium"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <Avatar 
            src={profileData.profilePicture || DEFAULT_AVATAR}
            alt={profileData.fullName || userData.username || t('common.user')}
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: !profileData.profilePicture ? 'primary.main' : 'transparent',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            {!profileData.profilePicture && (profileData.fullName || userData.username) ? (profileData.fullName || userData.username).charAt(0).toUpperCase() : null}
          </Avatar>
        </IconButton>
        <Typography variant="body1" sx={{ ml: 1 }}>{t('navbar.profile')}</Typography>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        className={styles.appBar} 
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          marginLeft: open ? `${drawerWidth}px` : 0,
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing[open ? 'easeOut' : 'sharp'],
            duration: theme.transitions.duration[open ? 'enteringScreen' : 'leavingScreen'],
          }),
          right: 0,
          paddingRight: 'inherit',
        }}
      >
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
            {t('app.name')}
          </Typography>
          
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box sx={{ position: 'relative', width: { xs: '100%', sm: 'auto' }, ml: 2, maxWidth: '400px' }}>
              <div className={styles.search} ref={searchRef}>
                <div className={styles.searchIconWrapper}>
                  <SearchIcon />
                </div>
                <InputBase
                  placeholder={t('navbar.search')}
                  inputProps={{ 'aria-label': 'search' }}
                  value={searchValue}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  classes={{
                    root: styles.inputRoot,
                    input: styles.inputInput,
                  }}
                  fullWidth
                />
              </div>
              
              {showSearchResults && searchResults.length > 0 && (
                <Paper className={styles.searchResultsContainer}>
                  <List className={styles.searchResultsList}>
                    {searchResults.map((result, index) => (
                      <ListItem
                        key={`${result.type}-${index}`}
                        disablePadding
                        divider={index < searchResults.length - 1}
                      >
                        <ListItemButton
                          onClick={() => handleResultClick(result)}
                          className={styles.listItemButton}
                        >
                          <ListItemIcon className={styles.listItemIcon}>
                            {result.type === 'action' ? (
                              result.item.icon
                            ) : result.type === 'wallet' ? (
                              <AccountBalanceWalletIcon color="primary" />
                            ) : (
                              <ReceiptIcon color="primary" />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography variant="body2" className={styles.resultTitle}>
                                {result.type === 'action' ? result.item.name :
                                 result.type === 'wallet' ? result.item.accountName :
                                 result.item.description || `Transaction #${result.item.id}`}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" className={styles.resultDescription}>
                                {result.type === 'action' ? result.item.description :
                                 result.type === 'wallet' ? `$${result.item.balance.toFixed(2)}` :
                                 `$${result.item.amount.toFixed(2)} - ${result.item.category?.name || 'Uncategorized'}`}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <NotificationMenu />
            
            <LanguageSwitcher iconOnly={true} />
            
            <Box 
              onClick={handleProfileMenuOpen}
              className={styles.profileButton}
            >
              <Avatar 
                src={profileData.profilePicture || DEFAULT_AVATAR}
                alt={profileData.fullName || userData.username || t('common.user')}
                className={styles.avatar}
                sx={{ 
                  bgcolor: !profileData.profilePicture ? 'primary.main' : 'transparent',
                }}
              >
                {!profileData.profilePicture && (profileData.fullName || userData.username) ? (profileData.fullName || userData.username).charAt(0).toUpperCase() : null}
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
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
      <ProfileDialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} />
    </>
  );
};

export default AppNavbar;
