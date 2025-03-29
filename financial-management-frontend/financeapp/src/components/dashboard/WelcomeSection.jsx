import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Paper, Box, Fade } from '@mui/material';
import SplitText from './SplitText';
import styles from '../../styles/dashboard.module.css';

/**
 * WelcomeSection component displays a greeting to the user
 * and provides introduction text to the dashboard
 */
const WelcomeSection = ({ userProfile, user, openFinanceActionPanel }) => {
  // Get user name from profile with fallbacks
  const userName = useMemo(() => 
    userProfile?.fullName || user?.username || 'User'
  , [userProfile, user]);

  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  
  // Array of welcome images
  const welcomeImages = [
    "/Welcome.jpg",
    "/Welcome_2.jpg",
    "/Welcome_3.png"
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
              alt={`Welcome ${currentImageIndex + 1}`} 
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
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </Box>
        </Box>
        
        <Box className={styles.welcomeTextContent}>
          <Box className={styles.welcomeHeader}>
            <SplitText
              text={`Welcome, ${userName}! 👋`}
              className={styles.welcomeTitle}
              {...animationProps}
              delay={35}
              style={{ display: 'block', width: '100%' }}
              textAlign="left"
            />
          </Box>
          
          <SplitText
            text="This is your financial dashboard. Here you can manage your finances, track expenses, and plan your budget."
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
                aria-label="Open quick navigation menu"
                className={styles['nav-link-highlight']}
                sx={{
                  marginLeft: '2px',
                  marginRight: '2px',
                  display: 'inline-block'
                }}
              >
                <SplitText
                  text="Click here"
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
                text="for quick navigation."
                className={styles['subtitle-split']}
                {...animationProps}
                delay={35}
                style={{ marginLeft: '2px' }}
                textAlign="left"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default WelcomeSection; 