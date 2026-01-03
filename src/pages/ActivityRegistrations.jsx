import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
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
  CircularProgress,
  Chip,
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
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarTodayIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  HowToReg as HowToRegIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  ContactMail as ContactMailIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Query } from 'appwrite';
import PageHeader from '../components/common/PageHeader';
import { alpha } from '@mui/material/styles';

const ActivityRegistrations = () => {
  const { databases, databaseId, collections } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const theme = useTheme();
  
  // State for registration data
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivity, setFilterActivity] = useState('all');
  
  // State for activities dropdown
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };
  
  // Fetch all activities for the filter dropdown
  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await databases.listDocuments(
        databaseId,
        collections.activities,
        [],
        100, // Fetch up to 100 activities
        0
      );
      setActivities(response.documents);
    } catch (error) {
      console.error('Error fetching activities:', error);
      showError(t('activities.fetchError'));
    } finally {
      setLoadingActivities(false);
    }
  };
  
  // Fetch registrations from the database
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (searchQuery) {
        // We'll have to fetch users that match the search query first
        const usersResponse = await databases.listDocuments(
          databaseId,
          collections.users,
          [Query.search('name', searchQuery)],
          100,
          0
        );
        
        if (usersResponse.documents.length > 0) {
          const userIds = usersResponse.documents.map(user => user.$id);
          filters.push(Query.equal('userId', userIds));
        } else {
          // If no users match, we can return empty results early
          setRegistrations([]);
          setTotalRegistrations(0);
          setLoading(false);
          return;
        }
      }
      
      if (filterActivity !== 'all') {
        filters.push(Query.equal('activityId', filterActivity));
      }
      
      // Fetch registrations
      const response = await databases.listDocuments(
        databaseId,
        collections.activityRegistrations,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        'createdAt', // Sort by creation date
        'DESC' // Most recent first
      );
      
      // If we have registrations, fetch the user and activity details for each
      let registrationsWithDetails = [];
      if (response.documents.length > 0) {
        // Get unique user IDs and activity IDs to fetch
        const userIds = [...new Set(response.documents.map(reg => reg.userId))];
        const activityIds = [...new Set(response.documents.map(reg => reg.activityId))];
        
        // Fetch user details
        const usersResponse = await databases.listDocuments(
          databaseId,
          collections.users,
          [Query.equal('$id', userIds)],
          100,
          0
        );
        
        // Fetch activity details
        const activitiesResponse = await databases.listDocuments(
          databaseId,
          collections.activities,
          [Query.equal('$id', activityIds)],
          100,
          0
        );
        
        // Create maps for easy lookup
        const userMap = {};
        usersResponse.documents.forEach(user => {
          userMap[user.$id] = user;
        });
        
        const activityMap = {};
        activitiesResponse.documents.forEach(activity => {
          activityMap[activity.$id] = activity;
        });
        
        // Combine registration data with user and activity data
        registrationsWithDetails = response.documents.map(reg => ({
          ...reg,
          user: userMap[reg.userId] || { name: 'Unknown User' },
          activity: activityMap[reg.activityId] || { title: 'Unknown Activity' }
        }));
      }
      
      setRegistrations(registrationsWithDetails);
      setTotalRegistrations(response.total);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showError(t('activityRegistrations.fetchError', 'Error fetching registrations'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch of activities and registrations
  useEffect(() => {
    fetchActivities();
  }, []);
  
  // Fetch registrations when filters or pagination changes
  useEffect(() => {
    fetchRegistrations();
  }, [paginationModel, searchQuery, filterActivity]);
  
  // Handle view registration details
  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setOpenDialog(true);
  };
  
  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRegistration(null);
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'user',
      headerName: t('activityRegistrations.studentName', 'Student Name'),
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.user?.name || 'Unknown',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.75rem'
          }}>
            {(params.value || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'userEmail',
      headerName: t('activityRegistrations.email', 'Email'),
      flex: 1.2,
      minWidth: 180,
      valueGetter: (params) => params.row.user?.email || '',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value ? (
            <>
              <Avatar sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: 'secondary.main',
                fontSize: '0.65rem'
              }}>
                <EmailIcon fontSize="small" />
              </Avatar>
              <Typography 
                variant="body2" 
                color="text.primary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px'
                }}
                title={params.value}
              >
                {params.value}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {t('common.noEmail')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'userPhone',
      headerName: t('activityRegistrations.phone', 'Phone'),
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.user?.phone || '',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value ? (
            <>
              <Avatar sx={{ 
                width: 24, 
                height: 24, 
                bgcolor: 'info.main',
                fontSize: '0.65rem'
              }}>
                <PhoneIcon fontSize="small" />
              </Avatar>
              <Typography variant="body2" color="text.primary">
                {params.value}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {t('common.noPhone')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'activity',
      headerName: t('activityRegistrations.activityTitle', 'Activity'),
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.activity?.title || 'Unknown',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'success.main',
            fontSize: '0.75rem'
          }}>
            <EventIcon fontSize="small" />
          </Avatar>
          <Typography 
            variant="body2" 
            fontWeight="medium" 
            color="text.primary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '150px'
            }}
            title={params.value}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'activityType',
      headerName: t('activityRegistrations.activityType', 'Type'),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => params.row.activity?.type || '',
      renderCell: (params) => {
        if (!params.value) return null;
        
        const typeColors = {
          trip: 'primary',
          event: 'secondary', 
          workshop: 'info'
        };
        
        return (
          <Chip
            label={t(`activities.types.${params.value}`, params.value)}
            color={typeColors[params.value] || 'default'}
            size="small"
            sx={{ 
              borderRadius: 2,
              fontWeight: 'medium'
            }}
          />
        );
      },
    },
    {
      field: 'registrationDate',
      headerName: t('activityRegistrations.registrationDate', 'Registration Date'),
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.registrationDate || params.row.createdAt,
      valueFormatter: (params) => formatDate(params.value),
      renderCell: (params) => (
        <Chip
          label={formatDate(params.value)}
          size="small"
          icon={<CalendarTodayIcon />}
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
      field: 'status',
      headerName: t('activityRegistrations.statusLabel', 'Status'),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (params) => params.row.status || 'registered',
      renderCell: (params) => {
        const statusConfig = {
          registered: { color: 'success', icon: <HowToRegIcon /> },
          pending: { color: 'warning', icon: <ScheduleIcon /> },
          confirmed: { color: 'info', icon: <EventAvailableIcon /> },
          cancelled: { color: 'error', icon: <CalendarTodayIcon /> }
        };
        
        const config = statusConfig[params.value] || statusConfig.registered;
        
        return (
          <Chip
            label={t(`activityRegistrations.status.${params.value}`, params.value)}
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
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={t('common.view')}>
          <IconButton
            size="small"
            onClick={() => handleViewRegistration(params.row)}
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
      ),
    },
  ];
  
  return (
    <>
      <PageHeader
        title={t('activityRegistrations.title', 'Activity Registrations')}
        actionLabel={t('common.refresh')}
        onAction={() => fetchRegistrations()}
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
                      {totalRegistrations}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activityRegistrations.totalRegistrations', 'Total Registrations')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <HowToRegIcon />
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
                      {registrations.filter(reg => reg.status === 'confirmed' || reg.status === 'registered').length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activityRegistrations.confirmedRegistrations', 'Confirmed')}
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
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: theme.palette.warning.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {registrations.filter(reg => reg.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activityRegistrations.pendingRegistrations', 'Pending')}
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
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
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
                      {activities.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('activityRegistrations.activeActivities', 'Active Activities')}
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
              {t('activityRegistrations.registrationsList') || 'Activity Registrations Management'}
            </Typography>
            
            {/* Search and Filter Controls */}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('students.searchPlaceholder', 'Search by student name...')}
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
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('activityRegistrations.activity', 'Activity')}
                  </InputLabel>
                  <Select
                    value={filterActivity}
                    onChange={(e) => setFilterActivity(e.target.value)}
                    label={t('activityRegistrations.activity', 'Activity')}
                    disabled={loadingActivities}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    {activities.map((activity) => (
                      <MenuItem key={activity.$id} value={activity.$id}>{activity.title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Tooltip title={t('common.refresh')}>
                  <IconButton
                    onClick={() => fetchRegistrations()}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: theme.palette.primary.contrastText
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
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
              rows={registrations}
              columns={columns}
              getRowId={(row) => row.$id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              rowCount={totalRegistrations}
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
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('activityRegistrations.noRegistrations', 'No registrations found')}
                    </Typography>
                  </Box>
                ),
              }}
            />
          </Box>
        </Paper>
      </Fade>
      
      {/* Enhanced Registration View Dialog */}
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
        {selectedRegistration && (
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
                    {t('activityRegistrations.registrationDetails', 'Activity Registration Details')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {selectedRegistration.user?.name} - {selectedRegistration.activity?.title}
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
                  {/* Student Information Card */}
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardHeader 
                        title={t('activityRegistrations.studentInfo', 'Student Information')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
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
                        <Stack spacing={2}>
                          <Card 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.03)' 
                                : theme.palette.grey[50], 
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>{t('activityRegistrations.studentName', 'Name')}:</strong>
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" color="text.primary">
                              {selectedRegistration.user?.name || 'N/A'}
                            </Typography>
                          </Card>
                          
                          {selectedRegistration.user?.email && (
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activityRegistrations.email', 'Email')}:</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" color="secondary" />
                                <Typography variant="body1" fontWeight="medium" color="text.primary">
                                  {selectedRegistration.user.email}
                                </Typography>
                              </Box>
                            </Card>
                          )}
                          
                          {selectedRegistration.user?.phone && (
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activityRegistrations.phone', 'Phone')}:</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" color="info" />
                                <Typography variant="body1" fontWeight="medium" color="text.primary">
                                  {selectedRegistration.user.phone}
                                </Typography>
                              </Box>
                            </Card>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Activity Information Card */}
                  <Grid item xs={12} md={6}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <CardHeader 
                        title={t('activityRegistrations.activityInfo', 'Activity Information')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <EventIcon />
                          </Avatar>
                        }
                        sx={{ 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? theme.palette.success.dark 
                            : theme.palette.success.light,
                          color: theme.palette.success.contrastText,
                          '& .MuiCardHeader-title': {
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            color: 'inherit'
                          }
                        }}
                      />
                      <CardContent>
                        <Stack spacing={2}>
                          <Card 
                            elevation={1} 
                            sx={{ 
                              p: 2, 
                              bgcolor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.03)' 
                                : theme.palette.grey[50], 
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>{t('activities.title', 'Title')}:</strong>
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" color="text.primary">
                              {selectedRegistration.activity?.title || 'N/A'}
                            </Typography>
                          </Card>
                          
                          {selectedRegistration.activity?.type && (
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activities.type')}:</strong>
                              </Typography>
                              <Chip
                                label={t(`activities.types.${selectedRegistration.activity.type}`, selectedRegistration.activity.type)}
                                color="primary"
                                size="small"
                                sx={{ borderRadius: 2 }}
                              />
                            </Card>
                          )}
                          
                          {selectedRegistration.activity?.location && (
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activities.location')}:</strong>
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {selectedRegistration.activity.location}
                              </Typography>
                            </Card>
                          )}
                          
                          {selectedRegistration.activity?.startDate && (
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activities.startDate')} - {t('activities.endDate')}:</strong>
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {formatDateTime(selectedRegistration.activity.startDate)}
                                {selectedRegistration.activity?.endDate && (
                                  <> - {formatDateTime(selectedRegistration.activity.endDate)}</>
                                )}
                              </Typography>
                            </Card>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Registration Details Card */}
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
                        title={t('activityRegistrations.registrationDetails', 'Registration Details')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <AssignmentIcon />
                          </Avatar>
                        }
                        sx={{ 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? theme.palette.info.dark 
                            : theme.palette.info.light,
                          color: theme.palette.info.contrastText,
                          '& .MuiCardHeader-title': {
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            color: 'inherit'
                          }
                        }}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activityRegistrations.registrationDate')}:</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarTodayIcon fontSize="small" color="warning" />
                                <Typography variant="body1" fontWeight="medium" color="text.primary">
                                  {formatDateTime(selectedRegistration.registrationDate || selectedRegistration.createdAt)}
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('common.lastUpdated')}:</strong>
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {formatDateTime(selectedRegistration.updatedAt)}
                              </Typography>
                            </Card>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Card 
                              elevation={1} 
                              sx={{ 
                                p: 2, 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.03)' 
                                  : theme.palette.grey[50], 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>{t('activityRegistrations.statusLabel', 'Status')}:</strong>
                              </Typography>
                              <Chip
                                label={t(`activityRegistrations.status.${selectedRegistration.status || 'registered'}`, selectedRegistration.status || 'registered')}
                                color={
                                  selectedRegistration.status === 'confirmed' ? 'success' :
                                  selectedRegistration.status === 'pending' ? 'warning' :
                                  selectedRegistration.status === 'cancelled' ? 'error' :
                                  'info'
                                }
                                size="small"
                                sx={{ borderRadius: 2, fontWeight: 'medium' }}
                              />
                            </Card>
                          </Grid>
                          
                          {selectedRegistration.note && (
                            <Grid item xs={12}>
                              <Card 
                                elevation={1} 
                                sx={{ 
                                  p: 2, 
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.03)' 
                                    : theme.palette.grey[50], 
                                  borderRadius: 2,
                                  border: `1px solid ${theme.palette.divider}`
                                }}
                              >
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>{t('activityRegistrations.notes', 'Notes')}:</strong>
                                </Typography>
                                <Typography variant="body1" color="text.primary">
                                  {selectedRegistration.note}
                                </Typography>
                              </Card>
                            </Grid>
                          )}
                          
                          <Grid item xs={12}>
                            <Alert 
                              severity="info" 
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.info.dark, 0.2)
                                  : alpha(theme.palette.info.light, 0.2),
                                color: theme.palette.text.primary,
                                border: `1px solid ${theme.palette.info.main}`,
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                  color: theme.palette.info.main
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontStyle: 'italic' }}>
                                {t('activityRegistrations.registrationConfirmation', 'This student has registered for the activity.')}
                              </Typography>
                            </Alert>
                          </Grid>
                        </Grid>
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
                  variant="contained"
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
        )}
      </Dialog>
    </>
  );
};

export default ActivityRegistrations; 