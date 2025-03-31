import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Fade, IconButton } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/financialTips.module.css';

const getIconComponent = (tipKey) => {
  switch (tipKey) {
    case 'emergencyFund':
    case 'diversifyInvestments':
      return <SavingsIcon />;
    case 'fiftyThirtyTwenty':
    case 'reviewGoals':
      return <AccountBalanceIcon />;
    case 'payYourselfFirst':
    case 'minimizeDebt':
      return <TipsAndUpdatesIcon />;
    case 'trackSpending':
      return <AutoGraphIcon />;
    case 'automateFinances':
      return <LightbulbIcon />;
    default:
      return <LightbulbIcon />;
  }
};

const FinancialTips = ({ maxTips = 1, inWelcomeSection = false }) => {
  const { t } = useTranslation();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Get tips from translation file
  const tipKeys = [
    'emergencyFund',
    'fiftyThirtyTwenty',
    'payYourselfFirst',
    'trackSpending',
    'automateFinances',
    'diversifyInvestments',
    'reviewGoals',
    'minimizeDebt'
  ];

  // Create tips array from translations
  const FINANCIAL_TIPS = tipKeys.map(key => ({
    key,
    icon: getIconComponent(key),
    title: t(`financialTips.${key}.title`),
    content: t(`financialTips.${key}.content`)
  }));

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
  }, [FINANCIAL_TIPS.length]);

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
        {t('financialTips.title')}
        
        {/* Only show current tip indicator when in welcome section */}
        {inWelcomeSection && (
          <Typography 
            variant="caption" 
            sx={{ ml: 'auto', color: 'text.secondary', display: 'flex', alignItems: 'center' }}
          >
            {t('financialTips.tipCounter', { current: currentTipIndex + 1, total: FINANCIAL_TIPS.length })}
          </Typography>
        )}
      </Typography>
      
      <Box className={styles.tipsContent}>
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
      </Box>
      
      {/* Navigation controls - only show in welcome section */}
      {inWelcomeSection && (
        <Box className={styles.tipControls}>
          <IconButton 
            size="small"
            onClick={handlePreviousTip}
            aria-label={t('financialTips.previousTip')}
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
                aria-label={t('financialTips.goToTip', { number: index + 1 })}
                aria-current={currentTipIndex === index ? 'true' : undefined}
              />
            ))}
          </Box>
          
          <IconButton 
            size="small"
            onClick={handleNextTip}
            aria-label={t('financialTips.nextTip')}
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