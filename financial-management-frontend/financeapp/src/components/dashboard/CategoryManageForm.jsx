import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogTitle,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  DialogActions,
  DialogContentText,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FinanceService from '../../services/FinanceService';
import styles from '../../styles/walletManage.module.css';

const CategoryManageForm = ({ open, handleClose, onCategoryUpdated, embedded = false }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit category states
  const [editMode, setEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryType, setEditCategoryType] = useState('');
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await FinanceService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category) => {
    setEditMode(true);
    setEditCategoryId(category.id);
    setEditCategoryName(category.categoryName);
    setEditCategoryType(category.type);
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditCategoryId(null);
    setEditCategoryName('');
    setEditCategoryType('');
  };

  const handleEditSave = async () => {
    if (!editCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Find the category to update
      const categoryToUpdate = categories.find(c => c.id === editCategoryId);
      
      if (!categoryToUpdate) {
        throw new Error('Category not found');
      }
      
      // Create updated category data
      const updatedCategory = {
        ...categoryToUpdate,
        categoryName: editCategoryName,
        type: editCategoryType
      };
      
      // Call API to update category
      await FinanceService.updateCategory(editCategoryId, updatedCategory);
      
      // Reset edit mode
      setEditMode(false);
      setEditCategoryId(null);
      setEditCategoryName('');
      setEditCategoryType('');
      
      // Refresh categories list
      fetchCategories();
      
      // Notify parent component
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
    setDeleteCategoryId(category.id);
    setDeleteCategoryName(category.categoryName);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteCategoryId(null);
    setDeleteCategoryName('');
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError('');
    
    try {
      // Call API to delete category
      await FinanceService.deleteCategory(deleteCategoryId);
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setDeleteCategoryId(null);
      setDeleteCategoryName('');
      
      // Refresh categories list
      fetchCategories();
      
      // Notify parent component
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryTypeColor = (type) => {
    return type === 'INCOME' ? 'success' : 'error';
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box className={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      ) : categories.length === 0 ? (
        <Typography variant="body1" className={styles.emptyMessage}>
          No categories found. Create a category to get started.
        </Typography>
      ) : (
        <List className={styles.walletList}>
          {categories.map((category, index) => (
            <React.Fragment key={category.id}>
              <ListItem 
                className={`${styles.walletItem} ${editCategoryId === category.id ? styles.walletItemEditing : ''}`}
              >
                {editMode && editCategoryId === category.id ? (
                  <Box className={styles.editContainer}>
                    <TextField
                      size="small"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="Category name"
                      className={styles.textField}
                      sx={{ flexGrow: 1 }}
                    />
                    <Select
                      size="small"
                      value={editCategoryType}
                      onChange={(e) => setEditCategoryType(e.target.value)}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="EXPENSE">Expense</MenuItem>
                      <MenuItem value="INCOME">Income</MenuItem>
                    </Select>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={handleEditSave}
                      disabled={loading}
                      className={`${styles.actionButton} ${styles.saveButton}`}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      size="small"
                      onClick={handleEditCancel}
                      className={styles.actionButton}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" className={styles.walletName}>
                            {category.categoryName}
                          </Typography>
                          <Chip 
                            label={category.type === 'INCOME' ? 'Income' : 'Expense'} 
                            color={getCategoryTypeColor(category.type)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditClick(category)}
                        disabled={editMode}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteClick(category)}
                        disabled={editMode}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
              {index < categories.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          className: styles.confirmDialog
        }}
      >
        <DialogTitle className={styles.confirmTitle}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the category "{deleteCategoryName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions className={styles.confirmActions}>
          <Button 
            onClick={handleDeleteCancel} 
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : null}
            className={styles.deleteButton}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
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
        className: styles.dialogPaper
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>Manage Categories</Typography>
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.dialogContent}>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManageForm; 