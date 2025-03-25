import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import DecryptedText from './DecryptedText';
import styles from '../../styles/dashboard.module.css';

/**
 * WelcomeSection component displays a greeting to the user
 * and provides introduction text to the dashboard
 */
const WelcomeSection = ({ userProfile, user, openFinanceActionPanel }) => {
  return (
    <Paper className={styles.welcomeCard}>
      <Box className={styles.welcomeHeader}>
        <DecryptedText
          text={`Welcome, ${userProfile?.fullName || user?.username || 'User'}!`}
          animateOn="view"
          revealDirection="start"
          speed={50}  // Higher speed value = slower animation
          sequential={true}  // Change to true for more visible character-by-character effect
          maxIterations={8}  // More iterations = longer animation
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
          text="This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget."
          animateOn="view"
          revealDirection="start"
          speed={20} // Lower value = faster animation (reduced from 50 to 20)
          sequential={true}
          maxIterations={5} // Reduced iterations for faster completion
        />
        {' '} <br></br>
        <DecryptedText
          text="Click here"
          animateOn="view"
          revealDirection="start"
          speed={50}
          sequential={true}
          maxIterations={8}
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
          text="for quick navigation."
          animateOn="view"
          revealDirection="start"
          speed={50}
          sequential={true}
          maxIterations={8}
        />
      </Typography>
    </Paper>
  );
};

export default WelcomeSection; 