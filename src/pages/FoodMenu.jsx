import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  Switch,
  FormControlLabel,
  CircularProgress,
  Avatar,
  Divider,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  CardHeader,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  Visibility as VisibilityIcon,
  Photo as PhotoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Fastfood as FastfoodIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';

const FoodMenu = () => {
  const { databases, databaseId, collections, ID, storage, bucketId } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const theme = useTheme();
  
  // State for menu items
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  
  // State for categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete', 'view'
  
  // State for category dialog
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState('create'); // 'create', 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    itemDescription: '',
    categoryId: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
  });

  // Category form state
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    isActive: true,
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Collection IDs
  const COLLECTIONS = {
    foodMenu: '68373009002a61f5cf07',
    categories: '68503924002ea954e95f',
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterCategory !== 'all') {
        filters.push(Query.equal('category', filterCategory));
      }
      
      if (filterAvailability !== 'all') {
        filters.push(Query.equal('isAvailable', filterAvailability === 'available'));
      }
      
      if (searchQuery) {
        filters.push(Query.search('itemName', searchQuery));
      }
      
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.foodMenu,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        '$createdAt',
        'DESC'
      );
      
      setMenuItems(response.documents);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      showError(t('foodMenu.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories - fetches all using pagination
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Fetch all categories by paginating through results
      const allCategories = [];
      let offset = 0;
      const limit = 100; // Maximum allowed per request
      let hasMore = true;

      while (hasMore) {
        const response = await databases.listDocuments(
          databaseId,
          COLLECTIONS.categories,
          [],
          limit,
          offset,
          '$createdAt',
          'ASC'
        );

        allCategories.push(...response.documents);

        // Check if there are more documents to fetch
        if (response.documents.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
      
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError(t('categories.fetchError', 'Failed to fetch categories'));
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [paginationModel, searchQuery, filterCategory, filterAvailability]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle dialog open for create
  const handleCreate = () => {
    setFormData({
      itemName: '',
      itemDescription: '',
      categoryId: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
    });
    setImageFile(null);
    setImagePreview('');
    setDialogMode('create');
    setOpenDialog(true);
  };

  // Handle dialog open for view
  const handleView = (item) => {
    setSelectedMenuItem(item);
    setDialogMode('view');
    setOpenDialog(true);
  };

  // Handle dialog open for edit
  const handleEdit = (item) => {
    setSelectedMenuItem(item);
    setFormData({
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      categoryId: item.categoryId || item.category, // Support both old and new format
      price: item.price?.toString() || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    setDialogMode('edit');
    setOpenDialog(true);
  };

  // Handle dialog open for delete
  const handleDelete = (item) => {
    setSelectedMenuItem(item);
    setDialogMode('delete');
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMenuItem(null);
    setImageFile(null);
    setImagePreview('');
  };

  // Category dialog handlers
  const handleCreateCategory = () => {
    setCategoryFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      isActive: true,
    });
    setCategoryDialogMode('create');
    setOpenCategoryDialog(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name || '',
      nameAr: category.nameAr || '',
      description: category.description || '',
      descriptionAr: category.descriptionAr || '',
      isActive: category.isActive ?? true,
    });
    setCategoryDialogMode('edit');
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setSelectedCategory(null);
  };

  // Handle category input change
  const handleCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Appwrite storage
  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `food-menu-${timestamp}-${imageFile.name}`;
      
      // Upload to Appwrite storage
      const response = await storage.createFile(
        bucketId,
        ID.unique(),
        imageFile
      );
      
      // Get the file URL
      const fileUrl = storage.getFileView(bucketId, response.$id);
      
      return fileUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.itemName.trim()) {
      showError(t('foodMenu.validation.itemNameRequired'));
      return false;
    }
    if (!formData.itemDescription.trim()) {
      showError(t('foodMenu.validation.descriptionRequired'));
      return false;
    }
    if (!formData.categoryId) {
      showError(t('foodMenu.validation.categoryRequired'));
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      showError(t('foodMenu.validation.invalidPrice'));
      return false;
    }
    return true;
  };

  // Validate category form
  const validateCategoryForm = () => {
    if (!categoryFormData.name.trim()) {
      showError(t('categories.validation.nameRequired', 'Category name is required'));
      return false;
    }
    if (!categoryFormData.nameAr.trim()) {
      showError(t('categories.validation.nameArRequired', 'Arabic name is required'));
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Upload image if a new one is selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else {
          return; // Stop if image upload failed
        }
      }

      const menuItemData = {
        itemName: formData.itemName.trim(),
        itemDescription: formData.itemDescription.trim(),
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        imageUrl: imageUrl,
        isAvailable: formData.isAvailable,
        updatedAt: new Date().toISOString(),
      };

      if (dialogMode === 'create') {
        menuItemData.createdAt = new Date().toISOString();
        
        await databases.createDocument(
          databaseId,
          COLLECTIONS.foodMenu,
          ID.unique(),
          menuItemData
        );

        showSuccess(t('foodMenu.menuItemCreated'));
      } else if (dialogMode === 'edit') {
        await databases.updateDocument(
          databaseId,
          COLLECTIONS.foodMenu,
          selectedMenuItem.$id,
          menuItemData
        );

        showSuccess(t('foodMenu.menuItemUpdated'));
      }
      
      handleCloseDialog();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      showError(t('foodMenu.saveError'));
    }
  };

  // Submit category form
  const handleCategorySubmit = async () => {
    if (!validateCategoryForm()) return;

    try {
      const categoryData = {
        name: categoryFormData.name.trim(),
        nameAr: categoryFormData.nameAr.trim(),
        description: categoryFormData.description.trim(),
        descriptionAr: categoryFormData.descriptionAr.trim(),
        isActive: categoryFormData.isActive,
        updatedAt: new Date().toISOString(),
      };

      if (categoryDialogMode === 'create') {
        categoryData.createdAt = new Date().toISOString();
        
        await databases.createDocument(
          databaseId,
          COLLECTIONS.categories,
          ID.unique(),
          categoryData
        );

        showSuccess(t('categories.categoryCreated', 'Category created successfully'));
      } else if (categoryDialogMode === 'edit') {
        await databases.updateDocument(
          databaseId,
          COLLECTIONS.categories,
          selectedCategory.$id,
          categoryData
        );

        showSuccess(t('categories.categoryUpdated', 'Category updated successfully'));
      }
      
      handleCloseCategoryDialog();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showError(t('categories.saveError', 'Failed to save category'));
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    try {
      await databases.deleteDocument(
        databaseId,
        COLLECTIONS.foodMenu,
        selectedMenuItem.$id
      );

      showSuccess(t('foodMenu.menuItemDeleted'));
      handleCloseDialog();
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showError(t('foodMenu.deleteError'));
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (item) => {
    try {
      await databases.updateDocument(
        databaseId,
        COLLECTIONS.foodMenu,
        item.$id,
        {
          isAvailable: !item.isAvailable,
          updatedAt: new Date().toISOString(),
        }
      );

      showSuccess(t('foodMenu.menuItemUpdated'));
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
      showError(t('foodMenu.saveError'));
    }
  };

  // Data grid columns with enhanced styling
  const columns = [
    {
      field: 'imageUrl',
      headerName: 'Image',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params) => (
        params.value ? (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Avatar
              src={params.value}
              alt={params.row.itemName}
              variant="rounded"
              sx={{ 
                width: 40, 
                height: 40,
                border: `2px solid ${theme.palette.divider}`,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Avatar 
              variant="rounded" 
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.light, 0.3),
                color: theme.palette.primary.main,
                border: `2px solid ${theme.palette.divider}`
              }}
            >
              <RestaurantIcon fontSize="small" />
            </Avatar>
          </Box>
        )
      ),
    },
    {
      field: 'itemName',
      headerName: t('foodMenu.itemName'),
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.75rem'
          }}>
            {(params.value || 'M').charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'categoryId',
      headerName: t('foodMenu.category'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        // Find category by ID
        const category = categories.find(cat => cat.$id === params.value) || 
                         categories.find(cat => cat.name === params.row.category); // Fallback for old data
        
        const categoryColors = ['primary', 'secondary', 'warning', 'info', 'success', 'error'];
        const colorIndex = categories.findIndex(cat => cat.$id === params.value) % categoryColors.length;
        
        return (
          <Chip
            label={category ? category.name : (params.row.category || 'Unknown')}
            color={categoryColors[colorIndex] || 'default'}
            size="small"
            sx={{ 
              borderRadius: 2,
              fontWeight: 'medium'
            }}
            icon={<CategoryIcon />}
          />
        );
      },
    },
    {
      field: 'price',
      headerName: t('foodMenu.price'),
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0} OMR`}
          size="small"
          icon={<AttachMoneyIcon />}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.success.main, 0.2)
              : alpha(theme.palette.success.light, 0.3),
            color: theme.palette.success.main,
            fontWeight: 'bold',
            borderRadius: 2
          }}
        />
      ),
    },
    {
      field: 'isAvailable',
      headerName: t('foodMenu.isAvailable'),
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? t('common.active') : t('common.inactive')}
          color={params.value ? 'success' : 'error'}
          size="small"
          variant="filled"
          sx={{ 
            borderRadius: 2,
            fontWeight: 'medium'
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('common.createdAt'),
      flex: 0.9,
      minWidth: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 1.2,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={() => handleView(params.row)}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.info.main, 0.2)
                  : alpha(theme.palette.info.light, 0.3),
                color: theme.palette.info.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.info.main, 0.3)
                    : alpha(theme.palette.info.light, 0.5),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('foodMenu.toggleAvailability')}>
            <IconButton
              size="small"
              onClick={() => handleToggleAvailability(params.row)}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(params.row.isAvailable ? theme.palette.success.main : theme.palette.error.main, 0.2)
                  : alpha(params.row.isAvailable ? theme.palette.success.light : theme.palette.error.light, 0.3),
                color: params.row.isAvailable ? theme.palette.success.main : theme.palette.error.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(params.row.isAvailable ? theme.palette.success.main : theme.palette.error.main, 0.3)
                    : alpha(params.row.isAvailable ? theme.palette.success.light : theme.palette.error.light, 0.5),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {params.row.isAvailable ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('common.edit')}>
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.warning.main, 0.2)
                  : alpha(theme.palette.warning.light, 0.3),
                color: theme.palette.warning.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.warning.main, 0.3)
                    : alpha(theme.palette.warning.light, 0.5),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('common.delete')}>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row)}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.error.main, 0.2)
                  : alpha(theme.palette.error.light, 0.3),
                color: theme.palette.error.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.error.main, 0.3)
                    : alpha(theme.palette.error.light, 0.5),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory && item.category !== filterCategory) return false;
    if (filterAvailability === 'available' && !item.isAvailable) return false;
    if (filterAvailability === 'unavailable' && item.isAvailable) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const category = categories.find(cat => cat.$id === item.categoryId) || 
                       categories.find(cat => cat.name === item.category);
      return (
        item.itemName?.toLowerCase().includes(query) ||
        item.itemDescription?.toLowerCase().includes(query) ||
        category?.name?.toLowerCase().includes(query) ||
        category?.nameAr?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title={t('foodMenu.title')}
        actionLabel={t('foodMenu.create')}
        onAction={handleCreate}
      />
      
      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Card elevation={3} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: theme.palette.primary.contrastText,
              position: 'relative',
              overflow: 'hidden',
              transform: 'perspective(1000px) rotateX(0deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {menuItems.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('foodMenu.totalItems', 'Total Items')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <RestaurantIcon />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Card elevation={3} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: theme.palette.success.contrastText,
              position: 'relative',
              overflow: 'hidden',
              transform: 'perspective(1000px) rotateX(0deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {menuItems.filter(item => item.isAvailable).length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('foodMenu.availableItems', 'Available Items')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <CheckCircleIcon />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card elevation={3} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: theme.palette.warning.contrastText,
              position: 'relative',
              overflow: 'hidden',
              transform: 'perspective(1000px) rotateX(0deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {loadingCategories ? (
                        <CircularProgress size={24} sx={{ color: 'inherit' }} />
                      ) : (
                        categories.filter(category => category.isActive !== false).length
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('foodMenu.activeCategories', 'Active Categories')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <CategoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Card elevation={3} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: theme.palette.info.contrastText,
              position: 'relative',
              overflow: 'hidden',
              transform: 'perspective(1000px) rotateX(0deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(5deg) translateY(-5px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {menuItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('foodMenu.totalValue', 'Total Value (OMR)')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <AttachMoneyIcon />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>
      </Grid>
      
      <Fade in={true}>
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          {/* Enhanced Header Section */}
          <Box sx={{ 
            p: 3, 
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: theme.palette.primary.contrastText
          }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'inherit' }}>
              {t('foodMenu.subtitle', 'Manage restaurant menu items')}
            </Typography>
            
            {/* Search and Filter Controls */}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& input': { color: theme.palette.primary.contrastText },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('foodMenu.category')}
                  </InputLabel>
                  <Select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label={t('foodMenu.category')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.$id} value={category.$id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('foodMenu.isAvailable')}
                  </InputLabel>
                  <Select
                    value={filterAvailability}
                    onChange={(e) => setFilterAvailability(e.target.value)}
                    label={t('foodMenu.isAvailable')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    <MenuItem value="available">{t('common.active')}</MenuItem>
                    <MenuItem value="unavailable">{t('common.inactive')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={fetchMenuItems}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="outlined"
                    startIcon={<CategoryIcon />}
                    onClick={handleCreateCategory}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      fontWeight: 'medium',
                      textTransform: 'none',
                      mr: 1,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {t('categories.manage', 'Categories')}
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      fontWeight: 'medium',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    {t('foodMenu.create')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Loading Progress Bar */}
          {loading && (
            <LinearProgress 
              sx={{ 
                height: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }} 
            />
          )}

          {/* Enhanced Data Grid */}
          <Box sx={{ height: 600, width: '100%', p: 2 }}>
            <DataGrid
              rows={filteredMenuItems}
              columns={columns}
              getRowId={(row) => row.$id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              loading={loading}
              disableSelectionOnClick
              disableColumnMenu
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: theme.palette.text.primary
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 8px rgba(0,0,0,0.3)' 
                      : '0 4px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa',
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  '& .MuiDataGrid-columnHeader': {
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: theme.palette.text.primary
                  }
                }
              }}
              localeText={{
                noRowsLabel: (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <RestaurantIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  </Box>
                ),
              }}
            />
          </Box>
        </Paper>
      </Fade>
      
      {/* Enhanced Dialog System */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            maxHeight: '90vh',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          }
        }}
      >
        {dialogMode === 'delete' ? (
          <Fade in={true}>
            <Box>
              <DialogTitle sx={{ 
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                  : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                color: theme.palette.error.contrastText,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  <DeleteIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {t('foodMenu.deleteConfirm')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {selectedMenuItem?.itemName}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default 
              }}>
                <Alert 
                  severity="warning" 
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.warning.dark, 0.2)
                      : alpha(theme.palette.warning.light, 0.2),
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.warning.main}`,
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Typography variant="body1" fontWeight="medium">
                    Are you sure you want to delete "{selectedMenuItem?.itemName}"? This action cannot be undone.
                  </Typography>
                </Alert>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                borderTop: `1px solid ${theme.palette.divider}`, 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper 
                  : theme.palette.grey[50]
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleConfirmDelete} 
                  color="error" 
                  variant="contained"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.delete')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        ) : dialogMode === 'view' ? (
          <Fade in={true}>
            <Box>
              <DialogTitle sx={{ 
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
                  : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: theme.palette.info.contrastText,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  <VisibilityIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {selectedMenuItem?.itemName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {t('foodMenu.details', 'Menu Item Details')}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default 
              }}>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {selectedMenuItem?.imageUrl && (
                    <Grid item xs={12} md={4}>
                      <Card 
                        elevation={2} 
                        sx={{ 
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={selectedMenuItem.imageUrl}
                          alt={selectedMenuItem.itemName}
                          sx={{ objectFit: 'cover' }}
                        />
                      </Card>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={selectedMenuItem?.imageUrl ? 8 : 12}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                          {selectedMenuItem?.itemName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                          {selectedMenuItem?.itemDescription}
                        </Typography>
                        
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Chip
                            label={(() => {
                              const category = categories.find(cat => cat.$id === selectedMenuItem?.categoryId) || 
                                               categories.find(cat => cat.name === selectedMenuItem?.category);
                              return category ? category.name : (selectedMenuItem?.category || 'Unknown');
                            })()}
                            color="primary"
                            icon={<CategoryIcon />}
                            sx={{ borderRadius: 2 }}
                          />
                          <Chip
                            label={selectedMenuItem?.isAvailable ? t('common.active') : t('common.inactive')}
                            color={selectedMenuItem?.isAvailable ? 'success' : 'error'}
                            variant="filled"
                            sx={{ borderRadius: 2 }}
                          />
                        </Stack>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 2,
                          bgcolor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.success.light, 0.2),
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.success.main}`
                        }}>
                          <AttachMoneyIcon color="success" />
                          <Typography variant="h5" color="success.main" fontWeight="bold">
                            {selectedMenuItem?.price || 0} OMR
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                borderTop: `1px solid ${theme.palette.divider}`, 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper 
                  : theme.palette.grey[50]
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.close')}
                </Button>
                <Button 
                  onClick={() => {
                    handleCloseDialog();
                    handleEdit(selectedMenuItem);
                  }}
                  color="primary"
                  variant="contained"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.edit')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        ) : (
          <Fade in={true}>
            <Box>
              <DialogTitle sx={{ 
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: theme.palette.primary.contrastText,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  {dialogMode === 'create' ? <AddIcon /> : <EditIcon />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {dialogMode === 'create' ? t('foodMenu.create') : t('foodMenu.edit')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {dialogMode === 'create' ? 'Add new menu item' : 'Update menu item details'}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('foodMenu.itemName')}
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('foodMenu.category')}</InputLabel>
                      <Select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        label={t('foodMenu.category')}
                        sx={{ borderRadius: 2 }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.$id} value={category.$id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {categories.length === 0 && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                        {t('categories.noCategories', 'No categories available. Please create categories first.')}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('foodMenu.itemDescription')}
                      name="itemDescription"
                      value={formData.itemDescription}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('foodMenu.price')}
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">OMR</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.03)' 
                          : theme.palette.grey[50],
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isAvailable}
                            onChange={handleInputChange}
                            name="isAvailable"
                            color="success"
                          />
                        }
                        label={t('foodMenu.isAvailable')}
                        sx={{ flex: 1 }}
                      />
                      <Chip
                        label={formData.isAvailable ? t('common.active') : t('common.inactive')}
                        color={formData.isAvailable ? 'success' : 'error'}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      />
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('foodMenu.imageUrl')}
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhotoIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* Enhanced Image Upload Section */}
                  <Grid item xs={12}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardHeader 
                        title={t('foodMenu.uploadImage')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <PhotoIcon />
                          </Avatar>
                        }
                        sx={{ 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? theme.palette.secondary.dark 
                            : theme.palette.secondary.light,
                          color: theme.palette.secondary.contrastText,
                          '& .MuiCardHeader-title': {
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            color: 'inherit'
                          }
                        }}
                      />
                      <CardContent>
                        {/* Image Preview */}
                        {(imagePreview || formData.imageUrl) && (
                          <Box sx={{ mb: 3 }}>
                            <Card sx={{ maxWidth: 300, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
                              <CardMedia
                                component="img"
                                height="200"
                                image={imagePreview || formData.imageUrl}
                                alt="Menu item preview"
                                sx={{ objectFit: 'cover' }}
                              />
                              <CardContent sx={{ p: 2 }}>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={handleRemoveImage}
                                  startIcon={<DeleteIcon />}
                                  sx={{ 
                                    borderRadius: 2,
                                    textTransform: 'none'
                                  }}
                                >
                                  Remove Image
                                </Button>
                              </CardContent>
                            </Card>
                          </Box>
                        )}
                        
                        {/* File Upload */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          p: 3,
                          border: `2px dashed ${theme.palette.divider}`,
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.02)' 
                            : theme.palette.grey[50]
                        }}>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="image-upload"
                            type="file"
                            onChange={handleImageSelect}
                          />
                          <label htmlFor="image-upload">
                            <Button
                              variant="contained"
                              component="span"
                              startIcon={<PhotoIcon />}
                              disabled={uploadingImage}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 'medium'
                              }}
                            >
                              {t('foodMenu.selectImage')}
                            </Button>
                          </label>
                          
                          {uploadingImage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} />
                              <Typography variant="body2" color="text.secondary">
                                Uploading...
                              </Typography>
                            </Box>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" textAlign="center">
                            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                borderTop: `1px solid ${theme.palette.divider}`, 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper 
                  : theme.palette.grey[50]
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  color="primary" 
                  variant="contained"
                  disabled={uploadingImage}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {dialogMode === 'create' ? t('common.create') : t('common.save')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        )}
      </Dialog>
      
      {/* Category Management Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={handleCloseCategoryDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            maxHeight: '90vh',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          }
        }}
      >
        <Fade in={true}>
          <Box>
            <DialogTitle sx={{ 
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: theme.palette.secondary.contrastText,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'inherit' 
              }}>
                <CategoryIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {categoryDialogMode === 'create' ? t('categories.create', 'Create Category') : t('categories.edit', 'Edit Category')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                  {categoryDialogMode === 'create' ? 'Add new category' : 'Update category details'}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ 
              p: 3, 
              bgcolor: theme.palette.background.default
            }}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('categories.name', 'Category Name (English)')}
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('categories.nameAr', 'Category Name (Arabic)')}
                    name="nameAr"
                    value={categoryFormData.nameAr}
                    onChange={handleCategoryInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('categories.description', 'Description (English)')}
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('categories.descriptionAr', 'Description (Arabic)')}
                    name="descriptionAr"
                    value={categoryFormData.descriptionAr}
                    onChange={handleCategoryInputChange}
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Card 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.03)' 
                        : theme.palette.grey[50],
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={categoryFormData.isActive}
                          onChange={handleCategoryInputChange}
                          name="isActive"
                          color="success"
                        />
                      }
                      label={t('categories.isActive', 'Active Category')}
                      sx={{ flex: 1 }}
                    />
                    <Chip
                      label={categoryFormData.isActive ? t('common.active') : t('common.inactive')}
                      color={categoryFormData.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </Card>
                </Grid>
                
                {/* Categories List */}
                {categoryDialogMode === 'create' && categories.length > 0 && (
                  <Grid item xs={12}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardHeader 
                        title={t('categories.existing', 'Existing Categories')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CategoryIcon />
                          </Avatar>
                        }
                      />
                      <CardContent>
                        <Stack spacing={2}>
                          {categories.map((category) => (
                            <Box 
                              key={category.$id}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                p: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.02)' 
                                  : theme.palette.grey[50]
                              }}
                            >
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {category.name} / {category.nameAr}
                                </Typography>
                                {category.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {category.description}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={category.isActive ? t('common.active') : t('common.inactive')}
                                  color={category.isActive ? 'success' : 'error'}
                                  size="small"
                                  sx={{ borderRadius: 2 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditCategory(category)}
                                  sx={{ 
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.warning.main, 0.2)
                                      : alpha(theme.palette.warning.light, 0.3),
                                    color: theme.palette.warning.main
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`, 
              bgcolor: theme.palette.mode === 'dark' 
                ? theme.palette.background.paper 
                : theme.palette.grey[50]
            }}>
              <Button 
                onClick={handleCloseCategoryDialog}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleCategorySubmit} 
                color="primary" 
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                {categoryDialogMode === 'create' ? t('common.create') : t('common.save')}
              </Button>
            </DialogActions>
          </Box>
        </Fade>
      </Dialog>
    </>
  );
};

export default FoodMenu; 