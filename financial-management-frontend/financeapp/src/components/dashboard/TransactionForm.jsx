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
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import FinanceService from '../../services/FinanceService';

const TransactionForm = ({ open, handleClose, onTransactionAdded, embedded = false }) => {
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setCategoriesError(false);
      
      try {
        // Fetch accounts
        const accountsResponse = await FinanceService.getAccounts();
        setAccounts(accountsResponse.data || []);
        
        // Fetch categories
        const categoriesResponse = await FinanceService.getCategories();
        setCategories(categoriesResponse.data || []);
        
        // Set default account if available
        if (accountsResponse.data && accountsResponse.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            accountId: accountsResponse.data[0].id
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 403) {
          setCategoriesError(true);
        } else {
          setError('Failed to load data. Please try again later.');
        }
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
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      transactionDate: date
    });
    
    // Clear error for this field
    if (errors.transactionDate) {
      setErrors({
        ...errors,
        transactionDate: ''
      });
    }
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
    
    setSubmitting(true);
    setError('');
    
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null
      };
      
      await FinanceService.createTransaction(transactionData, formData.accountId);
      
      // Reset form
      resetForm();
      
      // Close dialog and notify parent
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
      if (!embedded) {
        handleClose();
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.response?.data?.message || 'Failed to create transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      accountId: accounts.length > 0 ? accounts[0].id : '',
      transactionType: 'EXPENSE',
      amount: '',
      description: '',
      categoryId: '',
      transactionDate: new Date()
    });
    setErrors({});
    setError('');
  };

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    category => category.type === formData.transactionType
  );

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.accountId}>
            <InputLabel id="account-label">Account</InputLabel>
            <Select
              labelId="account-label"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              label="Account"
              disabled={loading || accounts.length === 0}
            >
              {accounts.map(account => (
                <MenuItem key={account.id} value={account.id}>
                  {account.accountName} ({account.accountType})
                </MenuItem>
              ))}
            </Select>
            {errors.accountId && <FormHelperText>{errors.accountId}</FormHelperText>}
            {accounts.length === 0 && !loading && (
              <FormHelperText>No accounts available. Please create an account first.</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="transaction-type-label">Type</InputLabel>
            <Select
              labelId="transaction-type-label"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              label="Type"
              disabled={loading}
            >
              <MenuItem value="EXPENSE">Expense</MenuItem>
              <MenuItem value="INCOME">Income</MenuItem>
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
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Date"
            value={formData.transactionDate}
            onChange={handleDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.transactionDate,
                helperText: errors.transactionDate,
                disabled: loading
              }
            }}
          />
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
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              label="Category"
              disabled={loading || categoriesError || filteredCategories.length === 0}
            >
              <MenuItem value="">None</MenuItem>
              {filteredCategories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.categoryName}
                </MenuItem>
              ))}
            </Select>
            {categoriesError && (
              <FormHelperText error>
                Unable to load categories. Please check your permissions.
              </FormHelperText>
            )}
            {filteredCategories.length === 0 && !categoriesError && !loading && (
              <FormHelperText>
                No {formData.transactionType.toLowerCase()} categories available. Please create a category first.
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {!embedded && (
          <Button onClick={handleClose} disabled={submitting} sx={{ mr: 1 }}>
            Cancel
          </Button>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting || loading || (accounts.length === 0)}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Saving...' : 'Save Transaction'}
        </Button>
      </Box>
    </>
  );

  // If embedded, just return the form content
  if (embedded) {
    return formContent;
  }

  // Otherwise, wrap in a Dialog
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogContent>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm; 