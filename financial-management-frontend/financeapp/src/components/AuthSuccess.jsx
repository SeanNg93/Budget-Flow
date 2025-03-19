import React from 'react';
import { Box } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import styles from '../styles/auth.module.css';

/**
 * AuthSuccess component for displaying authentication success messages with consistent styling
 * @param {Object} props - Component props
 * @param {string} props.message - Success message to display
 * @param {boolean} props.visible - Whether the success message should be visible
 */
const AuthSuccess = ({ message, visible = true }) => {
  if (!visible || !message) return null;
  
  return (
    <Box className={styles.successMessage}>
      <CheckCircleOutline style={{ marginRight: '8px', fontSize: '18px' }} />
      {message}
    </Box>
  );
};

export default AuthSuccess; 