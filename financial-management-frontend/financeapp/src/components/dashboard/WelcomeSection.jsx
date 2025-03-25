import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import DecryptedText from './DecryptedText';
import styles from '../../styles/dashboard.module.css';

/**
 * WelcomeSection component displays a greeting to the user
 * and provides introduction text to the dashboard
 */
const WelcomeSection = ({ userProfile, user, openFinanceActionPanel }) => {
  // Common configuration for DecryptedText components
  const commonTextProps = {
    animateOn: "view",
    revealDirection: "start",
    sequential: true,
    maxIterations: 8,
    speed: 50
  };

  return (
    <Paper className={styles.welcomeCard}>
      <Box className={styles.welcomeHeader}>
        <DecryptedText
          {...commonTextProps}
          text={`Welcome, ${userProfile?.fullName || user?.username || 'User'}!`}
          className={styles.welcomeTitle}
          parentClassName={styles.welcomeTitleContainer}
        />
      </Box>
      <Typography 
        variant="body1" 
        color="text.secondary"
        className={styles.welcomeSubtitle}
      >
        <DecryptedText
          {...commonTextProps}
          text="This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget."
          speed={20} // Override speed for faster animation
          maxIterations={5} // Override iterations for faster completion
        />
        {' '} <br></br>
        <DecryptedText
          {...commonTextProps}
          text="Click here"
          onClick={openFinanceActionPanel}
          style={{ 
            color: '#007aff', 
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 500
          }}
        />
        {' '}
        <DecryptedText
          {...commonTextProps}
          text="for quick navigation."
        />
      </Typography>
    </Paper>
  );
};

export default WelcomeSection; 