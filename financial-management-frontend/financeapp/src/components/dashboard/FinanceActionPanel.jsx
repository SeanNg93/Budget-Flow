import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TransactionForm from './TransactionForm';
import AccountForm from './AccountForm';
import CategoryForm from './CategoryForm';

// TabPanel component for rendering tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`finance-tabpanel-${index}`}
      aria-labelledby={`finance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Helper function for a11y props
function a11yProps(index) {
  return {
    id: `finance-tab-${index}`,
    'aria-controls': `finance-tabpanel-${index}`,
  };
}

const FinanceActionPanel = ({ 
  open, 
  handleClose, 
  initialTab = 0,
  onTransactionAdded,
  onAccountAdded,
  onCategoryAdded
}) => {
  const [tabValue, setTabValue] = useState(initialTab);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Custom close handlers for each form
  const handleTransactionClose = () => {
    if (onTransactionAdded) onTransactionAdded();
    handleClose();
  };

  const handleAccountClose = () => {
    if (onAccountAdded) onAccountAdded();
    handleClose();
  };

  const handleCategoryClose = () => {
    if (onCategoryAdded) onCategoryAdded();
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Manage Finances</Typography>
          <IconButton aria-label="close" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="finance management tabs"
          variant="fullWidth"
        >
          <Tab label="Transactions" {...a11yProps(0)} />
          <Tab label="Accounts" {...a11yProps(1)} />
          <Tab label="Categories" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <TransactionForm 
            open={true} 
            handleClose={handleTransactionClose}
            onTransactionAdded={onTransactionAdded}
            embedded={true}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <AccountForm 
            open={true} 
            handleClose={handleAccountClose}
            onAccountAdded={onAccountAdded}
            embedded={true}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <CategoryForm 
            open={true} 
            handleClose={handleCategoryClose}
            onCategoryAdded={onCategoryAdded}
            embedded={true}
          />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceActionPanel; 