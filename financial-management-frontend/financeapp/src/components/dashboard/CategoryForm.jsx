import React, { useState } from 'react';
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

const CategoryForm = ({ open, handleClose, onCategoryAdded, embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryName: '',
    type: 'EXPENSE'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    
    if (!formData.type) {
      newErrors.type = 'Category type is required';
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
      type: 'EXPENSE'
    });
    setErrors({});
    setError('');
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.categoryName} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Category Name
            </Typography>
            <TextField
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              placeholder="e.g., Groceries, Rent, Salary"
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
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.type} size="small" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Category Type
            </Typography>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              displayEmpty
              disabled={loading}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="EXPENSE">Expense</MenuItem>
              <MenuItem value="INCOME">Income</MenuItem>
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>
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
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Add Category</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm; 