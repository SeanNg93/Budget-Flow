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
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const CategoryForm = ({ open, handleClose, onCategoryAdded, embedded = false, compact = false, defaultType = 'EXPENSE' }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryName: '',
    type: defaultType
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update type when defaultType prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: defaultType
    }));
  }, [defaultType]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.categoryName) {
      newErrors.categoryName = 'Category name is required';
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
      await FinanceService.createCategory(formData);
      
      // Reset form
      resetForm();
      
      // Close dialog and notify parent
      if (onCategoryAdded) {
        onCategoryAdded();
      }
      
      if (!embedded) {
        handleClose();
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.response?.data?.message || 'Failed to create category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      categoryName: '',
      type: defaultType
    });
    setErrors({});
    setError('');
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: compact ? 1 : 2 }}>{error}</Alert>}
      
      <Grid container spacing={compact ? 1 : 2} sx={{ mt: compact ? 0 : 0.5 }}>
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.categoryName} size="small" sx={{ mb: 0 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Category Name
            </Typography>
            <TextField
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              placeholder={formData.type === 'INCOME' ? 'e.g., Salary, Bonus, Investments' : 'e.g., Groceries, Rent, Utilities'}
              error={!!errors.categoryName}
              helperText={errors.categoryName}
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
      </Grid>
      
      <Box sx={{ mt: compact ? 1 : 2, display: 'flex', justifyContent: 'flex-end' }}>
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
          size={compact ? "small" : "medium"}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none'
          }}
        >
          {submitting ? 'Saving...' : 'Save Category'}
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
          width: '450px',
          maxHeight: '85vh',
          margin: '16px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 1.5, fontWeight: 600 }}>Add Category</DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 1.5, px: 2 }}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm; 