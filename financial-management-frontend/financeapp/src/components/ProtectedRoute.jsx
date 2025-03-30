import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const authenticated = AuthService.isAuthenticated();
        
        if (!authenticated) {
          // If not authenticated, redirect to login
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
        } else {
          // If authenticated, try to get current user data
          const userData = await AuthService.getCurrentUser();
          
          if (!userData) {
            // If no user data, token might be invalid
            AuthService.logout();
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
          } else {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        AuthService.logout();
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    // We already redirected in the useEffect, but this is a safety net
    // Return null instead of the Navigate component
    return null;
  }
  
  return children;
};

export default ProtectedRoute; 