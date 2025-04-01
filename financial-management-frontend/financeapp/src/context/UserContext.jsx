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
    email: null
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
  
  // Load initial user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData.id) {
      fetchUserProfile(userData.id);
      // Initialize notification service with user ID
      initializeNotificationService(userData.id);
      // Fetch initial data including summary
      fetchInitialData();

      // Register notification callbacks
      registerNotificationCallback('WALLET_SHARE_ACCEPTED', fetchWalletsAndShared);
      registerNotificationCallback('WALLET_RECEIVED', fetchWalletsAndShared);
      registerNotificationCallback('MONEY_SENT', fetchTransactionsAndSummary);
      registerNotificationCallback('MONEY_RECEIVED', fetchTransactionsAndSummary);
    }
  }, []);

  // Function to fetch wallets and shared wallets
  const fetchWalletsAndShared = useCallback(async () => {
    console.log("Fetching wallets and shared wallets..."); // Debug log
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
    console.log("Fetching transactions..."); // Debug log
    try {
      const response = await FinanceService.getTransactions({}); // Pass empty object or appropriate filters
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  // Function to fetch financial summary
  const fetchFinancialSummary = useCallback(async () => {
    console.log("Fetching financial summary..."); // Debug log
    try {
      const response = await FinanceService.getFinancialSummary();
      setFinancialSummary(response.data || { totalBalance: 0, totalIncome: 0, totalExpense: 0, netSavings: 0 });
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    }
  }, []);

  // Function to fetch transactions AND summary (triggered by money transfer notifications)
  const fetchTransactionsAndSummary = useCallback(async () => {
    console.log("Fetching transactions and summary after notification..."); // Debug log
    // Fetching summary and transactions is likely sufficient, wallets might not change balance instantly depending on backend logic
    // If balances ARE expected to update instantly, call fetchWalletsAndShared as well.
    await Promise.all([fetchTransactions(), fetchFinancialSummary()]);
    // Optional: Add fetchWalletsAndShared() if individual wallet balances need refresh
    // await Promise.all([fetchTransactions(), fetchFinancialSummary(), fetchWalletsAndShared()]); 
  }, [fetchTransactions, fetchFinancialSummary]);

  // Fetch initial data on load
  const fetchInitialData = useCallback(async () => {
    await Promise.all([fetchWalletsAndShared(), fetchTransactions(), fetchFinancialSummary()]);
  }, [fetchWalletsAndShared, fetchTransactions, fetchFinancialSummary]);
  
  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
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
        
        // Process profile picture URL
        let profilePicUrl = data.profilePictureUrl;
        if (profilePicUrl && !profilePicUrl.startsWith('http')) {
          profilePicUrl = `${API_BASE_URL}${profilePicUrl}`;
        }
        
        // Update context state
        setProfileData({
          fullName: data.fullName || null,
          profilePicture: profilePicUrl || null,
          userId: data.userId || userId,
          email: data.email || null
        });
        
        // Initialize notification service with user ID when profile is loaded
        initializeNotificationService(userId);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
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
      email: profile.email || profileData.email
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