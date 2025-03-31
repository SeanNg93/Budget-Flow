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
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/dashboard.module.css';
import { getWalletColorClass, getWalletIcon, WALLET_ICONS } from '../../utils/walletIcons';
import ShareWalletForm from './ShareWalletForm';
import UserTransferForm from './UserTransferForm';
import WalletForm from './WalletForm';
import FinancialTips from './FinancialTips';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';

// Map of icon types to components
const iconComponents = {
  wallet: <AccountBalanceWalletIcon className={styles.walletIcon} />,
  creditCard: <CreditCardIcon className={styles.walletIcon} />,
  savings: <SavingsIcon className={styles.walletIcon} />,
  cash: <PaymentsIcon className={styles.walletIcon} />,
  investment: <ShowChartIcon className={styles.walletIcon} />,
  piggyBank: <SavingsOutlinedIcon className={styles.walletIcon} />,
  bank: <AccountBalanceIcon className={styles.walletIcon} />,
  shopping: <ShoppingBagIcon className={styles.walletIcon} />,
  default: <AccountBalanceWalletIcon className={styles.walletIcon} />
};

// Extracted Wallet Icon component
const WalletIcon = React.memo(({ wallet }) => {
  // Force re-render when wallet changes by adding a timestamp-based key
  const [renderKey, setRenderKey] = useState(Date.now());
  
  // Check if there's a direct icon reference on the wallet object (for immediate updates)
  const directIcon = wallet._icon;
  
  // If not, check the localStorage cache
  const customIcon = directIcon || getWalletIcon(wallet.id);
  
  // Update the render key when the wallet id, customIcon or forceRefresh changes
  useEffect(() => {
    setRenderKey(Date.now());
  }, [wallet.id, customIcon, wallet._forceIconRefresh, wallet._icon]);
  
  // Check if the icon is an emoji
  if (customIcon) {
    const iconItem = WALLET_ICONS.find(icon => icon.value === customIcon);
    if (iconItem?.type === 'emoji') {
      return (
        <span 
          key={`${wallet.id}-${customIcon}-${renderKey}`} 
          className={styles.walletIcon} 
          style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}
        >
          {customIcon}
        </span>
      );
    } else if (iconComponents[customIcon]) {
      return React.cloneElement(
        iconComponents[customIcon], 
        { 
          key: `${wallet.id}-${customIcon}-${renderKey}`, 
          style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' } 
        }
      );
    }
  }
  
  // Otherwise, fall back to account type mapping
  const typeToIcon = {
    'savings': 'savings',
    'credit card': 'creditCard',
    'cash': 'cash',
    'investment': 'investment',
    'checking': 'bank'
  };
  
  const key = wallet.accountType?.toLowerCase() || 'default';
  const iconType = typeToIcon[key] || 'default';
  
  return React.cloneElement(
    iconComponents[iconType] || iconComponents.default, 
    { 
      key: `${wallet.id}-${iconType}-${renderKey}`, 
      style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' } 
    }
  );
});

// Extracted Shared Wallet Avatar component
const SharedWalletAvatar = React.memo(({ info, isOwner, t }) => {
  const avatarUrl = isOwner ? info.sharedWithProfilePictureUrl : info.ownerProfilePictureUrl;
  const username = isOwner ? info.sharedWithUsername : info.ownerUsername;
  
  const tooltipTitle = isOwner 
    ? t('wallets.sharedWithUser', { username: info.sharedWithUsername })
    : t('wallets.ownedByUser', { username: info.ownerUsername });
  
  return (
    <Tooltip title={tooltipTitle}>
      <Avatar 
        src={avatarUrl || undefined}
        sx={{ 
          width: 24, 
          height: 24, 
          fontSize: '0.8rem',
          marginLeft: '4px',
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
const WalletCard = React.memo(({ wallet, colorClass, isShared, isWalletOwner, getSharedWalletInfo, onMenuOpen, t, i18n }) => {
  const handleMenuOpen = useCallback((e) => {
    e.stopPropagation();
    onMenuOpen(e, wallet);
  }, [wallet, onMenuOpen]);

  // Force component to update when wallet or colorClass changes
  const [updated, setUpdated] = useState(Date.now());
  
  // Use direct color class if available (for immediate updates after editing)
  const effectiveColorClass = wallet._colorClass || colorClass;
  
  // Function to force a refresh when needed
  const refreshState = useCallback(() => {
    setUpdated(Date.now());
  }, []);
  
  useEffect(() => {
    // This effect will run whenever relevant wallet properties change
    refreshState();
  }, [
    wallet.id, 
    wallet.accountName, 
    wallet.balance, 
    wallet._colorClass, 
    wallet._icon, 
    wallet._forceIconRefresh, 
    colorClass,
    refreshState
  ]);

  return (
    <Box key={`${wallet.id}-${updated}`} className={`${styles.walletItem} ${styles[effectiveColorClass]}`}>
      <IconButton
        size="small"
        className={styles.walletMenuButtonCircle}
        onClick={handleMenuOpen}
        aria-label={t('wallets.options')}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      
      <Box className={styles.walletHeader} sx={{ height: '32px', display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" className={styles.walletName} sx={{ 
          display: 'flex', 
          alignItems: 'center',
          minHeight: '32px',
          lineHeight: '32px'
        }}>
          <Box component="span" sx={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            mr: 1
          }}>
            <WalletIcon wallet={wallet} />
          </Box>
          {wallet.accountName}
        </Typography>
      </Box>

      <Typography variant="h4" className={styles.walletBalance}>
        {formatCurrency(wallet.balance, i18n.language)}
      </Typography>

      <Box sx={{ flexGrow: 1 }}></Box>
      
      <Divider sx={{ my: 1, opacity: 0.6 }} />
      
      <Typography 
        variant="body2" 
        className={styles.walletType}
        component="div" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '28px',
          lineHeight: '28px'
        }}
      >
        {isShared ? (
          <>
            {isWalletOwner(wallet.id) ? t('wallets.sharedWalletWith') : t('wallets.sharedWalletBy')}
            <SharedWalletAvatar 
              info={getSharedWalletInfo(wallet.id)} 
              isOwner={isWalletOwner(wallet.id)} 
              t={t}
            />
          </>
        ) : (
          wallet.accountType || t('wallets.generalAccount')
        )}
      </Typography>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to determine if we need to re-render
  // Return false to force re-render if any of these properties change
  return (
    prevProps.wallet.id === nextProps.wallet.id &&
    prevProps.wallet.accountName === nextProps.wallet.accountName &&
    prevProps.wallet.balance === nextProps.wallet.balance &&
    prevProps.colorClass === nextProps.colorClass &&
    prevProps.wallet._forceIconRefresh === nextProps.wallet._forceIconRefresh &&
    prevProps.wallet._icon === nextProps.wallet._icon &&
    prevProps.wallet._colorClass === nextProps.wallet._colorClass &&
    prevProps.isShared === nextProps.isShared
  );
});

const WalletOverview = ({ onManageWallets, externalWallets }) => {
  const { t, i18n } = useTranslation();
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
    sendMoneyDialog: false,
    editWalletDialog: false
  });
  
  const [walletToShare, setWalletToShare] = useState(null);
  const [walletToEdit, setWalletToEdit] = useState(null);

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
      setError(t('wallets.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [externalWallets, t]);

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

  const handleEditWallet = useCallback(() => {
    setWalletToEdit(selectedWalletForMenu);
    updateDialogState('editWalletDialog', true);
    handleWalletMenuClose();
  }, [selectedWalletForMenu, updateDialogState, handleWalletMenuClose]);

  const handleEditWalletClose = useCallback(() => {
    updateDialogState('editWalletDialog', false);
    setWalletToEdit(null);
  }, [updateDialogState]);
  
  const handleWalletUpdated = useCallback((updatedWallet) => {
    setLoading(false);

    // Only update if we have a valid updatedWallet object
    if (updatedWallet) {
      // Update the wallets state with the changed wallet
      setWallets(currentWallets => {
        return currentWallets.map(wallet => {
          if (wallet.id === updatedWallet.id) {
            // Use the properties directly from the updated wallet, as they already include
            // the _colorClass, _icon, and _forceIconRefresh properties
            return updatedWallet;
          }
          return wallet;
        });
      });

      // Update the selected wallet if it was the one that got updated
      if (selectedWalletForMenu && selectedWalletForMenu.id === updatedWallet.id) {
        setSelectedWalletForMenu(updatedWallet);
      }
    }

    // Close the wallet form dialog
    setDialogStates(prev => ({
      ...prev,
      editWalletDialog: false
    }));
  }, [setWallets, selectedWalletForMenu, setDialogStates]);
  
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={fetchWallets} 
            sx={{ mt: 2 }}
            size="small"
          >
            {t('common.retry')}
          </Button>
        </Box>
      );
    }
    
    if (wallets.length === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t('wallets.noWallets')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onManageWallets}
              size="small"
            >
              {t('wallets.createWallet')}
            </Button>
          </Box>
          
          {/* Show financial tips when no wallets exist */}
          <Box sx={{ mt: 'auto' }}>
            <FinancialTips maxTips={3} />
          </Box>
        </Box>
      );
    }
    
    return (
      <Box className={styles.walletsContainer} sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: wallets.length <= 2 ? 'space-between' : 'flex-start' 
      }}>
        <Box>
          {wallets.length > walletsPerPage && (
            <IconButton 
              className={styles.walletNavButton} 
              onClick={() => changePage('prev')}
              sx={{ left: -20 }}
              disabled={!!slideDirection}
              aria-label={t('wallets.previousWallets')}
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
                t={t}
                i18n={i18n}
              />
            ))}
          </Box>
          
          {wallets.length > walletsPerPage && (
            <IconButton 
              className={styles.walletNavButton} 
              onClick={() => changePage('next')}
              sx={{ right: -20 }}
              disabled={!!slideDirection}
              aria-label={t('wallets.nextWallets')}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          )}
          
          {totalPages > 1 && (
            <Box className={styles.paginationDots} role="navigation" aria-label={t('wallets.walletPages')}>
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
                  aria-label={t('wallets.goToPage', { number: index + 1 })}
                  aria-current={currentPage === index ? 'page' : undefined}
                />
              ))}
            </Box>
          )}
        </Box>
        
        {/* Only show financial tips when there are 2 or fewer wallets */}
        {wallets.length <= 2 && (
          <Box sx={{ mt: 1, mb: 0.5 }}>
            <FinancialTips maxTips={1} />
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
    onManageWallets,
    t,
    i18n,
    fetchWallets
  ]);

  return (
    <Paper className={styles.walletOverviewCard} sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box className={styles.walletOverviewHeader}>
        <Typography 
          component="h2" 
          variant="h5" 
          color="text.primary" 
          className={styles.sectionTitle}
        >
          {t('dashboard.yourWallets')}
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
          aria-label={t('wallets.manageWallets')}
        >
          {t('dashboard.manageWallets')}
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
        <MenuItem onClick={handleEditWallet} className={styles.dashboardMenuItem}>
          <EditIcon fontSize="small" className={styles.dashboardMenuIcon} />
          <span>{t('wallets.editWallet')}</span>
        </MenuItem>
        <MenuItem onClick={handleSendMoney} className={styles.dashboardMenuItem}>
          <SendIcon fontSize="small" className={styles.dashboardMenuIcon} />
          <span>{t('wallets.sendMoney')}</span>
        </MenuItem>
        <MenuItem onClick={handleShareWallet} className={styles.dashboardMenuItem}>
          <PersonAddIcon fontSize="small" className={styles.dashboardMenuIcon} />
          <span>{t('wallets.shareWallet')}</span>
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

      {walletToEdit && (
        <WalletForm
          open={dialogStates.editWalletDialog}
          handleClose={handleEditWalletClose}
          onWalletAdded={handleWalletUpdated}
          wallet={walletToEdit}
        />
      )}
    </Paper>
  );
};

export default WalletOverview;
