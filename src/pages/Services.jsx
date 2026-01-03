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
  Tab,
  Tabs,
  Grid,
  InputAdornment,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  FormControlLabel,
  Switch,
  CardHeader,
  Avatar,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Image as ImageIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  EventAvailable as EventAvailableIcon,
  Language as LanguageIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';

const Services = () => {
  const { databases, databaseId, collections, storage, bucketId, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const theme = useTheme();
  
  // State for service data
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalServices, setTotalServices] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete', 'view'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('all');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // State for image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    type: 'maintenance',
    price: 0,
    duration: 0,
    isAvailable: true,
    imageUrl: '',
    providerName: '',
    providerContact: '',
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '',
  });
  
  // Service types
  const serviceTypes = [
    { id: 'maintenance', name: t('services.types.maintenance') },
    { id: 'cleaning', name: t('services.types.cleaning') },
    { id: 'laundry', name: t('services.types.laundry') },
    { id: 'transportation', name: t('services.types.transportation') },
    { id: 'other', name: t('services.types.other') },
  ];
  
  // Load services on initial load and when filters change
  useEffect(() => {
    fetchServices();
  }, [paginationModel, searchQuery, filterType, filterAvailability, currentTab]);
  
  // Fetch services from the database
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterType !== 'all') {
        filters.push(Query.equal('type', filterType));
      }
      
      if (filterAvailability !== 'all') {
        filters.push(Query.equal('isAvailable', filterAvailability === 'available'));
      }
      
      if (searchQuery) {
        // Search in both English and Arabic names
        filters.push(Query.search('nameEn', searchQuery));
        // You might need a different approach to search in both fields
      }
      
      if (currentTab === 'available') {
        filters.push(Query.equal('isAvailable', true));
      } else if (currentTab === 'unavailable') {
        filters.push(Query.equal('isAvailable', false));
      }
      
      // Fetch services
      const response = await databases.listDocuments(
        databaseId,
        collections.services,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize
      );
      
      setServices(response.documents);
      setTotalServices(response.total);
    } catch (error) {
      console.error('Error fetching services:', error);
      showError(t('services.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog open for create
  const handleCreateService = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      type: 'maintenance',
      price: 0,
      duration: 0,
      isAvailable: true,
      imageUrl: '',
      providerName: '',
      providerContact: '',
    });
    setFormErrors({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      price: '',
    });
    setSelectedImage(null);
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit
  const handleEditService = (service) => {
    setSelectedService(service);
    setFormData({
      nameEn: service.nameEn || '',
      nameAr: service.nameAr || '',
      descriptionEn: service.descriptionEn || '',
      descriptionAr: service.descriptionAr || '',
      type: service.type || 'maintenance',
      price: service.price || 0,
      duration: service.duration || 0,
      isAvailable: service.isAvailable === false ? false : true,
      imageUrl: service.imageUrl || '',
      providerName: service.providerName || '',
      providerContact: service.providerContact || '',
    });
    setFormErrors({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      price: '',
    });
    setSelectedImage(null);
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Handle dialog open for delete
  const handleDeleteService = (service) => {
    setSelectedService(service);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog open for view
  const handleViewService = (service) => {
    setSelectedService(service);
    setDialogMode('view');
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPaginationModel({
      page: 0,
      pageSize: paginationModel.pageSize,
    });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };
  
  // Handle switch toggle for isAvailable
  const handleAvailabilityChange = (e) => {
    setFormData({ ...formData, isAvailable: e.target.checked });
  };
  
  // Handle image selection
const handleImageChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    setSelectedImage(e.target.files[0]);
  }
};

// Upload image to storage
const uploadImage = async () => {
  if (!selectedImage) return null;
  
  try {
    setUploadingImage(true);
    
    // Create a unique file ID
    const fileId = ID.unique();
    
    // Upload file to storage
    const file = await storage.createFile(
      bucketId,
      fileId,
      selectedImage
    );
    
    // Get file preview URL using the file ID from the response
    const fileUrl = storage.getFilePreview(
      bucketId,
      file.$id
    );
    
    return fileUrl.href;
  } catch (error) {
    console.error('Error uploading image:', error);
    showError(t('services.imageUploadError'));
    return null;
  } finally {
    setUploadingImage(false);
  }
};
  
  // Validate form
  const validateForm = () => {
    const errors = {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      price: '',
    };
    
    if (!formData.nameEn.trim()) {
      errors.nameEn = t('services.validation.nameEnRequired');
    }
    
    if (!formData.nameAr.trim()) {
      errors.nameAr = t('services.validation.nameArRequired');
    }
    
    if (!formData.descriptionEn.trim()) {
      errors.descriptionEn = t('services.validation.descriptionEnRequired');
    }
    
    if (!formData.descriptionAr.trim()) {
      errors.descriptionAr = t('services.validation.descriptionArRequired');
    }
    
    if (formData.price < 0) {
      errors.price = t('services.validation.invalidPrice');
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      let imageUrl = formData.imageUrl;
      
      // Upload image if a new one is selected
      if (selectedImage) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }
      
      const serviceData = {
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        descriptionEn: formData.descriptionEn,
        descriptionAr: formData.descriptionAr,
        type: formData.type,
        price: Number(formData.price),
        duration: Number(formData.duration),
        isAvailable: formData.isAvailable,
        imageUrl: imageUrl,
        providerName: formData.providerName,
        providerContact: formData.providerContact,
      };
      
      if (dialogMode === 'create') {
        // Add timestamps for new documents
        serviceData.createdAt = new Date().toISOString();
        serviceData.updatedAt = new Date().toISOString();
        
        // Create new service
        await databases.createDocument(
          databaseId,
          collections.services,
          ID.unique(),
          serviceData
        );
        
        showSuccess(t('services.createSuccess'));
      } else if (dialogMode === 'edit') {
        // Update timestamp for edits
        serviceData.updatedAt = new Date().toISOString();
        
        // Update existing service
        await databases.updateDocument(
          databaseId,
          collections.services,
          selectedService.$id,
          serviceData
        );
        
        showSuccess(t('services.updateSuccess'));
      }
      
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      showError(t('services.saveError'));
    }
  };
  
  // Handle service deletion
  const handleConfirmDelete = async () => {
    try {
      await databases.deleteDocument(
        databaseId,
        collections.services,
        selectedService.$id
      );
      
      showSuccess(t('services.deleteSuccess'));
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      showError(t('services.deleteError'));
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get service type label
  const getTypeLabel = (typeId) => {
    const type = serviceTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };
  
  // Get availability color
  const getAvailabilityColor = (isAvailable) => {
    return isAvailable ? 'success' : 'error';
  };
  
  // Get availability label
  const getAvailabilityLabel = (isAvailable) => {
    return isAvailable ? t('services.status.available') : t('services.status.unavailable');
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(
      isRTL ? 'ar-SA' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };
  
  // DataGrid columns
  const columns = [
    {
      field: 'name',
      headerName: t('services.fields.name'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.imageUrl && (
            <Avatar
              src={params.row.imageUrl}
              alt={isRTL ? params.row.nameAr : params.row.nameEn}
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/40';
              }}
            />
          )}
          {!params.row.imageUrl && (
            <Avatar sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main',
              borderRadius: 2
            }}>
              <CategoryIcon fontSize="small" />
            </Avatar>
          )}
          <Box>
            <Typography variant="body2" fontWeight="medium" color="text.primary">
            {isRTL ? params.row.nameAr : params.row.nameEn}
          </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTypeLabel(params.row.type)}
            </Typography>
          </Box>
        </Box>
      ),
      valueGetter: (params) => isRTL ? params.row.nameAr : params.row.nameEn,
    },
    {
      field: 'type',
      headerName: t('services.fields.type'),
      width: 150,
      renderCell: (params) => (
        <Chip
          label={getTypeLabel(params.row.type)}
          size="small"
          icon={<CategoryIcon />}
          sx={{ 
            borderRadius: 2,
            fontWeight: 'medium',
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.light, 0.3),
            color: theme.palette.primary.main,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
          }}
        />
      ),
    },
    {
      field: 'price',
      headerName: t('services.fields.price'),
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: 'success.main',
            fontSize: '0.75rem'
          }}>
            OMR
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {formatCurrency(params.row.price)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'duration',
      headerName: t('services.fields.duration'),
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailableIcon fontSize="small" sx={{ color: 'info.main' }} />
          <Typography variant="body2" color="text.primary">
            {params.row.duration} {t('services.fields.hours')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'isAvailable',
      headerName: t('services.fields.availability'),
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getAvailabilityLabel(params.row.isAvailable)}
          color={getAvailabilityColor(params.row.isAvailable)}
          size="small"
          icon={params.row.isAvailable ? <CheckCircleIcon /> : <BlockIcon />}
          variant="filled"
          sx={{ 
            borderRadius: 2,
            fontWeight: 'medium'
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('common.view')}>
            <IconButton 
              onClick={() => handleViewService(params.row)} 
              size="small"
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
          <Tooltip title={t('common.edit')}>
            <IconButton 
              onClick={() => handleEditService(params.row)} 
              size="small"
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.light, 0.3),
                color: theme.palette.primary.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.primary.light, 0.5),
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
              onClick={() => handleDeleteService(params.row)} 
              size="small"
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
        </Stack>
      ),
    },
  ];
  
  // Render enhanced dialog content
  const renderEnhancedDialogContent = () => {
    if (dialogMode === 'view') {
      return (
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
              borderBottom: `1px solid ${theme.palette.divider}`,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <Avatar sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.15)' 
                  : 'rgba(255,255,255,0.2)', 
                color: 'inherit' 
              }}>
                <VisibilityIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                {isRTL ? selectedService?.nameAr : selectedService?.nameEn}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ 
              p: 3, 
              bgcolor: theme.palette.background.default,
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              <Grid container spacing={3}>
                {selectedService?.imageUrl && (
            <Grid item xs={12}>
                    <Zoom in={true}>
                      <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={selectedService.imageUrl}
                  alt={isRTL ? selectedService.nameAr : selectedService.nameEn}
                          sx={{ 
                            width: '100%', 
                            height: 200, 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                  onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x200';
                  }}
                />
                      </Card>
                    </Zoom>
            </Grid>
          )}
                
                {[
                  { label: t('services.fields.nameEn'), value: selectedService?.nameEn },
                  { label: t('services.fields.nameAr'), value: selectedService?.nameAr },
                  { label: t('services.fields.type'), value: getTypeLabel(selectedService?.type) },
                  { label: t('services.fields.price'), value: formatCurrency(selectedService?.price) },
                  { label: t('services.fields.duration'), value: `${selectedService?.duration} ${t('services.fields.hours')}` },
                  { label: t('services.fields.availability'), value: getAvailabilityLabel(selectedService?.isAvailable) },
                  { label: t('services.fields.providerName'), value: selectedService?.providerName || t('common.notSpecified') },
                  { label: t('services.fields.providerContact'), value: selectedService?.providerContact || t('common.notSpecified') },
                  { label: t('services.fields.createdAt'), value: formatDate(selectedService?.createdAt) }
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.03)' 
                          : theme.palette.grey[50], 
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : theme.palette.grey[100],
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        }
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.label}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="text.primary">
                        {item.value}
                      </Typography>
                    </Card>
          </Grid>
                ))}
                
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
                      title={t('services.fields.descriptionEn')}
                      sx={{ 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? theme.palette.primary.dark 
                          : theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        '& .MuiCardHeader-title': {
                          fontSize: '1rem',
                          fontWeight: 'medium',
                          color: 'inherit'
                        }
                      }}
                    />
                    <CardContent>
                      <Typography variant="body1" color="text.primary">
                        {selectedService?.descriptionEn || t('common.notAvailable')}
            </Typography>
                    </CardContent>
                  </Card>
          </Grid>
                
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
                      title={t('services.fields.descriptionAr')}
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
                      <Typography variant="body1" color="text.primary" dir="rtl">
                        {selectedService?.descriptionAr || t('common.notAvailable')}
                      </Typography>
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
                color="primary"
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
            </DialogActions>
          </Box>
        </Fade>
      );
    }
    
    if (dialogMode === 'delete') {
      return (
        <Fade in={true}>
          <Box>
            <DialogTitle sx={{ 
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: theme.palette.error.contrastText,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              <Avatar sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.15)' 
                  : 'rgba(255,255,255,0.2)', 
                color: 'inherit' 
              }}>
                <DeleteIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                {t('services.deleteTitle')}
        </Typography>
            </DialogTitle>
            <DialogContent sx={{ 
              p: 3, 
              bgcolor: theme.palette.background.default
            }}>
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.warning.dark, 0.2)
                    : alpha(theme.palette.warning.light, 0.2),
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.warning.main}`,
                  '& .MuiAlert-icon': {
                    color: theme.palette.warning.main
                  }
                }}
              >
                <Typography sx={{ color: theme.palette.text.primary }}>
                  {t('services.deleteConfirmation')} <strong>{isRTL ? selectedService?.nameAr : selectedService?.nameEn}</strong>?
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3, 
              gap: 1, 
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
                startIcon={<DeleteIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 'medium',
                  boxShadow: 2
                }}
              >
                {t('common.delete')}
              </Button>
            </DialogActions>
          </Box>
        </Fade>
      );
    }
    
    // Create/Edit form
    return (
      <Fade in={true}>
        <Box>
          <DialogTitle sx={{ 
            background: `linear-gradient(135deg, ${
              dialogMode === 'create' 
                ? theme.palette.mode === 'dark' 
                  ? `${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%`
                  : '#667eea 0%, #764ba2 100%'
                : theme.palette.mode === 'dark'
                  ? `${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%`
                  : '#f093fb 0%, #f5576c 100%'
            })`,
            color: theme.palette.mode === 'dark' 
              ? theme.palette.primary.contrastText 
              : 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.15)' 
                : 'rgba(255,255,255,0.2)', 
              color: 'inherit' 
            }}>
              {dialogMode === 'create' ? <AddIcon /> : <EditIcon />}
            </Avatar>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
              {dialogMode === 'create' ? t('services.createTitle') : t('services.editTitle')}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ 
            p: 3, 
            bgcolor: theme.palette.background.default,
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            {renderServiceDialogContent()}
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            gap: 1, 
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
              startIcon={dialogMode === 'create' ? <AddIcon /> : <EditIcon />}
              disabled={uploadingImage}
              sx={{ 
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 'medium',
                boxShadow: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: 4
                }
              }}
            >
              {uploadingImage ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                dialogMode === 'create' ? t('common.create') : t('common.update')
              )}
            </Button>
          </DialogActions>
        </Box>
      </Fade>
    );
  };
  
  // Render service dialog content
  const renderServiceDialogContent = () => {
    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* English name */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2,
                color: theme.palette.primary.main
              }}
            >
              <LanguageIcon />
              {t('services.fields.nameEn')}
            </Typography>
          <TextField
            name="nameEn"
            label={t('services.fields.nameEn')}
            fullWidth
            value={formData.nameEn}
            onChange={handleInputChange}
            error={!!formErrors.nameEn}
            helperText={formErrors.nameEn}
            required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.primary
                }
              }}
            />
          </Card>
        </Grid>
        
        {/* Arabic name */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 2,
                color: theme.palette.secondary.main
              }}
            >
              <LanguageIcon />
              {t('services.fields.nameAr')}
            </Typography>
          <TextField
            name="nameAr"
            label={t('services.fields.nameAr')}
            fullWidth
            value={formData.nameAr}
            onChange={handleInputChange}
            error={!!formErrors.nameAr}
            helperText={formErrors.nameAr}
            required
            dir="rtl"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.primary
                }
              }}
            />
          </Card>
        </Grid>
        
        {/* English description */}
        <Grid item xs={12}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventAvailableIcon />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                    {t('services.fields.descriptionEn')}
                  </Typography>
                </Box>
              }
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.dark 
                  : theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                '& .MuiCardHeader-title': {
                  color: 'inherit'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
          <TextField
            name="descriptionEn"
            label={t('services.fields.descriptionEn')}
            fullWidth
            multiline
            rows={3}
            value={formData.descriptionEn}
            onChange={handleInputChange}
            error={!!formErrors.descriptionEn}
            helperText={formErrors.descriptionEn}
            required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.primary
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Arabic description */}
        <Grid item xs={12}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventAvailableIcon />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                    {t('services.fields.descriptionAr')}
                  </Typography>
                </Box>
              }
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.secondary.dark 
                  : theme.palette.secondary.light,
                color: theme.palette.secondary.contrastText,
                '& .MuiCardHeader-title': {
                  color: 'inherit'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
          <TextField
            name="descriptionAr"
            label={t('services.fields.descriptionAr')}
            fullWidth
            multiline
            rows={3}
            value={formData.descriptionAr}
            onChange={handleInputChange}
            error={!!formErrors.descriptionAr}
            helperText={formErrors.descriptionAr}
            required
            dir="rtl"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.primary
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Service details row */}
        <Grid item xs={12}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                    Service Details
                  </Typography>
                </Box>
              }
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.info.dark 
                  : theme.palette.info.light,
                color: theme.palette.info.contrastText,
                '& .MuiCardHeader-title': {
                  color: 'inherit'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
        {/* Service type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {t('services.fields.type')}
                    </InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              label={t('services.fields.type')}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                      }}
            >
              {serviceTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Price */}
        <Grid item xs={12} md={6}>
          <TextField
            name="price"
            label={t('services.fields.price')}
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleInputChange}
            error={!!formErrors.price}
            helperText={formErrors.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">OMR</InputAdornment>,
            }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.primary
                      }
                    }}
          />
        </Grid>
        
        {/* Duration */}
        <Grid item xs={12} md={6}>
          <TextField
            name="duration"
            label={t('services.fields.duration')}
            type="number"
            fullWidth
            value={formData.duration}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">{t('services.fields.hours')}</InputAdornment>,
            }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.primary
                      }
                    }}
          />
        </Grid>
        
        {/* Availability */}
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
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
          <FormControlLabel
            control={
              <Switch
                checked={formData.isAvailable}
                onChange={handleAvailabilityChange}
                color="success"
              />
            }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {formData.isAvailable ? <CheckCircleIcon color="success" /> : <BlockIcon color="error" />}
                          <Typography color="text.primary">
                            {t(formData.isAvailable ? 'services.status.available' : 'services.status.unavailable')}
                          </Typography>
                        </Box>
                      }
                    />
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Provider information */}
        <Grid item xs={12}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                    Provider Information
                  </Typography>
                </Box>
              }
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.success.dark 
                  : theme.palette.success.light,
                color: theme.palette.success.contrastText,
                '& .MuiCardHeader-title': {
                  color: 'inherit'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
        {/* Provider name */}
        <Grid item xs={12} md={6}>
          <TextField
            name="providerName"
            label={t('services.fields.providerName')}
            fullWidth
            value={formData.providerName}
            onChange={handleInputChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.primary
                      }
                    }}
          />
        </Grid>
        
        {/* Provider contact */}
        <Grid item xs={12} md={6}>
          <TextField
            name="providerContact"
            label={t('services.fields.providerContact')}
            fullWidth
            value={formData.providerContact}
            onChange={handleInputChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.primary
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Image upload */}
        <Grid item xs={12}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon />
                  <Typography variant="h6" sx={{ color: 'inherit' }}>
              {t('services.fields.image')}
            </Typography>
                </Box>
              }
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.warning.dark 
                  : theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                '& .MuiCardHeader-title': {
                  color: 'inherit'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium',
                      borderColor: theme.palette.warning.main,
                      color: theme.palette.warning.main,
                      '&:hover': {
                        borderColor: theme.palette.warning.dark,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.warning.main, 0.2)
                          : alpha(theme.palette.warning.light, 0.2)
                      }
                    }}
              >
                {t('services.selectImage')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {selectedImage && (
                    <Chip
                      label={selectedImage.name}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    />
              )}
            </Box>
                
                {(formData.imageUrl || selectedImage) && (
                  <Zoom in={true}>
                    <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', maxWidth: 300 }}>
              <Box
                component="img"
                        src={selectedImage ? URL.createObjectURL(selectedImage) : formData.imageUrl}
                alt="Service image"
                        sx={{ 
                          width: '100%', 
                          height: 150, 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x150';
                        }}
                      />
                    </Card>
                  </Zoom>
            )}
          </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Calculate statistics
  const stats = {
    total: totalServices,
    available: services.filter(s => s.isAvailable).length,
    unavailable: services.filter(s => !s.isAvailable).length,
    byType: serviceTypes.reduce((acc, type) => {
      acc[type.id] = services.filter(s => s.type === type.id).length;
      return acc;
    }, {})
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={t('services.title')} 
        subtitle={t('services.subtitle')}
        icon={<CategoryIcon fontSize="large" />}
      />
      
      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: theme.palette.primary.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('services.title')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.2)', 
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
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: theme.palette.success.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.available}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('services.status.available')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.2)', 
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
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: theme.palette.error.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.unavailable}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('services.status.unavailable')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <BlockIcon />
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
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.1)' 
              }} />
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: theme.palette.warning.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {serviceTypes.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('services.types.title') || 'Types'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <LanguageIcon />
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
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.1)' 
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
              {t('services.list') || 'Services List'}
            </Typography>
            
            {/* Search and Filter Controls */}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
                  size="small"
              placeholder={t('common.search')}
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
                      '& input': { color: theme.palette.primary.contrastText }
                    }
              }}
            />
          </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('services.filterByType')}
                  </InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label={t('services.filterByType')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('services.filterByAvailability')}
                  </InputLabel>
              <Select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                label={t('services.filterByAvailability')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="available">{t('services.status.available')}</MenuItem>
                <MenuItem value="unavailable">{t('services.status.unavailable')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={() => fetchServices()}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: theme.palette.primary.contrastText
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateService}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
            >
              {t('services.addService')}
            </Button>
                </Stack>
          </Grid>
        </Grid>
          </Box>

          {/* Enhanced Tab Navigation */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa' 
          }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
              variant="fullWidth"
              sx={{ 
                '& .MuiTab-root': { 
                  textTransform: 'none',
                  fontWeight: 'medium',
                  minHeight: 56,
                  color: theme.palette.text.primary
                }
              }}
            >
              <Tab 
                value="all" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon fontSize="small" />
                    {t('common.all')}
                    <Badge badgeContent={stats.total} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                value="available" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    {t('services.status.available')}
                    <Badge badgeContent={stats.available} color="success" />
                  </Box>
                } 
              />
              <Tab 
                value="unavailable" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon fontSize="small" />
                    {t('services.status.unavailable')}
                    <Badge badgeContent={stats.unavailable} color="error" />
                  </Box>
                } 
              />
        </Tabs>
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
          rows={services}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={totalServices}
          paginationMode="server"
          loading={loading}
          disableRowSelectionOnClick
              disableColumnMenu
          getRowId={(row) => row.$id}
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
                    <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
      
      {/* Enhanced Service Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
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
        {renderEnhancedDialogContent()}
      </Dialog>
    </Box>
  );
};

export default Services; 