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
  ListItemIcon
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  AttachMoney as MoneyIcon,
  ArrowUpward as SentIcon,
  ArrowDownward as ReceivedIcon,
  CheckCircle as ReadIcon,
  MarkChatRead as MarkReadIcon,
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
    }
  ]);
  
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every minute
    const interval = setInterval(() => {
      if (!anchorEl) { // Only poll when menu is closed
        fetchUnreadCount();
      }
    }, 60000);
    
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
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MONEY_SENT':
        return <SentIcon color="error" />;
      case 'MONEY_RECEIVED':
        return <ReceivedIcon color="success" />;
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
  
  return (
    <>
      <IconButton
        aria-label="show notifications"
        color="inherit"
        onClick={handleMenuOpen}
        className={styles.notificationButton}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          classes={{
            root: styles.badgeRoot,
            badge: styles.badge
          }}
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
        classes={{
          root: styles.menuRoot,
          paper: styles.paper
        }}
      >
        <Box className={styles.headerContainer}>
          <Typography variant="h6" component="div">
            Notifications
            {unreadCount > 0 && (
              <Typography 
                component="span" 
                className={styles.newCountBadge}
              >
                {unreadCount} new
              </Typography>
            )}
          </Typography>
          
          <Box>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
                className={styles.markAllReadButton}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider className={styles.divider} />
        
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
                button
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
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
                  secondary={
                    <Typography component="span" variant="body2" color="text.secondary">
                      <Box component="span" className={styles.metaContainer}>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                        {notification.read && (
                          <Typography component="span" variant="caption" color="success.main" className={styles.readStatus}>
                            <ReadIcon fontSize="inherit" className={styles.readIcon} />
                            Read
                          </Typography>
                        )}
                      </Box>
                    </Typography>
                  }
                  primaryTypographyProps={{
                    style: { fontWeight: notification.read ? 'normal' : 'bold' }
                  }}
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