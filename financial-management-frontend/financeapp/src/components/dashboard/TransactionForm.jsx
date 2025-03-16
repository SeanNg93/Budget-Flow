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
  Alert,
  IconButton,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import CategoryForm from './CategoryForm';

const TransactionForm = ({ open, handleClose, onTransactionAdded, embedded = false }) => {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
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

  const handleAccountAdded = async () => {
    setAccountFormOpen(false);
    // Refresh accounts list
    try {
      const accountsResponse = await FinanceService.getAccounts();
      setAccounts(accountsResponse.data || []);
    } catch (err) {
      console.error('Error refreshing accounts:', err);
    }
  };

  const handleCategoryAdded = async () => {
    setCategoryFormOpen(false);
    // Refresh categories list
    try {
      const categoriesResponse = await FinanceService.getCategories();
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      console.error('Error refreshing categories:', err);
    }
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormControl fullWidth error={!!errors.accountId} size="small" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
                Wallet
              </Typography>
              <Select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                displayEmpty
                disabled={loading || accounts.length === 0}
                sx={{ borderRadius: '8px' }}
              >
                {accounts.map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.accountName} ({account.accountType})
                  </MenuItem>
                ))}
              </Select>
              {errors.accountId && <FormHelperText>{errors.accountId}</FormHelperText>}
              {accounts.length === 0 && !loading && (
                <FormHelperText>No wallets available. Please create a wallet first.</FormHelperText>
              )}
            </FormControl>
            <IconButton 
              size="small" 
              onClick={() => setAccountFormOpen(true)}
              sx={{ mt: 1 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.transactionType} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Type
            </Typography>
            <Select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              displayEmpty
              disabled={loading}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="EXPENSE">Expense</MenuItem>
              <MenuItem value="INCOME">Income</MenuItem>
            </Select>
            {errors.transactionType && <FormHelperText>{errors.transactionType}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.amount} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Amount
            </Typography>
            <TextField
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              error={!!errors.amount}
              helperText={errors.amount}
              disabled={loading}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.transactionDate} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Date
            </Typography>
            <DatePicker 
              value={formData.transactionDate}
              onChange={handleDateChange}
              disabled={loading}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  error: !!errors.transactionDate,
                  helperText: errors.transactionDate,
                  sx: { 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }
                } 
              }}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.description} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Description
            </Typography>
            <TextField
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's this transaction for?"
              error={!!errors.description}
              helperText={errors.description}
              disabled={loading}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FormControl fullWidth error={!!errors.categoryId} size="small" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
                Category
              </Typography>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                displayEmpty
                disabled={loading || filteredCategories.length === 0}
                sx={{ borderRadius: '8px' }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <em>Select a category</em>;
                  }
                  const category = categories.find(cat => cat.id === selected);
                  return category ? category.categoryName : '';
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select a category</em>
                </MenuItem>
                {filteredCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.categoryName}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
              {filteredCategories.length === 0 && !loading && (
                <FormHelperText>
                  {categoriesError 
                    ? 'Error loading categories. Please try again.' 
                    : `No ${formData.transactionType.toLowerCase()} categories available. Please create a category first.`}
                </FormHelperText>
              )}
            </FormControl>
            <IconButton 
              size="small" 
              onClick={() => setCategoryFormOpen(true)}
              sx={{ mt: 1 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        {!embedded && (
          <Button 
            onClick={handleClose} 
            disabled={submitting} 
            sx={{ 
              mr: 1, 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none'
          }}
        >
          {submitting ? 'Saving...' : 'Save Transaction'}
        </Button>
      </Box>

      {/* Account Form Dialog */}
      <WalletForm
        open={accountFormOpen}
        handleClose={() => setAccountFormOpen(false)}
        onAccountAdded={handleAccountAdded}
      />

      {/* Category Form Dialog */}
      <CategoryForm
        open={categoryFormOpen}
        handleClose={() => setCategoryFormOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />
    </>
  );

  // If embedded, just return the form content
  if (embedded) {
    return formContent;
  }

  // Otherwise, wrap in a Dialog
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add Transaction</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm; 