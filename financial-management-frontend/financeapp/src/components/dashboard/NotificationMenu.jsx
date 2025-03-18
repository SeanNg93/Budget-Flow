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
  styled,
  alpha,
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
    width: 320,
    maxHeight: 400,
    overflow: 'auto',
    borderRadius: 12,
    marginTop: theme.spacing(1),
    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
  },
  '& .MuiDivider-root': {
    margin: theme.spacing(1, 0),
  },
}));

const NotificationItem = styled(ListItem)(({ theme, read }) => ({
  borderRadius: 8,
  marginBottom: 4,
  padding: theme.spacing(1.5),
  backgroundColor: read ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
}));

const EmptyNotification = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
      const response = await FinanceService.getUnreadNotificationCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await FinanceService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
        sx={{ 
          borderRadius: 2,
          mx: 1,
          '&:hover': {
            backgroundColor: alpha('#000', 0.04)
          }
        }}
      >
        <StyledBadge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </StyledBadge>
      </IconButton>
      
      <StyledMenu
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
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Notifications
            {unreadCount > 0 && (
              <Typography 
                component="span" 
                sx={{ 
                  ml: 1, 
                  fontSize: '0.8rem', 
                  color: 'error.main',
                  fontWeight: 'bold',
                  backgroundColor: alpha('#f44336', 0.1),
                  borderRadius: 10,
                  px: 1,
                  py: 0.5
                }}
              >
                {unreadCount} new
              </Typography>
            )}
          </Typography>
          
          {unreadCount > 0 && (
            <Button 
              size="small" 
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 1.5
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <EmptyNotification>
            <Typography variant="body2">
              No notifications yet
            </Typography>
          </EmptyNotification>
        ) : (
          <List sx={{ p: 1 }}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                read={notification.read}
                button
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                      {notification.read && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                          <ReadIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                          Read
                        </Typography>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    style: { fontWeight: notification.read ? 'normal' : 'bold' }
                  }}
                />
              </NotificationItem>
            ))}
          </List>
        )}
      </StyledMenu>
    </>
  );
};

export default NotificationMenu; 