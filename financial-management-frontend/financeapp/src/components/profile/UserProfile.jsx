import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Avatar } from '@mui/material';

const API_BASE_URL = "http://localhost:8080";

const UserProfile = ({ user }) => {
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token || !user || !user.id) return;

                const response = await axios.get(`${API_BASE_URL}/api/user/profile/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.data) {
                    setUserProfile(response.data);
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        };

        fetchUserProfile();
    }, [user]);

    if (!userProfile) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Avatar src={userProfile.profilePictureUrl} alt={userProfile.fullName} />
            <Box sx={{ ml: 2 }}>
                <Typography variant="h6">{userProfile.fullName || user.username}</Typography>
                <Typography variant="body2" color="text.secondary">{userProfile.email}</Typography>
            </Box>
        </Box>
    );
};

export default UserProfile;
