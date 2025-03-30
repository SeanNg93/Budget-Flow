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
import SearchIcon from '@mui/icons-material/Search';
import FinanceService from '../../services/FinanceService';
import CategoryForm from './CategoryForm';
import styles from '../../styles/walletManage.module.css';
import { useTranslation } from 'react-i18next';

// Create a FadeTransition component with forwardRef
const FadeTransition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const CategoryManageForm = ({ open, handleClose, onCategoryUpdated, embedded = false }) => {
  const { t } = useTranslation();
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

  // Add a new state for storing spending progress data
  const [categorySpending, setCategorySpending] = useState({});

  // Add a new state for search query
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, tabValue]);

  useEffect(() => {
    if (open && categories.length > 0) {
      // Fetch spending progress for categories with a spending limit
      fetchCategorySpendingProgress();
    }
  }, [open, categories, tabValue]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get categories by type
      const response = await FinanceService.getCategoriesByType(tabValue);
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(t('categories.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorySpendingProgress = async () => {
    // Now fetch for both categories with spending limits
    const categoriesToFetch = categories.filter(
      cat => cat.spendingLimit
    );
    
    if (categoriesToFetch.length === 0) return;
    
    const spendingData = {};
    
    try {
      // Fetch spending progress for each category
      await Promise.all(
        categoriesToFetch.map(async (category) => {
          try {
            const response = await FinanceService.getCategorySpendingProgress(category.id);
            spendingData[category.id] = response.data;
          } catch (err) {
            console.error(`Error fetching data for category ${category.id}:`, err);
            // Set default values if fetch fails
            spendingData[category.id] = { 
              totalSpent: 0, 
              percentage: 0,
              limit: category.spendingLimit,
              warningThreshold: category.type === 'EXPENSE' ? 
                category.spendingLimit * (category.warningPercentage || 80) / 100 : 0
            };
          }
        })
      );
      
      setCategorySpending(spendingData);
    } catch (err) {
      console.error('Error fetching category spending data:', err);
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
      setError(t('category.errors.nameRequired'));
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
      setError(err.response?.data?.message || t('categories.errors.updateFailed'));
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
      setError(err.response?.data?.message || t('categories.errors.deleteFailed'));
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
      
      {/* Search and filter bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ position: 'relative', flexGrow: 1, mb: 1 }}>
          <TextField
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" sx={{ fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '8px',
                fontSize: '0.9rem',
                height: '38px'
              }
            }}
            size="small"
          />
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenNewCategoryForm}
          startIcon={<AddIcon />}
          size="small"
          sx={{
            ml: 1,
            mb: 1,
            borderRadius: '8px',
            textTransform: 'none',
            boxShadow: 'none',
            whiteSpace: 'nowrap',
            fontSize: '0.85rem',
            px: 1.5
          }}
        >
          {t('category.addCategory')}
        </Button>
      </Box>
      
      {/* Tab navigation for category types */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="category-type-tabs"
        className={styles.categoryTabs}
        sx={{ 
          minHeight: '40px',
          '& .MuiTab-root': {
            fontSize: '0.85rem',
            minHeight: '40px',
            textTransform: 'none',
            fontWeight: 500
          }
        }}
      >
        <Tab 
          value="EXPENSE" 
          label={t('transactions.expense')} 
          sx={{ 
            color: '#ff3b30',
            '&.Mui-selected': {
              color: '#ff3b30'
            }
          }}
        />
        <Tab 
          value="INCOME" 
          label={t('transactions.income')}
          sx={{
            color: '#34c759',
            '&.Mui-selected': {
              color: '#34c759'
            }
          }}
        />
      </Tabs>
      
      {loading ? (
        <Box className={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      ) : categories.length === 0 ? (
        <Typography variant="body1" className={styles.emptyMessage}>
          {t('categories.noCategories')}
        </Typography>
      ) : (
        <>
          {(() => {
            const filteredCategories = categories
              .filter(category => {
                if (!searchQuery) return true;
                return category.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
              });
            
            if (filteredCategories.length === 0) {
              return (
                <Typography variant="body1" className={styles.emptyMessage}>
                  {t('categories.noSearchMatch')}
                </Typography>
              );
            }
            
            return (
              <List className={styles.walletList}>
                {filteredCategories.map((category, index) => (
                  <React.Fragment key={category.id}>
                    <ListItem 
                      className={`${styles.walletItem} ${editCategoryId === category.id ? styles.walletItemEditing : ''} 
                        ${tabValue === 'INCOME' ? styles.incomeCategory : ''}`}
                      sx={{ 
                        p: 2, 
                        borderLeft: category.spendingLimit ? `4px solid ${tabValue === 'EXPENSE' ? '#ff3b30' : '#34c759'}` : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.03)'
                        }
                      }}
                    >
                      {editMode && editCategoryId === category.id ? (
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <Grid container spacing={1.5}>
                            <Grid item xs={12}>
                              <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
                                {t('categories.categoryName')}
                              </Typography>
                              <TextField
                                fullWidth
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                variant="outlined"
                                size="small"
                                error={!editCategoryName.trim()}
                                helperText={!editCategoryName.trim() ? t('category.errors.nameRequired') : ''}
                                sx={{ 
                                  mb: 1.5,
                                  '& .MuiOutlinedInput-root': {
                                    fontSize: '0.9rem'
                                  }
                                }}
                              />
                            </Grid>
                            
                            {tabValue === 'EXPENSE' && (
                              <>
                                <Grid item xs={7}>
                                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
                                    {t('categories.spendingLimit')}
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    value={editSpendingLimit}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setEditSpendingLimit(value);
                                      }
                                    }}
                                    placeholder={t('categories.spendingLimitPlaceholder')}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                      sx: { fontSize: '0.9rem' }
                                    }}
                                  />
                                </Grid>
                                
                                <Grid item xs={5}>
                                  <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
                                    {t('categories.warnAt')}
                                  </Typography>
                                  <TextField
                                    fullWidth
                                    value={`${editWarningPercentage}%`}
                                    disabled
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">
                                        <Tooltip title={t('categories.warningAtPercentage')} arrow>
                                          <InfoIcon fontSize="small" sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                        </Tooltip>
                                      </InputAdornment>,
                                      sx: { fontSize: '0.9rem' }
                                    }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} sx={{ mt: 0.5 }}>
                                  <Slider
                                    value={editWarningPercentage}
                                    onChange={(e, newValue) => setEditWarningPercentage(newValue)}
                                    min={10}
                                    max={100}
                                    step={5}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${value}%`}
                                    sx={{ 
                                      mt: 1,
                                      '& .MuiSlider-valueLabel': {
                                        fontSize: '0.75rem'
                                      }
                                    }}
                                  />
                                </Grid>
                              </>
                            )}
                          </Grid>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1 }}>
                            <Button 
                              startIcon={<CancelIcon />}
                              onClick={handleEditCancel}
                              size="small"
                              sx={{ mr: 1, fontSize: '0.85rem' }}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              startIcon={<SaveIcon />}
                              onClick={handleEditSave}
                              disabled={!editCategoryName.trim() || loading}
                              size="small"
                              sx={{ fontSize: '0.85rem' }}
                            >
                              {t('common.save')}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ width: '100%' }}>
                            <Box className={styles.categoryHeader}>
                              <Typography variant="subtitle1" className={styles.categoryName} sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                {category.categoryName}
                              </Typography>
                              <Box>
                                <IconButton 
                                  edge="end" 
                                  aria-label={t('common.edit')}
                                  onClick={() => handleEditClick(category)}
                                  disabled={editMode}
                                  size="small"
                                  sx={{ mr: 0.5 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label={t('common.delete')}
                                  onClick={() => handleDeleteClick(category)}
                                  disabled={editMode}
                                  size="small"
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            {category.spendingLimit ? (
                              <Box sx={{ width: '100%' }}>
                                <Box className={styles.limitInfo}>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main', opacity: 0.8 }} />
                                    {tabValue === 'EXPENSE' ? t('categories.limit') : t('categories.goal')}: ${parseFloat(category.spendingLimit).toFixed(2)}
                                  </Typography>
                                  {tabValue === 'EXPENSE' && (
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <WarningIcon fontSize="small" sx={{ mr: 0.5, color: 'warning.main' }} />
                                      {t('categories.warnAt')}: ${calculateWarningAmount(category.spendingLimit, category.warningPercentage || 80).toFixed(2)}
                                    </Typography>
                                  )}
                                </Box>
                                
                                {/* Progress bar visualization */}
                                <Box className={styles.progressBarContainer}>
                                  {tabValue === 'EXPENSE' && (
                                    <>
                                      {/* Warning threshold marker */}
                                      <Box 
                                        className={styles.warningMarker}
                                        style={{ left: `${category.warningPercentage || 80}%` }} 
                                      />
                                      
                                      {/* Warning threshold popup */}
                                      <Box
                                        className={styles.warningPopup}
                                        style={{ left: `${category.warningPercentage || 80}%` }}
                                      >
                                        {category.warningPercentage || 80}% {t('categories.warning')}
                                      </Box>
                                    </>
                                  )}
                                  
                                  {/* Actual spending or goal progress */}
                                  <Box 
                                    className={styles.progressBar}
                                    style={{ 
                                      width: `${categorySpending[category.id]?.percentage || 0}%`,
                                      backgroundColor: 
                                        tabValue === 'EXPENSE'
                                          ? (categorySpending[category.id]?.percentage || 0) >= (category.warningPercentage || 80) 
                                            ? '#ff9800' 
                                            : '#ff3b30'
                                          : '#34c759'
                                    }} 
                                  />
                                </Box>
                                
                                {/* Current spending vs. limit info or income vs. goal info */}
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                                  ${categorySpending[category.id]?.totalSpent?.toFixed(2) || '0.00'} / ${parseFloat(category.spendingLimit).toFixed(2)}
                                  {categorySpending[category.id]?.percentage ? 
                                    ` (${Math.round(categorySpending[category.id]?.percentage)}%)` : 
                                    ' (0%)'}
                                </Typography>
                              </Box>
                            ) : tabValue === 'EXPENSE' ? (
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                mt: 0.5, 
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <InfoIcon fontSize="small" className={styles.infoIconSmall} />
                                {t('categories.noSpendingLimit')}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                mt: 0.5, 
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <InfoIcon fontSize="small" className={styles.infoIconSmall} />
                                {t('categories.noIncomeGoal')}
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}
                    </ListItem>
                    {index < filteredCategories.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            );
          })()}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            width: '350px',
            maxWidth: '90vw',
            p: 0.5
          }
        }}
        TransitionComponent={FadeTransition}
        TransitionProps={{
          nodeRef: deleteDialogRef,
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: 300
        }}
        ref={deleteDialogRef}
      >
        <DialogTitle sx={{ fontSize: '1rem', pt: 2, pb: 1 }}>{t('categories.confirmDeletion')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem' }}>
            {t('categories.deleteConfirmMessage', { categoryName: deleteCategoryName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2 }}>
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.85rem' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : null}
            size="small"
            sx={{ fontSize: '0.85rem' }}
          >
            {deleting ? t('categories.deleting') : t('common.delete')}
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
        <DialogTitle sx={{ pb: 1, pt: 1.5, fontWeight: 600, fontSize: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {t('categories.addCategory')}
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
        style: { width: '500px', maxWidth: '90vw' }
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
          <Typography variant="h6" className={styles.title} sx={{ fontSize: '1.1rem' }}>
            {t('categories.manageCategories')}
            <span className={styles.walletCount} style={{ fontSize: '0.9rem' }}>
              ({t('categories.total')}: {categories.length})
            </span>
          </Typography>
          <IconButton 
            aria-label="close" 
            onClick={handleClose} 
            size="small"
            sx={{
              color: 'rgba(0, 0, 0, 0.54)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#007aff'
              }
            }}
          >
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