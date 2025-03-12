import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import FinanceService from '../../services/FinanceService';

const TransactionForm = ({ open, handleClose, onTransactionAdded }) => {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    transactionType: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    transactionDate: new Date()
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const accountsResponse = await FinanceService.getAccounts();
        setAccounts(accountsResponse.data || []);
        
        // Set default account if available
        if (accountsResponse.data && accountsResponse.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            accountId: accountsResponse.data[0].id
          }));
        }
        
        // Fetch categories
        const categoriesResponse = await FinanceService.getCategories();
        setCategories(categoriesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data for transaction form:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchData();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // If transaction type changes, reset category
    if (name === 'transactionType') {
      setFormData(prev => ({
        ...prev,
        categoryId: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      transactionDate: date
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const transactionData = {
        transactionType: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transactionDate: formData.transactionDate,
        category: { id: formData.categoryId }
      };
      
      await FinanceService.createTransaction(transactionData, formData.accountId);
      
      // Reset form
      setFormData({
        accountId: accounts.length > 0 ? accounts[0].id : '',
        transactionType: 'EXPENSE',
        amount: '',
        description: '',
        categoryId: '',
        transactionDate: new Date()
      });
      
      // Notify parent component
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
      // Close dialog
      handleClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      // You could set a form error here to display to the user
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    category => category.type === formData.transactionType
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Transaction</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.accountId}>
                <InputLabel>Account</InputLabel>
                <Select
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  label="Account"
                >
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountName} ({account.accountType})
                    </MenuItem>
                  ))}
                </Select>
                {errors.accountId && <FormHelperText>{errors.accountId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  label="Transaction Type"
                >
                  <MenuItem value="INCOME">Income</MenuItem>
                  <MenuItem value="EXPENSE">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Transaction Date"
                  value={formData.transactionDate}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.transactionDate}
                      helperText={errors.transactionDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.categoryId}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  label="Category"
                >
                  {filteredCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.categoryName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm; 