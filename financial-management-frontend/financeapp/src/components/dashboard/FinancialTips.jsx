import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Fade, IconButton } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import styles from '../../styles/financialTips.module.css';

// Array of financial tips - keep content brief for better display
const FINANCIAL_TIPS = [
  {
    icon: <SavingsIcon />,
    title: "Create an Emergency Fund",
    content: "Aim to save 3-6 months of expenses for unexpected events."
  },
  {
    icon: <AccountBalanceIcon />,
    title: "The 50/30/20 Rule",
    content: "Try to allocate 50% of income to needs, 30% to wants, and 20% to savings."
  },
  {
    icon: <TipsAndUpdatesIcon />,
    title: "Pay Yourself First",
    content: "Set aside savings as soon as you receive income, before spending on other things."
  },
  {
    icon: <AutoGraphIcon />,
    title: "Track Your Spending",
    content: "Regularly review your expenses to identify areas where you can cut back."
  },
  {
    icon: <LightbulbIcon />,
    title: "Automate Your Finances",
    content: "Set up automatic transfers to savings accounts and automatic bill payments."
  },
  {
    icon: <SavingsIcon />,
    title: "Diversify Your Investments",
    content: "Don't put all your eggs in one basket. Spread investments across different asset classes."
  },
  {
    icon: <AccountBalanceIcon />,
    title: "Review Financial Goals Regularly",
    content: "Adjust your financial plan as your life circumstances change."
  },
  {
    icon: <TipsAndUpdatesIcon />,
    title: "Minimize Debt",
    content: "Pay off high-interest debt first and avoid unnecessary borrowing."
  }
];

const FinancialTips = ({ maxTips = 1, inWelcomeSection = false }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Ensure we don't show more than one tip in wallet overview
  const actualMaxTips = Math.min(maxTips, 1);

  // Rotate through tips every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % FINANCIAL_TIPS.length);
        setFadeIn(true);
      }, 500); // Wait for fade-out animation before changing tip
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Handle manual navigation between tips
  const handlePreviousTip = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentTipIndex((prevIndex) => 
        prevIndex === 0 ? FINANCIAL_TIPS.length - 1 : prevIndex - 1
      );
      setFadeIn(true);
    }, 500);
  };

  const handleNextTip = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % FINANCIAL_TIPS.length);
      setFadeIn(true);
    }, 500);
  };

  // Select tips to display (current and next)
  const tipsToShow = [];
  for (let i = 0; i < actualMaxTips; i++) {
    const index = (currentTipIndex + i) % FINANCIAL_TIPS.length;
    tipsToShow.push(FINANCIAL_TIPS[index]);
  }

  return (
    <Box className={`${styles.tipsContainer} ${inWelcomeSection ? styles.welcomeTipsContainer : ''}`}>
      <Typography variant="h6" className={styles.tipsTitle}>
        <LightbulbIcon className={styles.tipIcon} />
        Financial Tips
        
        {/* Only show current tip indicator when in welcome section */}
        {inWelcomeSection && (
          <Typography 
            variant="caption" 
            sx={{ ml: 'auto', color: 'text.secondary', display: 'flex', alignItems: 'center' }}
          >
            Tip {currentTipIndex + 1} of {FINANCIAL_TIPS.length}
          </Typography>
        )}
      </Typography>
      
      {tipsToShow.map((tip, index) => (
        <Fade key={`${currentTipIndex + index}`} in={fadeIn} timeout={{ enter: 800, exit: 500 }}>
          <Paper 
            elevation={inWelcomeSection ? 1 : 0} 
            className={`${styles.tipCard} ${inWelcomeSection ? styles.welcomeTipCard : ''}`}
          >
            <Box className={styles.iconContainer}>
              {tip.icon}
            </Box>
            <Box className={styles.tipContent}>
              <Typography variant="subtitle1" className={styles.tipTitle}>
                {tip.title}
              </Typography>
              <Typography variant="body2" className={styles.tipText}>
                {tip.content}
              </Typography>
            </Box>
          </Paper>
        </Fade>
      ))}
      
      {/* Navigation controls - only show in welcome section */}
      {inWelcomeSection && (
        <Box className={styles.tipControls}>
          <IconButton 
            size="small"
            onClick={handlePreviousTip}
            aria-label="Previous tip"
            className={styles.tipNavButton}
          >
            <NavigateBeforeIcon fontSize="small" />
          </IconButton>
          
          {/* Progress indicator dots */}
          <Box className={styles.tipNavDots}>
            {FINANCIAL_TIPS.map((_, index) => (
              <Box
                key={index}
                className={`${styles.tipNavDot} ${currentTipIndex === index ? styles.activeTipDot : ''}`}
                onClick={() => {
                  if (index !== currentTipIndex) {
                    setFadeIn(false);
                    setTimeout(() => {
                      setCurrentTipIndex(index);
                      setFadeIn(true);
                    }, 500);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Go to tip ${index + 1}`}
              />
            ))}
          </Box>
          
          <IconButton 
            size="small"
            onClick={handleNextTip}
            aria-label="Next tip"
            className={styles.tipNavButton}
          >
            <NavigateNextIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default FinancialTips; 