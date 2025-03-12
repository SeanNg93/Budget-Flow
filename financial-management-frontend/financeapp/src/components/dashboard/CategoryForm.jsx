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
  Alert
} from '@mui/material';
import FinanceService from '../../services/FinanceService';

const CategoryForm = ({ open, handleClose, onCategoryAdded }) => {
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
      // Format the data for the API
      const categoryData = {
        categoryName: formData.categoryName,
        type: formData.type
      };
      
      // Call the API to create the category
      await FinanceService.createCategory(categoryData);
      
      // Reset form and close dialog
      resetForm();
      handleClose();
      
      // Notify parent component
      if (onCategoryAdded) {
        onCategoryAdded();
      }
    } catch (error) {
      // Check if it's a 403 error (Forbidden)
      if (error.response && error.response.status === 403) {
        setError('You do not have permission to create categories. Please contact your administrator.');
      } else {
        setError('Failed to create category. Please try again.');
      }
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Category</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {!loading && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleChange}
                error={!!errors.categoryName}
                helperText={errors.categoryName}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Category Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Category Type"
                >
                  <MenuItem value="INCOME">Income</MenuItem>
                  <MenuItem value="EXPENSE">Expense</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
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
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryForm; 