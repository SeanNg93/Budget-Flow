import React, { useMemo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import DecryptedText from './DecryptedText';
import styles from '../../styles/dashboard.module.css';

/**
 * Custom DecryptedText component with preset properties
 */
const AnimatedText = ({ text, overrides = {}, ...props }) => {
  // Base configuration
  const baseProps = {
    animateOn: "view",
    revealDirection: "start",
    sequential: true,
    maxIterations: 8,
    speed: 50,
    text,
    ...props
  };

  return <DecryptedText {...baseProps} {...overrides} />;
};

/**
 * WelcomeSection component displays a greeting to the user
 * and provides introduction text to the dashboard
 */
const WelcomeSection = ({ userProfile, user, openFinanceActionPanel }) => {
  // Get user name from profile with fallbacks
  const userName = useMemo(() => 
    userProfile?.fullName || user?.username || 'User'
  , [userProfile, user]);

  // Configuration for clickable text
  const linkTextStyle = {
    color: '#007aff', 
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 500
  };

  return (
    <Paper className={styles.welcomeCard}>
      <Box className={styles.welcomeHeader}>
        <AnimatedText
          text={`Welcome, ${userName}!`}
          className={styles.welcomeTitle}
          parentClassName={styles.welcomeTitleContainer}
        />
      </Box>
      
      <Typography 
        variant="body1" 
        color="text.secondary"
        className={styles.welcomeSubtitle}
      >
        <AnimatedText
          text="This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget."
          overrides={{
            speed: 20,
            maxIterations: 5
          }}
        />
        {' '} <br />
        
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <AnimatedText
            text="Click here"
            onClick={openFinanceActionPanel}
            style={linkTextStyle}
            aria-label="Open quick navigation menu"
            role="button"
            tabIndex={0}
            overrides={{
              onKeyPress: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  openFinanceActionPanel();
                }
              }
            }}
          />
          {' '}
          <AnimatedText text=" for quick navigation." />
        </Box>
      </Typography>
    </Paper>
  );
};

export default WelcomeSection; 