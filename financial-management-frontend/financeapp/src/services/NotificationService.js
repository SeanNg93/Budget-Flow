import { useState, useEffect, useCallback } from 'react';
import FinanceService from './FinanceService';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { WEBSOCKET_URL } from '../config/apiConfig';

// Configuration - uses environment variable in production
const NOTIFICATION_QUEUE = '/user/queue/notifications'; // User-specific queue

// Shared state for all components
let sharedState = {
  unreadCount: 0,
  notifications: [],
  isConnected: false, // Track connection status
};

// Subscribed components
const subscribers = new Set();

// Callbacks for specific notification types (can be kept if needed elsewhere)
const notificationCallbacks = {
  WALLET_SHARE_ACCEPTED: null,
  WALLET_RECEIVED: null,
  MONEY_SENT: null,
  MONEY_RECEIVED: null
};

// WebSocket client instance
let stompClient = null;
let currentUsername = null; // Store username for destination path
let currentUserId = null; // Keep userId if needed for initial fetch

// Function to notify all subscribers of state changes
const notifySubscribers = () => {
  // Make sure to pass a copy of the state to avoid mutation issues
  const stateCopy = { ...sharedState }; 
  subscribers.forEach(callback => callback(stateCopy));
};

// Function to register callbacks (if still needed)
export const registerNotificationCallback = (type, callback) => {
  if (notificationCallbacks.hasOwnProperty(type)) {
    notificationCallbacks[type] = callback;
  } else {
    console.warn(`Attempted to register callback for unknown type: ${type}`);
  }
};

// Function to fetch initial notifications (called once on connect or manually)
const fetchInitialNotifications = async () => {
  if (!currentUserId) return;
  
  try {
    const response = await FinanceService.getNotifications(); // Use existing API call
    
    if (response && response.data) {
      const initialNotifications = response.data;
      const unreadCount = initialNotifications.filter(n => !n.read).length;
      
      sharedState = {
        ...sharedState,
        notifications: initialNotifications,
        unreadCount: unreadCount,
      };
      
      notifySubscribers();
    }
  } catch (error) {
    console.error('Error fetching initial notifications:', error);
    // Handle error appropriately, maybe set an error state
  }
};

// Function to handle incoming WebSocket messages
const handleWebSocketMessage = (message) => {
  try {
    const notification = JSON.parse(message.body);

    // Add the new notification to the beginning of the list
    const updatedNotifications = [notification, ...sharedState.notifications];
    
    // Optionally, limit the number of stored notifications
    // if (updatedNotifications.length > MAX_NOTIFICATIONS) { ... }

    sharedState = {
      ...sharedState,
      notifications: updatedNotifications,
      unreadCount: sharedState.unreadCount + 1, // Increment unread count
    };

    notifySubscribers();

    // Trigger callbacks if needed
    const callback = notificationCallbacks[notification.type];
    if (callback) {
      callback();
    }

  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
};

// Function to connect WebSocket
const connectWebSocket = (username) => {
  if (stompClient && stompClient.connected) {
    return;
  }

  const socket = new SockJS(WEBSOCKET_URL);
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000, // Attempt reconnect every 5 seconds
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: (frame) => {
      sharedState = { ...sharedState, isConnected: true };
      notifySubscribers();

      // Fetch initial notifications upon connection
      fetchInitialNotifications();

      // Subscribe to user-specific queue
      // Note: The destination needs /user prefix which is handled by the broker
      const userQueue = `/user/${username}/queue/notifications`;
      stompClient.subscribe(userQueue, handleWebSocketMessage);
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      sharedState = { ...sharedState, isConnected: false };
      notifySubscribers();
    },
    onWebSocketError: (event) => {
      console.error('WebSocket error:', event);
      sharedState = { ...sharedState, isConnected: false };
      notifySubscribers();
    },
    onDisconnect: () => {
        sharedState = { ...sharedState, isConnected: false };
        notifySubscribers();
        // Optionally try to reconnect here or let the reconnectDelay handle it
    }
  });

  stompClient.activate();
};

// Function to disconnect WebSocket
const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
  }
  stompClient = null;
  sharedState = { ...sharedState, isConnected: false };
  notifySubscribers();
};

// Function to mark a notification as read (API call)
const markAsRead = async (id) => {
  try {
    await FinanceService.markNotificationAsRead(id);
    
    let notificationFound = false;
    const updatedNotifications = sharedState.notifications.map(notification => {
      if (notification.id === id && !notification.read) {
        notificationFound = true;
        return { ...notification, read: true };
      }
      return notification;
    });
    
    if (notificationFound) {
        sharedState = {
          ...sharedState,
          notifications: updatedNotifications,
          unreadCount: Math.max(0, sharedState.unreadCount - 1)
        };
        notifySubscribers();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Function to mark all notifications as read (API call)
const markAllAsRead = async () => {
  try {
    await FinanceService.markAllNotificationsAsRead();
    
    const updatedNotifications = sharedState.notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    if (sharedState.unreadCount > 0) {
        sharedState = {
          ...sharedState,
          notifications: updatedNotifications,
          unreadCount: 0
        };
        notifySubscribers();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Function to clear all notifications (API call)
const clearNotifications = async () => {
  try {
    await FinanceService.deleteAllNotifications();
    
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

// Initialize the notification service with username and userId
// We need the username for the WebSocket topic
export const initializeNotificationService = (username, userId) => {
  if (!username || !userId) {
      console.error("Cannot initialize NotificationService without username and userId.");
      return;
  }
  
  // If user changes, disconnect old socket and clear state
  if ((username && username !== currentUsername) || (userId && userId !== currentUserId)) {
    disconnectWebSocket();
    sharedState = {
      unreadCount: 0,
      notifications: [],
      isConnected: false,
    };
    notifySubscribers(); // Notify about cleared state
  }

  currentUsername = username;
  currentUserId = userId;
  
  // Connect WebSocket if not already connected
  connectWebSocket(username);
};

// React hook to use notifications
export const useNotifications = () => {
  const [state, setState] = useState(sharedState);
  
  useEffect(() => {
    // Callback function to update local state when sharedState changes
    const handleStateUpdate = (newState) => {
      setState({ ...newState }); // Update component state
    };
    
    // Subscribe the component
    subscribers.add(handleStateUpdate);
    
    // Initial state sync
    handleStateUpdate(sharedState); 

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      subscribers.delete(handleStateUpdate);
      // Optional: Disconnect WebSocket if no components are using the service
      // if (subscribers.size === 0) { 
      //   disconnectWebSocket();
      // }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount
  
  // Expose state and actions
  return {
    isConnected: state.isConnected,
    unreadCount: state.unreadCount,
    notifications: state.notifications,
    // Expose actions that components might need
    fetchInitialNotifications: useCallback(fetchInitialNotifications, []), // Allow manual refresh if needed
    markAsRead: useCallback(markAsRead, []), 
    markAllAsRead: useCallback(markAllAsRead, []), 
    clearNotifications: useCallback(clearNotifications, [])
  };
}; 