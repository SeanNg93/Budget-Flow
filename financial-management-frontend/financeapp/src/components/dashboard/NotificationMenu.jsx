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
// Import our new notification service
import { useNotifications } from '../../services/NotificationService';
import { useTranslation } from 'react-i18next';

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
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotifications();
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleMenuOpen = useCallback(async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  }, [fetchNotifications]);
  
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
        aria-label={`${unreadCount} ${t('notifications.unread', 'unread notifications')}`}
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
              {t('common.notifications', 'Notifications')}
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
                className={styles.actionButton}
              >
                {t('notifications.markAllRead', 'Mark all as read')}
              </Button>
            ) : notifications.length > 0 ? (
              <Button 
                size="small" 
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleClearNotifications}
                className={styles.actionButton}
              >
                {t('notifications.clearAll', 'Clear all')}
              </Button>
            ) : null}
          </Box>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box className={styles.loadingContainer}>
            <CircularProgress size={24} />
            <Typography variant="body2">
              {t('notifications.loading', 'Loading notifications...')}
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box className={styles.emptyContainer}>
            <Typography variant="body2" align="center">
              {t('notifications.noNotifications', 'No notifications to display')}
            </Typography>
          </Box>
        ) : (
          <List dense className={styles.list}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                className={clsx(styles.listItem, {
                  [styles.unread]: !notification.read
                })}
                disableGutters
              >
                <ListItemIcon className={styles.listItemIcon}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={formatDate(notification.createdAt)}
                  className={styles.listItemText}
                />
                <Box className={styles.notificationActions}>
                  {isAcceptableWalletNotification(notification) && (
                    <Tooltip title={t('notifications.acceptWallet', 'Accept shared wallet')}>
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label={t('notifications.acceptWallet', 'Accept shared wallet')}
                        onClick={() => handleAcceptSharedWallet(notification)}
                        disabled={acceptingWallet === notification.id}
                        className={styles.acceptButton}
                      >
                        {acceptingWallet === notification.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <AcceptIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {!notification.read && (
                    <Tooltip title={t('notifications.markRead', 'Mark as read')}>
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label={t('notifications.markRead', 'Mark as read')}
                        onClick={() => handleMarkAsRead(notification.id)}
                        className={styles.markReadButton}
                      >
                        <ReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu; 