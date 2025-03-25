import { useState, useEffect, useCallback } from 'react';
import FinanceService from './FinanceService';

// Configuration
const POLLING_INTERVAL = 30000; // 30 seconds

// Shared state for all components
let sharedState = {
  unreadCount: 0,
  notifications: [],
  lastFetched: null,
  isPolling: false
};

// Subscribed components
const subscribers = new Set();

// User ID for authorization
let currentUserId = null;

// Function to notify all subscribers of state changes
const notifySubscribers = () => {
  subscribers.forEach(callback => callback(sharedState));
};

// Check if we should fetch new data
const shouldFetchData = () => {
  if (!sharedState.lastFetched) return true;
  
  const now = new Date();
  const lastFetch = new Date(sharedState.lastFetched);
  const timeDiff = now - lastFetch;
  
  // If it's been more than 15 seconds since last fetch
  return timeDiff > 15000;
};

// Function to fetch unread counts with throttling
const fetchUnreadCount = async () => {
  if (!currentUserId) return;
  
  try {
    // Only fetch if necessary
    if (shouldFetchData()) {
      const response = await FinanceService.getUnreadNotificationCount();
      
      if (response && response.data) {
        sharedState = {
          ...sharedState,
          unreadCount: response.data.unreadCount,
          lastFetched: new Date()
        };
        
        notifySubscribers();
      }
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

// Function to fetch notifications
const fetchNotifications = async () => {
  if (!currentUserId) return;
  
  try {
    const response = await FinanceService.getNotifications();
    
    if (response && response.data) {
      sharedState = {
        ...sharedState,
        notifications: response.data,
        lastFetched: new Date()
      };
      
      // Update the unread count based on notifications array
      const unreadCount = response.data.filter(n => !n.read).length;
      sharedState.unreadCount = unreadCount;
      
      notifySubscribers();
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

// Function to mark a notification as read
const markAsRead = async (id) => {
  try {
    await FinanceService.markNotificationAsRead(id);
    
    // Update local state
    const updatedNotifications = sharedState.notifications.map(notification => 
      notification.id === id 
        ? { ...notification, read: true } 
        : notification
    );
    
    sharedState = {
      ...sharedState,
      notifications: updatedNotifications,
      unreadCount: Math.max(0, sharedState.unreadCount - 1)
    };
    
    notifySubscribers();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Function to mark all notifications as read
const markAllAsRead = async () => {
  try {
    await FinanceService.markAllNotificationsAsRead();
    
    // Update local state
    const updatedNotifications = sharedState.notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    sharedState = {
      ...sharedState,
      notifications: updatedNotifications,
      unreadCount: 0
    };
    
    notifySubscribers();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Function to clear all notifications
const clearNotifications = async () => {
  try {
    await FinanceService.deleteAllNotifications();
    
    // Update local state
    sharedState = {
      ...sharedState,
      notifications: [],
      unreadCount: 0
    };
    
    notifySubscribers();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

// Start polling function
const startPolling = () => {
  if (sharedState.isPolling) return;
  
  sharedState.isPolling = true;
  
  // Fetch immediately
  fetchUnreadCount();
  
  // Set up interval
  const interval = setInterval(() => {
    fetchUnreadCount();
  }, POLLING_INTERVAL);
  
  // Store interval ID for cleanup
  sharedState.pollingInterval = interval;
};

// Stop polling function
const stopPolling = () => {
  if (!sharedState.isPolling) return;
  
  clearInterval(sharedState.pollingInterval);
  sharedState.isPolling = false;
  sharedState.pollingInterval = null;
};

// Initialize the notification service with a user ID
export const initializeNotificationService = (userId) => {
  if (userId !== currentUserId) {
    // Clear any existing state if user changes
    if (currentUserId) {
      stopPolling();
      sharedState = {
        unreadCount: 0,
        notifications: [],
        lastFetched: null,
        isPolling: false
      };
    }
    
    // Set the new user ID
    currentUserId = userId;
    
    // Start polling with the new user ID
    startPolling();
    
    console.log('NotificationService initialized for user:', userId);
  }
};

// React hook to use notifications
export const useNotifications = () => {
  const [state, setState] = useState(sharedState);
  
  useEffect(() => {
    // Add subscriber
    const callback = (newState) => {
      setState({ ...newState });
    };
    
    subscribers.add(callback);
    
    // Start polling if not already started
    if (!sharedState.isPolling && currentUserId) {
      startPolling();
    }
    
    // Return cleanup function
    return () => {
      subscribers.delete(callback);
      
      // If no more subscribers, stop polling
      if (subscribers.size === 0) {
        stopPolling();
      }
    };
  }, []);
  
  // Memoized functions to prevent unnecessary re-renders
  const memoizedFetchNotifications = useCallback(fetchNotifications, []);
  const memoizedMarkAsRead = useCallback(markAsRead, []);
  const memoizedMarkAllAsRead = useCallback(markAllAsRead, []);
  const memoizedClearNotifications = useCallback(clearNotifications, []);
  
  return {
    unreadCount: state.unreadCount,
    notifications: state.notifications,
    fetchNotifications: memoizedFetchNotifications,
    markAsRead: memoizedMarkAsRead,
    markAllAsRead: memoizedMarkAllAsRead,
    clearNotifications: memoizedClearNotifications
  };
}; 