import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
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

const FinancialTips = ({ maxTips = 1 }) => {
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

  // Select tips to display (current and next)
  const tipsToShow = [];
  for (let i = 0; i < actualMaxTips; i++) {
    const index = (currentTipIndex + i) % FINANCIAL_TIPS.length;
    tipsToShow.push(FINANCIAL_TIPS[index]);
  }

  return (
    <Box className={styles.tipsContainer}>
      <Typography variant="h6" className={styles.tipsTitle}>
        <LightbulbIcon className={styles.tipIcon} />
        Financial Tips
      </Typography>
      
      {tipsToShow.map((tip, index) => (
        <Fade key={`${currentTipIndex + index}`} in={fadeIn} timeout={{ enter: 800, exit: 500 }}>
          <Paper elevation={0} className={styles.tipCard}>
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
  );
};

export default FinancialTips; 