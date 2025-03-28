import React, { useMemo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import DecryptedText from './DecryptedText';
import styles from '../../styles/dashboard.module.css';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  
  // Get user name from profile with fallbacks
  const userName = useMemo(() => 
    userProfile?.fullName || user?.username || 'User'
  , [userProfile, user]);

  // Get current language to use as a key for the AnimatedText components
  const currentLanguage = i18n.language;

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
          key={`welcome-title-${currentLanguage}`}
          text={`${t('dashboard.welcome')}, ${userName}! 👋`}
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
          key={`welcome-desc-${currentLanguage}`}
          text={t('dashboard.welcomeDescription', 'This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget.')}
          overrides={{
            speed: 20,
            maxIterations: 5
          }}
        />
        {' '} <br />
        
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <AnimatedText
            key={`click-here-${currentLanguage}`}
            text={t('dashboard.clickHere', '👉 Click here 👈')}
            onClick={openFinanceActionPanel}
            style={linkTextStyle}
            aria-label={t('dashboard.openQuickNavigation', 'Open quick navigation menu')}
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
          <AnimatedText 
            key={`quick-nav-${currentLanguage}`}
            text={t('dashboard.forQuickNavigation', ' for quick navigation.')} 
          />
        </Box>
      </Typography>
    </Paper>
  );
};

export default WelcomeSection; 