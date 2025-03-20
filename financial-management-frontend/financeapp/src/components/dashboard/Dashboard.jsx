import React, { useState } from 'react';
import FinanceChart from './FinanceChart';
import SimpleFinanceChart from './SimpleFinanceChart';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const Dashboard = () => {
  const [chartType, setChartType] = useState('advanced'); // 'advanced' or 'simple'
  
  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };
  
  return (
    <div>
      {/* Chart Section */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="advanced" aria-label="advanced chart">
              <BarChartIcon />
            </ToggleButton>
            <ToggleButton value="simple" aria-label="simple chart">
              <ShowChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {chartType === 'advanced' ? <FinanceChart /> : <SimpleFinanceChart />}
      </Grid>
    </div>
  );
};

export default Dashboard; 