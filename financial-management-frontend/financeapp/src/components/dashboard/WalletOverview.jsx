import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/dashboard.module.css';
import { getWalletColorClass } from '../../utils/colorUtils';
import ShareWalletForm from './ShareWalletForm';
import UserTransferForm from './UserTransferForm';

const WalletOverview = ({ onManageWallets, externalWallets }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null);
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});
  
  const walletsPerPage = 4;
  
  // Add state for wallet menu
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState(null);
  const [selectedWalletForMenu, setSelectedWalletForMenu] = useState(null);
  
  // Add state for share wallet dialog
  const [shareWalletDialogOpen, setShareWalletDialogOpen] = useState(false);
  const [walletToShare, setWalletToShare] = useState(null);
  
  // Add state for send money dialog
  const [sendMoneyDialogOpen, setSendMoneyDialogOpen] = useState(false);

  useEffect(() => {
    // If external wallets are provided, use them
    if (externalWallets && externalWallets.length > 0) {
      setWallets(externalWallets);
      fetchSharedWalletsInfo();
    } else {
      // Otherwise fetch wallets
      fetchWallets();
    }
  }, [externalWallets]);

  const fetchWallets = async () => {
    // Only fetch if external wallets are not provided
    if (externalWallets && externalWallets.length > 0) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await FinanceService.getWallets();
      setWallets(response.data || []);
      fetchSharedWalletsInfo();
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shared wallet information to identify which wallets are shared and who they're shared with
  const fetchSharedWalletsInfo = async () => {
    try {
      // Get wallets shared with the current user
      const sharedWithMeResponse = await FinanceService.getSharedWalletsWithMe();
      const sharedWithMe = sharedWithMeResponse.data || [];
      
      // Get wallets shared by the current user
      const sharedByMeResponse = await FinanceService.getSharedWalletsByMe();
      const sharedByMe = sharedByMeResponse.data || [];
      
      // Create a map of wallet IDs to their shared wallet information
      const sharedInfo = {};
      
      // Process wallets shared with me
      sharedWithMe.forEach(sharedWallet => {
        if (sharedWallet.accepted) {
          sharedInfo[sharedWallet.walletId] = {
            isShared: true,
            isOwner: false,
            ownerUsername: sharedWallet.ownerUsername,
            ownerId: sharedWallet.ownerId,
            sharedWithId: sharedWallet.sharedWithId,
            sharedWithUsername: sharedWallet.sharedWithUsername,
            walletName: sharedWallet.walletName
          };
        }
      });
      
      // Process wallets shared by me
      sharedByMe.forEach(sharedWallet => {
        if (sharedWallet.accepted) {
          sharedInfo[sharedWallet.walletId] = {
            isShared: true,
            isOwner: true,
            ownerUsername: sharedWallet.ownerUsername,
            ownerId: sharedWallet.ownerId,
            sharedWithId: sharedWallet.sharedWithId,
            sharedWithUsername: sharedWallet.sharedWithUsername,
            walletName: sharedWallet.walletName
          };
        }
      });
      
      setSharedWalletsInfo(sharedInfo);
    } catch (err) {
      console.error('Error fetching shared wallet info:', err);
    }
  };

  // Function to get the appropriate icon based on account type
  const getWalletIcon = (accountType) => {
    switch(accountType?.toLowerCase()) {
      case 'savings':
        return <SavingsIcon className={styles.walletIcon} />;
      case 'credit card':
        return <CreditCardIcon className={styles.walletIcon} />;
      case 'cash':
        return <PaymentsIcon className={styles.walletIcon} />;
      default:
        return <AccountBalanceWalletIcon className={styles.walletIcon} />;
    }
  };

  // Function to check if a wallet is shared
  const isSharedWallet = (walletId) => {
    return sharedWalletsInfo[walletId] !== undefined;
  };

  // Function to check if current user is the owner of a shared wallet
  const isWalletOwner = (walletId) => {
    return sharedWalletsInfo[walletId]?.isOwner === true;
  };

  // Function to get shared wallet information
  const getSharedWalletInfo = (walletId) => {
    return sharedWalletsInfo[walletId] || {};
  };

  const totalPages = Math.ceil(wallets.length / walletsPerPage);
  const displayedWallets = wallets.slice(
    currentPage * walletsPerPage,
    (currentPage + 1) * walletsPerPage
  );

  const handleNextPage = () => {
    setSlideDirection('slideLeft');
    setTimeout(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 200);
  };

  const handlePrevPage = () => {
    setSlideDirection('slideRight');
    setTimeout(() => {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }, 200);
  };

  // Add functions for wallet menu
  const handleWalletMenuOpen = (event, wallet) => {
    event.stopPropagation();
    setWalletMenuAnchorEl(event.currentTarget);
    setSelectedWalletForMenu(wallet);
  };
  
  const handleWalletMenuClose = () => {
    setWalletMenuAnchorEl(null);
  };
  
  // Add functions for share wallet
  const handleShareWallet = () => {
    setWalletToShare(selectedWalletForMenu);
    setShareWalletDialogOpen(true);
    handleWalletMenuClose();
  };
  
  const handleShareWalletClose = () => {
    setShareWalletDialogOpen(false);
    setWalletToShare(null);
  };
  
  const handleWalletShared = () => {
    // Refresh wallet list after sharing
    fetchWallets();
  };
  
  // Add functions for send money
  const handleSendMoney = () => {
    setSendMoneyDialogOpen(true);
    handleWalletMenuClose();
  };
  
  const handleSendMoneyClose = () => {
    setSendMoneyDialogOpen(false);
  };
  
  const handleSendMoneyCompleted = () => {
    handleSendMoneyClose();
    fetchWallets();
  };

  // Reset animation after it completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        setSlideDirection(null);
      }, 400); // Slightly longer than the animation to ensure it completes
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // Generate avatar for shared wallet
  const renderSharedWalletAvatar = (walletId) => {
    const info = getSharedWalletInfo(walletId);
    const isOwner = isWalletOwner(walletId);
    
    // For owner: show avatar of person it's shared with
    // For recipient: show avatar of the owner
    const username = isOwner ? info.sharedWithUsername : info.ownerUsername;
    
    const tooltipTitle = isOwner 
      ? `Shared with: ${info.sharedWithUsername}`
      : `Owner: ${info.ownerUsername}`;

    return (
      <Tooltip title={tooltipTitle}>
        <Avatar 
          sx={{ 
            width: 24, 
            height: 24, 
            fontSize: '0.8rem',
            marginLeft: '8px',
            backgroundColor: '#1976d2',
            border: '2px solid white',
            cursor: 'pointer'
          }}
        >
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </Avatar>
      </Tooltip>
    );
  };

  return (
    <Paper className={styles.walletOverviewCard}>
      <Box className={styles.walletOverviewHeader}>
        <Typography 
          component="h2" 
          variant="h5" 
          color="text.primary" 
          className={styles.sectionTitle}
        >
          Your Wallets
          {wallets.length > 0 && (
            <Typography 
              component="span" 
              variant="h6" 
              sx={{ 
                ml: 1, 
                color: 'text.secondary', 
                fontWeight: 'normal',
                fontSize: '1.1rem',
                opacity: 0.8
              }}
            >
              ({wallets.length})
            </Typography>
          )}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onManageWallets}
          className={styles.manageWalletsButton}
          size="small"
          startIcon={<SettingsIcon />}
        >
          Manage Wallets
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      ) : wallets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You don't have any wallets yet. Create one to get started!
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onManageWallets}
            size="small"
          >
            Create Wallet
          </Button>
        </Box>
      ) : (
        <Box className={styles.walletsContainer}>
          {wallets.length > walletsPerPage && (
            <IconButton 
              className={styles.walletNavButton} 
              onClick={handlePrevPage}
              sx={{ left: -18 }}
              disabled={!!slideDirection}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}
          
          <Box className={`${styles.walletsList} ${slideDirection ? styles[slideDirection] : ''}`}>
            {displayedWallets.map((wallet) => {
              const colorClass = getWalletColorClass(wallet.id);
              const isShared = isSharedWallet(wallet.id);
              return (
                <Box key={wallet.id} className={`${styles.walletItem} ${styles[colorClass]}`}>
                  <Box className={styles.walletHeader}>
                    <Typography variant="h6" className={styles.walletName}>
                      {getWalletIcon(wallet.accountType)}
                      {wallet.accountName}
                    </Typography>
                    <IconButton
                      size="small"
                      className={styles.walletMenuButton}
                      onClick={(e) => handleWalletMenuOpen(e, wallet)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h4" className={styles.walletBalance}>
                    ${wallet.balance.toFixed(2)}
                  </Typography>
                  
                  {/* Add a spacer div that will push the wallet type to the bottom */}
                  <Box sx={{ flexGrow: 1 }}></Box>
                  
                  <Divider sx={{ my: 1, opacity: 0.6 }} />
                  <Typography 
                    variant="body2" 
                    className={styles.walletType}
                    component="div" 
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {isShared ? (
                      <>
                        {isWalletOwner(wallet.id) ? 'Shared Wallet with:' : 'Shared Wallet by:'}
                        {renderSharedWalletAvatar(wallet.id)}
                      </>
                    ) : (
                      wallet.accountType || "General Account"
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          {wallets.length > walletsPerPage && (
            <IconButton 
              className={styles.walletNavButton} 
              onClick={handleNextPage}
              sx={{ right: -18 }}
              disabled={!!slideDirection}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          )}
          
          {totalPages > 1 && (
            <Box className={styles.paginationDots}>
              {[...Array(totalPages)].map((_, index) => (
                <Box 
                  key={index}
                  className={`${styles.paginationDot} ${currentPage === index ? styles.activeDot : ''}`}
                  onClick={() => {
                    if (slideDirection || index === currentPage) return;
                    
                    if (index > currentPage) {
                      setSlideDirection('slideLeft');
                    } else {
                      setSlideDirection('slideRight');
                    }
                    
                    setTimeout(() => {
                      setCurrentPage(index);
                    }, 200);
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
      
      {/* Wallet Menu */}
      <Menu
        anchorEl={walletMenuAnchorEl}
        open={Boolean(walletMenuAnchorEl)}
        onClose={handleWalletMenuClose}
        classes={{ paper: styles.dashboardMenuPaper }}
      >
        <MenuItem onClick={handleSendMoney} className={styles.dashboardMenuItem}>
          <SendIcon fontSize="small" className={styles.dashboardMenuIcon} />
          <span>Send Money</span>
        </MenuItem>
        <MenuItem onClick={handleShareWallet} className={styles.dashboardMenuItem}>
          <PersonAddIcon fontSize="small" className={styles.dashboardMenuIcon} />
          <span>Share Wallet</span>
        </MenuItem>
      </Menu>
      
      {/* Share Wallet Dialog */}
      {walletToShare && (
        <ShareWalletForm
          open={shareWalletDialogOpen}
          handleClose={handleShareWalletClose}
          wallet={walletToShare}
          onWalletShared={handleWalletShared}
        />
      )}
      
      {/* Send Money Dialog */}
      {selectedWalletForMenu && (
        <UserTransferForm
          open={sendMoneyDialogOpen}
          handleClose={handleSendMoneyClose}
          onTransferCompleted={handleSendMoneyCompleted}
          defaultSourceWallet={selectedWalletForMenu}
        />
      )}
    </Paper>
  );
};

export default WalletOverview; 