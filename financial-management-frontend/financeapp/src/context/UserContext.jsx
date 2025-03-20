import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
  
  // Load initial user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData.id) {
      fetchUserProfile(userData.id);
    }
  }, []);
  
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