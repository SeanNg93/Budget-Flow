import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Paper, Box, Fade } from '@mui/material';
import SplitText from './SplitText';
import styles from '../../styles/dashboard.module.css';
import FinancialTips from './FinancialTips';
import { useTranslation } from 'react-i18next';

/**
 * WelcomeSection component displays a greeting to the user
 * and provides introduction text to the dashboard
 */
const WelcomeSection = ({ userProfile, user, openFinanceActionPanel, walletCount = 0 }) => {
  const { t } = useTranslation();
  
  // Get user name from profile with fallbacks
  const userName = useMemo(() => 
    userProfile?.fullName || user?.username || t('common.user')
  , [userProfile, user, t]);

  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  
  // State for controlling welcome/tips display
  const [showWelcome, setShowWelcome] = useState(true);
  const [contentFadeIn, setContentFadeIn] = useState(true);
  
  // Array of welcome images
  const welcomeImages = [
    "/Welcome.jpg",
    "/Welcome_2.jpg",
    "/Welcome_3.png",
    "/Welcome_4.jpg",
    "/Welcome_5.jpg"
  ];

  // Auto-rotate images every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      
      // Wait for fade-out before changing image
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % welcomeImages.length);
        setFadeIn(true);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, [welcomeImages.length]);

  // Effect to swap welcome text with financial tips after delay
  useEffect(() => {
    // If wallet count is 3 or more, set up transition to financial tips
    if (walletCount >= 3) {
      // Wait 10 seconds before transitioning to financial tips
      const tipTransitionTimer = setTimeout(() => {
        // Fade out current content
        setContentFadeIn(false);
        
        // Wait for fade-out to complete before switching content
        setTimeout(() => {
          setShowWelcome(false);
          setContentFadeIn(true);
        }, 500);
      }, 10000);
      
      return () => clearTimeout(tipTransitionTimer);
    } else if (!showWelcome) {
      // If wallet count drops below 3 and we're showing tips, transition back to welcome text
      // Fade out current content
      setContentFadeIn(false);
      
      // Wait for fade-out to complete before switching content back to welcome
      setTimeout(() => {
        setShowWelcome(true);
        setContentFadeIn(true);
      }, 500);
    }
  }, [walletCount, showWelcome]);

  // Handle manual image change
  const handleImageChange = (index) => {
    if (index !== currentImageIndex) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentImageIndex(index);
        setFadeIn(true);
      }, 500);
    }
  };

  // Animation settings for consistent animation across all text elements
  const animationProps = {
    animationFrom: { opacity: 0, transform: 'translate3d(0,20px,0)' },
    animationTo: { opacity: 1, transform: 'translate3d(0,0,0)' },
    easing: "easeOutCubic",
    threshold: 0.1,
    rootMargin: "0px"
  };

  return (
    <Paper className={styles.welcomeCard}>
      <Box className={styles.welcomeContent}>
        <Box className={styles.welcomeImageContainer}>
          <Fade in={fadeIn} timeout={{ enter: 800, exit: 500 }}>
            <img 
              src={welcomeImages[currentImageIndex]} 
              alt={t('dashboard.welcomeImageAlt', { number: currentImageIndex + 1 })} 
              className={styles.welcomeImage}
            />
          </Fade>
          
          {/* Image navigation dots */}
          <Box className={styles.imageNavDots}>
            {welcomeImages.map((_, index) => (
              <Box 
                key={index}
                className={`${styles.imageNavDot} ${currentImageIndex === index ? styles.activeImageDot : ''}`}
                onClick={() => handleImageChange(index)}
                role="button"
                tabIndex={0}
                aria-label={t('dashboard.viewImage', { number: index + 1 })}
              />
            ))}
          </Box>
        </Box>
        
        <Fade in={contentFadeIn} timeout={{ enter: 800, exit: 500 }}>
          <Box className={styles.welcomeTextContent}>
            {showWelcome ? (
              /* Welcome Message Content */
              <>
                <Box className={styles.welcomeHeader}>
                  <SplitText
                    text={t('dashboard.welcomeGreeting', { name: userName })}
                    className={styles.welcomeTitle}
                    {...animationProps}
                    delay={35}
                    style={{ display: 'block', width: '100%' }}
                    textAlign="left"
                  />
                </Box>
                
                <SplitText
                  text={t('dashboard.welcomeMessage')}
                  className={styles['subtitle-split']}
                  {...animationProps}
                  delay={15}
                  style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                  textAlign="left"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Navigation text with animated elements */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: 'rgba(0, 0, 0, 0.6)', 
                      fontSize: 'calc(0.97rem * var(--scale-factor))'
                    }}
                    className={styles['subtitle-split']}
                  >
                    <SplitText
                      text="👉"
                      className={styles['subtitle-split']}
                      {...animationProps}
                      delay={25}
                      style={{ marginRight: '2px' }}
                      textAlign="left"
                    />
                    
                    <Box 
                      component="span" 
                      onClick={openFinanceActionPanel}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          openFinanceActionPanel();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={t('dashboard.openNavigationMenu')}
                      className={styles['nav-link-highlight']}
                      sx={{
                        marginLeft: '2px',
                        marginRight: '2px',
                        display: 'inline-block'
                      }}
                    >
                      <SplitText
                        text={t('dashboard.clickHere')}
                        className={styles['subtitle-split']}
                        {...animationProps}
                        delay={30}
                        style={{ 
                          display: 'inline-block',
                          color: 'inherit',
                          textDecoration: 'inherit',
                          fontWeight: 'inherit'
                        }}
                        textAlign="left"
                      />
                    </Box>
                    
                    <SplitText
                      text="👈"
                      className={styles['subtitle-split']}
                      {...animationProps}
                      delay={25}
                      style={{ marginRight: '2px', marginLeft: '2px' }}
                      textAlign="left"
                    />
                    
                    <SplitText
                      text={t('dashboard.forQuickNavigation')}
                      className={styles['subtitle-split']}
                      {...animationProps}
                      delay={35}
                      style={{ marginLeft: '2px' }}
                      textAlign="left"
                    />
                  </Box>
                </Box>
              </>
            ) : (
              /* Financial Tips Content */
              <Box className={styles.tipsSection}>
                <FinancialTips maxTips={1} inWelcomeSection={true} />
              </Box>
            )}
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

export default WelcomeSection; 