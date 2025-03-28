import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { activateAccount } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';
import { useTranslation } from 'react-i18next';

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

export default function ActivateAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activating, setActivating] = useState(true);
  const [activated, setActivated] = useState(false);
  const [message, setMessage] = useState(t('auth.activatingAccount', 'Activating your account...'));

  useEffect(() => {
    const activateUserAccount = async () => {
      try {
        // Extract token from URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        
        if (!token) {
          setMessage(t('auth.invalidActivationLink', 'Invalid activation link. The token is missing.'));
          setActivating(false);
          return;
        }
        
        const response = await activateAccount(token);
        setActivated(true);
        setMessage(response.data.message || t('auth.accountActivated', 'Your account has been successfully activated! You can now log in.'));
      } catch (error) {
        setActivated(false);
        const errorMessage = error.response?.data 
          ? (typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || JSON.stringify(error.response.data))
          : t('auth.activationFailed', 'Account activation failed. The link may have expired or is invalid.');
        setMessage(errorMessage);
      } finally {
        setActivating(false);
      }
    };

    activateUserAccount();
  }, [location, t]);

  return (
    <CssBaseline>
      <div className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <div className={styles.logoBackground}>
              <img src="/Dollarnote_siegel_hq.jpg" alt={t('common.appName', 'Budget Flow Logo')} className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            {t('common.appName', 'BUDGET FLOW')}
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            {t('auth.appTagline', 'Illuminate Your Financial Future')}
          </Typography>
          
          {activating ? (
            <Box className={styles.loadingContainer}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                {message}
              </Typography>
            </Box>
          ) : (
            <Box className={styles.loadingContainer}>
              {activated ? (
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
              ) : (
                <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
              )}
              <Box className={activated ? styles.successMessage : styles.errorMessage}>
                {message}
              </Box>
              
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                className={styles.gradientButton}
              >
                {t('auth.goToLogin', 'Go to Login')}
              </Button>
              
              {!activated && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/register"
                    className={styles.authLink}
                  >
                    {t('auth.registerAgain', 'Register again')}
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