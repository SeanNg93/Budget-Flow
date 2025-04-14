import React, { useState, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  AttachMoney as MoneyIcon,
  ArrowUpward as SentIcon,
  ArrowDownward as ReceivedIcon,
  CheckCircle as ReadIcon,
  MarkChatRead as MarkReadIcon,
  Delete as DeleteIcon,
  AccountBalanceWallet as WalletIcon,
  PersonAdd as ShareIcon,
  Check as AcceptIcon,
} from '@mui/icons-material';
import FinanceService from '../../services/FinanceService';
import { format, formatDistanceToNow } from 'date-fns';
import styles from '../../styles/notificationMenu.module.css';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
// Import our new notification service
import { useNotifications } from '../../services/NotificationService';

const NotificationMenu = () => {
  const { t } = useTranslation();
  // Local state for UI elements
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptingWallet, setAcceptingWallet] = useState(null);
  
  // Use our centralized notification hook
  const {
    unreadCount,
    notifications,
    fetchInitialNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotifications();
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleMenuOpen = useCallback(async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    await fetchInitialNotifications();
    setLoading(false);
  }, [fetchInitialNotifications]);
  
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  
  const handleMarkAsRead = useCallback(async (id) => {
    await markAsRead(id);
  }, [markAsRead]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);
  
  const handleClearNotifications = useCallback(async () => {
    await clearNotifications();
    handleMenuClose();
  }, [clearNotifications, handleMenuClose]);
  
  // Function to get localized notification message based on notification type and content
  const getLocalizedNotificationMessage = useCallback((notification) => {
    // Check if it's a wallet sharing notification
    if (notification.type === 'WALLET_SHARED' || notification.type === 'WALLET_RECEIVED') {
      // Extract username and wallet name using regex
      const sharedPattern = notification.message.match(/^(.+?)\s+shared\s+their\s+wallet\s+["'](.+?)["']/i);
      if (sharedPattern) {
        const username = sharedPattern[1];
        const walletName = sharedPattern[2];
        return t('notifications.types.walletShared', { username, walletName });
      }
    } 
    // Check if it's a wallet accepted notification
    else if (notification.type === 'WALLET_SHARE_ACCEPTED') {
      // Extract username and wallet name for acceptance notification
      const acceptedPattern = notification.message.match(/^(.+?)\s+accepted\s+your\s+shared\s+wallet\s+["'](.+?)["']/i);
      if (acceptedPattern) {
        const username = acceptedPattern[1];
        const walletName = acceptedPattern[2];
        return t('notifications.types.walletAccepted', { username, walletName });
      }
    }
    // Check if it's a money sent notification
    else if (notification.type === 'MONEY_SENT') {
      // Extract amount and recipient for money sent notification
      const sentPattern = notification.message.match(/You\s+sent\s+(.+?)\s+to\s+(.+?)$/i);
      if (sentPattern) {
        const amount = sentPattern[1];
        const recipient = sentPattern[2];
        return t('notifications.types.moneySent', { amount, recipient });
      }
    }
    // Check if it's a money received notification
    else if (notification.type === 'MONEY_RECEIVED') {
      // Extract amount and sender for money received notification
      const receivedPattern = notification.message.match(/You\s+received\s+(.+?)\s+from\s+(.+?)$/i);
      if (receivedPattern) {
        const amount = receivedPattern[1];
        const sender = receivedPattern[2];
        return t('notifications.types.moneyReceived', { amount, sender });
      }
    }
    
    // Return original message if no pattern matches
    return notification.message;
  }, [t]);
  
  // Handle accepting a shared wallet
  const handleAcceptSharedWallet = useCallback(async (notification) => {
    try {
      setAcceptingWallet(notification.id);
      
      // Parse the notification data to get the shared wallet ID
      let sharedWalletId;
      
      // First attempt: Try to extract from notification data JSON
      if (notification.data) {
        try {
          const parsedData = JSON.parse(notification.data);
          sharedWalletId = parsedData.sharedWalletId;
        } catch (e) {
          // Silently handle parsing errors
        }
      }
      
      // Second attempt: Check if there's a data field that's already an object
      if (!sharedWalletId && typeof notification.data === 'object' && notification.data !== null) {
        sharedWalletId = notification.data.sharedWalletId;
      }
      
      // Third attempt: Try to extract from the message
      if (!sharedWalletId) {
        // Improved regex patterns for wallet extraction
        const idMatch = notification.message.match(/ID:\s*(\d+)/i);
        const sharedPatternMatch = notification.message.match(/shared\s+their\s+wallet\s+["'](.+?)["']/i);
        const senderMatch = notification.message.match(/^(.+?)\s+shared\s+their/i);
        
        if (idMatch) {
          sharedWalletId = parseInt(idMatch[1]);
        } else if (sharedPatternMatch && senderMatch) {
          const walletName = sharedPatternMatch[1];
          const senderUsername = senderMatch[1];
          
          // Use our helper function to find the shared wallet ID
          sharedWalletId = await FinanceService.getSharedWalletIdByNotification(
            notification.id,
            senderUsername,
            walletName
          );
        }
      }
      
      // Last resort: use the notification ID itself
      if (!sharedWalletId) {
        sharedWalletId = notification.id;
      }
      
      // Call the API to accept the shared wallet
      await FinanceService.acceptSharedWallet(sharedWalletId);
      
      // Mark the notification as read
      await handleMarkAsRead(notification.id);
      
      // Refresh the page to show the new wallet
      window.location.reload();
    } catch (error) {
      console.error('Error accepting shared wallet:', error);
    } finally {
      setAcceptingWallet(null);
    }
  }, [handleMarkAsRead]);
  
  // Helper function to determine icon based on notification type
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'MONEY_SENT':
        return <SentIcon color="error" />;
      case 'MONEY_RECEIVED':
        return <ReceivedIcon color="success" />;
      case 'WALLET_SHARED':
        return <ShareIcon color="primary" />;
      case 'WALLET_RECEIVED':
        return <WalletIcon color="info" />;
      case 'WALLET_SHARE_ACCEPTED':
        return <AcceptIcon color="success" />;
      default:
        return <MoneyIcon color="primary" />;
    }
  }, []);
  
  // Format date for notification display
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If less than 24 hours ago, show relative time
    if (now - date < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show actual date
    return format(date, 'MMM d, yyyy h:mm a');
  }, []);
  
  // Check if notification is a shared wallet notification that can be accepted
  const isAcceptableWalletNotification = useCallback((notification) => {
    return notification.type === 'WALLET_RECEIVED' && !notification.read;
  }, []);
  
  return (
    <>
      <IconButton 
        aria-label={t('notifications.unreadCount', { count: unreadCount })}
        color="inherit" 
        onClick={handleMenuOpen}
        size="large"
        className={styles.badgeContainer}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          classes={{
            badge: styles.badge
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{ position: 'relative' }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        className={styles.menuRoot}
        PaperProps={{
          className: styles.paper
        }}
        MenuListProps={{
          className: styles.menuList
        }}
        disableScrollLock={true}
      >
        <Box className={styles.headerContainer}>
          <Box className={styles.titleContainer}>
            <Typography variant="h6" className={styles.title}>
              {t('notifications.title')}
            </Typography>
            {unreadCount > 0 && (
              <Box 
                component="span"
                className={styles.newCountBadge}
              >
                {unreadCount}
              </Box>
            )}
          </Box>
          
          <Box className={styles.headerActions}>
            {unreadCount > 0 ? (
              <Button 
                size="small" 
                startIcon={<MarkReadIcon fontSize="small" />}
                onClick={handleMarkAllAsRead}
                className={styles.markAllReadButton}
              >
                {t('notifications.markAllRead')}
              </Button>
            ) : (notifications.length > 0 && !loading) && (
              <Button 
                size="small" 
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleClearNotifications}
                className={styles.clearButton}
              >
                {t('notifications.clearAll')}
              </Button>
            )}
          </Box>
        </Box>
        
        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box className={styles.emptyNotification}>
            <Typography variant="body2">
              {t('notifications.noNotifications')}
            </Typography>
          </Box>
        ) : (
          <List className={styles.notificationList}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                className={clsx(
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread
                )}
              >
                <ListItemIcon className={styles.itemIcon}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={getLocalizedNotificationMessage(notification)}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <>
                      <Box className={styles.metaContainer}>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                        {notification.read && (
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="success.main" 
                            className={styles.readStatus}
                          >
                            <ReadIcon fontSize="inherit" className={styles.readIcon} />
                            {t('notifications.status.read')}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Render action buttons for wallet notifications */}
                      {isAcceptableWalletNotification(notification) && (
                        <Box className={styles.notificationActions}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={acceptingWallet === notification.id ? null : <AcceptIcon fontSize="small" />}
                            onClick={() => handleAcceptSharedWallet(notification)}
                            disabled={acceptingWallet === notification.id}
                            className={styles.acceptButton}
                          >
                            {acceptingWallet === notification.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              t('notifications.actions.accept')
                            )}
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={styles.dismissButton}
                          >
                            {t('notifications.actions.dismiss')}
                          </Button>
                        </Box>
                      )}
                    </>
                  }
                  primaryTypographyProps={{
                    style: { fontWeight: notification.read ? 'normal' : 'bold' }
                  }}
                  onClick={() => !notification.read && !isAcceptableWalletNotification(notification) && handleMarkAsRead(notification.id)}
                  className={!notification.read && !isAcceptableWalletNotification(notification) ? styles.clickableNotification : ''}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default React.memo(NotificationMenu); 