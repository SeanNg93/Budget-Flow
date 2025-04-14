import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
// Import NotificationService functions
import { initializeNotificationService, registerNotificationCallback } from '../services/NotificationService';
import FinanceService from '../services/FinanceService'; // Import FinanceService

const API_BASE_URL = "http://localhost:8080";
const DEFAULT_AVATAR = "/default-avatar.svg";

// Create a context for user data
const UserContext = createContext();

// Custom hook to use the UserContext
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    fullName: null,
    profilePicture: null,
    userId: null,
    email: null,
    username: null // Added username to profile state
  });
  // Add state for wallets and transactions if not already present
  const [wallets, setWallets] = useState([]);
  const [sharedWallets, setSharedWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  // Add state for financial summary
  const [financialSummary, setFinancialSummary] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0
  });
  
  // Load initial user ID from localStorage and fetch profile
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData.id) {
      fetchUserProfile(userData.id);
    } else {
      // console.log("No user data found in localStorage on initial load."); // Removed log
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Run only once on mount

  // Initialize WebSocket and fetch data AFTER profile is loaded
  useEffect(() => {
    if (profileData.userId && profileData.username) {
      // console.log(`User profile loaded. Initializing services for user: ${profileData.username} (ID: ${profileData.userId})`); // Removed log

      initializeNotificationService(profileData.username, profileData.userId);

      fetchInitialData();

      registerNotificationCallback('WALLET_SHARE_ACCEPTED', fetchWalletsAndShared);
      registerNotificationCallback('WALLET_RECEIVED', fetchWalletsAndShared);
      registerNotificationCallback('MONEY_SENT', fetchTransactionsAndSummary);
      registerNotificationCallback('MONEY_RECEIVED', fetchTransactionsAndSummary);

    } else {
        // console.log("User profile not yet loaded, skipping service initialization."); // Removed log
    }
  }, [profileData.userId, profileData.username]); // Dependencies: userId and username

  // Function to fetch wallets and shared wallets
  const fetchWalletsAndShared = useCallback(async () => {
    // console.log("Fetching wallets and shared wallets..."); // Removed log
    try {
      // Fetch wallets, wallets shared with the user, and wallets shared by the user
      const [walletsResponse, sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
        FinanceService.getWallets(),
        FinanceService.getSharedWalletsWithMe(), // Correct function name
        FinanceService.getSharedWalletsByMe()    // Correct function name
      ]);
      
      setWallets(walletsResponse.data || []);
      
      // Combine shared wallets (adjust based on how you want to use this state)
      const combinedShared = [
        ...(sharedWithMeResponse.data || []),
        ...(sharedByMeResponse.data || [])
      ];
      setSharedWallets(combinedShared);

    } catch (error) {
      console.error("Error fetching wallets or shared wallets:", error);
      // Set to empty arrays on error to prevent crashes
      setWallets([]); 
      setSharedWallets([]);
    }
  }, []);

  // Function to fetch transactions
  const fetchTransactions = useCallback(async () => {
    // console.log("Fetching transactions..."); // Removed log
    try {
      const response = await FinanceService.getTransactions({}); // Pass empty object or appropriate filters
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  // Function to fetch financial summary
  const fetchFinancialSummary = useCallback(async () => {
    // console.log("Fetching financial summary..."); // Removed log
    try {
      const response = await FinanceService.getFinancialSummary();
      setFinancialSummary(response.data || { totalBalance: 0, totalIncome: 0, totalExpense: 0, netSavings: 0 });
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    }
  }, []);

  // Function to fetch transactions AND summary (triggered by money transfer notifications)
  const fetchTransactionsAndSummary = useCallback(async () => {
    // console.log("Fetching transactions and summary after notification..."); // Removed log
    await Promise.all([fetchTransactions(), fetchFinancialSummary()]);
  }, [fetchTransactions, fetchFinancialSummary]);

  // Fetch initial data on load (now triggered by the new useEffect)
  const fetchInitialData = useCallback(async () => {
    // console.log("Fetching initial financial data..."); // Removed log
    await Promise.all([fetchWalletsAndShared(), fetchTransactions(), fetchFinancialSummary()]);
  }, [fetchWalletsAndShared, fetchTransactions, fetchFinancialSummary]);
  
  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    // console.log(`Fetching user profile for ID: ${userId}`); // Removed log
    try {
      const token = localStorage.getItem('userToken');
      if (!token || !userId) return;

      const response = await axios.get(`${API_BASE_URL}/api/user/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        // Process profile data
        const data = response.data;
        // console.log("Received profile data:", data); // Removed log
        
        // Process profile picture URL
        let profilePicUrl = data.profilePictureUrl;
        if (profilePicUrl && !profilePicUrl.startsWith('http')) {
          profilePicUrl = `${API_BASE_URL}${profilePicUrl}`;
        }
        
        // Update context state with all necessary info
        setProfileData({
          fullName: data.fullName || null,
          profilePicture: profilePicUrl || null,
          userId: data.userId || userId,
          email: data.email || null,
          username: data.username || null // Store username from API response
        });
        
        // DO NOT initialize WebSocket here - it will be handled by the dedicated useEffect
        
      } else {
          console.warn("No data received from user profile API.");
          // Consider clearing profile data or handling error state
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Consider clearing profile data or handling error state
      setProfileData({ userId: null, username: null, email: null, fullName: null, profilePicture: null });
    }
  };
  
  // Function to update profile picture
  const updateProfilePicture = (pictureUrl) => {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    let updatedUrl = pictureUrl;
    
    if (pictureUrl && !pictureUrl.startsWith('data:')) {
      if (!pictureUrl.startsWith('http')) {
        updatedUrl = `${API_BASE_URL}${pictureUrl}`;
      }
      updatedUrl = `${updatedUrl}?t=${timestamp}`;
    }
    
    setProfileData(prev => ({
      ...prev,
      profilePicture: updatedUrl
    }));
  };
  
  // Function to update full name
  const updateFullName = (name) => {
    setProfileData(prev => ({
      ...prev,
      fullName: name
    }));
  };
  
  // Function to update the whole profile
  const updateProfile = (profile) => {
    // Process profile picture URL
    let profilePicUrl = profile.profilePictureUrl;
    if (profilePicUrl && !profilePicUrl.startsWith('http')) {
      profilePicUrl = `${API_BASE_URL}${profilePicUrl}`;
    }
    
    setProfileData({
      fullName: profile.fullName || null,
      profilePicture: profilePicUrl || null,
      userId: profile.userId || profileData.userId,
      email: profile.email || profileData.email,
      username: profile.username || profileData.username // Ensure username is updated if present
    });
  };

  return (
    <UserContext.Provider 
      value={{ 
        profileData, 
        wallets, // Expose wallets
        sharedWallets, // Expose shared wallets
        transactions, // Expose transactions
        financialSummary, // Expose financial summary
        fetchWalletsAndShared, // Expose fetch function
        fetchTransactions, // Expose fetch function
        fetchTransactionsAndSummary, // Expose combined fetch function
        fetchFinancialSummary, // Expose summary fetch function
        fetchInitialData, // Expose initial fetch
        updateProfilePicture, 
        updateFullName,
        updateProfile,
        fetchUserProfile 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext; 