import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { verifyEmail } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';

// Material UI imports
import {
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        // Extract token from URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        
        if (!token) {
          setMessage('Invalid verification link. The token is missing.');
          setVerifying(false);
          return;
        }
        
        const response = await verifyEmail(token);
        setVerified(true);
        setMessage(response.data.message || 'Your email has been successfully verified! You can now log in.');
      } catch (error) {
        setVerified(false);
        const errorMessage = error.response?.data 
          ? (typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || JSON.stringify(error.response.data))
          : 'Email verification failed. The link may have expired or is invalid.';
        setMessage(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyUserEmail();
  }, [location]);

  return (
    <CssBaseline>
      <div className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <div className={styles.logoBackground}>
              <img src="/Illuminati-Logo.png" alt="Budget Flow Logo" className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            BUDGET FLOW
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            Illuminate Your Financial Future
          </Typography>
          
          {verifying ? (
            <Box className={styles.loadingContainer}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                {message}
              </Typography>
            </Box>
          ) : (
            <Box className={styles.loadingContainer}>
              {verified ? (
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
              ) : (
                <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
              )}
              <Box className={verified ? styles.successMessage : styles.errorMessage}>
                {message}
              </Box>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                className={styles.submitButton}
              >
                Go to Login
              </Button>
              
              {!verified && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/register"
                    className={styles.authLink}
                  >
                    Register again
                  </Link>
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </div>
    </CssBaseline>
  );
} 