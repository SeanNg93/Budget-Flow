import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { 
  TrendingDown as ExpenseIcon, 
  TrendingUp as IncomeIcon, 
  AccountBalance as SavingsIcon 
} from '@mui/icons-material';
import styles from '../../styles/transactions.module.css';
import { useTranslation } from 'react-i18next';

/**
 * TransactionSummaryCards component displays financial summary metrics 
 * (total expense, income, and net savings) based on filtered transactions
 */
const TransactionSummaryCards = ({ 
  totalExpense, 
  totalIncome, 
  netSavings,
  formatCurrency,
  currency = 'USD' 
}) => {
  const { t } = useTranslation();

  // Helper to determine if a value is positive, negative, or zero
  const getAmountClass = (amount) => {
    if (amount > 0) return styles.positiveAmount;
    if (amount < 0) return styles.negativeAmount;
    return styles.neutralAmount;
  };

  return (
    <Grid container spacing={2} className={styles.summaryCardsContainer}>
      {/* Expense Card */}
      <Grid item xs={12} sm={4}>
        <Paper className={`${styles.summaryCard} ${styles.expenseCard}`} elevation={1}>
          <Box className={styles.cardContent}>
            <Box className={styles.iconContainer}>
              <ExpenseIcon className={`${styles.cardIcon} ${styles.expenseIcon}`} />
            </Box>
            <Box className={styles.cardTextContent}>
              <Typography variant="body2" className={styles.cardLabel}>
                {t('transaction.expense', 'Total Expense')}
              </Typography>
              <Typography 
                variant="h5" 
                className={`${styles.cardAmount} ${styles.expenseAmount}`}
              >
                {formatCurrency(totalExpense, currency)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Income Card */}
      <Grid item xs={12} sm={4}>
        <Paper className={`${styles.summaryCard} ${styles.incomeCard}`} elevation={1}>
          <Box className={styles.cardContent}>
            <Box className={styles.iconContainer}>
              <IncomeIcon className={`${styles.cardIcon} ${styles.incomeIcon}`} />
            </Box>
            <Box className={styles.cardTextContent}>
              <Typography variant="body2" className={styles.cardLabel}>
                {t('transaction.income', 'Total Income')}
              </Typography>
              <Typography 
                variant="h5" 
                className={`${styles.cardAmount} ${styles.incomeAmount}`}
              >
                {formatCurrency(totalIncome, currency)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Net Savings Card */}
      <Grid item xs={12} sm={4}>
        <Paper className={`${styles.summaryCard} ${styles.savingsCard}`} elevation={1}>
          <Box className={styles.cardContent}>
            <Box className={styles.iconContainer}>
              <SavingsIcon className={`${styles.cardIcon} ${styles.savingsIcon}`} />
            </Box>
            <Box className={styles.cardTextContent}>
              <Typography variant="body2" className={styles.cardLabel}>
                {t('wallet.netSavings', 'Net Savings')}
              </Typography>
              <Typography 
                variant="h5" 
                className={`${styles.cardAmount} ${getAmountClass(netSavings)}`}
              >
                {formatCurrency(netSavings, currency)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TransactionSummaryCards; 