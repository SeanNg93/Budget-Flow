import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Avatar
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

// Extracted Wallet Icon component
const WalletIcon = React.memo(({ accountType }) => {
  const iconMap = {
    savings: <SavingsIcon className={styles.walletIcon} />,
    'credit card': <CreditCardIcon className={styles.walletIcon} />,
    cash: <PaymentsIcon className={styles.walletIcon} />,
    default: <AccountBalanceWalletIcon className={styles.walletIcon} />
  };
  
  const key = accountType?.toLowerCase() || 'default';
  return iconMap[key] || iconMap.default;
});

// Extracted Shared Wallet Avatar component
const SharedWalletAvatar = React.memo(({ info, isOwner }) => {
  const avatarUrl = isOwner ? info.sharedWithProfilePictureUrl : info.ownerProfilePictureUrl;
  const username = isOwner ? info.sharedWithUsername : info.ownerUsername;
  
  const tooltipTitle = isOwner 
    ? `Shared with: ${info.sharedWithUsername}`
    : `Owner: ${info.ownerUsername}`;
  
  return (
    <Tooltip title={tooltipTitle}>
      <Avatar 
        src={avatarUrl || undefined}
        sx={{ 
          width: 24, 
          height: 24, 
          fontSize: '0.8rem',
          marginLeft: '8px',
          backgroundColor: avatarUrl ? 'transparent' : '#1976d2',
          border: '2px solid white',
          cursor: 'pointer'
        }}
        aria-label={tooltipTitle}
      >
        {!avatarUrl && (username ? username.charAt(0).toUpperCase() : 'U')}
      </Avatar>
    </Tooltip>
  );
});

// Extracted Wallet Card component
const WalletCard = React.memo(({ wallet, colorClass, isShared, isWalletOwner, getSharedWalletInfo, onMenuOpen }) => {
  const handleMenuOpen = useCallback((e) => {
    e.stopPropagation();
    onMenuOpen(e, wallet);
  }, [wallet, onMenuOpen]);

  return (
    <Box key={wallet.id} className={`${styles.walletItem} ${styles[colorClass]}`}>
      <IconButton
        size="small"
        className={styles.walletMenuButtonCircle}
        onClick={handleMenuOpen}
        aria-label="Wallet options"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      
      <Box className={styles.walletHeader}>
        <Typography variant="h6" className={styles.walletName}>
          <WalletIcon accountType={wallet.accountType} />
          {wallet.accountName}
        </Typography>
      </Box>
      
      <Typography variant="h4" className={styles.walletBalance}>
        ${wallet.balance.toFixed(2)}
      </Typography>
      
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
            <SharedWalletAvatar 
              info={getSharedWalletInfo(wallet.id)} 
              isOwner={isWalletOwner(wallet.id)} 
            />
          </>
        ) : (
          wallet.accountType || "General Account"
        )}
      </Typography>
    </Box>
  );
});

const WalletOverview = ({ onManageWallets, externalWallets }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null);
  const [sharedWalletsInfo, setSharedWalletsInfo] = useState({});
  
  const walletsPerPage = 4;
  
  // Menu state
  const [walletMenuAnchorEl, setWalletMenuAnchorEl] = useState(null);
  const [selectedWalletForMenu, setSelectedWalletForMenu] = useState(null);
  
  // Dialog states
  const [dialogStates, setDialogStates] = useState({
    shareWalletDialog: false,
    sendMoneyDialog: false
  });
  
  const [walletToShare, setWalletToShare] = useState(null);

  // Memoized values
  const totalPages = useMemo(() => 
    Math.ceil(wallets.length / walletsPerPage), 
    [wallets.length, walletsPerPage]
  );

  const displayedWallets = useMemo(() => 
    wallets.slice(
      currentPage * walletsPerPage,
      (currentPage + 1) * walletsPerPage
    ), 
    [wallets, currentPage, walletsPerPage]
  );

  // Wallet checking utilities
  const isSharedWallet = useCallback(
    (walletId) => sharedWalletsInfo[walletId] !== undefined,
    [sharedWalletsInfo]
  );
  
  const isWalletOwner = useCallback(
    (walletId) => sharedWalletsInfo[walletId]?.isOwner === true,
    [sharedWalletsInfo]
  );
  
  const getSharedWalletInfo = useCallback(
    (walletId) => sharedWalletsInfo[walletId] || {},
    [sharedWalletsInfo]
  );

  const fetchWallets = useCallback(async () => {
    // Only fetch if external wallets are not provided
    if (externalWallets && externalWallets.length > 0) return;
    
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
  }, [externalWallets]);

  const fetchSharedWalletsInfo = useCallback(async () => {
    try {
      // Fetch shared wallets data in parallel
      const [sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getSharedWalletsWithMe(),
        FinanceService.getSharedWalletsByMe()
      ]);
      
      // Process shared wallets data
      const sharedInfo = {};
      const processSharedWallets = (wallets, isOwner) => {
        wallets.forEach(sharedWallet => {
          if (sharedWallet.accepted) {
            sharedInfo[sharedWallet.walletId] = {
              isShared: true,
              isOwner,
              ownerUsername: sharedWallet.ownerUsername,
              ownerId: sharedWallet.ownerId,
              sharedWithId: sharedWallet.sharedWithId,
              sharedWithUsername: sharedWallet.sharedWithUsername,
              walletName: sharedWallet.walletName,
              ownerProfilePictureUrl: sharedWallet.ownerProfilePictureUrl,
              sharedWithProfilePictureUrl: sharedWallet.sharedWithProfilePictureUrl
            };
          }
        });
      };
      
      processSharedWallets(sharedWithMeResponse.data || [], false);
      processSharedWallets(sharedByMeResponse.data || [], true);
      
      setSharedWalletsInfo(sharedInfo);
    } catch (err) {
      console.error('Error fetching shared wallet info:', err);
    }
  }, []);

  // Pagination handlers with animation
  const changePage = useCallback((direction, targetPage = null) => {
    setSlideDirection(direction === 'next' ? 'slideLeft' : 'slideRight');
    
    const timer = setTimeout(() => {
      if (targetPage !== null) {
        setCurrentPage(targetPage);
      } else {
        setCurrentPage(prev => {
          if (direction === 'next') {
            return (prev + 1) % totalPages;
          } else {
            return (prev - 1 + totalPages) % totalPages;
          }
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [totalPages]);

  // Menu handlers
  const handleWalletMenuOpen = useCallback((event, wallet) => {
    setWalletMenuAnchorEl(event.currentTarget);
    setSelectedWalletForMenu(wallet);
  }, []);
  
  const handleWalletMenuClose = useCallback(() => {
    setWalletMenuAnchorEl(null);
  }, []);
  
  // Dialog handlers
  const updateDialogState = useCallback((dialogName, isOpen) => {
    setDialogStates(prev => ({
      ...prev,
      [dialogName]: isOpen
    }));
  }, []);
  
  const handleShareWallet = useCallback(() => {
    setWalletToShare(selectedWalletForMenu);
    updateDialogState('shareWalletDialog', true);
    handleWalletMenuClose();
  }, [selectedWalletForMenu, updateDialogState, handleWalletMenuClose]);
  
  const handleShareWalletClose = useCallback(() => {
    updateDialogState('shareWalletDialog', false);
    setWalletToShare(null);
  }, [updateDialogState]);
  
  const handleSendMoney = useCallback(() => {
    updateDialogState('sendMoneyDialog', true);
    handleWalletMenuClose();
  }, [updateDialogState, handleWalletMenuClose]);
  
  const handleSendMoneyClose = useCallback(() => {
    updateDialogState('sendMoneyDialog', false);
  }, [updateDialogState]);
  
  const handleWalletShared = useCallback(() => {
    fetchWallets();
    handleShareWalletClose();
  }, [fetchWallets, handleShareWalletClose]);

  const handleSendMoneyCompleted = useCallback(() => {
    handleSendMoneyClose();
    fetchWallets();
  }, [handleSendMoneyClose, fetchWallets]);

  // Effects
  useEffect(() => {
    // Use external wallets if provided, otherwise fetch wallets
    if (externalWallets && externalWallets.length > 0) {
      setWallets(externalWallets);
      fetchSharedWalletsInfo();
    } else {
      fetchWallets();
    }
  }, [externalWallets, fetchWallets, fetchSharedWalletsInfo]);

  // Reset animation after it completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        setSlideDirection(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  // Render content based on loading/error/empty states
  const renderContent = useCallback(() => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Typography color="error" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      );
    }
    
    if (wallets.length === 0) {
      return (
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
      );
    }
    
    return (
      <Box className={styles.walletsContainer}>
        {wallets.length > walletsPerPage && (
          <IconButton 
            className={styles.walletNavButton} 
            onClick={() => changePage('prev')}
            sx={{ left: -20 }}
            disabled={!!slideDirection}
            aria-label="Previous wallets"
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
        )}
        
        <Box className={`${styles.walletsList} ${slideDirection ? styles[slideDirection] : ''}`}>
          {displayedWallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              colorClass={getWalletColorClass(wallet.id)}
              isShared={isSharedWallet(wallet.id)}
              isWalletOwner={isWalletOwner}
              getSharedWalletInfo={getSharedWalletInfo}
              onMenuOpen={handleWalletMenuOpen}
            />
          ))}
        </Box>
        
        {wallets.length > walletsPerPage && (
          <IconButton 
            className={styles.walletNavButton} 
            onClick={() => changePage('next')}
            sx={{ right: -20 }}
            disabled={!!slideDirection}
            aria-label="Next wallets"
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        )}
        
        {totalPages > 1 && (
          <Box className={styles.paginationDots} role="navigation" aria-label="Wallet pages">
            {[...Array(totalPages)].map((_, index) => (
              <Box 
                key={index}
                className={`${styles.paginationDot} ${currentPage === index ? styles.activeDot : ''}`}
                onClick={() => {
                  if (slideDirection || index === currentPage) return;
                  changePage(index > currentPage ? 'next' : 'prev', index);
                }}
                role="button"
                tabIndex={0}
                aria-label={`Go to page ${index + 1}`}
                aria-current={currentPage === index ? 'page' : undefined}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }, [
    loading, 
    error, 
    wallets.length, 
    walletsPerPage, 
    slideDirection, 
    displayedWallets, 
    changePage, 
    currentPage, 
    totalPages, 
    isSharedWallet, 
    isWalletOwner, 
    getSharedWalletInfo, 
    handleWalletMenuOpen,
    onManageWallets
  ]);

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
          aria-label="Manage wallets"
        >
          Manage Wallets
        </Button>
      </Box>
      
      {renderContent()}
      
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
      
      {/* Dialogs */}
      {walletToShare && (
        <ShareWalletForm
          open={dialogStates.shareWalletDialog}
          handleClose={handleShareWalletClose}
          wallet={walletToShare}
          onWalletShared={handleWalletShared}
        />
      )}
      
      {selectedWalletForMenu && (
        <UserTransferForm
          open={dialogStates.sendMoneyDialog}
          handleClose={handleSendMoneyClose}
          onTransferCompleted={handleSendMoneyCompleted}
          defaultSourceWallet={selectedWalletForMenu}
        />
      )}
    </Paper>
  );
};

export default WalletOverview; 