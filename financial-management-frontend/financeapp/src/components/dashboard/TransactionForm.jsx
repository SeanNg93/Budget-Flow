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
  Typography,
  DialogContentText,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import CategoryForm from './CategoryForm';
import styles from '../../styles/transactionForm.module.css';

const TransactionForm = ({ open, handleClose, onTransactionAdded, embedded = false, initialData = null }) => {
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
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const [editWalletOpen, setEditWalletOpen] = useState(false);
  const [editWalletId, setEditWalletId] = useState(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [deleteWalletOpen, setDeleteWalletOpen] = useState(false);
  const [deleteWalletId, setDeleteWalletId] = useState(null);
  const [deleteWalletName, setDeleteWalletName] = useState('');

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
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        accountId: initialData.wallet.id.toString(),
        transactionType: initialData.transactionType,
        amount: initialData.amount.toString(),
        description: initialData.description || '',
        categoryId: initialData.category ? initialData.category.id.toString() : '',
        transactionDate: initialData.transactionDate ? new Date(initialData.transactionDate) : new Date()
      });
    }
  }, [initialData]);
  
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
        transactionType: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
        transactionDate: formData.transactionDate
      };
      
      let response;
      
      if (initialData) {
        // Update existing transaction
        response = await FinanceService.updateTransaction(initialData.id, transactionData);
      } else {
        // Create new transaction
        response = await FinanceService.createTransaction(
          transactionData, 
          parseInt(formData.accountId, 10)
        );
      }
      
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
      console.error('Error processing transaction:', err);
      setError(err.response?.data?.message || 'Failed to process transaction. Please try again.');
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
    try {
      const accountsResponse = await FinanceService.getAccounts();
      setAccounts(accountsResponse.data || []);
    } catch (err) {
      console.error('Error refreshing accounts:', err);
    }
  };

  const handleCategoryAdded = async () => {
    setCategoryFormOpen(false);
    try {
      const categoriesResponse = await FinanceService.getCategories();
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      console.error('Error refreshing categories:', err);
    }
  };

  const handleEditCategoryClick = () => {
    if (!formData.categoryId) return;
    const category = categories.find(cat => cat.id === formData.categoryId);
    if (!category) return;
    setEditCategoryId(category.id);
    setEditCategoryName(category.categoryName);
    setEditCategoryOpen(true);
  };

  const handleEditCategoryClose = () => {
    setEditCategoryOpen(false);
    setEditCategoryId(null);
    setEditCategoryName('');
  };

  const handleEditCategorySave = async () => {
    if (!editCategoryName.trim() || !editCategoryId) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const categoryToUpdate = categories.find(c => c.id === editCategoryId);
      if (!categoryToUpdate) {
        throw new Error('Category not found');
      }
      const updatedCategory = {
        ...categoryToUpdate,
        categoryName: editCategoryName
      };
      await FinanceService.updateCategory(editCategoryId, updatedCategory);
      handleEditCategoryClose();
      const categoriesResponse = await FinanceService.getCategories();
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoryClick = () => {
    if (!formData.categoryId) return;
    const category = categories.find(cat => cat.id === formData.categoryId);
    if (!category) return;
    setDeleteCategoryId(category.id);
    setDeleteCategoryName(category.categoryName);
    setDeleteCategoryOpen(true);
  };

  const handleDeleteCategoryClose = () => {
    setDeleteCategoryOpen(false);
    setDeleteCategoryId(null);
    setDeleteCategoryName('');
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    setLoading(true);
    setError('');
    try {
      await FinanceService.deleteCategory(deleteCategoryId);
      if (formData.categoryId === deleteCategoryId) {
        setFormData({
          ...formData,
          categoryId: ''
        });
      }
      handleDeleteCategoryClose();
      const categoriesResponse = await FinanceService.getCategories();
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWalletClick = () => {
    if (!formData.accountId) return;
    const wallet = accounts.find(acc => acc.id === formData.accountId);
    if (!wallet) return;
    setEditWalletId(wallet.id);
    setEditWalletName(wallet.accountName);
    setEditWalletOpen(true);
  };

  const handleEditWalletClose = () => {
    setEditWalletOpen(false);
    setEditWalletId(null);
    setEditWalletName('');
  };

  const handleEditWalletSave = async () => {
    if (!editWalletName.trim() || !editWalletId) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const walletToUpdate = accounts.find(w => w.id === editWalletId);
      if (!walletToUpdate) {
        throw new Error('Wallet not found');
      }
      const updatedWallet = {
        ...walletToUpdate,
        accountName: editWalletName
      };
      await FinanceService.updateAccount(editWalletId, updatedWallet);
      handleEditWalletClose();
      const accountsResponse = await FinanceService.getAccounts();
      setAccounts(accountsResponse.data || []);
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError(err.response?.data?.message || 'Failed to update wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWalletClick = () => {
    if (!formData.accountId) return;
    const wallet = accounts.find(acc => acc.id === formData.accountId);
    if (!wallet) return;
    setDeleteWalletId(wallet.id);
    setDeleteWalletName(wallet.accountName);
    setDeleteWalletOpen(true);
  };

  const handleDeleteWalletClose = () => {
    setDeleteWalletOpen(false);
    setDeleteWalletId(null);
    setDeleteWalletName('');
  };

  const handleDeleteWalletConfirm = async () => {
    if (!deleteWalletId) return;
    setLoading(true);
    setError('');
    try {
      await FinanceService.deleteAccount(deleteWalletId);
      if (formData.accountId === deleteWalletId) {
        const remainingAccounts = accounts.filter(acc => acc.id !== deleteWalletId);
        setFormData({
          ...formData,
          accountId: remainingAccounts.length > 0 ? remainingAccounts[0].id : ''
        });
      }
      handleDeleteWalletClose();
      const accountsResponse = await FinanceService.getAccounts();
      setAccounts(accountsResponse.data || []);
    } catch (err) {
      console.error('Error deleting wallet:', err);
      setError(err.response?.data?.message || 'Failed to delete wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <Box className={styles.formContainer}>
      {error && <Alert severity="error" className={styles.errorAlert}>{error}</Alert>}
      
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f9f9fb', mb: 1.5 }}>
        {/* Wallet and Category Section */}
        <Box sx={{ mb: 2 }}>
          {/* Wallet Selection */}
          <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
            <Box className={styles.labelContainer}>
              <Typography variant="subtitle2" className={styles.labelText}>
                <AccountBalanceWalletIcon className={styles.labelIcon} />
                Wallet
              </Typography>
              <Box className={styles.actionButtonsContainer}>
                <IconButton 
                  size="small" 
                  className={styles.editButton}
                  onClick={handleEditWalletClick}
                  disabled={loading || !formData.accountId}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  className={styles.deleteButton}
                  onClick={handleDeleteWalletClick}
                  disabled={loading || !formData.accountId}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  className={styles.addIconButton}
                  onClick={() => setAccountFormOpen(true)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <Select
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              displayEmpty
              error={!!errors.accountId}
              disabled={loading}
              className={styles.selectField}
              size="small"
              sx={{ 
                mb: 0.5,
                '& .MuiInputBase-root': { height: '40px' }
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography sx={{ color: 'text.secondary' }}>Select a wallet</Typography>;
                }
                const account = accounts.find(a => a.id === selected);
                return account ? account.accountName : '';
              }}
            >
              <MenuItem value="" disabled>Select a wallet</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.accountName}
                </MenuItem>
              ))}
            </Select>
            {errors.accountId && <FormHelperText error>{errors.accountId}</FormHelperText>}
          </FormControl>

          {/* Category Selection */}
          <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
            <Box className={styles.labelContainer}>
              <Typography variant="subtitle2" className={styles.labelText}>
                <CategoryIcon className={styles.labelIcon} />
                Category
              </Typography>
              <Box className={styles.actionButtonsContainer}>
                <IconButton 
                  size="small" 
                  className={styles.editButton}
                  onClick={handleEditCategoryClick}
                  disabled={loading || !formData.categoryId}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  className={styles.deleteButton}
                  onClick={handleDeleteCategoryClick}
                  disabled={loading || !formData.categoryId}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  className={styles.addIconButton}
                  onClick={() => setCategoryFormOpen(true)}
                  disabled={loading}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              displayEmpty
              error={!!errors.categoryId}
              disabled={loading}
              className={styles.selectField}
              size="small"
              sx={{ 
                mb: 0.5,
                '& .MuiInputBase-root': { height: '40px' }
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return <em>Select a category</em>;
                }
                const category = categories.find(c => c.id === selected);
                return category ? category.categoryName : '';
              }}
            >
              <MenuItem value="" disabled>
                <em>Select a category</em>
              </MenuItem>
              {categories
                .filter(category => category.type === formData.transactionType)
                .map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.categoryName}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && <FormHelperText error>{errors.categoryId}</FormHelperText>}
          </FormControl>
        </Box>
        
        <Divider className={styles.divider} sx={{ my: 1.5 }} />
        
        {/* Amount, Date, and Description */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
              <Box className={styles.labelContainer}>
                <Typography variant="subtitle2" className={styles.labelText}>
                  <AttachMoneyIcon className={styles.labelIcon} />
                  Amount
                </Typography>
              </Box>
              <TextField
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                error={!!errors.amount}
                helperText={errors.amount}
                disabled={loading}
                size="small"
                className={`${styles.inputField} ${styles.amountField}`}
                sx={{ '& .MuiInputBase-root': { height: '40px' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
              <Box className={styles.labelContainer}>
                <Typography variant="subtitle2" className={styles.labelText}>
                  <CalendarTodayIcon className={styles.labelIcon} />
                  Date
                </Typography>
              </Box>
              <DatePicker
                value={formData.transactionDate}
                onChange={handleDateChange}
                disabled={loading}
                slotProps={{
                  textField: {
                    error: !!errors.transactionDate,
                    helperText: errors.transactionDate,
                    className: styles.dateField,
                    fullWidth: true,
                    size: "small",
                    sx: { '& .MuiInputBase-root': { height: '40px' } }
                  }
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Description - Full width */}
        <FormControl fullWidth className={styles.formControl} sx={{ mb: 0 }}>
          <Box className={styles.labelContainer}>
            <Typography variant="subtitle2" className={styles.labelText}>
              <DescriptionIcon className={styles.labelIcon} />
              Description
            </Typography>
          </Box>
          <TextField
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What's this transaction for?"
            error={!!errors.description}
            helperText={errors.description}
            disabled={loading}
            multiline
            rows={2}
            size="small"
            className={`${styles.inputField} ${styles.descriptionField}`}
          />
        </FormControl>
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Transaction Type Toggle */}
        <ToggleButtonGroup
          value={formData.transactionType}
          exclusive
          onChange={(e, newType) => {
            if (newType !== null) {
              handleChange({ target: { name: 'transactionType', value: newType } });
            }
          }}
          aria-label="transaction type"
          size="small"
          className={styles.typeToggle}
          disabled={loading || submitting}
        >
          <ToggleButton value="EXPENSE" aria-label="expense" className={styles.expenseToggle}>
            <ArrowUpwardIcon fontSize="small" />
            <span style={{ marginLeft: '4px' }}>Expense</span>
          </ToggleButton>
          <ToggleButton value="INCOME" aria-label="income" className={styles.incomeToggle}>
            <ArrowDownwardIcon fontSize="small" />
            <span style={{ marginLeft: '4px' }}>Income</span>
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!embedded && (
            <Button 
              onClick={handleClose} 
              disabled={submitting} 
              className={styles.cancelButton}
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
            className={styles.saveTransactionButton}
          >
            {submitting ? 'Saving...' : formData.transactionType === 'EXPENSE' ? 'Save Expense Transaction' : 'Save Income Transaction'}
          </Button>
        </Box>
      </Box>
      
      {/* Edit Category Dialog */}
      <Dialog
        open={editCategoryOpen}
        onClose={handleEditCategoryClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Edit Category</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            placeholder="Category name"
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleEditCategoryClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEditCategorySave}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <Dialog
        open={deleteCategoryOpen}
        onClose={handleDeleteCategoryClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Delete Category</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText>
            Are you sure you want to delete the category "{deleteCategoryName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDeleteCategoryClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteCategoryConfirm}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Wallet Dialog */}
      <Dialog
        open={editWalletOpen}
        onClose={handleEditWalletClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Edit Wallet</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            value={editWalletName}
            onChange={(e) => setEditWalletName(e.target.value)}
            placeholder="Wallet name"
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleEditWalletClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEditWalletSave}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Wallet Dialog */}
      <Dialog
        open={deleteWalletOpen}
        onClose={handleDeleteWalletClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Delete Wallet</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText>
            Are you sure you want to delete the wallet "{deleteWalletName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDeleteWalletClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteWalletConfirm}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Wallet Form Dialog */}
      <Dialog 
        open={accountFormOpen} 
        onClose={() => setAccountFormOpen(false)}
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add Wallet</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <WalletForm 
            open={true} 
            handleClose={() => setAccountFormOpen(false)}
            onWalletAdded={handleAccountAdded}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Category Form Dialog */}
      <Dialog 
        open={categoryFormOpen} 
        onClose={() => setCategoryFormOpen(false)}
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add Category</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <CategoryForm 
            open={true} 
            handleClose={() => setCategoryFormOpen(false)}
            onCategoryAdded={handleCategoryAdded}
            embedded={true}
            defaultType={formData.transactionType}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );

  // If embedded, just return the form content
  if (embedded) {
    return formContent;
  }

  // Otherwise, wrap in a Dialog with additional PaperProps
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth={!embedded}
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        {formData.transactionType === 'EXPENSE' ? 
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowUpwardIcon sx={{ mr: 1, color: '#ff3b30', fontSize: '1.3rem' }} />
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </Box> : 
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowDownwardIcon sx={{ mr: 1, color: '#34c759', fontSize: '1.3rem' }} />
            {initialData ? 'Edit Income' : 'Add Income'}
          </Box>
        }
      </DialogTitle>
      <DialogContent className={styles.dialogContent}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
