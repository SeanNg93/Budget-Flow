import React, { useState } from 'react';
import FinanceChart from './FinanceChart';
import SimpleFinanceChart from './SimpleFinanceChart';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Grid, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
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
            aria-label={t('dashboard.chartType')}
            size="small"
          >
            <ToggleButton value="advanced" aria-label={t('dashboard.advancedChart')}>
              <BarChartIcon />
            </ToggleButton>
            <ToggleButton value="simple" aria-label={t('dashboard.simpleChart')}>
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