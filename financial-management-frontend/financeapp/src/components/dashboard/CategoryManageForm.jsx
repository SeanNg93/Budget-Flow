import React, { useState, useEffect, useRef } from 'react';
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
  Slider,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip,
  Fade
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FinanceService from '../../services/FinanceService';
import CategoryForm from './CategoryForm';
import styles from '../../styles/walletManage.module.css';

// Create a FadeTransition component with forwardRef
const FadeTransition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const CategoryManageForm = ({ open, handleClose, onCategoryUpdated, embedded = false }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState('EXPENSE');
  
  // Edit category states
  const [editMode, setEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSpendingLimit, setEditSpendingLimit] = useState('');
  const [editWarningPercentage, setEditWarningPercentage] = useState(80);
  
  // New category form state
  const [newCategoryFormOpen, setNewCategoryFormOpen] = useState(false);
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Refs for transitions
  const deleteDialogRef = useRef(null);
  const newCategoryDialogRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, tabValue]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get categories by type
      const response = await FinanceService.getCategoriesByType(tabValue);
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditClick = (category) => {
    setEditMode(true);
    setEditCategoryId(category.id);
    setEditCategoryName(category.categoryName);
    setEditSpendingLimit(category.spendingLimit || '');
    setEditWarningPercentage(category.warningPercentage || 80);
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditCategoryId(null);
    setEditCategoryName('');
    setEditSpendingLimit('');
    setEditWarningPercentage(80);
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
        spendingLimit: editSpendingLimit || null,
        warningPercentage: editWarningPercentage
      };
      
      // Call API to update category
      await FinanceService.updateCategory(editCategoryId, updatedCategory);
      
      // Reset edit mode
      setEditMode(false);
      setEditCategoryId(null);
      setEditCategoryName('');
      setEditSpendingLimit('');
      setEditWarningPercentage(80);
      
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

  const calculateWarningAmount = (limit, percentage) => {
    if (!limit) return 0;
    const numericLimit = parseFloat(limit);
    return numericLimit * (percentage / 100);
  };

  const handleOpenNewCategoryForm = () => {
    setNewCategoryFormOpen(true);
  };

  const handleCloseNewCategoryForm = () => {
    setNewCategoryFormOpen(false);
  };

  const handleCategoryAdded = () => {
    handleCloseNewCategoryForm();
    fetchCategories();
    
    // Notify parent component
    if (onCategoryUpdated) {
      onCategoryUpdated();
    }
  };

  // Form content that will be used in both embedded and non-embedded modes
  const formContent = (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="category type tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              minWidth: 100
            }
          }}
        >
          <Tab label="Expenses" value="EXPENSE" />
          <Tab label="Income" value="INCOME" />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewCategoryForm}
          disabled={editMode || loading}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: 'none',
            fontWeight: 500
          }}
        >
          New Category
        </Button>
      </Box>
      
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
                  <Box sx={{ width: '100%' }}>
                    <Box className={styles.editContainer} sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        placeholder="Category name"
                        className={styles.textField}
                        sx={{ mb: 2 }}
                      />
                      
                      {tabValue === 'EXPENSE' && (
                        <>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Spending Limit"
                            value={editSpendingLimit}
                            onChange={(e) => setEditSpendingLimit(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                            placeholder="Set a spending limit"
                            className={styles.textField}
                            sx={{ mb: 2 }}
                          />
                          
                          <Box sx={{ px: 1, mb: 1 }}>
                            <Typography id="warning-percentage-slider" gutterBottom variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Warning at percentage:</span>
                              <span>{editWarningPercentage}%</span>
                            </Typography>
                            <Slider
                              value={editWarningPercentage}
                              onChange={(e, newValue) => setEditWarningPercentage(newValue)}
                              aria-labelledby="warning-percentage-slider"
                              valueLabelDisplay="auto"
                              step={5}
                              marks
                              min={50}
                              max={95}
                            />
                            
                            {editSpendingLimit && (
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <WarningIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                                Warning at: ${calculateWarningAmount(editSpendingLimit, editWarningPercentage).toFixed(2)}
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        color="inherit" 
                        size="small"
                        onClick={handleEditCancel}
                        startIcon={<CancelIcon />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none'
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        onClick={handleEditSave}
                        disabled={loading}
                        startIcon={<SaveIcon />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Typography variant="body1" className={styles.walletName}>
                          {category.categoryName}
                        </Typography>
                      }
                      secondary={
                        category.spendingLimit ? (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Limit: ${parseFloat(category.spendingLimit).toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <WarningIcon fontSize="small" sx={{ mr: 0.5, color: 'warning.main' }} />
                              Warn at: ${calculateWarningAmount(category.spendingLimit, category.warningPercentage || 80).toFixed(2)} ({category.warningPercentage || 80}%)
                            </Typography>
                          </Box>
                        ) : tabValue === 'EXPENSE' ? (
                          <Typography variant="body2" color="text.secondary">
                            No spending limit set
                          </Typography>
                        ) : null
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
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: deleteDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 400
        }}
        ref={deleteDialogRef}
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
      
      {/* New Category Form Dialog */}
      <Dialog
        open={newCategoryFormOpen}
        onClose={handleCloseNewCategoryForm}
        maxWidth="sm"
        PaperProps={{
          className: styles.walletFormDialog
        }}
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: newCategoryDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 400
        }}
        ref={newCategoryDialogRef}
      >
        <DialogTitle sx={{ pb: 1, pt: 1.5, fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Add New Category
            <IconButton size="small" onClick={handleCloseNewCategoryForm}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CategoryForm 
            embedded={true} 
            compact={true} 
            defaultType={tabValue}
            onCategoryAdded={handleCategoryAdded}
          />
        </DialogContent>
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
      onClose={embedded ? null : handleClose}
      maxWidth="sm"
      PaperProps={{
        className: styles.dialogPaper,
        style: { width: '65%', maxWidth: '650px' }
      }}
      TransitionComponent={FadeTransition}
      TransitionProps={{
        nodeRef: dialogRef,
        mountOnEnter: true,
        unmountOnExit: true,
        timeout: 400
      }}
      ref={dialogRef}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Box className={styles.headerContainer}>
          <Typography variant="h6" className={styles.title}>
            Manage Categories
            <span className={styles.walletCount}>
              (Total: {categories.length})
            </span>
          </Typography>
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