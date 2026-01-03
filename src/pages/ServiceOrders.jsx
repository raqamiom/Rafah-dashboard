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
  Rating,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  EventNote as EventNoteIcon,
  Person as PersonIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  RoomService as RoomServiceIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';

const ServiceOrders = () => {
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL, currentLanguage } = useLanguage();
  const theme = useTheme();
  
  // State for service order data
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalServiceOrders, setTotalServiceOrders] = useState(0);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState(null);
  
  // State for services and students
  const [services, setServices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
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
  
  // Simplified form state for single service orders
  const [formData, setFormData] = useState({
    userId: '',
    serviceId: '',
    quantity: 1,
    roomNumber: '',
    roomId: '',
    specialInstructions: '',
    status: 'pending',
  });

  // Collection IDs - simplified to only use serviceOrders
  const COLLECTIONS = {
    services: collections.services,
    serviceOrders: collections.serviceOrders,
    users: collections.users,
  };

  // Fetch services from the database
  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.services
      );
      setServices(response.documents);
    } catch (error) {
      console.error('Error fetching services:', error);
      showError(t('services.fetchError'));
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch students from the database
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.users,
        [Query.equal('role', 'student')]
      );
      setStudents(response.documents);
    } catch (error) {
      console.error('Error fetching students:', error);
      showError(t('users.fetchError'));
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch service orders from the database
  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterStatus !== 'all') {
        filters.push(Query.equal('status', filterStatus));
      }
      
      if (searchQuery) {
        filters.push(Query.search('roomNumber', searchQuery));
      }
      
      if (currentTab !== 'all') {
        filters.push(Query.equal('status', currentTab));
      }
      
      // Fetch service orders with simplified structure
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.serviceOrders,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        '$createdAt',
        'DESC'
      );
      
      // Enrich with user and service names
      const enrichedServiceOrders = await Promise.all(
        response.documents.map(async (order) => {
          try {
            // Fetch user details
            const user = await databases.getDocument(
              databaseId,
              COLLECTIONS.users,
              order.userId
            );
            
            // Fetch service details
            const service = await databases.getDocument(
              databaseId,
              COLLECTIONS.services,
              order.serviceId
            );
            
            return {
              ...order,
              studentName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              studentEmail: user.email,
              serviceName: currentLanguage === 'ar' ? service.nameAr : service.nameEn,
              serviceDetails: service,
            };
          } catch (error) {
            console.error('Error fetching service order details:', error);
            return {
              ...order,
              studentName: order.studentName,
              studentEmail: '',
              serviceName: order.serviceName,
              serviceDetails: null,
            };
          }
        })
      );
      
      setServiceOrders(enrichedServiceOrders);
      setTotalServiceOrders(response.total);
    } catch (error) {
      console.error('Error fetching service orders:', error);
      showError(t('serviceOrders.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Generate service order ID
  const generateServiceOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `ORD${year}${month}${day}${timestamp}`;
  };

  // Initial fetch
  useEffect(() => {
    fetchServices();
    fetchStudents();
    fetchServiceOrders();
  }, [paginationModel, searchQuery, filterStatus, currentTab]);

  // Fetch student details when selected
  const fetchStudentDetails = async (userId) => {
    try {
      setLoadingStudentDetails(true);
      
      // Get student details
      const userResponse = await databases.getDocument(
        databaseId,
        COLLECTIONS.users,
        userId
      );
      
      // Get student's contracts and rooms
      const contractsResponse = await databases.listDocuments(
        databaseId,
        collections.contracts,
        [Query.equal('userId', userId)]
      );
      
      let roomDetails = [];
      let hasActiveContract = false;
      let activeContract = null;
      
      if (contractsResponse.documents.length > 0) {
        activeContract = contractsResponse.documents.find(c => c.status === 'active');
        hasActiveContract = !!activeContract;
        
        if (activeContract && activeContract.roomIds) {
          const roomPromises = activeContract.roomIds.map(roomId =>
            databases.getDocument(databaseId, collections.rooms, roomId)
              .catch(err => {
                console.error('Error fetching room:', err);
                return null;
              })
          );
          const rooms = await Promise.all(roomPromises);
          roomDetails = rooms.filter(room => room !== null);
        }
      }
      
      const studentDetails = {
        ...userResponse,
        contracts: contractsResponse.documents,
        rooms: roomDetails,
        hasActiveContract,
        activeContract
      };
      
      setSelectedStudentDetails(studentDetails);
      
      // Auto-populate room number if student has assigned rooms
      if (roomDetails.length > 0 && !formData.roomNumber) {
        setFormData(prev => ({
          ...prev,
          roomNumber: roomDetails[0].roomNumber,
          roomId: roomDetails[0].$id
        }));
      }
      
    } catch (error) {
      console.error('Error fetching student details:', error);
      setSelectedStudentDetails(null);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setFormData({ ...formData, userId: studentId, roomNumber: '', roomId: '' }); // Clear room selection when student changes
    if (studentId) {
      fetchStudentDetails(studentId);
    } else {
      setSelectedStudentDetails(null);
    }
  };

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    if (!selectedStudentDetails || !selectedStudentDetails.rooms) return;
    
    const selectedRoom = selectedStudentDetails.rooms.find(room => room.$id === roomId);
    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        roomId: roomId,
        roomNumber: selectedRoom.roomNumber
      }));
    }
  };

  // Get service name based on language
  const getServiceName = (service) => {
    return currentLanguage === 'ar' ? service.nameAr : service.nameEn;
  };

  // Get service description based on language
  const getServiceDescription = (service) => {
    return currentLanguage === 'ar' ? service.descriptionAr : service.descriptionEn;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'PPpp');
  };

  // Get total amount for current service and quantity
  const getTotalAmount = () => {
    const selectedService = services.find(s => s.$id === formData.serviceId);
    if (!selectedService) return 0;
    return selectedService.price * formData.quantity;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userId') {
      handleStudentSelect(value);
    } else if (name === 'roomId') {
      handleRoomSelect(value);
    } else if (name === 'quantity') {
      const qty = Math.max(1, parseInt(value) || 1);
      setFormData({ ...formData, [name]: qty });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle dialog open for create
  const handleCreateServiceOrder = () => {
    setFormData({
      userId: '',
      serviceId: '',
      quantity: 1,
      roomNumber: '',
      roomId: '',
      specialInstructions: '',
      status: 'pending',
    });
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle dialog open for view
  const handleViewServiceOrder = (order) => {
    setSelectedServiceOrder(order);
    setDialogMode('view');
    setOpenDialog(true);
    
    // Fetch student details for the order being viewed
    if (order.userId) {
      fetchStudentDetails(order.userId);
    }
  };
  
  // Handle dialog open for edit
  const handleEditServiceOrder = (order) => {
    setSelectedServiceOrder(order);
    setFormData({
      userId: order.userId,
      serviceId: order.serviceId,
      quantity: order.quantity || 1,
      roomNumber: order.roomNumber,
      roomId: order.roomId,
      specialInstructions: order.specialInstructions || '',
      status: order.status,
    });
    
    // Fetch student details for the order
    if (order.userId) {
      fetchStudentDetails(order.userId);
    }
    
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Handle dialog open for rate
  const handleRateServiceOrder = (order) => {
    setSelectedServiceOrder(order);
    setFormData({
      ...formData,
      rating: order.rating || 0,
      feedback: order.feedback || '',
    });
    setDialogMode('rate');
    setOpenDialog(true);
  };
  

  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedServiceOrder(null);
    setSelectedStudentDetails(null);
  };
  
  // Handle rating change
  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      rating: newValue,
    });
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      scheduledDate: date,
    });
  };
  
  // Handle service selection
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.id === serviceId);
    setFormData({
      ...formData,
      serviceId: serviceId,
      serviceName: service ? service.name : '',
    });
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.userId) {
      showError(t('serviceOrders.selectStudent'));
      return false;
    }

    if (!formData.serviceId) {
      showError(t('serviceOrders.selectService'));
      return false;
    }

    if (!formData.roomId) {
      showError(t('serviceOrders.enterRoomNumber'));
      return false;
    }

    if (formData.quantity < 1) {
      showError(t('serviceOrders.invalidQuantity'));
      return false;
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const selectedService = services.find(s => s.$id === formData.serviceId);
      if (!selectedService) {
        showError(t('serviceOrders.serviceNotFound'));
        return;
      }

      const totalAmount = selectedService.price * formData.quantity;

      if (dialogMode === 'create') {
        // Create service order with all data in one document
        const serviceOrderData = {
          serviceOrderId: generateServiceOrderId(),
          userId: formData.userId,
          serviceId: formData.serviceId,
          serviceName: getServiceName(selectedService),
          quantity: formData.quantity,
          pricePerUnit: selectedService.price,
          totalAmount: totalAmount,
          status: formData.status,
          roomNumber: formData.roomNumber,
          roomId: formData.roomId,
          specialInstructions: formData.specialInstructions,
          orderTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await databases.createDocument(
          databaseId,
          COLLECTIONS.serviceOrders,
          ID.unique(),
          serviceOrderData
        );

        showSuccess(t('serviceOrders.serviceOrderCreated'));
      } else if (dialogMode === 'edit') {
        // Update service order
        const serviceOrderData = {
          serviceId: formData.serviceId,
          serviceName: getServiceName(selectedService),
          quantity: formData.quantity,
          pricePerUnit: selectedService.price,
          totalAmount: totalAmount,
          status: formData.status,
          roomNumber: formData.roomNumber,
          roomId: formData.roomId,
          specialInstructions: formData.specialInstructions,
          updatedAt: new Date().toISOString(),
        };

        // Add completion time if status is completed
        if (formData.status === 'completed' && selectedServiceOrder.status !== 'completed') {
          serviceOrderData.completionTime = new Date().toISOString();
        }

        await databases.updateDocument(
          databaseId,
          COLLECTIONS.serviceOrders,
          selectedServiceOrder.$id,
          serviceOrderData
        );

        showSuccess(t('serviceOrders.serviceOrderUpdated'));
      }
      
      handleCloseDialog();
      fetchServiceOrders();
    } catch (error) {
      console.error('Error handling service order:', error);
      showError(t('serviceOrders.operationError'));
    }
  };
  

  
  // Change service order status
  const handleChangeStatus = async (order, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      // Add completion time if status is completed
      if (newStatus === 'completed') {
        updateData.completionTime = new Date().toISOString();
      }

      await databases.updateDocument(
        databaseId,
        COLLECTIONS.serviceOrders,
        order.$id,
        updateData
      );

      const statusMessages = {
        processing: t('serviceOrders.serviceOrderProcessing'),
        completed: t('serviceOrders.serviceOrderCompleted'),
        cancelled: t('serviceOrders.serviceOrderCancelled'),
      };
      
      showSuccess(statusMessages[newStatus] || t('serviceOrders.statusUpdated'));
      fetchServiceOrders();
    } catch (error) {
      console.error('Error updating service order status:', error);
      showError(t('serviceOrders.statusUpdateError'));
    }
  };
  
  // Add service to service order
  const handleAddService = (serviceId) => {
    const service = services.find(s => s.$id === serviceId);
    if (!service) return;

    // Check if service already exists
    if (selectedServices.find(item => item.serviceId === serviceId)) {
      showError(t('serviceOrders.serviceAlreadyAdded'));
      return;
    }

    const newServiceOrderItem = {
      serviceId: serviceId,
      quantity: 1,
      price: service.price,
      service: service
    };

    setSelectedServices([...selectedServices, newServiceOrderItem]);
  };

  // Remove service from service order
  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter(item => item.serviceId !== serviceId));
  };

  // Data grid columns
  const columns = [
    {
      field: 'serviceOrderId',
      headerName: t('serviceOrders.serviceOrderId'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.75rem'
          }}>
            <AssignmentIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="primary.main">
            {params.row.serviceOrderId}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'studentName',
      headerName: t('serviceOrders.studentName'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'secondary.main',
            fontSize: '0.75rem'
          }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {params.row.studentName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'serviceName',
      headerName: t('serviceOrders.serviceName'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'info.main',
            fontSize: '0.75rem'
          }}>
            <RoomServiceIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" color="text.primary">
            {params.row.serviceName}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: t('serviceOrders.quantity'),
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => (
        <Chip
          label={params.row.quantity}
          size="small"
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.warning.main, 0.2)
              : alpha(theme.palette.warning.light, 0.3),
            color: theme.palette.warning.main,
            fontWeight: 'bold'
          }}
        />
      ),
    },
    {
      field: 'totalAmount',
      headerName: t('serviceOrders.totalAmount'),
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: 'success.main',
            fontSize: '0.65rem'
          }}>
            OMR
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {params.value || 0}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'roomNumber',
      headerName: t('serviceOrders.roomNumber'),
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.roomNumber}
          size="small"
          icon={<EventNoteIcon />}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.info.main, 0.2)
              : alpha(theme.palette.info.light, 0.3),
            color: theme.palette.info.main,
            fontWeight: 'medium'
          }}
        />
      ),
    },
    {
      field: 'orderTime',
      headerName: t('serviceOrders.orderTime'),
      flex: 0.9,
      minWidth: 130,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'createdAt',
      headerName: t('common.createdAt'),
      flex: 0.9,
      minWidth: 130,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'status',
      headerName: t('serviceOrders.statusLabel'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const statusColors = {
          pending: 'warning',
          processing: 'info',
          completed: 'success',
          cancelled: 'error',
        };
        
        const statusIcons = {
          pending: <HourglassEmptyIcon />,
          processing: <ScheduleIcon />,
          completed: <CheckCircleIcon />,
          cancelled: <CancelIcon />,
        };
        
        return (
          <Chip
            label={t(`serviceOrders.status.${params.value}`)}
            color={statusColors[params.value] || 'default'}
            size="small"
            icon={statusIcons[params.value]}
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
              onClick={() => handleViewServiceOrder(params.row)}
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
          
          {params.row.status === 'pending' && (
            <Tooltip title={t('serviceOrders.process')}>
              <IconButton
                size="small"
                onClick={() => handleChangeStatus(params.row, 'processing')}
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
                <ScheduleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {params.row.status === 'processing' && (
            <Tooltip title={t('serviceOrders.complete')}>
              <IconButton
                size="small"
                onClick={() => handleChangeStatus(params.row, 'completed')}
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.success.light, 0.3),
                  color: theme.palette.success.main,
                  '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.success.main, 0.3)
                      : alpha(theme.palette.success.light, 0.5),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {(params.row.status === 'pending' || params.row.status === 'processing') && (
            <Tooltip title={t('serviceOrders.cancel')}>
              <IconButton
                size="small"
                onClick={() => handleChangeStatus(params.row, 'cancelled')}
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
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {(params.row.status === 'pending' || params.row.status === 'processing') && (
            <Tooltip title={t('common.edit')}>
              <IconButton
                size="small"
                onClick={() => handleEditServiceOrder(params.row)}
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
          )}
          

        </Stack>
      ),
    },
  ];
  
  // Filter service orders based on tab and filters
  const filteredServiceOrders = serviceOrders.filter(order => {
    if (currentTab === 'pending' && order.status !== 'pending') return false;
    if (currentTab === 'processing' && order.status !== 'processing') return false;
    if (currentTab === 'completed' && order.status !== 'completed') return false;
    if (currentTab === 'cancelled' && order.status !== 'cancelled') return false;
    
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.serviceOrderId?.toLowerCase().includes(query) ||
        order.studentName?.toLowerCase().includes(query) ||
        order.roomNumber?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Calculate stats
  const stats = {
    total: serviceOrders.length,
    pending: serviceOrders.filter(order => order.status === 'pending').length,
    processing: serviceOrders.filter(order => order.status === 'processing').length,
    completed: serviceOrders.filter(order => order.status === 'completed').length,
    cancelled: serviceOrders.filter(order => order.status === 'cancelled').length,
  };
  
  return (
    <>
      <PageHeader
        title={t('serviceOrders.title')}
        actionLabel={t('serviceOrders.create')}
        onAction={handleCreateServiceOrder}
      />
      
      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
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
                      {t('serviceOrders.totalServiceOrders')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <AssignmentIcon />
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
        
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
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
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('serviceOrders.status.pending')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <HourglassEmptyIcon />
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
        
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
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
                      {stats.processing}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('serviceOrders.status.processing')}
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
        
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
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
                      {stats.completed}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('serviceOrders.status.completed')}
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
        
        <Grid item xs={12} sm={6} md={3} lg={2.4}>
          <Zoom in={true} style={{ transitionDelay: '500ms' }}>
            <Card elevation={2} sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: theme.palette.error.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.cancelled}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('serviceOrders.status.cancelled')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <CancelIcon />
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
              {t('serviceOrders.list') || 'Service Orders List'}
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
                    {t('serviceOrders.statusLabel')}
                  </InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label={t('serviceOrders.statusLabel')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    <MenuItem value="pending">{t('serviceOrders.status.pending')}</MenuItem>
                    <MenuItem value="processing">{t('serviceOrders.status.processing')}</MenuItem>
                    <MenuItem value="completed">{t('serviceOrders.status.completed')}</MenuItem>
                    <MenuItem value="cancelled">{t('serviceOrders.status.cancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={() => fetchServiceOrders()}
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
                    onClick={handleCreateServiceOrder}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    {t('serviceOrders.create')}
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
                    <AssignmentIcon fontSize="small" />
                    {t('common.all')}
                    <Badge badgeContent={stats.total} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                value="pending" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HourglassEmptyIcon fontSize="small" />
                    {t('serviceOrders.status.pending')}
                    <Badge badgeContent={stats.pending} color="warning" />
                  </Box>
                } 
              />
              <Tab 
                value="processing" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    {t('serviceOrders.status.processing')}
                    <Badge badgeContent={stats.processing} color="info" />
                  </Box>
                } 
              />
              <Tab 
                value="completed" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    {t('serviceOrders.status.completed')}
                    <Badge badgeContent={stats.completed} color="success" />
                  </Box>
                } 
              />
              <Tab 
                value="cancelled" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelIcon fontSize="small" />
                    {t('serviceOrders.status.cancelled')}
                    <Badge badgeContent={stats.cancelled} color="error" />
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
              rows={filteredServiceOrders}
              columns={columns}
              getRowId={(row) => row.$id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              rowCount={filteredServiceOrders.length}
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
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
      
      {/* Dialogs */}
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
        {dialogMode === 'view' ? (
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
                    {t('serviceOrders.viewServiceOrder')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    ID: {selectedServiceOrder?.serviceOrderId}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Service Order ID as the first and most prominent item */}
                  <Grid item xs={12}>
                    <Card 
                      elevation={3} 
                      sx={{ 
                        p: 3, 
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: theme.palette.primary.contrastText,
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                            {t('serviceOrders.serviceOrderId')}
                          </Typography>
                          <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                            {selectedServiceOrder?.serviceOrderId}
                          </Typography>
                        </Box>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          width: 56, 
                          height: 56,
                          color: 'inherit'
                        }}>
                          <AssignmentIcon />
                        </Avatar>
                      </Box>
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
                  </Grid>
                  
                  {[
                    { label: t('serviceOrders.studentName'), value: selectedServiceOrder?.studentName },
                    { label: t('serviceOrders.serviceName'), value: selectedServiceOrder?.serviceName },
                    { label: t('serviceOrders.quantity'), value: selectedServiceOrder?.quantity },
                    { label: t('serviceOrders.pricePerUnit'), value: `${selectedServiceOrder?.pricePerUnit || 0} OMR` },
                    { label: t('serviceOrders.totalAmount'), value: `${selectedServiceOrder?.totalAmount || 0} OMR` },
                    { label: t('serviceOrders.roomNumber'), value: selectedServiceOrder?.roomNumber },
                    { label: t('serviceOrders.orderTime'), value: formatDate(selectedServiceOrder?.orderTime) },
                    { label: t('common.createdAt'), value: formatDate(selectedServiceOrder?.createdAt) },
                    { label: t('common.updatedAt'), value: formatDate(selectedServiceOrder?.updatedAt) }
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
                  
                  <Grid item xs={12} sm={6}>
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
                        {t('serviceOrders.statusLabel')}
                      </Typography>
                      <Chip
                        label={t(`serviceOrders.status.${selectedServiceOrder?.status}`)}
                        color={
                          selectedServiceOrder?.status === 'pending'
                            ? 'warning'
                            : selectedServiceOrder?.status === 'processing'
                              ? 'info'
                              : selectedServiceOrder?.status === 'completed'
                                ? 'success'
                                : 'error'
                        }
                        size="small"
                        variant="filled"
                        sx={{ borderRadius: 2, fontWeight: 'medium' }}
                      />
                    </Card>
                  </Grid>
                  
                  {selectedServiceOrder?.completionTime && (
                    <Grid item xs={12} sm={6}>
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
                          {t('serviceOrders.completionTime')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                          {formatDate(selectedServiceOrder?.completionTime)}
                        </Typography>
                      </Card>
                    </Grid>
                  )}
                  
                  {selectedServiceOrder?.specialInstructions && (
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
                          title={t('serviceOrders.specialInstructions')}
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
                            {selectedServiceOrder?.specialInstructions}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {/* Service Description */}
                  {selectedServiceOrder?.serviceDetails && (
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
                          title={t('serviceOrders.serviceDetails')}
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
                          <Typography variant="body2" color="text.secondary">
                            {getServiceDescription(selectedServiceOrder.serviceDetails)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {/* Student Information in View Dialog */}
                  {selectedStudentDetails && (
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
                          title={t('students.studentInformation')}
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
                        <CardContent sx={{ p: 2 }}>
                          {loadingStudentDetails ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : (
                            <>
                              {/* Student Basic Info */}
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('students.name')}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedStudentDetails.name || `${selectedStudentDetails.firstName || ''} ${selectedStudentDetails.lastName || ''}`.trim()}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('students.email')}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedStudentDetails.email || 'N/A'}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('students.phone')}
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedStudentDetails.phone || 'N/A'}
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('contracts.statusLabel')}
                                  </Typography>
                                  <Chip
                                    label={selectedStudentDetails.hasActiveContract ? t('contracts.status.active') : t('contracts.noActiveContract')}
                                    color={selectedStudentDetails.hasActiveContract ? 'success' : 'warning'}
                                    size="small"
                                    sx={{ borderRadius: 2, fontWeight: 'medium' }}
                                  />
                                </Grid>
                                
                                {/* Emergency Contact */}
                                {(selectedStudentDetails.emergencyContactName || selectedStudentDetails.emergencyContactPhone) && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                      {t('students.emergencyContact')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {selectedStudentDetails.emergencyContactName || 'N/A'}
                                      {selectedStudentDetails.emergencyContactPhone && 
                                        ` (${selectedStudentDetails.emergencyContactPhone})`
                                      }
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                              
                              {/* Room Information */}
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    {t('rooms.assignedRooms')}
                                  </Typography>
                                  {selectedStudentDetails.hasActiveContract && selectedStudentDetails.rooms && selectedStudentDetails.rooms.length > 0 ? (
                                    <>
                                      <Paper 
                                        sx={{ 
                                          p: 1.5, 
                                          mb: 1.5,
                                          bgcolor: 'primary.light',
                                          color: 'primary.contrastText',
                                          borderRadius: 1
                                        }}
                                      >
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {selectedStudentDetails.rooms.length === 1 
                                            ? `${t('rooms.room')} ${selectedStudentDetails.rooms[0].roomNumber}`
                                            : `${selectedStudentDetails.rooms.length} ${t('rooms.rooms')}`
                                          }
                                          {selectedStudentDetails.activeContract && (
                                            <> • {t('contracts.contract')} {selectedStudentDetails.activeContract.$id.slice(-6)}</>
                                          )}
                                        </Typography>
                                      </Paper>
                                      
                                      <Grid container spacing={1}>
                                        {selectedStudentDetails.rooms.map((room) => (
                                          <Grid item xs={12} sm={6} md={4} key={room.$id}>
                                            <Paper 
                                              sx={{ 
                                                p: 1.5, 
                                                bgcolor: 'action.hover',
                                                border: 1,
                                                borderColor: 'divider'
                                              }}
                                            >
                                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                {t('rooms.room')} {room.roomNumber}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {t('rooms.type')}: {t(`rooms.types.${room.type}`) || room.type}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {t('rooms.building')}: {room.building || 'N/A'}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {t('rooms.floor')}: {room.floor || 'N/A'}
                                              </Typography>
                                           
                                            </Paper>
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </>
                                  ) : (
                                    <Paper 
                                      sx={{ 
                                        p: 1.5, 
                                        bgcolor: 'warning.light',
                                        color: 'warning.contrastText',
                                        borderRadius: 1
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {selectedStudentDetails.hasActiveContract 
                                          ? t('rooms.noRoomsAssigned') 
                                          : t('contracts.noActiveContract')}
                                      </Typography>
                                    </Paper>
                                  )}
                                </Grid>
                              </Grid>
                            </>
                          )}
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
                {selectedServiceOrder?.status === 'pending' || selectedServiceOrder?.status === 'processing' ? (
                  <Button 
                    onClick={() => {
                      handleCloseDialog();
                      handleEditServiceOrder(selectedServiceOrder);
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
                ) : null}
              </DialogActions>
            </Box>
          </Fade>
        ) : dialogMode === 'rate' ? (
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
                  <StarIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {t('serviceOrders.rateService')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                  {selectedServiceOrder?.serviceName}
                </Typography>
                
                <Box sx={{ mb: 3, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('serviceOrders.rating')}
                  </Typography>
                  <Rating
                    value={formData.rating}
                    onChange={handleRatingChange}
                    size="large"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label={t('serviceOrders.feedback')}
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder={t('serviceOrders.feedbackPlaceholder')}
                />
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
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  color="primary"
                  variant="contained"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  {t('common.submit')}
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
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {dialogMode === 'create' ? t('serviceOrders.create') : t('serviceOrders.edit')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto'
              }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      {loadingStudents ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <FormControl fullWidth required>
                          <InputLabel>{t('serviceOrders.student')}</InputLabel>
                          <Select
                            name="userId"
                            value={formData.userId}
                            onChange={handleInputChange}
                            label={t('serviceOrders.student')}
                          >
                            {students.map((student) => (
                              <MenuItem key={student.$id} value={student.$id}>
                                {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>{t('serviceOrders.roomNumber')}</InputLabel>
                        <Select
                          name="roomId"
                          value={formData.roomId}
                          onChange={handleInputChange}
                          label={t('serviceOrders.roomNumber')}
                          disabled={!selectedStudentDetails?.rooms?.length}
                        >
                          {selectedStudentDetails?.rooms?.length > 0 ? (
                            selectedStudentDetails.rooms.map((room) => (
                              <MenuItem key={room.$id} value={room.$id}>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {room.roomNumber}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {t(`rooms.types.${room.type}`) || room.type} • {room.building}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value="" disabled>
                              {selectedStudentDetails ? t('rooms.noRoomsAvailable') : t('serviceOrders.selectStudentFirst')}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      {loadingServices ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <FormControl fullWidth required>
                          <InputLabel>{t('serviceOrders.service')}</InputLabel>
                          <Select
                            name="serviceId"
                            value={formData.serviceId}
                            onChange={handleInputChange}
                            label={t('serviceOrders.service')}
                          >
                            {services
                              .filter(service => service.isAvailable)
                              .map((service) => (
                                <MenuItem key={service.$id} value={service.$id}>
                                  {getServiceName(service)} - {service.price} OMR
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('serviceOrders.quantity')}
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        inputProps={{ min: 1 }}
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>{t('serviceOrders.statusLabel')}</InputLabel>
                        <Select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          label={t('serviceOrders.statusLabel')}
                        >
                          <MenuItem value="pending">{t('serviceOrders.status.pending')}</MenuItem>
                          <MenuItem value="processing">{t('serviceOrders.status.processing')}</MenuItem>
                          <MenuItem value="completed">{t('serviceOrders.status.completed')}</MenuItem>
                          <MenuItem value="cancelled">{t('serviceOrders.status.cancelled')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('serviceOrders.specialInstructions')}
                        name="specialInstructions"
                        value={formData.specialInstructions}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        placeholder={t('serviceOrders.specialInstructionsPlaceholder')}
                      />
                    </Grid>
                    
                    {/* Total Amount Display */}
                    {formData.serviceId && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <Typography variant="h6" align="center">
                            {t('serviceOrders.total')}: {getTotalAmount()} OMR
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
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
    </>
  );
};

export default ServiceOrders; 