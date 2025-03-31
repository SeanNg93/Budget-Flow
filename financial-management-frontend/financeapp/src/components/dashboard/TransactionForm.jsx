import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ToggleButton,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import MoneyInput from '../utils/MoneyInput';
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
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import FinanceService from '../../services/FinanceService';
import WalletForm from './WalletForm';
import CategoryForm from './CategoryForm';
import CategoryManageForm from './CategoryManageForm';
import WalletManageForm from './WalletManageForm';
import styles from '../../styles/transactionForm.module.css';
import { formatCurrency } from '../../utils/moneyFormatter';
import { useTranslation } from 'react-i18next';

// Create a SlideTransition component with forwardRef
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TransactionForm = ({ open, handleClose, onTransactionAdded, embedded = false, initialData = null }) => {
  const { t } = useTranslation();

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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [categorySpendingData, setCategorySpendingData] = useState(null);
  const [categoryExcessAmount, setCategoryExcessAmount] = useState(0);
  const [sharedWallets, setSharedWallets] = useState({});
  const [walletManageFormOpen, setWalletManageFormOpen] = useState(false);

  // Track if form has been initialized with initial data
  const formInitialized = useRef(false);

  // Add refs for transitions
  const dialogRef = useRef(null);
  const errorAlertRef = useRef(null);
  const successAlertRef = useRef(null);
  const categoryFormDialogRef = useRef(null);
  const editCategoryDialogRef = useRef(null);
  const deleteCategoryDialogRef = useRef(null);
  const editWalletDialogRef = useRef(null);
  const deleteWalletDialogRef = useRef(null);

  // Add new state and function for opening the CategoryManageForm
  const [categoryManageFormOpen, setCategoryManageFormOpen] = useState(false);
  
  const handleOpenCategoryManage = () => {
    setCategoryManageFormOpen(true);
  };

  const handleCloseCategoryManage = () => {
    setCategoryManageFormOpen(false);
  };

  const handleOpenWalletManage = () => {
    setWalletManageFormOpen(true);
  };

  const handleCloseWalletManage = () => {
    setWalletManageFormOpen(false);
  };

  // Helper function to fetch category spending data - memoize with useCallback
  const fetchCategorySpendingData = useCallback(async (catId) => {
    if (!catId || catId === '' || formData.transactionType !== 'EXPENSE') {
      setCategorySpendingData(null);
      return;
    }
    
    try {
      const catIdNumber = parseInt(catId, 10);
      
      // First check if this category has a spending limit to avoid unnecessary API calls
      const category = categories.find(c => c.id.toString() === catId.toString());
      
      // Skip API call if category doesn't exist or doesn't have a spending limit
      if (!category || !category.spendingLimit) {
        setCategorySpendingData(null);
        setCategoryExcessAmount(0);
        return;
      }
      
      const response = await FinanceService.getCategorySpendingProgress(catIdNumber);
      
      // Handle case when editing an existing transaction
      if (initialData && initialData.category && initialData.category.id.toString() === catId.toString() && initialData.transactionType === 'EXPENSE') {
        // Subtract the original transaction amount from the total spent for limit calculation purposes
        const originalAmount = parseFloat(initialData.amount) || 0;
        const adjustedTotalSpent = Math.max(0, response.data.totalSpent - originalAmount);
        
        // Create adjusted response data
        const adjustedData = {
          ...response.data,
          totalSpent: adjustedTotalSpent,
          // Store the original total spent for display purposes
          originalTotalSpent: response.data.totalSpent,
          percentage: (adjustedTotalSpent / response.data.limit) * 100
        };
        
        setCategorySpendingData(adjustedData);
        
        // Recalculate excess amount with adjusted total
        const newAmount = parseFloat(formData.amount || 0);
        if (adjustedData.limit && newAmount > 0) {
          const newTotal = adjustedTotalSpent + newAmount;
          if (newTotal > adjustedData.limit) {
            setCategoryExcessAmount(newTotal - adjustedData.limit);
          } else {
            setCategoryExcessAmount(0);
          }
        }
      } else {
        // Normal case (not editing an existing transaction in the same category)
        setCategorySpendingData(response.data);
        
        // Set excess amount if applicable
        const amount = parseFloat(formData.amount || 0);
        if (response.data.limit && amount > 0) {
          const newTotal = response.data.totalSpent + amount;
          if (newTotal > response.data.limit) {
            setCategoryExcessAmount(newTotal - response.data.limit);
          } else {
            setCategoryExcessAmount(0);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching category spending data:', err);
      setCategorySpendingData(null);
    }
  }, [formData.transactionType, formData.amount, categories, initialData]);

  // Helper function to fetch income goal progress data - memoize with useCallback
  const fetchIncomeGoalProgress = useCallback(async (catId) => {
    if (!catId || catId === '' || formData.transactionType !== 'INCOME') {
      setCategorySpendingData(null);
      return;
    }
    
    try {
      const catIdNumber = parseInt(catId, 10);
      
      // First check if this category has a goal (spending limit for income)
      const category = categories.find(c => c.id.toString() === catId.toString());
      
      // Skip API call if category doesn't exist or doesn't have a goal
      if (!category || !category.spendingLimit) {
        setCategorySpendingData(null);
        return;
      }
      
      // For income categories, we'll also use the spending progress API but interpret it differently
      const response = await FinanceService.getCategorySpendingProgress(catIdNumber);
      
      // Handle case when editing an existing transaction
      if (initialData && initialData.category && initialData.category.id.toString() === catId.toString() && initialData.transactionType === 'INCOME') {
        // Subtract the original transaction amount from the total collected for goal calculation purposes
        const originalAmount = parseFloat(initialData.amount) || 0;
        const adjustedTotalCollected = Math.max(0, response.data.totalSpent - originalAmount);
        
        // Create adjusted response data
        const adjustedData = {
          ...response.data,
          totalSpent: adjustedTotalCollected,
          // Store the original total spent for display purposes
          originalTotalSpent: response.data.totalSpent,
          percentage: (adjustedTotalCollected / response.data.limit) * 100
        };
        
        setCategorySpendingData(adjustedData);
      } else {
        // Normal case
        setCategorySpendingData(response.data);
      }
    } catch (err) {
      console.error('Error fetching income goal progress data:', err);
      setCategorySpendingData(null);
    }
  }, [formData.transactionType, formData.amount, categories, initialData]);

  // Update useEffect to call appropriate function based on transaction type
  useEffect(() => {
    // Call our helper function to fetch category data based on transaction type
    if (formData.categoryId) {
      if (formData.transactionType === 'EXPENSE') {
        fetchCategorySpendingData(formData.categoryId);
      } else if (formData.transactionType === 'INCOME') {
        fetchIncomeGoalProgress(formData.categoryId);
      }
    } else {
      setCategorySpendingData(null);
      setCategoryExcessAmount(0);
    }
  }, [formData.categoryId, formData.transactionType, formData.amount, fetchCategorySpendingData, fetchIncomeGoalProgress]);

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
        
        // Fetch shared wallets info
        const [sharedWithMeResponse, sharedByMeResponse] = await Promise.all([
          FinanceService.getSharedWalletsWithMe(),
          FinanceService.getSharedWalletsByMe()
        ]);
        
        // Process shared wallets info
        const sharedWalletsMap = {};
        
        // Add wallets shared with me
        (sharedWithMeResponse.data || []).forEach(shared => {
          if (shared.accepted) {
            sharedWalletsMap[shared.walletId] = true;
          }
        });
        
        // Add wallets shared by me
        (sharedByMeResponse.data || []).forEach(shared => {
          if (shared.accepted) {
            sharedWalletsMap[shared.walletId] = true;
          }
        });
        
        setSharedWallets(sharedWalletsMap);
        
        // Set default account if available and not editing
        if (!initialData && accountsResponse.data && accountsResponse.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            accountId: accountsResponse.data[0].id.toString()
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
      
      // Reset the initialization flag when the dialog opens
      if (!initialData) {
        formInitialized.current = false;
      }
    }
  }, [open, initialData]);
  
  // Reset initialization flag and form data when dialog opens/closes
  useEffect(() => {
    if (!open) {
      formInitialized.current = false;
    } else if (initialData && !formInitialized.current) {
      // Only run this once when the form opens with initialData
      formInitialized.current = true;
      
      // When opening with initialData, reset form and then set timeout to load data
      // This helps overcome potential timing issues
      setTimeout(() => {
        // Handle different possible formats of wallet property
        let accountId = '';
        if (initialData.wallet?.id) {
          accountId = initialData.wallet.id.toString();
        } else if (initialData.accountId) {
          accountId = initialData.accountId.toString();
        } else if (initialData.account?.id) {
          accountId = initialData.account.id.toString();
        }
        
        // Log what we found for debugging
        console.log('Setting account ID for edit:', accountId, 'from initialData:', initialData);
        
        // Handle different possible formats of category property
        let categoryId = '';
        if (initialData.category?.id) {
          categoryId = initialData.category.id.toString();
        } else if (initialData.categoryId) {
          categoryId = initialData.categoryId.toString();
        }
        
        // Ensure amount is properly converted to string
        const amountStr = initialData.amount ? String(initialData.amount) : '';
        
        setFormData({
          accountId: accountId,
          transactionType: initialData.transactionType || 'EXPENSE',
          amount: amountStr,
          description: initialData.description || '',
          categoryId: categoryId,
          transactionDate: initialData.transactionDate ? new Date(initialData.transactionDate) : new Date()
        });
        
        // Load the category spending data if needed
        if (categoryId && initialData.transactionType === 'EXPENSE' && categories.length > 0) {
          setTimeout(() => {
            fetchCategorySpendingData(categoryId);
          }, 100);
        }
      }, 300); // Short delay to ensure component is fully mounted
    } else if (!initialData && open && !formInitialized.current) {
      // This is a new transaction (not editing), so load last used category
      formInitialized.current = true;
      
      // Get the last used category from localStorage
      try {
        const lastTransactionType = localStorage.getItem('lastTransactionType') || 'EXPENSE';
        const lastCategoryType = lastTransactionType === 'EXPENSE' ? 'lastExpenseCategory' : 'lastIncomeCategory';
        const lastCategoryId = localStorage.getItem(lastCategoryType);

        if (lastCategoryId) {
          setFormData(prev => ({
            ...prev,
            transactionType: lastTransactionType,
            categoryId: lastCategoryId
          }));
        }
      } catch (err) {
        console.error('Error loading last category from localStorage:', err);
      }
    }
  }, [open, initialData, fetchCategorySpendingData, categories.length]);
  
  // Update the useEffect for the checkCategoryLimit function
  useEffect(() => {
    const checkCategoryLimit = () => {
      // Only check for expense transactions
      if (formData.transactionType !== 'EXPENSE' || !formData.categoryId || !formData.amount) {
        setWarningMessage('');
        setIsWarningVisible(false);
        setIsErrorVisible(false);
        return;
      }
      
      // Convert categoryId to string for safe comparison
      const categoryIdStr = formData.categoryId.toString();
      const category = categories.find(c => c.id.toString() === categoryIdStr);
      setSelectedCategory(category);
      
      if (category && category.spendingLimit) {
        const limit = parseFloat(category.spendingLimit);
        const amount = parseFloat(formData.amount);
        const warningThreshold = limit * (category.warningPercentage || 80) / 100;
        
        if (amount > limit) {
          setWarningMessage(`Warning: You have exceeded your spending limit of $${limit.toFixed(2)} for this category!`);
          setIsWarningVisible(false);
          setIsErrorVisible(true);
        } else if (amount > warningThreshold) {
          setWarningMessage(`Careful, you are about to exceed your spending limit of $${limit.toFixed(2)} for this category.`);
          setIsWarningVisible(true);
          setIsErrorVisible(false);
        } else {
          setWarningMessage('');
          setIsWarningVisible(false);
          setIsErrorVisible(false);
        }
      } else {
        setWarningMessage('');
        setIsWarningVisible(false);
        setIsErrorVisible(false);
      }
    };
    
    checkCategoryLimit();
  }, [formData.amount, formData.categoryId, formData.transactionType, categories]);
  
  // Fetch category spending data when category changes
  useEffect(() => {
    // Call our helper function to fetch category spending data
    if (formData.categoryId) {
      fetchCategorySpendingData(formData.categoryId);
    } else {
      setCategorySpendingData(null);
      setCategoryExcessAmount(0);
    }
  }, [formData.categoryId, formData.transactionType, formData.amount, fetchCategorySpendingData]);
  
  // Update selected category when categoryId changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      // Convert to string for consistent comparison
      const categoryIdStr = formData.categoryId.toString();
      const category = categories.find(c => c.id.toString() === categoryIdStr);
      if (category) {
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [formData.categoryId, categories]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Save category selection to localStorage when user chooses a category
    if (name === 'categoryId' && value) {
      try {
        const categoryType = formData.transactionType === 'EXPENSE' ? 'lastExpenseCategory' : 'lastIncomeCategory';
        localStorage.setItem(categoryType, value);
        localStorage.setItem('lastTransactionType', formData.transactionType);
      } catch (err) {
        console.error('Error saving category to localStorage:', err);
      }
    }
    
    // Save transaction type to localStorage when it changes
    if (name === 'transactionType') {
      try {
        localStorage.setItem('lastTransactionType', value);
        
        // If we have categories loaded, check if there's a saved category for this type
        if (categories.length > 0) {
          const categoryType = value === 'EXPENSE' ? 'lastExpenseCategory' : 'lastIncomeCategory';
          const savedCategoryId = localStorage.getItem(categoryType);
          
          // Check if the saved category exists and matches the current transaction type
          if (savedCategoryId) {
            const savedCategory = categories.find(c => 
              c.id.toString() === savedCategoryId && c.type === value
            );
            
            if (savedCategory) {
              // Update the category in the form
              setFormData(prev => ({
                ...prev,
                categoryId: savedCategoryId,
                transactionType: value
              }));
              return;
            }
          }
        }
        
        // If we couldn't find a matching saved category, just clear the selection
        setFormData(prev => ({
          ...prev,
          categoryId: '',
          transactionType: value
        }));
      } catch (err) {
        console.error('Error working with localStorage:', err);
      }
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Add special handler for amount field
  const handleAmountChange = (value) => {
    setFormData(prev => ({
      ...prev,
      amount: value
    }));
    
    if (errors.amount) {
      setErrors({
        ...errors,
        amount: ''
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
    
    // Improved amount validation
    if (!formData.amount || formData.amount === '') {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(formData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
      
      // Check for sufficient funds when transaction is an EXPENSE
      if (formData.transactionType === 'EXPENSE' && formData.accountId) {
        const selectedAccount = accounts.find(a => a.id.toString() === formData.accountId.toString());
        if (selectedAccount) {
          const walletBalance = selectedAccount.balance || 0;
          
          // If editing a transaction, we need to consider the original amount
          let originalAmount = 0;
          if (initialData && initialData.transactionType === 'EXPENSE' && 
              initialData.wallet && initialData.wallet.id.toString() === formData.accountId.toString()) {
            originalAmount = parseFloat(initialData.amount) || 0;
          }
          
          // For editing: check if (new amount - original amount) > wallet balance
          // For new transactions: check if amount > wallet balance
          const effectiveAmount = numAmount - (initialData ? originalAmount : 0);
          
          if (effectiveAmount > walletBalance) {
            newErrors.amount = `Insufficient funds in wallet. Available: ${formatCurrency(walletBalance)}`;
          }
        }
      }
    }
    
    // Validate description
    if (!formData.description) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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
    setError(null);
    
    try {
      // Parse category ID properly - handle both string and number formats
      const categoryId = formData.categoryId ? parseInt(formData.categoryId.toString(), 10) : null;
      
      // Get full category details if categoryId is provided
      let categoryDetails = null;
      if (categoryId) {
        // Find the category using string comparison for safety
        const category = categories.find(cat => cat.id.toString() === categoryId.toString());
        if (category) {
          categoryDetails = {
            id: categoryId,
            categoryName: category.categoryName,
            type: category.type
          };
        }
      }
      
      const transactionData = {
        transactionType: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: categoryId,
        category: categoryDetails, // Include full category details
        transactionDate: formData.transactionDate
      };
      
      // Add wallet details when updating a transaction
      if (formData.accountId) {
        const selectedWallet = accounts.find(acc => acc.id.toString() === formData.accountId.toString());
        if (selectedWallet) {
          transactionData.wallet = {
            id: selectedWallet.id,
            accountName: selectedWallet.accountName
          };
        }
      }
      
      let response;
      let isUpdate = false;
      
      if (initialData) {
        // Update existing transaction
        
        // Get the transaction ID, handling different possible formats
        let transactionId;
        if (typeof initialData.id === 'number') {
          transactionId = initialData.id;
        } else if (typeof initialData.id === 'string' && initialData.id.includes(':')) {
          // Handle case where ID might be in format like "123:string"
          transactionId = parseInt(initialData.id.toString().split(':')[0], 10);
        } else {
          transactionId = parseInt(initialData.id.toString(), 10);
        }
        
        // Ensure transactionId is valid
        if (isNaN(transactionId)) {
          throw new Error('Invalid transaction ID');
        }
        
        response = await FinanceService.updateTransaction(transactionId, transactionData);
        isUpdate = true;
      } else {
        // Create new transaction
        response = await FinanceService.createTransaction(
          transactionData, 
          parseInt(formData.accountId.toString(), 10)
        );
      }
      
      // Only reset form for new transactions, not for edits
      if (!initialData) {
        resetForm();
      }
      
      // Close dialog and notify parent
      if (onTransactionAdded) {
        onTransactionAdded(isUpdate);
      }
      
      if (!embedded) {
        handleClose();
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error === 'Insufficient funds') {
          // Format the error message nicely with the available balance
          setError(`Insufficient funds! Available: ${formatCurrency(parseFloat(errorData.available) || 0)}`);
        } else {
          setError(errorData.message || 'Failed to process transaction. Please try again.');
        }
      } else {
        setError('Failed to process transaction. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    // Don't reset if we're editing (initialData exists)
    if (initialData) {
      return;
    }
    
    setFormData({
      accountId: accounts.length > 0 ? accounts[0].id.toString() : '',
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
      
      // Update local state immediately instead of fetching again
      const updatedAccounts = accounts.filter(acc => acc.id !== deleteWalletId);
      setAccounts(updatedAccounts);
      
      if (formData.accountId === deleteWalletId) {
        setFormData({
          ...formData,
          accountId: updatedAccounts.length > 0 ? updatedAccounts[0].id : ''
        });
      }
      
      handleDeleteWalletClose();
    } catch (err) {
      console.error('Error deleting wallet:', err);
      // Handle the specific case where the wallet is shared and user doesn't have permission
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to delete wallet. Please try again.');
      }
      handleDeleteWalletClose();
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user has insufficient funds
  const hasInsufficientFunds = () => {
    if (formData.transactionType !== 'EXPENSE' || !formData.accountId || !formData.amount) {
      return false;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }
    
    const account = accounts.find(a => a.id.toString() === formData.accountId.toString());
    if (!account) {
      return false;
    }
    
    return amount > (account.balance || 0);
  };
  
  // Helper function for checking if approaching warning threshold
  const isExceedingWarningThreshold = () => {
    if (!formData.categoryId || !formData.amount || !categorySpendingData || !categorySpendingData.limit) {
      return false;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return false;
    }
    
    const category = categories.find(c => c.id.toString() === formData.categoryId.toString());
    if (!category || !category.spendingLimit) {
      return false;
    }
    
    const warningThreshold = categorySpendingData.limit * (category.warningPercentage || 80) / 100;
    const newTotal = categorySpendingData.totalSpent + amount;
    
    return newTotal > warningThreshold && newTotal <= categorySpendingData.limit;
  };

  // Shared wallet badge component
  const sharedWalletBadge = useMemo(() => {
    try {
      if (formData && formData.accountId && sharedWallets && 
          Object.keys(sharedWallets).length > 0 && 
          sharedWallets[parseInt(formData.accountId, 10)]) {
        return (
          <Typography 
            component="span"
            variant="caption"
            className={styles.sharedWalletBadge}
          >
            ({t('transactions.sharedWallet')})
          </Typography>
        );
      }
    } catch (err) {
      console.error('Error rendering shared wallet badge:', err);
    }
    return null;
  }, [formData, formData?.accountId, sharedWallets, t]);

  // Helper function to render wallet selection value
  const renderWalletValue = (selected) => {
    try {
      if (!selected) {
        return <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t('transactions.selectWallet')}</Typography>;
      }
      // Use toString() for consistent string comparison
      const selectedStr = selected.toString();
      const account = accounts.find(a => a && a.id && a.id.toString() === selectedStr);
      return <Typography sx={{ fontSize: '0.8rem' }}>
        {account ? (account.accountName + (sharedWallets && Object.keys(sharedWallets).length > 0 && sharedWallets[account.id] ? ` (${t('transactions.sharedWallet')})` : "")) : ''}
      </Typography>;
    } catch (err) {
      console.error('Error rendering wallet value:', err);
      return <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t('transactions.selectWallet')}</Typography>;
    }
  };
  
  // Helper function to render category selection value
  const renderValue = (selected) => {
    if (!selected) {
      return <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Select your category</Typography>;
    }
    // Convert to string for safe comparison
    const selectedStr = selected.toString();
    const category = categories.find(c => c.id.toString() === selectedStr);
    return <Typography sx={{ fontSize: '0.8rem' }}>{category ? category.categoryName : 'Uncategorized'}</Typography>;
  };

  // Use this version of handleClose in the component
  const handleDialogClose = () => {
    // Reset form data
    resetForm();
    // Reset the initialization flag
    formInitialized.current = false;
    // Call the parent's handleClose function
    handleClose();
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <Box className={styles.formContainer}>
      {error && <Alert severity="error" className={styles.errorAlert} ref={errorAlertRef}>{error}</Alert>}
      
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f9f9fb', mb: 1.5 }}>
        {/* Wallet and Category Section */}
        <Box sx={{ mb: 2 }}>
          {/* Wallet Selection */}
          <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
            <Box className={styles.labelContainer}>
              <Typography variant="subtitle2" className={styles.labelText}>
                <AccountBalanceWalletIcon className={styles.labelIcon} />
                {t('transactions.wallet')}
                {sharedWalletBadge}
                {formData.accountId && accounts.length > 0 && (
                  <Typography 
                    component="span" 
                    className={styles.walletBalance}
                    sx={{ 
                      fontSize: '0.65rem', 
                      opacity: 0.75,
                      fontWeight: 400
                    }}
                  >
                    ({formatCurrency(accounts.find(a => a.id.toString() === formData.accountId.toString())?.balance || 0)})
                  </Typography>
                )}
              </Typography>
              <Box className={styles.actionButtonsContainer}>
                <IconButton 
                  size="small" 
                  className={styles.addIconButton}
                  onClick={() => setAccountFormOpen(true)}
                  disabled={loading}
                  title={t('transactions.addWallet')}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  className={styles.manageButton}
                  onClick={handleOpenWalletManage}
                  disabled={loading}
                  title={t('transactions.manageWallets')}
                >
                  <AccountBalanceWalletIcon fontSize="small" />
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
                '& .MuiInputBase-root': { height: '36px' },
                '& .MuiSelect-select': { fontSize: '0.8rem' }
              }}
              renderValue={renderWalletValue}
            >
              <MenuItem value="" disabled>
                <Typography sx={{ fontSize: '0.8rem' }}>{t('transactions.selectWallet')}</Typography>
              </MenuItem>
              {accounts.map((account) => (
                <MenuItem 
                  key={account.id} 
                  value={account.id.toString()}
                  sx={{ fontSize: '0.8rem' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {account.accountName}
                    {sharedWallets && Object.keys(sharedWallets).length > 0 && sharedWallets[account.id] && (
                      <Typography 
                        component="span"
                        variant="caption"
                        className={styles.sharedWalletBadge}
                      >
                        ({t('transactions.sharedWallet')})
                      </Typography>
                    )}
                    {account.balance !== undefined && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ marginLeft: 'auto', fontSize: '0.75rem' }}
                      >
                        {formatCurrency(account.balance)}
                      </Typography>
                    )}
                  </Box>
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
                {t('transactions.category')}
                {formData.transactionType === 'EXPENSE' && categorySpendingData && categorySpendingData.limit > 0 && (
                  <Typography 
                    component="span" 
                    variant="caption" 
                    className={`${styles.categoryInfoText} ${categoryExcessAmount > 0 ? styles.categoryExceedingText : ''}`}
                  >
                    {categoryExcessAmount > 0 ? 
                      `(${t('transactions.exceedingLimitBy')} ${formatCurrency(categoryExcessAmount)})` : 
                      initialData ?
                        `(${t('transactions.limit')}: ${formatCurrency(categorySpendingData.limit)}, ${t('transactions.current')}: ${formatCurrency(categorySpendingData.originalTotalSpent ? categorySpendingData.originalTotalSpent : categorySpendingData.totalSpent)})` :
                        `(${t('transactions.limit')}: ${formatCurrency(categorySpendingData.limit)}, ${t('transactions.left')}: ${formatCurrency(Math.max(0, categorySpendingData.limit - categorySpendingData.totalSpent))}, ${Math.round((1 - categorySpendingData.totalSpent / categorySpendingData.limit) * 100)}%)`
                    }
                  </Typography>
                )}
                
                {formData.transactionType === 'INCOME' && formData.categoryId && selectedCategory && selectedCategory.spendingLimit > 0 && (
                  <Typography 
                    component="span" 
                    variant="caption" 
                    className={`${styles.categoryInfoText} ${
                      categorySpendingData && categorySpendingData.totalSpent > 0 ? 
                        categorySpendingData.percentage >= 85 ? 
                          styles.categoryHighAchievementText : 
                          styles.categoryIncomeText 
                        : ''
                    }`}
                  >
                    {(() => {
                      const goalAmount = parseFloat(selectedCategory.spendingLimit);
                      
                      if (categorySpendingData) {
                        const collectedAmount = categorySpendingData.originalTotalSpent ? 
                          categorySpendingData.originalTotalSpent : 
                          categorySpendingData.totalSpent;
                        
                        const percentAchieved = Math.min(100, Math.round((collectedAmount / goalAmount) * 100)) || 0;
                        
                        return `(${t('categories.goal')}: ${formatCurrency(goalAmount)}, ${t('categories.collected')}: ${formatCurrency(collectedAmount)}, ${percentAchieved}%)`;
                      }
                      
                      return `(${t('categories.goal')}: ${formatCurrency(goalAmount)})`;
                    })()}
                  </Typography>
                )}
              </Typography>
              <Box className={styles.actionButtonsContainer}>
                <IconButton 
                  size="small" 
                  className={styles.addIconButton}
                  onClick={() => setCategoryFormOpen(true)}
                  disabled={loading}
                  title={t('transactions.addCategory')}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  className={styles.manageButton}
                  onClick={handleOpenCategoryManage}
                  disabled={loading}
                  title={t('transactions.manageCategories')}
                >
                  <CategoryIcon fontSize="small" />
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
                '& .MuiInputBase-root': { height: '36px' },
                '& .MuiSelect-select': { fontSize: '0.8rem' }
              }}
              renderValue={renderValue}
            >
              <MenuItem value="" disabled>
                <Typography sx={{ fontSize: '0.8rem' }}>{t('transactions.selectCategory')}</Typography>
              </MenuItem>
              {categories
                .filter(category => category.type === formData.transactionType)
                .map((category) => (
                <MenuItem key={category.id} value={category.id.toString()} sx={{ fontSize: '0.8rem' }}>
                  {category.categoryName}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && <FormHelperText error>{errors.categoryId}</FormHelperText>}
            
            {/* Display category limit warnings under the dropdown */}
            {formData.transactionType === 'EXPENSE' && categorySpendingData && categorySpendingData.limit > 0 && (
              <Box className={styles.categoryInfoBox}>
                {categoryExcessAmount > 0 ? (
                  <Alert 
                    severity="error" 
                    icon={<ErrorIcon fontSize="small" />}
                    className={styles.categoryAlert}
                  >
                    {initialData ? 
                      t('transactions.exceedLimitUpdateWarning', {
                        total: formatCurrency(categorySpendingData.totalSpent + parseFloat(formData.amount || 0))
                      }) :
                      t('transactions.exceedLimitNewWarning', {
                        total: formatCurrency(categorySpendingData.totalSpent + parseFloat(formData.amount || 0))
                      })
                    }
                  </Alert>
                ) : isExceedingWarningThreshold() ? (
                  <Alert 
                    severity="warning" 
                    icon={<WarningIcon fontSize="small" />}
                    className={styles.categoryAlert}
                  >
                    {initialData ?
                      t('transactions.approachingLimitUpdateWarning', {
                        limit: formatCurrency(categorySpendingData.limit),
                        total: formatCurrency(categorySpendingData.totalSpent + parseFloat(formData.amount || 0))
                      }) :
                      t('transactions.approachingLimitNewWarning', {
                        limit: formatCurrency(categorySpendingData.limit),
                        total: formatCurrency(categorySpendingData.totalSpent + parseFloat(formData.amount || 0))
                      })
                    }
                  </Alert>
                ) : null}
              </Box>
            )}
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
                  {t('transactions.amount')}
                </Typography>
              </Box>
              
              {/* Add a position relative wrapper for the tooltip positioning */}
              <Box sx={{ position: 'relative' }}>
                <MoneyInput
                  name="amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  error={errors.amount}
                  disabled={loading}
                  size="small"
                  label=""
                  className={`${styles.inputField} ${styles.amountField} ${errors.amount && errors.amount.includes('Insufficient funds') ? styles.insufficientFundsError : ''}`}
                  sx={{ '& .MuiInputBase-root': { height: '36px' } }}
                />
                
                {/* Add tooltip for insufficient funds - only show when there are insufficient funds */}
                {hasInsufficientFunds() && (
                  <Box className={styles.fundsErrorPopup}>
                    <ErrorIcon fontSize="small" />
                    <span>
                      {(() => {
                        const selectedAccount = accounts.find(a => a.id.toString() === formData.accountId.toString());
                        if (selectedAccount) {
                          const walletBalance = selectedAccount.balance || 0;
                          return t('transactions.insufficientFundsWithBalance', {
                            balance: formatCurrency(walletBalance)
                          });
                        }
                        return t('transactions.insufficientFunds');
                      })()}
                    </span>
                  </Box>
                )}
              </Box>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth className={styles.formControl} sx={{ mb: 1 }}>
              <Box className={styles.labelContainer}>
                <Typography variant="subtitle2" className={styles.labelText}>
                  <CalendarTodayIcon className={styles.labelIcon} />
                  {t('transactions.date')}
                </Typography>
              </Box>
              <DatePicker
                value={formData.transactionDate}
                onChange={handleDateChange}
                disabled={loading}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    error: !!errors.transactionDate,
                    helperText: errors.transactionDate,
                    className: styles.dateField,
                    fullWidth: true,
                    size: "small",
                    sx: { 
                      '& .MuiInputBase-root': { height: '36px' },
                      '& .MuiInputBase-input': { fontSize: '0.8rem' }
                    }
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
              {t('transactions.description')}
            </Typography>
          </Box>
          <TextField
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('transactions.descriptionPlaceholder')}
            error={!!errors.description}
            helperText={errors.description}
            disabled={loading}
            multiline
            rows={2}
            size="small"
            className={`${styles.inputField} ${styles.descriptionField}`}
            inputProps={{
              maxLength: 500,
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">
              {formData.description.length}/500 {t('common.characters')}
            </Typography>
          </Box>
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
            <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
            <span style={{ marginLeft: '3px' }}>{t('transactions.expense')}</span>
          </ToggleButton>
          <ToggleButton value="INCOME" aria-label="income" className={styles.incomeToggle}>
            <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
            <span style={{ marginLeft: '3px' }}>{t('transactions.income')}</span>
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!embedded && (
            <Button 
              onClick={handleDialogClose} 
              disabled={submitting} 
              className={styles.cancelButton}
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button 
            variant="contained" 
            color={formData.transactionType === 'EXPENSE' ? 'error' : 'success'}
            onClick={handleSubmit}
            disabled={submitting || loading || hasInsufficientFunds()}
            startIcon={submitting ? <CircularProgress size={18} /> : null}
            className={styles.saveTransactionButton}
          >
            {submitting ? t('common.saving') : formData.transactionType === 'EXPENSE' ? t('transactions.saveExpense') : t('transactions.saveIncome')}
          </Button>
        </Box>
      </Box>
      
      {/* Edit Category Dialog */}
      <Dialog
        open={editCategoryOpen}
        onClose={handleEditCategoryClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
        ref={editCategoryDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.editCategory')}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            placeholder={t('transactions.categoryName')}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleEditCategoryClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEditCategorySave}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <Dialog
        open={deleteCategoryOpen}
        onClose={handleDeleteCategoryClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
        ref={deleteCategoryDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.deleteCategory')}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText>
            {t('transactions.deleteCategoryConfirm', { categoryName: deleteCategoryName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDeleteCategoryClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteCategoryConfirm}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Wallet Dialog */}
      <Dialog
        open={editWalletOpen}
        onClose={handleEditWalletClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
        ref={editWalletDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.editWallet')}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            value={editWalletName}
            onChange={(e) => setEditWalletName(e.target.value)}
            placeholder={t('transactions.walletName')}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleEditWalletClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEditWalletSave}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Wallet Dialog */}
      <Dialog
        open={deleteWalletOpen}
        onClose={handleDeleteWalletClose}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
        ref={deleteWalletDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.deleteWallet')}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText>
            {t('transactions.deleteWalletConfirm', { walletName: deleteWalletName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDeleteWalletClose}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteWalletConfirm}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 500, boxShadow: 'none' }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Wallet Form Dialog */}
      <Dialog 
        open={accountFormOpen} 
        onClose={() => setAccountFormOpen(false)}
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' } }}
        ref={categoryFormDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.addWallet')}</DialogTitle>
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
        ref={categoryFormDialogRef}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>{t('transactions.addCategory')}</DialogTitle>
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
      
      {/* Category Manage Form Dialog */}
      <Dialog 
        open={categoryManageFormOpen} 
        onClose={handleCloseCategoryManage}
        maxWidth="sm"
        fullWidth={true}
        PaperProps={{
          className: styles.dialogPaper,
          style: { 
            width: '500px', 
            maxWidth: '90vw'
          }
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          <CategoryManageForm 
            open={true} 
            handleClose={handleCloseCategoryManage}
            onCategoryUpdated={() => {
              // Refresh categories when form is closed
              handleCloseCategoryManage();
              const fetchNewCategories = async () => {
                try {
                  const categoriesResponse = await FinanceService.getCategories();
                  setCategories(categoriesResponse.data || []);
                } catch (err) {
                  console.error('Error refreshing categories:', err);
                }
              };
              fetchNewCategories();
            }}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Wallet Management Form */}
      <WalletManageForm
        open={walletManageFormOpen}
        handleClose={handleCloseWalletManage}
        onWalletUpdated={() => {
          // Refresh wallets data
          FinanceService.getAccounts().then(response => {
            setAccounts(response.data || []);
          });
        }}
      />
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
      onClose={handleDialogClose}
      fullWidth
      maxWidth="sm"
      disableScrollLock={true}
      PaperProps={{
        className: styles.dialogPaper
      }}
      TransitionComponent={SlideTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle className={styles.dialogTitle}>
        {formData.transactionType === 'EXPENSE' ? 
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowUpwardIcon sx={{ mr: 0.8, color: '#ff3b30', fontSize: '1.1rem' }} />
            {initialData ? t('transactions.editExpense') : t('transactions.addTransaction')}
          </Box> : 
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowDownwardIcon sx={{ mr: 0.8, color: '#34c759', fontSize: '1.1rem' }} />
            {initialData ? t('transactions.editIncome') : t('transactions.addTransaction')}
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
