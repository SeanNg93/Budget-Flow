import React from 'react';
import { Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import styles from '../styles/auth.module.css';

/**
 * AuthError component for displaying authentication errors with consistent styling
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {boolean} props.visible - Whether the error should be visible
 */
const AuthError = ({ message, visible = true }) => {
  if (!visible || !message) return null;
  
  return (
    <Box className={styles.errorMessage}>
      <ErrorOutline style={{ marginRight: '8px', fontSize: '18px' }} />
      {message}
    </Box>
  );
};

export default AuthError; 