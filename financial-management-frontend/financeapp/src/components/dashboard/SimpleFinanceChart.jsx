import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import styles from '../../styles/financeChart.module.css';
import FinanceService from '../../services/FinanceService';

const SimpleFinanceChart = ({ chartType = 'simple', onChartTypeChange }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [customDateRange, setCustomDateRange] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  });

  // Fetch chart data based on time range
  useEffect(() => {
    fetchChartData();
  }, [timeRange, startDate, endDate, selectedCategory]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Replace with actual service call when API is available
      const response = await FinanceService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use placeholder data for now
      setCategories([
        { id: 'food', name: 'Food' },
        { id: 'transportation', name: 'Transportation' },
        { id: 'housing', name: 'Housing' },
        { id: 'entertainment', name: 'Entertainment' },
        { id: 'utilities', name: 'Utilities' }
      ]);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Use the service method to fetch chart data
      const response = await FinanceService.getFinancialDataByDateRange(startDate, endDate, selectedCategory);
      
      // Check if we have real data from API
      if (response.data && 
          ((response.data.chartData && response.data.chartData.length > 0) || 
           (response.data.data && response.data.data.length > 0))) {
        
        // Handle different possible response formats
        let processedChartData = [];
        let processedSummaryData = { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
        
        // Format 1: { chartData: [...], summaryData: {...} }
        if (response.data.chartData) {
          processedChartData = response.data.chartData.map(item => ({
            name: item.period || item.name,
            income: parseFloat(item.income) || 0,
            expenses: parseFloat(item.expenses) || 0
          }));
          
          if (response.data.summaryData) {
            processedSummaryData = {
              totalIncome: parseFloat(response.data.summaryData.totalIncome) || 0,
              totalExpenses: parseFloat(response.data.summaryData.totalExpenses) || 0,
              netSavings: parseFloat(response.data.summaryData.netSavings) || 0
            };
          }
        }
        // Format 2: { data: [...], summary: {...} }
        else if (response.data.data) {
          processedChartData = response.data.data.map(item => ({
            name: item.period || item.name,
            income: parseFloat(item.income) || 0,
            expenses: parseFloat(item.expenses) || 0
          }));
          
          if (response.data.summary) {
            processedSummaryData = {
              totalIncome: parseFloat(response.data.summary.totalIncome) || 0,
              totalExpenses: parseFloat(response.data.summary.totalExpenses) || 0,
              netSavings: parseFloat(response.data.summary.netSavings) || 0
            };
          }
        }
        
        setChartData(processedChartData);
        setSummaryData(processedSummaryData);
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

  const handleTimeRangeChange = (event) => {
    const newTimeRange = event.target.value;
    setTimeRange(newTimeRange);
    setCustomDateRange(newTimeRange === 'custom');
    
    // Update date range based on selected time period
    const today = new Date();
    
    switch (newTimeRange) {
      case 'week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'year':
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
        break;
      default:
        // Keep current dates for custom
        break;
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
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

  // Find the maximum value to scale the chart
  const getMaxValue = () => {
    if (!chartData || chartData.length === 0) return 0;
    
    return Math.max(
      ...chartData.map(item => Math.max(item.income, item.expenses))
    );
  };

  const maxValue = getMaxValue();

  return (
    <Card className={styles.chartCard}>
      <CardHeader
        title="Income vs Expenses"
        subheader="Financial performance over time"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={onChartTypeChange}
              aria-label="chart type"
              size="small"
              sx={{ mr: 1 }}
            >
              <ToggleButton value="advanced" aria-label="advanced chart">
                <BarChartIcon />
              </ToggleButton>
              <ToggleButton value="simple" aria-label="simple chart">
                <ShowChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={exportToExcel} title="Export to Excel">
              <FileDownloadIcon />
            </IconButton>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        {/* Filters Row */}
        <Grid container spacing={2} className={styles.filterContainer}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                displayEmpty
              >
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {customDateRange && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  fullWidth
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  fullWidth
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: format(startDate, 'yyyy-MM-dd')
                  }}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                displayEmpty
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Summary Section */}
        <Box className={styles.summaryContainer}>
          <Box className={styles.summaryItem}>
            <Typography variant="subtitle2" color="textSecondary">Total Income</Typography>
            <Typography variant="h6" color="primary">{formatCurrency(summaryData.totalIncome)}</Typography>
          </Box>
          <Box className={styles.summaryItem}>
            <Typography variant="subtitle2" color="textSecondary">Total Expenses</Typography>
            <Typography variant="h6" color="error">{formatCurrency(summaryData.totalExpenses)}</Typography>
          </Box>
          <Box className={styles.summaryItem}>
            <Typography variant="subtitle2" color="textSecondary">Net Savings</Typography>
            <Typography 
              variant="h6" 
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
          ) : (
            <Box className={styles.simpleChartContainer}>
              <Box className={styles.chartLegend}>
                <Box className={styles.legendItem}>
                  <Box className={styles.legendColor} style={{ backgroundColor: '#4caf50' }} />
                  <Typography variant="body2">Income</Typography>
                </Box>
                <Box className={styles.legendItem}>
                  <Box className={styles.legendColor} style={{ backgroundColor: '#f44336' }} />
                  <Typography variant="body2">Expenses</Typography>
                </Box>
              </Box>
              
              <Box className={styles.simpleBarChart}>
                {chartData.map((item, index) => (
                  <Box key={index} className={styles.barGroup}>
                    <Box className={styles.barLabel}>
                      <Typography variant="caption">{item.name}</Typography>
                    </Box>
                    <Box className={styles.bars}>
                      <Box 
                        className={styles.incomeBar} 
                        style={{ 
                          height: maxValue ? `${(item.income / maxValue) * 100}%` : '0%'
                        }}
                      >
                        <Box className={styles.barTooltip}>
                          {formatCurrency(item.income)}
                        </Box>
                      </Box>
                      <Box 
                        className={styles.expenseBar} 
                        style={{ 
                          height: maxValue ? `${(item.expenses / maxValue) * 100}%` : '0%'
                        }}
                      >
                        <Box className={styles.barTooltip}>
                          {formatCurrency(item.expenses)}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimpleFinanceChart; 