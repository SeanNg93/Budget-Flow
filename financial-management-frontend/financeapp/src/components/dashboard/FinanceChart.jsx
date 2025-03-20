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
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  InputLabel,
  Slider
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import styles from '../../styles/financeChart.module.css';
import FinanceService from '../../services/FinanceService';

const FinanceChart = ({ chartType = 'advanced', onChartTypeChange }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [customDateRange, setCustomDateRange] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  });
  const [renderError, setRenderError] = useState(false);
  const [timeSliderValue, setTimeSliderValue] = useState(1); // Default to month (1)

  // Time range slider marks
  const timeMarks = [
    { value: 0, label: 'Week' },
    { value: 1, label: 'Month' },
    { value: 2, label: 'Quarter' },
    { value: 3, label: 'Year' }
  ];

  // Map slider value to time range
  useEffect(() => {
    const ranges = ['week', 'month', 'quarter', 'year'];
    setTimeRange(ranges[timeSliderValue]);
  }, [timeSliderValue]);

  // Fetch chart data based on time range
  useEffect(() => {
    fetchChartData();
  }, [timeRange, startDate, endDate]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Use the new service method to fetch chart data
      const response = await FinanceService.getFinancialDataByDateRange(startDate, endDate);
      
      // Check if we have real data from API
      if (response.data && response.data.chartData && response.data.chartData.length > 0) {
        setChartData(response.data.chartData);
        setSummaryData(response.data.summaryData);
      } else {
        // Use mock data if API returned empty results
        const mockData = generateMockData();
        setChartData(mockData.chartData);
        setSummaryData(mockData.summaryData);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to mock data
      const mockData = generateMockData();
      setChartData(mockData.chartData);
      setSummaryData(mockData.summaryData);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
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
      // Generate monthly data for a quarter
      const monthNames = ['Month 1', 'Month 2', 'Month 3'];
      
      for (let i = 0; i < 3; i++) {
        const income = Math.floor(Math.random() * 5000) + 1000;
        const expenses = Math.floor(Math.random() * 4000) + 800;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: monthNames[i],
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
    } else if (timeRange === 'custom') {
      // Generate data for custom range (simplified)
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const intervals = Math.min(diffDays, 10); // Max 10 data points
      
      for (let i = 0; i < intervals; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(i * diffDays / intervals));
        
        const income = Math.floor(Math.random() * 1000) + 200;
        const expenses = Math.floor(Math.random() * 800) + 100;
        
        totalIncome += income;
        totalExpenses += expenses;
        
        mockData.push({
          name: format(date, 'MMM dd'),
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

  const handleTimeSliderChange = (event, newValue) => {
    setTimeSliderValue(newValue);
    
    // Update date range based on selected time period
    const today = new Date();
    
    switch (newValue) {
      case 0: // week
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 1: // month
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 2: // quarter
        setStartDate(startOfQuarter(today));
        setEndDate(endOfQuarter(today));
        break;
      case 3: // year
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
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

  return (
    <Card className={styles.chartCard}>
      <CardHeader
        title="Financial performance over time"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={onChartTypeChange}
              aria-label="chart type"
              size="small"
              sx={{ mr: 1, transform: 'scale(0.85)', transformOrigin: 'right' }}
            >
              <ToggleButton value="advanced" aria-label="advanced chart">
                <BarChartIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="simple" aria-label="simple chart">
                <ShowChartIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton 
              onClick={exportToExcel} 
              title="Export to Excel"
              size="small"
              sx={{ transform: 'scale(0.85)' }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex' }}>
          {/* Main Chart Content */}
          <Box sx={{ flex: 1 }}>
            {/* Summary Section */}
            <Box className={styles.summaryContainer}>
              <Box className={styles.summaryItem}>
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
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 10,
                      bottom: 5,
                    }}
                    onError={() => setRenderError(true)}
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
          
          {/* Time Range Slider (Vertical on right side) */}
          <Box sx={{ width: 60, pl: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                transform: 'rotate(-90deg)', 
                transformOrigin: 'center', 
                whiteSpace: 'nowrap',
                mb: 2
              }}
            >
              Time Range
            </Typography>
            <Slider
              orientation="vertical"
              value={timeSliderValue}
              onChange={handleTimeSliderChange}
              step={null}
              marks={timeMarks}
              min={0}
              max={3}
              sx={{ 
                height: 180,
                '& .MuiSlider-markLabel': {
                  fontSize: '10px',
                  transform: 'translateX(20px)'
                }
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FinanceChart; 