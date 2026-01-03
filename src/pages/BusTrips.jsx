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
  CircularProgress,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  Alert,
  Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DirectionsBus as DirectionsBusIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  TripOrigin as TripOriginIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';

const BusTrips = () => {
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const theme = useTheme();
  
  // Debug: Check if all dependencies are available
  console.log('BusTrips dependencies:', {
    databases: !!databases,
    databaseId,
    collections: collections?.busTrips,
    ID: !!ID,
    showSuccess: !!showSuccess,
    showError: !!showError,
    user: !!user
  });
  
  // State for bus trips data
  const [busTrips, setBusTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  
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
  
  // Form state
  const [formData, setFormData] = useState({
    busName: '',
    departure: new Date(),
    fromLocation: '',
    toLocation: '',
    capacity: 50,
    availableSeats: 50,
    price: 0,
    status: 'active',
    notes: '',
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    busName: '',
    fromLocation: '',
    toLocation: '',
    departure: '',
    capacity: '',
    price: '',
  });
  
  // Trip statuses
  const tripStatuses = [
    { id: 'active', name: t('busTrips.status.active') || 'Active', color: 'success' },
    { id: 'completed', name: t('busTrips.status.completed') || 'Completed', color: 'info' },
    { id: 'cancelled', name: t('busTrips.status.cancelled') || 'Cancelled', color: 'error' },
    { id: 'delayed', name: t('busTrips.status.delayed') || 'Delayed', color: 'warning' },
  ];
  
  // Load bus trips on initial load and when filters change
  useEffect(() => {
    fetchBusTrips();
  }, [paginationModel, searchQuery, filterStatus, filterDateRange, currentTab]);
  
  // Fetch bus trips from the database
  const fetchBusTrips = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterStatus !== 'all') {
        filters.push(Query.equal('status', filterStatus));
      }
      
      if (searchQuery) {
        filters.push(Query.search('busName', searchQuery));
      }
      
      if (currentTab === 'today') {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        filters.push(Query.greaterThanEqual('departure', todayStart.toISOString()));
        filters.push(Query.lessThan('departure', todayEnd.toISOString()));
      } else if (currentTab === 'upcoming') {
        const now = new Date();
        filters.push(Query.greaterThan('departure', now.toISOString()));
      } else if (currentTab === 'completed') {
        filters.push(Query.equal('status', 'completed'));
      }
      
      // Fetch bus trips
      const response = await databases.listDocuments(
        databaseId,
        collections.busTrips,
        filters.length > 0 ? filters : undefined,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        ['departure']
      );
      
      setBusTrips(response.documents);
      setTotalTrips(response.total);
    } catch (error) {
      console.error('Error fetching bus trips:', error);
      showError(t('busTrips.fetchError') || 'Error fetching bus trips');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle dialog open for create
  const handleCreateTrip = () => {
    setFormData({
      busName: '',
      departure: new Date(),
      fromLocation: '',
      toLocation: '',
      capacity: 50,
      availableSeats: 50,
      price: 0,
      status: 'active',
      notes: '',
    });
    setFormErrors({
      busName: '',
      fromLocation: '',
      toLocation: '',
      departure: '',
      capacity: '',
      price: '',
    });
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit
  const handleEditTrip = (trip) => {
    setFormData({
      busName: trip.busName || '',
      departure: trip.departure ? new Date(trip.departure) : new Date(),
      fromLocation: trip.fromLocation || '',
      toLocation: trip.toLocation || '',
      capacity: trip.capacity || 50,
      availableSeats: trip.availableSeats || trip.capacity || 50,
      price: trip.price || 0,
      status: trip.status || 'active',
      notes: trip.notes || '',
    });
    setFormErrors({
      busName: '',
      fromLocation: '',
      toLocation: '',
      departure: '',
      capacity: '',
      price: '',
    });
    setSelectedTrip(trip);
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Handle dialog open for delete
  const handleDeleteTrip = (trip) => {
    setSelectedTrip(trip);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog open for view
  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setDialogMode('view');
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTrip(null);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Handle datetime change
  const handleDateTimeChange = (name, value) => {
    console.log('DateTime changed:', name, value);
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.busName.trim()) {
      errors.busName = t('busTrips.validation.busNameRequired') || 'Bus name is required';
    }
    
    if (!formData.fromLocation.trim()) {
      errors.fromLocation = t('busTrips.validation.fromLocationRequired') || 'From location is required';
    }
    
    if (!formData.toLocation.trim()) {
      errors.toLocation = t('busTrips.validation.toLocationRequired') || 'To location is required';
    }
    
    if (!formData.departure) {
      errors.departure = t('busTrips.validation.departureRequired') || 'Departure time is required';
    } else {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // Allow 5 minutes in the past
      if (formData.departure < fiveMinutesAgo) {
        errors.departure = t('busTrips.validation.departureFuture') || 'Departure time must be in the future';
      }
    }
    
    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = t('busTrips.validation.capacityRequired') || 'Capacity must be greater than 0';
    }
    
    if (formData.price < 0) {
      errors.price = t('busTrips.validation.priceValid') || 'Price must be 0 or greater';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed');
    
    try {
      const tripData = {
        ...formData,
        departure: formData.departure.toISOString(),
        availableSeats: parseInt(formData.availableSeats),
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        createdBy: user?.name || user?.email || 'System',
        createdAt: new Date().toISOString(),
        updatedBy: user?.name || user?.email || 'System',
        updatedAt: new Date().toISOString(),
      };
      
      if (dialogMode === 'create') {
        console.log('Creating document with data:', tripData);
        console.log('Database ID:', databaseId);
        console.log('Collection ID:', collections.busTrips);
        
        const result = await databases.createDocument(
          databaseId,
          collections.busTrips,
          ID.unique(),
          tripData
        );
        
        console.log('Document created successfully:', result);
        showSuccess(t('busTrips.createSuccess') || 'Bus trip created successfully');
      } else if (dialogMode === 'edit') {
        await databases.updateDocument(
          databaseId,
          collections.busTrips,
          selectedTrip.$id,
          {
            ...tripData,
            createdBy: selectedTrip.createdBy,
            createdAt: selectedTrip.createdAt,
          }
        );
        showSuccess(t('busTrips.updateSuccess') || 'Bus trip updated successfully');
      }
      
      handleCloseDialog();
      fetchBusTrips();
    } catch (error) {
      console.error('Error saving bus trip:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      });
      
      let errorMessage = t('busTrips.saveError') || 'Error saving bus trip';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      showError(errorMessage);
    }
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    try {
      await databases.deleteDocument(
        databaseId,
        collections.busTrips,
        selectedTrip.$id
      );
      showSuccess(t('busTrips.deleteSuccess') || 'Bus trip deleted successfully');
      handleCloseDialog();
      fetchBusTrips();
    } catch (error) {
      console.error('Error deleting bus trip:', error);
      showError(t('busTrips.deleteError') || 'Error deleting bus trip');
    }
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get status color
  const getStatusColor = (status) => {
    const statusObj = tripStatuses.find(s => s.id === status);
    return statusObj ? statusObj.color : 'default';
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    const statusObj = tripStatuses.find(s => s.id === status);
    return statusObj ? statusObj.name : status;
  };
  
  // DataGrid columns
  const columns = [
    {
      field: 'busName',
      headerName: t('busTrips.columns.busName') || 'Bus Name',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsBusIcon color="primary" fontSize="small" />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'departure',
      headerName: t('busTrips.columns.departure') || 'Departure',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {formatDateTime(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fromLocation',
      headerName: t('busTrips.columns.from') || 'From',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TripOriginIcon color="success" fontSize="small" />
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'toLocation',
      headerName: t('busTrips.columns.to') || 'To',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon color="error" fontSize="small" />
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'availableSeats',
      headerName: t('busTrips.columns.seats') || 'Available Seats',
      width: 130,
      renderCell: (params) => {
        const capacity = params.row.capacity || 50;
        const available = params.value || 0;
        const percentage = (available / capacity) * 100;
        
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {available}/{capacity}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.grey[500], 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: percentage > 50 ? theme.palette.success.main : 
                                   percentage > 20 ? theme.palette.warning.main : 
                                   theme.palette.error.main,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'price',
      headerName: t('busTrips.columns.price') || 'Price',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {params.value ? `${params.value} OMR` : 'Free'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: t('busTrips.columns.status') || 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
          icon={params.value === 'active' ? <CheckCircleIcon /> : 
                params.value === 'completed' ? <CheckCircleIcon /> : 
                <BlockIcon />}
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={t('common.view') || 'View'}>
            <IconButton
              size="small"
              onClick={() => handleViewTrip(params.row)}
              color="info"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.edit') || 'Edit'}>
            <IconButton
              size="small"
              onClick={() => handleEditTrip(params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete') || 'Delete'}>
            <IconButton
              size="small"
              onClick={() => handleDeleteTrip(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title={t('busTrips.title') || 'Bus Trips Management'}
          subtitle={t('busTrips.subtitle') || 'Manage bus trips and schedules'}
          icon={DirectionsBusIcon}
        />
        
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={300}>
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {busTrips.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t('busTrips.stats.totalTrips') || 'Total Trips'}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <DirectionsBusIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={400}>
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {busTrips.filter(trip => trip.status === 'active').length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t('busTrips.stats.activeTrips') || 'Active Trips'}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={500}>
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.dark, 0.9)})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {busTrips.reduce((sum, trip) => sum + (trip.availableSeats || 0), 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t('busTrips.stats.availableSeats') || 'Available Seats'}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in timeout={600}>
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {busTrips.filter(trip => new Date(trip.departure) > new Date()).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t('busTrips.stats.upcomingTrips') || 'Upcoming Trips'}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <ScheduleIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
        
        {/* Main Content */}
        <Paper sx={{ width: '100%' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label={t('busTrips.tabs.all') || 'All Trips'} value="all" />
              <Tab label={t('busTrips.tabs.today') || 'Today'} value="today" />
              <Tab label={t('busTrips.tabs.upcoming') || 'Upcoming'} value="upcoming" />
              <Tab label={t('busTrips.tabs.completed') || 'Completed'} value="completed" />
            </Tabs>
          </Box>
          
          {/* Toolbar */}
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('common.search') || 'Search'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('busTrips.filters.status') || 'Status'}</InputLabel>
                  <Select
                    value={filterStatus}
                    label={t('busTrips.filters.status') || 'Status'}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">{t('common.all') || 'All'}</MenuItem>
                    {tripStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={t('common.refresh') || 'Refresh'}>
                    <IconButton onClick={fetchBusTrips}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateTrip}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('busTrips.addTrip') || 'Add Trip'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {/* Data Grid */}
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={busTrips}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25]}
              loading={loading}
              disableRowSelectionOnClick
              getRowId={(row) => row.$id}
              rowCount={totalTrips}
              paginationMode="server"
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            />
          </Box>
        </Paper>
        
        {/* Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBusIcon color="primary" />
            {dialogMode === 'create' && (t('busTrips.addTrip') || 'Add Bus Trip')}
            {dialogMode === 'edit' && (t('busTrips.editTrip') || 'Edit Bus Trip')}
            {dialogMode === 'view' && (t('busTrips.viewTrip') || 'View Bus Trip')}
            {dialogMode === 'delete' && (t('busTrips.deleteTrip') || 'Delete Bus Trip')}
          </DialogTitle>
          
          <DialogContent dividers>
            {dialogMode === 'delete' ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('busTrips.deleteConfirm') || 'Are you sure you want to delete this bus trip?'}
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                  <strong>{selectedTrip?.busName}</strong> - {selectedTrip?.fromLocation} to {selectedTrip?.toLocation}
                </Typography>
              </Alert>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.busName') || 'Bus Name'}
                    name="busName"
                    value={formData.busName}
                    onChange={handleInputChange}
                    error={!!formErrors.busName}
                    helperText={formErrors.busName}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DirectionsBusIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label={t('busTrips.form.departure') || 'Departure Time'}
                    value={formData.departure}
                    onChange={(value) => handleDateTimeChange('departure', value)}
                    disabled={dialogMode === 'view'}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.departure,
                        helperText: formErrors.departure,
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.from') || 'From Location'}
                    name="fromLocation"
                    value={formData.fromLocation}
                    onChange={handleInputChange}
                    error={!!formErrors.fromLocation}
                    helperText={formErrors.fromLocation}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TripOriginIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.to') || 'To Location'}
                    name="toLocation"
                    value={formData.toLocation}
                    onChange={handleInputChange}
                    error={!!formErrors.toLocation}
                    helperText={formErrors.toLocation}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.capacity') || 'Capacity'}
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    error={!!formErrors.capacity}
                    helperText={formErrors.capacity}
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.availableSeats') || 'Available Seats'}
                    name="availableSeats"
                    type="number"
                    value={formData.availableSeats}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, max: formData.capacity }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.price') || 'Price (OMR)'}
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('busTrips.form.status') || 'Status'}</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label={t('busTrips.form.status') || 'Status'}
                      onChange={handleInputChange}
                      disabled={dialogMode === 'view'}
                    >
                      {tripStatuses.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('busTrips.form.notes') || 'Notes'}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={3}
                  />
                </Grid>
                
                {dialogMode === 'view' && selectedTrip && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {t('common.auditInfo') || 'Audit Information'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.createdBy') || 'Created By'}: {selectedTrip.createdBy || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.createdAt') || 'Created At'}: {formatDateTime(selectedTrip.createdAt)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.updatedBy') || 'Updated By'}: {selectedTrip.updatedBy || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('common.updatedAt') || 'Updated At'}: {formatDateTime(selectedTrip.updatedAt)}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            {dialogMode === 'delete' && (
              <Button onClick={handleConfirmDelete} color="error" variant="contained">
                {t('common.delete') || 'Delete'}
              </Button>
            )}
            {(dialogMode === 'create' || dialogMode === 'edit') && (
              <Button onClick={handleSubmit} variant="contained">
                {dialogMode === 'create' ? (t('common.create') || 'Create') : (t('common.update') || 'Update')}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BusTrips; 