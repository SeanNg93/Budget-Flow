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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import styles from '../../styles/financeChart.module.css';
import FinanceService from '../../services/FinanceService';

// Time range configuration
const TIME_RANGES = [
  { value: 'year', label: 'Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' }
];

// Chart summary item component
const SummaryItem = React.memo(({ label, value, color, onClick, isMockMode }) => (
  <Box 
    className={styles.summaryItem} 
    onClick={onClick}
    sx={{ 
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      ...(isMockMode && {
        '&::after': {
          content: '"DEMO"',
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          fontSize: '9px',
          backgroundColor: 'primary.main',
          color: 'white',
          padding: '2px 4px',
          borderRadius: '4px',
          opacity: 0.8
        }
      })
    }}
    aria-label={label}
    role={onClick ? "button" : undefined}
  >
    <Typography className={styles.summaryLabel}>{label}</Typography>
    <Typography className={styles.summaryValue} color={color}>{value}</Typography>
  </Box>
));

// Chart content state component
const ChartContent = React.memo(({ loading, renderError, chartData, onRetry, formatCurrency }) => {
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
          Unable to render chart. Please try again later.
        </Typography>
        <Box mt={2}>
          <Button 
            variant="outlined"
            color="primary"
            onClick={onRetry}
            aria-label="Retry loading chart"
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <Box className={styles.loadingContainer} sx={{ bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
        <Typography color="textSecondary" align="center">
          No financial data available for this time period.
        </Typography>
        <Typography color="textSecondary" align="center" variant="body2" sx={{ mt: 1 }}>
          Add transactions to see your financial performance chart.
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
        <Bar dataKey="income" name="Income" fill="#4caf50" />
        <Bar dataKey="expenses" name="Expenses" fill="#f44336" />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Time range navigation component
const TimeRangeNavigation = React.memo(({ 
  timeRangeIndex, 
  handleTimeRangeChange 
}) => (
  <Box className={styles.timeRangeControls}>
    <IconButton 
      onClick={() => handleTimeRangeChange('prev')}
      disabled={timeRangeIndex >= TIME_RANGES.length - 1}
      size="small"
      className={styles.navButton}
      aria-label="Previous time range"
    >
      <NavigateBeforeIcon fontSize="small" />
    </IconButton>

    <Typography 
      variant="subtitle2" 
      className={styles.timeRangeLabel}
    >
      {TIME_RANGES[timeRangeIndex].label}
    </Typography>
    
    <IconButton 
      onClick={() => handleTimeRangeChange('next')}
      disabled={timeRangeIndex <= 0}
      size="small"
      className={styles.navButton}
      aria-label="Next time range"
    >
      <NavigateNextIcon fontSize="small" />
    </IconButton>
  </Box>
));

const FinanceChart = () => {
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
  const [incomeLabelClicks, setIncomeLabelClicks] = useState(0);
  const [mockDataMode, setMockDataMode] = useState(false);

  // Derived state with useMemo
  const timeRange = useMemo(() => TIME_RANGES[timeRangeIndex].value, [timeRangeIndex]);

  // Format currency function memoized
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Data fetching with useCallback
  const fetchChartData = useCallback(async () => {
    setLoading(true);
    
    try {
      if (mockDataMode) {
        // Use mock data if in mock mode
        const mockData = generateMockData();
        setChartData(mockData.chartData);
        setSummaryData(mockData.summaryData);
      } else {
        // Use the service method to fetch chart data
        const response = await FinanceService.getFinancialDataByDateRange(startDate, endDate);
        
        if (response.data?.chartData?.length > 0) {
          // Use real data if available
          setChartData(response.data.chartData);
          setSummaryData(response.data.summaryData);
        } else {
          // Show empty chart when no data exists
          setChartData([]);
          setSummaryData({
            totalIncome: 0,
            totalExpenses: 0,
            netSavings: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      if (mockDataMode) {
        // Use mock data on error if in mock mode
        const mockData = generateMockData();
        setChartData(mockData.chartData);
        setSummaryData(mockData.summaryData);
      } else {
        // Reset to empty state on error
        setChartData([]);
        setSummaryData({
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        });
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mockDataMode]);

  // Mock data generator (memoized for performance)
  const generateMockData = useCallback(() => {
    const mockData = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    
    const mockDataConfig = {
      week: {
        count: 7,
        labelFormatter: (i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return format(date, 'EEE');
        },
        valueRange: { income: [100, 500], expenses: [50, 300] }
      },
      month: {
        count: 4,
        labelFormatter: (i) => `Week ${i + 1}`,
        valueRange: { income: [500, 2000], expenses: [300, 1500] }
      },
      quarter: {
        count: 3,
        labelFormatter: (i) => `Month ${i + 1}`,
        valueRange: { income: [1000, 5000], expenses: [800, 4000] }
      },
      year: {
        count: 12,
        labelFormatter: (i) => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[i];
        },
        valueRange: { income: [2000, 8000], expenses: [1500, 6000] }
      }
    };
    
    const config = mockDataConfig[timeRange];
    
    for (let i = 0; i < config.count; i++) {
      const income = Math.floor(Math.random() * 
        (config.valueRange.income[1] - config.valueRange.income[0])) + config.valueRange.income[0];
      const expenses = Math.floor(Math.random() * 
        (config.valueRange.expenses[1] - config.valueRange.expenses[0])) + config.valueRange.expenses[0];
      
      totalIncome += income;
      totalExpenses += expenses;
      
      mockData.push({
        name: config.labelFormatter(i),
        income: income,
        expenses: expenses
      });
    }
    
    return {
      chartData: mockData,
      summaryData: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses
      }
    };
  }, [timeRange, startDate]);

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

  // Utility functions with useCallback
  const exportToExcel = useCallback(() => {
    alert('Export to Excel functionality would be implemented here');
  }, []);

  // Secret feature handler with useCallback
  const handleIncomeLabelClick = useCallback(() => {
    if (mockDataMode) {
      // Turn off mock mode
      setMockDataMode(false);
      setIncomeLabelClicks(0);
      fetchChartData();
    } else {
      // Increment click counter
      const newClickCount = incomeLabelClicks + 1;
      setIncomeLabelClicks(newClickCount);
      
      // Activate mock mode after 5 clicks
      if (newClickCount >= 5) {
        setMockDataMode(true);
        fetchChartData();
      }
    }
  }, [mockDataMode, incomeLabelClicks, fetchChartData]);

  const handleRetry = useCallback(() => {
    setRenderError(false);
    fetchChartData();
  }, [fetchChartData]);

  // Set time range and fetch data with useEffect
  useEffect(() => {
    fetchChartData();
  }, [timeRange, startDate, endDate, fetchChartData]);

  // Memoized summary items rendering
  const renderSummaryItems = useMemo(() => (
    <Box className={styles.summaryContainer}>
      <SummaryItem 
        label="Total Income"
        value={formatCurrency(summaryData.totalIncome)}
        color="primary"
        onClick={handleIncomeLabelClick}
        isMockMode={mockDataMode}
      />
      
      <SummaryItem 
        label="Total Expenses"
        value={formatCurrency(summaryData.totalExpenses)}
        color="error"
      />
      
      <SummaryItem 
        label="Net Savings"
        value={formatCurrency(summaryData.netSavings)}
        color={summaryData.netSavings >= 0 ? "success" : "error"}
      />
    </Box>
  ), [summaryData, formatCurrency, handleIncomeLabelClick, mockDataMode]);

  return (
    <Card className={styles.chartCard}>
      <CardHeader
        title="Financial performance chart"
        action={
          <Box className={styles.headerControls}>
            <TimeRangeNavigation 
              timeRangeIndex={timeRangeIndex}
              handleTimeRangeChange={handleTimeRangeChange}
            />
            
            <IconButton 
              onClick={exportToExcel} 
              title="Export to Excel"
              size="small"
              className={styles.exportButton}
              aria-label="Export to Excel"
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
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