import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import styles from '../../styles/financeChart.module.css';
import FinanceService from '../../services/FinanceService';
import { useTranslation } from 'react-i18next';

// Time range configuration
const TIME_RANGES = [
  { value: 'year', label: 'Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' }
];

// Chart summary item component - Removed onClick and isMockMode handling
const SummaryItem = React.memo(({ label, value, color }) => (
  <Box
    className={styles.summaryItem}
    sx={{ cursor: 'default' }} // Always default cursor
    aria-label={label}
  >
    <Typography className={styles.summaryLabel}>{label}</Typography>
    <Typography className={styles.summaryValue} color={color}>{value}</Typography>
  </Box>
));

// Chart content state component
const ChartContent = React.memo(({ loading, renderError, chartData, onRetry, formatCurrency }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress aria-label="Loading chart data" />
      </Box>
    );
  }

  if (renderError) {
    return (
      <Box className={styles.errorContainer}>
        <Typography color="error" align="center">
          {t('common.error', 'Unable to render chart. Please try again later.')}
        </Typography>
        <Box mt={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={onRetry}
            aria-label="Retry loading chart"
          >
            {t('common.retry', 'Retry')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box className={styles.loadingContainer} sx={{ bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
        <Typography color="textSecondary" align="center">
          {t('chart.noData', 'No financial data available for this time period.')}
        </Typography>
        <Typography color="textSecondary" align="center" variant="body2" sx={{ mt: 1 }}>
          {t('chart.addTransactionsToSee', 'Add transactions to see your financial performance chart.')}
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: -10,
          bottom: 5,
        }}
        barSize={40}
        barGap={5}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Bar dataKey="income" name={t('transaction.income', 'Income')} fill="#4caf50" />
        <Bar dataKey="expenses" name={t('transaction.expense', 'Expenses')} fill="#f44336" />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Time range navigation component
const TimeRangeNavigation = React.memo(({
  timeRangeIndex,
  handleTimeRangeChange
}) => {
  const { t } = useTranslation();
  
  return (
    <Box className={styles.timeRangeControls}>
      <IconButton
        onClick={() => handleTimeRangeChange('prev')}
        disabled={timeRangeIndex >= TIME_RANGES.length - 1}
        size="small"
        className={styles.navButton}
        aria-label={t('chart.previousTimeRange', 'Previous time range')}
      >
        <NavigateBeforeIcon fontSize="small" />
      </IconButton>

      <Typography
        variant="subtitle2"
        className={styles.timeRangeLabel}
      >
        {t(`chart.timeRanges.${TIME_RANGES[timeRangeIndex].value}`, TIME_RANGES[timeRangeIndex].label)}
      </Typography>

      <IconButton
        onClick={() => handleTimeRangeChange('next')}
        disabled={timeRangeIndex <= 0}
        size="small"
        className={styles.navButton}
        aria-label={t('chart.nextTimeRange', 'Next time range')}
      >
        <NavigateNextIcon fontSize="small" />
      </IconButton>
    </Box>
  );
});

// Accept refreshKey prop
const FinanceChart = ({ refreshKey }) => {
  const { t } = useTranslation();
  // State management
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRangeIndex, setTimeRangeIndex] = useState(3); // Default to week (3)
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  });
  const [renderError, setRenderError] = useState(false);
  // Removed mockDataMode and incomeLabelClicks state

  // Derived state with useMemo
  const timeRange = useMemo(() => TIME_RANGES[timeRangeIndex].value, [timeRangeIndex]);

  // Format currency function memoized
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Data fetching with useCallback - Removed mock data logic
  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setRenderError(false); // Reset error state on fetch

    try {
      // Always use the service method to fetch chart data
      const response = await FinanceService.getFinancialDataByDateRange(startDate, endDate);

      if (response.data?.chartData) { // Check if chartData exists
        setChartData(response.data.chartData);
        setSummaryData(response.data.summaryData || { totalIncome: 0, totalExpenses: 0, netSavings: 0 });
      } else {
        // Show empty chart if chartData is missing or empty
        setChartData([]);
        setSummaryData({
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setRenderError(true); // Set error state
      setChartData([]);
      setSummaryData({
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]); // Removed generateMockData dependency

  // Removed generateMockData function

  // Update date range based on time range with useCallback
  const updateDateRangeForTimeRange = useCallback((index) => {
    const today = new Date();

    const dateRangeUpdaters = [
      // year
      () => {
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
      },
      // quarter
      () => {
        setStartDate(startOfQuarter(today));
        setEndDate(endOfQuarter(today));
      },
      // month
      () => {
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
      },
      // week
      () => {
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
      }
    ];

    if (index >= 0 && index < dateRangeUpdaters.length) {
      dateRangeUpdaters[index]();
    }
  }, []);

  // Navigation handlers with useCallback
  const handleTimeRangeChange = useCallback((direction) => {
    let newIndex;
    if (direction === 'next' && timeRangeIndex > 0) {
      newIndex = timeRangeIndex - 1;
    } else if (direction === 'prev' && timeRangeIndex < TIME_RANGES.length - 1) {
      newIndex = timeRangeIndex + 1;
    } else {
      return;
    }

    setTimeRangeIndex(newIndex);
    updateDateRangeForTimeRange(newIndex);
  }, [timeRangeIndex, updateDateRangeForTimeRange]);

  // Removed handleIncomeLabelClick function

  const handleRetry = useCallback(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Fetch data when time range, dates, or refreshKey changes
  useEffect(() => {
    fetchChartData();
  // Added refreshKey to dependency array
  }, [timeRange, startDate, endDate, fetchChartData, refreshKey]);

  // Memoized summary items rendering - Removed onClick and isMockMode from Total Income
  const renderSummaryItems = useMemo(() => (
    <Box className={styles.summaryContainer}>
      <SummaryItem
        label={t('chart.totalIncome', 'Total Income')}
        value={formatCurrency(summaryData.totalIncome)}
        color="#4caf50"
      />

      <SummaryItem
        label={t('chart.totalExpenses', 'Total Expenses')}
        value={formatCurrency(summaryData.totalExpenses)}
        color="#f44336"
      />

      <SummaryItem
        label={t('chart.netSavings', 'Net Savings')}
        value={formatCurrency(summaryData.netSavings)}
        color={summaryData.netSavings >= 0 ? "success" : "error"}
      />
    </Box>
  // Removed handleIncomeLabelClick and mockDataMode dependencies
  ), [summaryData, formatCurrency, t]);

  return (
    <Card className={styles.chartCard}>
      <CardHeader
        title={t('chart.financialPerformance', 'Financial performance chart')}
        action={
          <Box className={styles.headerControls}>
            <TimeRangeNavigation
              timeRangeIndex={timeRangeIndex}
              handleTimeRangeChange={handleTimeRangeChange}
            />
          </Box>
        }
      />

      <Divider />

      <CardContent>
        <Box className={styles.chartContentWrapper}>
          {/* Summary Section */}
          {renderSummaryItems}

          {/* Chart */}
          <Box className={styles.chartContainer}>
            <ChartContent
              loading={loading}
              renderError={renderError}
              chartData={chartData}
              onRetry={handleRetry}
              formatCurrency={formatCurrency}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FinanceChart;
