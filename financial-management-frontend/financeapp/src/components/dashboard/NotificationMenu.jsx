import React, { useState, useEffect } from 'react';
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

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [acceptingWallet, setAcceptingWallet] = useState(null);
  
  // Mock notifications data
  const [mockNotifications, setMockNotifications] = useState([
    {
      id: 1,
      message: "You sent $25.00 to testuser2 from your Main Wallet.",
      type: "MONEY_SENT",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
    },
    {
      id: 2,
      message: "You received $50.00 from testuser3.",
      type: "MONEY_RECEIVED",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 3,
      message: "You sent $15.00 to testuser4 from your Savings Wallet.",
      type: "MONEY_SENT",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
    },
    {
      id: 4,
      message: "testuser1 shared their wallet \"Travel Fund\" with you.",
      type: "WALLET_RECEIVED",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      data: JSON.stringify({ sharedWalletId: 1 })
    }
  ]);
  
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every minute
    const interval = setInterval(() => {
      if (!anchorEl) { // Only poll when menu is closed
        fetchUnreadCount();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [anchorEl]);
  
  const fetchUnreadCount = async () => {
    try {
      // First try the real API
      const response = await FinanceService.getUnreadNotificationCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      // Use mock data
      const unreadCount = mockNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    }
  };
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // First try the real API
      const response = await FinanceService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      // Use mock data
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      await FinanceService.markNotificationAsRead(id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Also update mock data
      setMockNotifications(prevMockNotifications => 
        prevMockNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Update mock data anyway
      setMockNotifications(prevMockNotifications => 
        prevMockNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await FinanceService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(notifications.map(notification => ({ 
        ...notification, 
        read: true 
      })));
      
      // Also update mock data
      setMockNotifications(mockNotifications.map(notification => ({ 
        ...notification, 
        read: true 
      })));
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      // Update mock data anyway
      setMockNotifications(mockNotifications.map(notification => ({ 
        ...notification, 
        read: true 
      })));
      
      // Update notifications
      setNotifications(notifications.map(notification => ({ 
        ...notification, 
        read: true 
      })));
      
      // Update unread count
      setUnreadCount(0);
    }
  };
  
  const handleClearNotifications = async () => {
    try {
      await FinanceService.deleteAllNotifications();
      
      // Update local state
      setNotifications([]);
      
      // Also update mock data
      setMockNotifications([]);
      
      // Update unread count
      setUnreadCount(0);
      
      // Close the menu
      handleMenuClose();
    } catch (error) {
      // Update mock data anyway
      setMockNotifications([]);
      
      // Update notifications
      setNotifications([]);
      
      // Update unread count
      setUnreadCount(0);
      
      // Close the menu
      handleMenuClose();
    }
  };
  
  // Handle accepting a shared wallet
  const handleAcceptSharedWallet = async (notification) => {
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
      // Silently handle errors
    } finally {
      setAcceptingWallet(null);
    }
  };
  
  const getNotificationIcon = (type) => {
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
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If less than 24 hours ago, show relative time
    if (now - date < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show actual date
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Check if notification is a shared wallet notification that can be accepted
  const isAcceptableWalletNotification = (notification) => {
    return notification.type === 'WALLET_RECEIVED' && !notification.read;
  };
  
  return (
    <>
      <IconButton 
        aria-label="show notifications"
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
        disableScrollLock
      >
        <Box className={styles.headerContainer}>
          <Box className={styles.titleContainer}>
            <Typography variant="h6" className={styles.title}>
              Notifications
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
                Mark all read
              </Button>
            ) : (notifications.length > 0 && !loading) && (
              <Button 
                size="small" 
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={handleClearNotifications}
                className={styles.clearButton}
              >
                Clear all
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
              No notifications yet
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
                  primary={notification.message}
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
                            Read
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
                              'Accept'
                            )}
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={styles.dismissButton}
                          >
                            Dismiss
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

export default NotificationMenu; 