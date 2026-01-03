import { useState, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  Avatar,
  Input,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ButtonGroup,
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
  Event as EventIcon,
  People as PeopleIcon,
  Room as RoomIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraAltIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  GroupWork as GroupWorkIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationOnIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Image as ImageIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { appwriteConfig } from '../config/appwrite';
import PageHeader from '../components/common/PageHeader';
import { Query, ID } from 'appwrite';
import { alpha } from '@mui/material/styles';

const Activities = () => {
  const { databases, databaseId, collections, storage, bucketId } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const theme = useTheme();
  
  // State for activity data
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete', 'view'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('upcoming');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'trip',
    location: '',
    imageUrl: '',
    maxParticipants: 30,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // +2 hours
    registrationDeadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // +1 day
    supervisor: '',
  });
  
  // Add these new states
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Add a new state for registrations
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [registrationTab, setRegistrationTab] = useState('details');
  
  // Activity types
  const activityTypes = [
    { id: 'trip', name: t('activities.types.trip') },
    { id: 'event', name: t('activities.types.event') },
    { id: 'workshop', name: t('activities.types.workshop') },
  ];
  
  // Fetch activities from the database
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (searchQuery) {
        filters.push(Query.search('title', searchQuery));
      }
      
      if (filterType !== 'all') {
        filters.push(Query.equal('type', filterType));
      }
      
      // Add filters based on the current tab
      if (currentTab === 'upcoming') {
        filters.push(Query.greaterThan('startDate', new Date().toISOString()));
      } else if (currentTab === 'past') {
        filters.push(Query.lessThan('endDate', new Date().toISOString()));
      } else if (currentTab === 'ongoing') {
        filters.push(Query.lessThanEqual('startDate', new Date().toISOString()));
        filters.push(Query.greaterThanEqual('endDate', new Date().toISOString()));
      }
      
      // Fetch activities
      const response = await databases.listDocuments(
        databaseId,
        collections.activities,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        'startDate', // Sort by startDate
        'DESC' // Most recent first
      );
      
      setActivities(response.documents);
      setTotalActivities(response.total);
    } catch (error) {
      console.error('Error fetching activities:', error);
      showError(t('activities.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [paginationModel, searchQuery, filterType, currentTab]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Format time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };
  
  // Calculate activity status
  const getActivityStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > now) {
      return 'upcoming';
    } else if (now >= start && now <= end) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Reset the form for create mode
  const handleCreateActivity = () => {
    setFormData({
      title: '',
      description: '',
      type: 'trip',
      location: '',
      imageUrl: '',
      maxParticipants: 30,
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // +2 hours
      registrationDeadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // +1 day
      supervisor: '',
    });
    setDialogMode('create');
    setOpenDialog(true);
    setImageFile(null); // Reset the image file
    setUploadProgress(0);
  };
  
  // Handle dialog open for view
  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setDialogMode('view');
    setOpenDialog(true);
    setRegistrationTab('details'); // Reset to details tab
    
    // Fetch registrations for this activity
    fetchRegistrations(activity.$id);
  };
  
  // Handle dialog open for edit
  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      type: activity.type || 'trip',
      location: activity.location || '',
      imageUrl: activity.imageUrl || '',
      maxParticipants: activity.maxParticipants || 30,
      startDate: new Date(activity.startDate),
      endDate: new Date(activity.endDate),
      registrationDeadline: new Date(activity.registrationDeadline),
      supervisor: activity.supervisor || '',
    });
    setDialogMode('edit');
    setOpenDialog(true);
    setImageFile(null); // Reset the image file
    setUploadProgress(0);
  };
  
  // Handle dialog open for delete
  const handleDeleteActivity = (activity) => {
    setSelectedActivity(activity);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActivity(null);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle date change
  const handleDateChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      showError(t('activities.titleRequired'));
      return false;
    }
    
    if (!formData.description.trim()) {
      showError(t('activities.descriptionRequired'));
      return false;
    }
    
    if (!formData.location.trim()) {
      showError(t('activities.locationRequired'));
      return false;
    }
    
    if (!formData.supervisor.trim()) {
      showError(t('activities.supervisorRequired'));
      return false;
    }
    
    if (formData.maxParticipants <= 0) {
      showError(t('activities.invalidParticipants'));
      return false;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showError(t('activities.invalidDateRange'));
      return false;
    }
    
    if (new Date(formData.registrationDeadline) <= new Date(formData.startDate)) {
      showError(t('activities.invalidDeadline'));
      return false;
    }
    
    return true;
  };
  
  // Handle image file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  
  // Handle image upload to Appwrite storage
const uploadImage = async () => {
  if (!imageFile) return null;
  
  try {
    setIsUploading(true);
    
    // Create a unique file ID and store it in a variable
    const fileId = ID.unique();
    console.log('Generated file ID:', fileId); // Debug log
    
    // Upload the file to Appwrite storage
    const uploadedFile = await storage.createFile(
      bucketId,
      fileId,
      imageFile,
      ['read("any")']  // Public read permission
    );
    
    console.log('Uploaded file response:', uploadedFile); // Debug log
    
    // Use the file ID from the upload response instead of the variable
    const actualFileId = uploadedFile.$id;
    
    // Get the complete file view URL using the actual file ID
    const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${actualFileId}/view?project=${appwriteConfig.projectId}`;
    
    console.log('Generated file URL:', fileUrl); // Debug log
    
    setIsUploading(false);
    setUploadProgress(0);
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    showError(t('activities.imageUploadError') || 'Error uploading image');
    setIsUploading(false);
    setUploadProgress(0);
    return null;
  }
};
  
  // Handle form submit with image upload
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Upload the image first if selected
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          console.log("Image uploaded successfully: ", uploadedImageUrl);
          imageUrl = uploadedImageUrl;
        } else {
          console.warn("Image upload failed, using existing URL if available");
        }
      }
      
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        imageUrl: imageUrl, // Use the uploaded image URL or the existing one
        maxParticipants: parseInt(formData.maxParticipants),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        registrationDeadline: formData.registrationDeadline.toISOString(),
        supervisor: formData.supervisor,
        updatedAt: new Date().toISOString(),
      };
      
      console.log("Saving activity with data: ", {
        ...activityData,
        imageDetails: imageUrl ? "Image URL provided" : "No image URL"
      });
      
      if (dialogMode === 'create') {
        // Add createdAt for new activities
        activityData.createdAt = new Date().toISOString();
        
        // Create a new activity
        await databases.createDocument(
          databaseId,
          collections.activities,
          ID.unique(),
          activityData
        );
        
        showSuccess(t('activities.activityCreated'));
      } else if (dialogMode === 'edit') {
        // Update the activity
        await databases.updateDocument(
          databaseId,
          collections.activities,
          selectedActivity.$id,
          activityData
        );
        
        showSuccess(t('activities.activityUpdated'));
      }
      
      handleCloseDialog();
      fetchActivities();
    } catch (error) {
      console.error(`Error ${dialogMode} activity:`, error);
      showError(t(`activities.${dialogMode}Error`));
    }
  };
  
  // Handle activity deletion
  const handleConfirmDelete = async () => {
    try {
      // Delete the activity
      await databases.deleteDocument(
        databaseId,
        collections.activities,
        selectedActivity.$id
      );
      
      showSuccess(t('activities.activityDeleted'));
      handleCloseDialog();
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      showError(t('activities.deleteError'));
    }
  };
  
  // Add a function to fetch registrations for an activity
  const fetchRegistrations = async (activityId) => {
    try {
      setLoadingRegistrations(true);
      
      const response = await databases.listDocuments(
        databaseId,
        collections.activityRegistrations,
        [Query.equal('activityId', activityId)],
        100, // Fetch up to 100 registrations
        0
      );
      
      // If we have registrations, fetch the user details for each
      let registrationsWithUsers = [];
      if (response.documents.length > 0) {
        // Get unique user IDs to fetch
        const userIds = [...new Set(response.documents.map(reg => reg.userId))];
        
        // Fetch user details
        const usersResponse = await databases.listDocuments(
          databaseId,
          collections.users,
          [Query.equal('$id', userIds)],
          100,
          0
        );
        
        // Create a map of userId to user for easy lookup
        const userMap = {};
        usersResponse.documents.forEach(user => {
          userMap[user.$id] = user;
        });
        
        // Combine registration data with user data
        registrationsWithUsers = response.documents.map(reg => ({
          ...reg,
          user: userMap[reg.userId] || { name: 'Unknown User' }
        }));
      }
      
      setRegistrations(registrationsWithUsers);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showError(t('activities.fetchActivityRegistrationsError', 'Error fetching registrations'));
    } finally {
      setLoadingRegistrations(false);
    }
  };
  
  // Add a function to update registration status
  const handleUpdateRegistrationStatus = async (registrationId, newStatus) => {
    try {
      await databases.updateDocument(
        databaseId,
        collections.activityRegistrations,
        registrationId,
        {
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      );
      
      // Update local state to reflect the change
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.$id === registrationId ? { ...reg, status: newStatus } : reg
        )
      );
      
      showSuccess(t('activities.registrationUpdated', 'Registration status updated'));
    } catch (error) {
      console.error('Error updating registration:', error);
      showError(t('activities.updateRegistrationError', 'Error updating registration'));
    }
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'title',
      headerName: t('activities.title'),
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.75rem'
          }}>
            <EventIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: t('activities.type'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={t(`activities.types.${params.value}`)}
          color={
            params.value === 'trip' 
              ? 'primary' 
              : params.value === 'event' 
                ? 'secondary' 
                : 'default'
          }
          size="small"
          icon={
            params.value === 'trip' ? <ExploreIcon /> :
            params.value === 'event' ? <EventIcon /> :
            <GroupWorkIcon />
          }
          sx={{ 
            borderRadius: 2,
            fontWeight: 'medium',
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette[params.value === 'trip' ? 'primary' : params.value === 'event' ? 'secondary' : 'info'].main, 0.2)
              : alpha(theme.palette[params.value === 'trip' ? 'primary' : params.value === 'event' ? 'secondary' : 'info'].light, 0.3),
            color: theme.palette[params.value === 'trip' ? 'primary' : params.value === 'event' ? 'secondary' : 'info'].main
          }}
        />
      ),
    },
    {
      field: 'location',
      headerName: t('activities.location'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: 'success.main',
            fontSize: '0.65rem'
          }}>
            <LocationOnIcon fontSize="small" />
          </Avatar>
          <Typography 
            variant="body2" 
            color="text.primary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '120px'
            }}
            title={params.value}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'startDate',
      headerName: t('activities.startDate'),
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => formatDate(params.value),
      renderCell: (params) => (
        <Chip
          label={formatDate(params.value)}
          size="small"
          icon={<CalendarTodayIcon />}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.info.main, 0.2)
              : alpha(theme.palette.info.light, 0.3),
            color: theme.palette.info.main,
            fontWeight: 'medium',
            borderRadius: 2
          }}
        />
      ),
    },
    {
      field: 'registrationDeadline',
      headerName: t('activities.registrationDeadline'),
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => formatDate(params.value),
      renderCell: (params) => (
        <Chip
          label={formatDate(params.value)}
          size="small"
          icon={<AccessTimeIcon />}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.warning.main, 0.2)
              : alpha(theme.palette.warning.light, 0.3),
            color: theme.palette.warning.main,
            fontWeight: 'medium',
            borderRadius: 2
          }}
        />
      ),
    },
    {
      field: 'maxParticipants',
      headerName: t('activities.maxParticipants'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          icon={<PeopleIcon />}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.secondary.main, 0.2)
              : alpha(theme.palette.secondary.light, 0.3),
            color: theme.palette.secondary.main,
            fontWeight: 'bold',
            borderRadius: 2
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: t('activities.statusLabel'),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => getActivityStatus(params.row.startDate, params.row.endDate),
      renderCell: (params) => {
        const status = params.value;
        const statusConfig = {
          upcoming: { color: 'primary', icon: <ScheduleIcon /> },
          ongoing: { color: 'success', icon: <EventAvailableIcon /> },
          completed: { color: 'info', icon: <CheckIcon /> }
        };
        
        const config = statusConfig[status] || { color: 'default', icon: <EventIcon /> };
        
        return (
          <Chip
            label={t(`activities.status.${status}`)}
            color={config.color}
            size="small"
            icon={config.icon}
            variant="filled"
            sx={{ 
              borderRadius: 2,
              fontWeight: 'medium'
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 1,
      minWidth: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={() => handleViewActivity(params.row)}
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
              size="small"
              onClick={() => handleEditActivity(params.row)}
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
              onClick={() => handleDeleteActivity(params.row)}
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
  
  // Calculate activity statistics
  const stats = {
    total: totalActivities,
    upcoming: activities.filter(activity => getActivityStatus(activity.startDate, activity.endDate) === 'upcoming').length,
    ongoing: activities.filter(activity => getActivityStatus(activity.startDate, activity.endDate) === 'ongoing').length,
    completed: activities.filter(activity => getActivityStatus(activity.startDate, activity.endDate) === 'completed').length,
  };
  
  return (
    <>
      <PageHeader
        title={t('activities.title')}
        actionLabel={t('activities.create')}
        onAction={handleCreateActivity}
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
                      {t('activities.totalActivities')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <EventIcon />
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
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: theme.palette.info.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.upcoming}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activities.status.upcoming')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <ScheduleIcon />
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
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: theme.palette.success.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.ongoing}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activities.status.ongoing')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <EventAvailableIcon />
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
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: theme.palette.secondary.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.completed}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activities.status.completed')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <CheckIcon />
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
              {t('activities.list') || 'Activities Management'}
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
                    {t('activities.type')}
                  </InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label={t('activities.type')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {activityTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
              </Grid>
          
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
          <Tooltip title={t('common.refresh')}>
            <IconButton
              onClick={() => fetchActivities()}
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
            onClick={handleCreateActivity}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
          >
            {t('activities.create')}
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
                    <EventIcon fontSize="small" />
                    {t('common.all')}
                    <Badge badgeContent={stats.total} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                value="upcoming" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    {t('activities.status.upcoming')}
                    <Badge badgeContent={stats.upcoming} color="info" />
                  </Box>
                } 
              />
              <Tab 
                value="ongoing" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventAvailableIcon fontSize="small" />
                    {t('activities.status.ongoing')}
                    <Badge badgeContent={stats.ongoing} color="success" />
                  </Box>
                } 
              />
              <Tab 
                value="past" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon fontSize="small" />
                    {t('activities.status.completed')}
                    <Badge badgeContent={stats.completed} color="secondary" />
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
            rows={activities}
            columns={columns}
            getRowId={(row) => row.$id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={totalActivities}
            paginationMode="server"
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
                    <ExploreIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
      
      {/* Activity CRUD Dialog */}
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
                  : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  <DeleteIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {t('activities.deleteConfirm')}
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
                {t('activities.deleteWarning', { 
                  title: selectedActivity?.title 
                })}
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
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  <VisibilityIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {selectedActivity?.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {t(`activities.types.${selectedActivity?.type}`)}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={registrationTab} 
                  onChange={(e, newValue) => setRegistrationTab(newValue)}
                    sx={{ 
                      '& .MuiTab-root': { 
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }
                    }}
                >
                  <Tab value="details" label={t('activities.details', 'Details')} />
                  <Tab
                    value="registrations"
                    label={t('activities.activityRegistrations', 'Registrations')}
                    disabled={!selectedActivity}
                  />
                </Tabs>
              </Box>
              
              {registrationTab === 'details' ? (
                  // Enhanced activity details content
                <Grid container spacing={2}>
                    {/* Activity Information Card */}
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
                          title={t('activities.activityInfo')}
                          avatar={
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AssignmentIcon />
                            </Avatar>
                          }
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
                          <Typography variant="body1" paragraph sx={{ color: 'text.primary' }}>
                      {selectedActivity?.description}
                    </Typography>
                        </CardContent>
                      </Card>
                  </Grid>
                  
                    {/* Activity Details Grid */}
                    {[
                      { 
                        label: t('activities.type'), 
                        value: t(`activities.types.${selectedActivity?.type}`),
                        icon: <EventIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.location'), 
                        value: selectedActivity?.location,
                        icon: <LocationOnIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.startDate'), 
                        value: formatDateTime(selectedActivity?.startDate),
                        icon: <CalendarTodayIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.endDate'), 
                        value: formatDateTime(selectedActivity?.endDate),
                        icon: <AccessTimeIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.registrationDeadline'), 
                        value: formatDateTime(selectedActivity?.registrationDeadline),
                        icon: <EventAvailableIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.maxParticipants'), 
                        value: selectedActivity?.maxParticipants,
                        icon: <PeopleIcon sx={{ mr: 1 }} color="primary" />
                      },
                      { 
                        label: t('activities.supervisor'), 
                        value: selectedActivity?.supervisor,
                        icon: <SupervisorAccountIcon sx={{ mr: 1 }} color="primary" />
                      }
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {item.icon}
                            <Typography variant="body2" color="text.secondary">
                              <strong>{item.label}:</strong> 
                      </Typography>
                    </Box>
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            {item.value}
                      </Typography>
                        </Card>
                  </Grid>
                    ))}
                    
                    {/* Activity Image */}
                  {selectedActivity?.imageUrl && (
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
                            title={t('activities.activityImage')}
                            avatar={
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <ImageIcon />
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
                            <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={selectedActivity.imageUrl}
                          alt={selectedActivity.title}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px', 
                            objectFit: 'contain',
                                  borderRadius: '8px',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 4px 8px rgba(0,0,0,0.3)' 
                                    : '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                          onError={(e) => {
                            console.log('Image failed to load:', selectedActivity.imageUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                      </Box>
                          </CardContent>
                        </Card>
                    </Grid>
                  )}
                </Grid>
              ) : (
                  // Enhanced registrations tab content
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'text.primary' }}>
                      {t('activities.participantList', 'Participant List')}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => fetchRegistrations(selectedActivity.$id)}
                      disabled={loadingRegistrations}
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                    >
                      {t('common.refresh', 'Refresh')}
                    </Button>
                  </Box>
                  
                  {loadingRegistrations ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : registrations.length === 0 ? (
                      <Card 
                        elevation={1} 
                        sx={{ 
                          p: 4, 
                          textAlign: 'center',
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.03)' 
                            : theme.palette.grey[50],
                          borderRadius: 2
                        }}
                      >
                        <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                      {t('activities.noActivityRegistrations', 'No registrations found for this activity')}
                    </Typography>
                      </Card>
                  ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8f9fa' }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('activities.studentName', 'Student Name')}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('activities.registrationDate', 'Registration Date')}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('activities.status', 'Status')}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('common.actions', 'Actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {registrations.map((registration) => (
                              <TableRow 
                                key={registration.$id}
                                sx={{ 
                                  '&:hover': { 
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255,255,255,0.02)' 
                                      : 'rgba(0,0,0,0.02)' 
                                  }
                                }}
                              >
                              <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                      {(registration.user.name || registration.user.firstName || 'U').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight="medium">
                                {registration.user.name || 
                                  `${registration.user.firstName || ''} ${registration.user.lastName || ''}`}
                                    </Typography>
                                  </Box>
                              </TableCell>
                              <TableCell>
                                  <Typography variant="body2">
                                {formatDate(registration.registrationDate || registration.createdAt)}
                                  </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={t(`activities.registrationStatus.${registration.status || 'pending'}`, 
                                    registration.status || 'pending')}
                                  color={
                                    registration.status === 'confirmed' ? 'success' :
                                    registration.status === 'rejected' ? 'error' :
                                    'warning'
                                  }
                                  size="small"
                                    sx={{ borderRadius: 2, fontWeight: 'medium' }}
                                />
                              </TableCell>
                              <TableCell>
                                <ButtonGroup size="small" variant="outlined">
                                  <Tooltip title={t('activities.approve', 'Approve')}>
                                    <Button
                                      color="success"
                                      onClick={() => handleUpdateRegistrationStatus(registration.$id, 'confirmed')}
                                      disabled={registration.status === 'confirmed'}
                                        sx={{ borderRadius: 1 }}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title={t('activities.reject', 'Reject')}>
                                    <Button
                                      color="error"
                                      onClick={() => handleUpdateRegistrationStatus(registration.$id, 'rejected')}
                                      disabled={registration.status === 'rejected'}
                                        sx={{ borderRadius: 1 }}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </Button>
                                  </Tooltip>
                                </ButtonGroup>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
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
              <Button 
                onClick={() => {
                  handleCloseDialog();
                  handleEditActivity(selectedActivity);
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
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'inherit' 
                }}>
                  {dialogMode === 'create' ? <AddIcon /> : <EditIcon />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
              {dialogMode === 'create' 
                ? t('activities.create') 
                : t('activities.edit')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {dialogMode === 'create' 
                      ? t('activities.createSubtitle') 
                      : t('activities.editSubtitle')}
                  </Typography>
                </Box>
            </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('activities.title')}
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('activities.description')}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('activities.type')}</InputLabel>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        label={t('activities.type')}
                      >
                        {activityTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('activities.location')}
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label={t('activities.startDate')}
                      value={formData.startDate}
                      onChange={(date) => handleDateChange('startDate', date)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label={t('activities.endDate')}
                      value={formData.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label={t('activities.registrationDeadline')}
                      value={formData.registrationDeadline}
                      onChange={(date) => handleDateChange('registrationDeadline', date)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('activities.maxParticipants')}
                      name="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      required
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('activities.supervisor')}
                      name="supervisor"
                      value={formData.supervisor}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>{t('activities.imageUpload', 'Image Upload')}</Divider>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        p: 2, 
                        border: `1px dashed ${theme.palette.divider}`, 
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.02)' 
                          : theme.palette.grey[50]
                      }}>
                      {/* Show preview if there's an image file or existing imageUrl */}
                      {(imageFile || formData.imageUrl) && !isUploading && (
                        <Box sx={{ mb: 2, textAlign: 'center' }}>
                          {imageFile ? (
                            <img 
                              src={URL.createObjectURL(imageFile)}
                              alt={t('activities.imagePreview', 'Image Preview')}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '200px', 
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 4px 8px rgba(0,0,0,0.3)' 
                                    : '0 4px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                          ) : (
                            <>
                              <img 
                                src={formData.imageUrl}
                                alt={t('activities.imagePreview', 'Image Preview')}
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '200px', 
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow: theme.palette.mode === 'dark' 
                                      ? '0 4px 8px rgba(0,0,0,0.3)' 
                                      : '0 4px 8px rgba(0,0,0,0.1)'
                                  }}
                                onError={(e) => {
                                  console.log('Form preview image failed to load:', formData.imageUrl);
                                  e.target.style.display = 'none';
                                }}
                              />
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                {formData.imageUrl}
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                      
                      {/* Upload progress */}
                      {isUploading && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                          <CircularProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            {Math.round(uploadProgress)}%
                          </Typography>
                        </Box>
                      )}
                      
                      {/* File input (hidden but triggered by the button) */}
                      <input
                        ref={fileInputRef}
                        accept="image/*"
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      
                      {/* Upload button */}
                      <Button
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                          sx={{ 
                            mt: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium'
                          }}
                      >
                        {t('activities.selectImage', 'Select Image')}
                      </Button>
                      
                      {/* Show file name if selected */}
                      {imageFile && (
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                          {imageFile.name}
                        </Typography>
                      )}
                      
                      {/* Option to keep existing URL */}
                      {!imageFile && formData.imageUrl && (
                        <TextField
                          fullWidth
                          label={t('activities.existingImageUrl', 'Existing Image URL')}
                          value={formData.imageUrl}
                          disabled
                          sx={{ mt: 2 }}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </LocalizationProvider>
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
                disabled={isUploading}
                  startIcon={isUploading ? <CircularProgress size={20} /> : (dialogMode === 'create' ? <AddIcon /> : <EditIcon />)}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    boxShadow: 2
                  }}
              >
                {isUploading ? (
                    t('activities.uploading')
                ) : (
                  dialogMode === 'create' ? t('common.create') : t('common.save')
                )}
              </Button>
            </DialogActions>
            </Box>
          </Fade>
        )}
      </Dialog>
    </>
  );
};

export default Activities; 