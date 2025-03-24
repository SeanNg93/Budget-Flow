import React, { useState, useEffect } from 'react';
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
  Grid,
  Divider,
  CircularProgress,
  ButtonGroup
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import styles from '../../styles/financeChart.module.css';
import FinanceService from '../../services/FinanceService';

const FinanceChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  });
  const [renderError, setRenderError] = useState(false);
  const [timeRangeIndex, setTimeRangeIndex] = useState(3); // Default to week (3)
  const [incomeLabelClicks, setIncomeLabelClicks] = useState(0);
  const [mockDataMode, setMockDataMode] = useState(false);

  // Time range options
  const timeRangeOptions = [
    { value: 'year', label: 'Year' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' }
  ];

  // Set time range based on index
  useEffect(() => {
    setTimeRange(timeRangeOptions[timeRangeIndex].value);
  }, [timeRangeIndex]);

  // Fetch chart data based on time range
  useEffect(() => {
    fetchChartData();
  }, [timeRange, startDate, endDate]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Use the new service method to fetch chart data
      const response = await FinanceService.getFinancialDataByDateRange(startDate, endDate);
      
      // If mock data mode is active, use mock data
      if (mockDataMode) {
        const mockData = generateMockData();
        setChartData(mockData.chartData);
        setSummaryData(mockData.summaryData);
      } 
      // Otherwise use real data
      else if (response.data && response.data.chartData && response.data.chartData.length > 0) {
        setChartData(response.data.chartData);
        setSummaryData(response.data.summaryData);
      } else {
        // Show empty chart when no real data exists
        setChartData([]);
        setSummaryData({
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      // If mock data mode is active, use mock data even on error
      if (mockDataMode) {
        const mockData = generateMockData();
        setChartData(mockData.chartData);
        setSummaryData(mockData.summaryData);
      } else {
        // Show empty chart instead of mock data on error
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
  };

  const generateMockData = () => {
    // This function is kept for reference but is no longer used in production
    // Generate realistic mock data based on selected time range
    const mockData = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    
    if (timeRange === 'week') {
      // Generate daily data for a week
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayLabel = format(date, 'EEE');
        
        const income = Math.floor(Math.random() * 500) + 100;
        const expenses = Math.floor(Math.random() * 300) + 50;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: dayLabel,
          income: income,
          expenses: expenses
        });
      }
    } else if (timeRange === 'month') {
      // Generate weekly data for a month
      for (let i = 0; i < 4; i++) {
        const income = Math.floor(Math.random() * 2000) + 500;
        const expenses = Math.floor(Math.random() * 1500) + 300;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: `Week ${i + 1}`,
          income: income,
          expenses: expenses
        });
      }
    } else if (timeRange === 'quarter') {
      // Generate quarterly data (4 quarters)
      const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      for (let i = 0; i < 4; i++) {
        const income = Math.floor(Math.random() * 5000) + 1000;
        const expenses = Math.floor(Math.random() * 4000) + 800;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: quarterNames[i],
          income: income,
          expenses: expenses
        });
      }
    } else if (timeRange === 'year') {
      // Generate monthly data for a year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 12; i++) {
        const income = Math.floor(Math.random() * 8000) + 2000;
        const expenses = Math.floor(Math.random() * 6000) + 1500;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: monthNames[i],
          income: income,
          expenses: expenses
        });
      }
    }
    
    return {
      chartData: mockData,
      summaryData: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses
      }
    };
  };

  const handlePreviousTimeRange = () => {
    if (timeRangeIndex < timeRangeOptions.length - 1) {
      const newIndex = timeRangeIndex + 1;
      setTimeRangeIndex(newIndex);
      updateDateRangeForTimeRange(newIndex);
    }
  };

  const handleNextTimeRange = () => {
    if (timeRangeIndex > 0) {
      const newIndex = timeRangeIndex - 1;
      setTimeRangeIndex(newIndex);
      updateDateRangeForTimeRange(newIndex);
    }
  };

  const updateDateRangeForTimeRange = (index) => {
    const today = new Date();
    
    switch (index) {
      case 0: // year
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
        break;
      case 1: // quarter
        setStartDate(startOfQuarter(today));
        setEndDate(endOfQuarter(today));
        break;
      case 2: // month
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 3: // week
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      default:
        // Keep current dates for custom
        break;
    }
  };

  const exportToExcel = () => {
    // In a real implementation, this would generate and download an Excel file
    alert('Export to Excel functionality would be implemented here');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle clicks on the income label (secret feature)
  const handleIncomeLabelClick = () => {
    if (mockDataMode) {
      // If already in mock mode, turn it off and reset clicks
      setMockDataMode(false);
      setIncomeLabelClicks(0);
      fetchChartData(); // Refresh with real data
    } else {
      // Count clicks
      const newClickCount = incomeLabelClicks + 1;
      setIncomeLabelClicks(newClickCount);
      
      // If clicked 5 times, activate mock data mode
      if (newClickCount >= 5) {
        setMockDataMode(true);
        fetchChartData(); // Refresh with mock data
      }
    }
  };

  return (
    <Card className={styles.chartCard}>
      <CardHeader
        title="Financial performance chart"
        action={
          <Box className={styles.headerControls}>
            <Box className={styles.timeRangeControls}>
              <IconButton 
                onClick={handlePreviousTimeRange} 
                disabled={timeRangeIndex >= timeRangeOptions.length - 1}
                size="small"
                className={styles.navButton}
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>

              <Typography 
                variant="subtitle2" 
                className={styles.timeRangeLabel}
              >
                {timeRangeOptions[timeRangeIndex].label}
              </Typography>
              
              <IconButton 
                onClick={handleNextTimeRange} 
                disabled={timeRangeIndex <= 0}
                size="small"
                className={styles.navButton}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <IconButton 
              onClick={exportToExcel} 
              title="Export to Excel"
              size="small"
              className={styles.exportButton}
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
          <Box className={styles.summaryContainer}>
            <Box 
              className={styles.summaryItem} 
              onClick={handleIncomeLabelClick}
              sx={{ 
                cursor: 'pointer',
                position: 'relative',
                ...(mockDataMode && {
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
            >
              <Typography className={styles.summaryLabel}>Total Income</Typography>
              <Typography className={styles.summaryValue} color="primary">{formatCurrency(summaryData.totalIncome)}</Typography>
            </Box>
            <Box className={styles.summaryItem}>
              <Typography className={styles.summaryLabel}>Total Expenses</Typography>
              <Typography className={styles.summaryValue} color="error">{formatCurrency(summaryData.totalExpenses)}</Typography>
            </Box>
            <Box className={styles.summaryItem}>
              <Typography className={styles.summaryLabel}>Net Savings</Typography>
              <Typography 
                className={styles.summaryValue}
                color={summaryData.netSavings >= 0 ? "success" : "error"}
              >
                {formatCurrency(summaryData.netSavings)}
              </Typography>
            </Box>
          </Box>
          
          {/* Chart */}
          <Box className={styles.chartContainer}>
            {loading ? (
              <Box className={styles.loadingContainer}>
                <CircularProgress />
              </Box>
            ) : renderError ? (
              <Box className={styles.errorContainer}>
                <Typography color="error" align="center">
                  Unable to render chart. Please try again later.
                </Typography>
                <Box mt={2}>
                  <Button 
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setRenderError(false);
                      fetchChartData();
                    }}
                  >
                    Retry
                  </Button>
                </Box>
              </Box>
            ) : chartData.length === 0 ? (
              <Box className={styles.loadingContainer} sx={{ bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
                <Typography color="textSecondary" align="center">
                  No financial data available for this time period.
                </Typography>
                <Typography color="textSecondary" align="center" variant="body2" sx={{ mt: 1 }}>
                  Add transactions to see your financial performance chart.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: -10,
                    bottom: 5,
                  }}
                  onError={() => setRenderError(true)}
                  barSize={timeRange === 'quarter' ? 30 : 40}
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
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FinanceChart; 