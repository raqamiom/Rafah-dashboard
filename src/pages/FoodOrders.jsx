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
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CardMedia,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  CardHeader,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Kitchen as KitchenIcon,
  DeliveryDining as DeliveryIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  AccessTime as AccessTimeIcon,
  MeetingRoom as MeetingRoomIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  LocalDining as LocalDiningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, alpha } from '@mui/material/styles';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';

const FoodOrders = () => {
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL, currentLanguage } = useLanguage();
  const theme = useTheme();
  
  // State for food order data
  const [foodOrders, setFoodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalFoodOrders, setTotalFoodOrders] = useState(0);
  const [selectedFoodOrder, setSelectedFoodOrder] = useState(null);
  
  // State for food menu and students
  const [foodMenu, setFoodMenu] = useState([]);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
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
  
  // State for food order form
  const [formData, setFormData] = useState({
    userId: '',
    roomNumber: '',
    roomId: '',
    deliveryNotes: '',
    status: 'pending',
    paymentStatus: 'pending',
  });
  
  // State for selected menu items
  const [selectedItems, setSelectedItems] = useState([]);

  // Collection IDs for food ordering
  const COLLECTIONS = {
    foodMenu: '68373009002a61f5cf07',
    foodOrders: '6837318d0033889a6907',
    foodOrderItems: '683732e800333949b399',
    categories: '68503924002ea954e95f',
    users: collections.users,
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.categories
      );
      setCategories(response.documents);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError(t('foodMenu.categories.fetchError'));
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch food menu items
  const fetchFoodMenu = async () => {
    try {
      setLoadingMenu(true);
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.foodMenu,
        [Query.equal('isAvailable', true)]
      );
      setFoodMenu(response.documents);
    } catch (error) {
      console.error('Error fetching food menu:', error);
      showError(t('foodOrders.fetchMenuError'));
    } finally {
      setLoadingMenu(false);
    }
  };

  // Fetch students
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

  // Fetch food orders
  const fetchFoodOrders = async () => {
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
      
      // Fetch food orders
      const response = await databases.listDocuments(
        databaseId,
        COLLECTIONS.foodOrders,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        '$createdAt',
        'DESC'
      );
      
      // Enrich with user details and order items
      const enrichedFoodOrders = await Promise.all(
        response.documents.map(async (order) => {
          try {
            // Fetch user details
            const user = await databases.getDocument(
              databaseId,
              COLLECTIONS.users,
              order.userId
            );
            
            // Fetch order items
            const orderItemsResponse = await databases.listDocuments(
              databaseId,
              COLLECTIONS.foodOrderItems,
              [Query.equal('orderId', order.$id)]
            );
            
            return {
              ...order,
              studentName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              studentEmail: user.email,
              orderItems: orderItemsResponse.documents,
              itemCount: orderItemsResponse.documents.length,
            };
          } catch (error) {
            console.error('Error fetching food order details:', error);
            return {
              ...order,
              studentName: 'Unknown Student',
              studentEmail: '',
              orderItems: [],
              itemCount: 0,
            };
          }
        })
      );
      
      setFoodOrders(enrichedFoodOrders);
      setTotalFoodOrders(response.total);
    } catch (error) {
      console.error('Error fetching food orders:', error);
      showError(t('foodOrders.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Generate food order ID
  const generateFoodOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `FO${year}${month}${day}${timestamp}`;
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.$id === categoryId);
    return category ? (currentLanguage === 'ar' ? category.nameAr || category.name : category.name) : categoryId;
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    fetchFoodMenu();
    fetchStudents();
    fetchFoodOrders();
  }, [paginationModel, searchQuery, filterStatus, currentTab]);

  // Fetch student details
  const fetchStudentDetails = async (userId) => {
    try {
      setLoadingStudentDetails(true);
      
      const userResponse = await databases.getDocument(
        databaseId,
        COLLECTIONS.users,
        userId
      );
      
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
      
      // Auto-populate room number and roomId
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
    setFormData({ 
      ...formData, 
      userId: studentId,
      roomNumber: '',
      roomId: ''
    });
    if (studentId) {
      fetchStudentDetails(studentId);
    } else {
      setSelectedStudentDetails(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'PPpp');
  };

  // Get total amount for selected items
  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => total + (item.quantity * item.pricePerItem), 0);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userId') {
      handleStudentSelect(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle add menu item to order
  const handleAddMenuItem = (menuItem) => {
    const existingItem = selectedItems.find(item => item.itemId === menuItem.$id);
    
    if (existingItem) {
      // Increase quantity
      setSelectedItems(selectedItems.map(item =>
        item.itemId === menuItem.$id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new item
      const newItem = {
        itemId: menuItem.$id,
        itemName: menuItem.itemName,
        quantity: 1,
        pricePerItem: menuItem.price || 0,
        specialInstructions: '',
        menuItem: menuItem,
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Handle remove menu item from order
  const handleRemoveMenuItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };

  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveMenuItem(itemId);
      return;
    }
    
    setSelectedItems(selectedItems.map(item =>
      item.itemId === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Handle special instructions change
  const handleInstructionsChange = (itemId, instructions) => {
    setSelectedItems(selectedItems.map(item =>
      item.itemId === itemId
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };



  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await databases.updateDocument(
        databaseId,
        COLLECTIONS.foodOrders,
        orderId,
        {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'ready' && { estimatedDeliveryTime: new Date().toISOString() }),
          ...(newStatus === 'delivered' && { actualDeliveryTime: new Date().toISOString() }),
        }
      );

      const statusMessages = {
        preparing: t('foodOrders.status.preparing'),
        ready: t('foodOrders.status.ready'),
        delivered: t('foodOrders.status.delivered'),
        cancelled: t('foodOrders.status.cancelled'),
      };

      showSuccess(`Order status updated to ${statusMessages[newStatus] || newStatus}`);
      fetchFoodOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showError(t('foodOrders.statusUpdateError'));
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (selectedItems.length === 0 || !formData.userId || !formData.roomNumber) {
      showError('Please fill in all required fields and select at least one item');
      return;
    }

    try {
      // Create the food order
      const orderData = {
        orderId: generateFoodOrderId(),
        userId: formData.userId,
        roomNumber: formData.roomNumber,
        roomId: formData.roomId, // Include roomId reference
        deliveryNotes: formData.deliveryNotes,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        totalAmount: getTotalAmount(),
        orderTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (dialogMode === 'create') {
        // Create food order
        const orderResponse = await databases.createDocument(
          databaseId,
          COLLECTIONS.foodOrders,
          ID.unique(),
          orderData
        );

        // Create food order items
        const orderItemPromises = selectedItems.map(item => 
          databases.createDocument(
            databaseId,
            COLLECTIONS.foodOrderItems,
            ID.unique(),
            {
              orderId: orderResponse.$id,
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.quantity * item.pricePerItem,
              specialInstructions: item.specialInstructions || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          )
        );

        await Promise.all(orderItemPromises);
        showSuccess(t('foodOrders.foodOrderCreated'));
      } else if (dialogMode === 'edit') {
        // Update food order
        await databases.updateDocument(
          databaseId,
          COLLECTIONS.foodOrders,
          selectedFoodOrder.$id,
          {
            ...orderData,
            updatedAt: new Date().toISOString(),
          }
        );
        showSuccess(t('foodOrders.foodOrderUpdated'));
      }

      setOpenDialog(false);
      fetchFoodOrders();
    } catch (error) {
      console.error('Error saving food order:', error);
      showError(t('foodOrders.operationError'));
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Box>
        <PageHeader
          title={t('foodOrders.title')}
          actionLabel={t('foodOrders.create')}
          onAction={() => {
            setFormData({
              userId: '',
              roomNumber: '',
              roomId: '',
              deliveryNotes: '',
              status: 'pending',
              paymentStatus: 'pending',
            });
            setSelectedItems([]);
            setDialogMode('create');
            setOpenDialog(true);
          }}
        />
        
        {/* Enhanced Loading Progress Bar */}
        {loading && (
          <LinearProgress 
            sx={{ 
              mb: 2,
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }} 
          />
        )}
        
        {/* Enhanced Stats cards with animations and gradients */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: t('foodOrders.totalOrders'),
              value: foodOrders.length,
              icon: RestaurantIcon,
              gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`,
              delay: 100
            },
            {
              title: t('foodOrders.status.pending'),
              value: foodOrders.filter(order => order.status === 'pending').length,
              icon: AccessTimeIcon,
              gradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
              delay: 200
            },
            {
              title: t('foodOrders.status.preparing'),
              value: foodOrders.filter(order => order.status === 'preparing').length,
              icon: KitchenIcon,
              gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.dark, 0.9)})`,
              delay: 300
            },
            {
              title: t('foodOrders.status.delivered'),
              value: foodOrders.filter(order => order.status === 'delivered').length,
              icon: DeliveryIcon,
              gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
              delay: 400
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Zoom in={true} timeout={stat.delay}>
                <Card 
                  sx={{
                    background: stat.gradient,
                    color: 'white',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '& .stat-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                      pointerEvents: 'none',
                    }
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h3" fontWeight="bold" sx={{ 
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          background: `linear-gradient(45deg, #fff, ${alpha('#fff', 0.8)})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          opacity: 0.9,
                          fontWeight: 500,
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{
                        p: 2,
                        borderRadius: '50%',
                        background: alpha('#fff', 0.2),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha('#fff', 0.3)}`,
                        transition: 'all 0.3s ease',
                      }} className="stat-icon">
                        <stat.icon sx={{ fontSize: 32, color: '#fff' }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        
        {/* Enhanced Main Content Paper */}
        <Fade in={true} timeout={1200}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
                : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? `0 8px 32px ${alpha('#000', 0.3)}`
                : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            {/* Enhanced Search and Filter Bar */}
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
            }}>
              {/* Enhanced Search Field */}
              <TextField
                label={t('common.search')}
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  minWidth: 280,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    background: alpha(theme.palette.background.paper, 0.8),
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                    }
                  }
                }}
              />
              
              {/* Enhanced Status Filter */}
              <FormControl 
                variant="outlined" 
                size="small" 
                sx={{ 
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }
                }}
              >
                <InputLabel>{t('foodOrders.statusLabel')}</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label={t('foodOrders.statusLabel')}
                >
                  <MenuItem value="all">{t('common.all')}</MenuItem>
                  <MenuItem value="pending">{t('foodOrders.status.pending')}</MenuItem>
                  <MenuItem value="preparing">{t('foodOrders.status.preparing')}</MenuItem>
                  <MenuItem value="ready">{t('foodOrders.status.ready')}</MenuItem>
                  <MenuItem value="delivered">{t('foodOrders.status.delivered')}</MenuItem>
                  <MenuItem value="cancelled">{t('foodOrders.status.cancelled')}</MenuItem>
                </Select>
              </FormControl>
              
              {/* Enhanced Category Filter */}
              <FormControl 
                variant="outlined" 
                size="small" 
                sx={{ 
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }
                }}
              >
                <InputLabel>{t('foodMenu.category')}</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label={t('foodMenu.category')}
                  disabled={loadingCategories}
                >
                  <MenuItem value="all">{t('common.all')}</MenuItem>
                  {categories
                    .filter(category => category.isActive !== false)
                    .map((category) => (
                      <MenuItem key={category.$id} value={category.$id}>
                        {currentLanguage === 'ar' ? category.nameAr || category.name : category.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              <Box sx={{ flexGrow: 1 }} />
              
              {/* Enhanced Action Buttons */}
              <Stack direction="row" spacing={1}>
                <Tooltip title={t('common.refresh')}>
                  <IconButton 
                    onClick={fetchFoodOrders}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.2),
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <RefreshIcon sx={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormData({
                      userId: '',
                      roomNumber: '',
                      roomId: '',
                      deliveryNotes: '',
                      status: 'pending',
                      paymentStatus: 'pending',
                    });
                    setSelectedItems([]);
                    setDialogMode('create');
                    setOpenDialog(true);
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                    }
                  }}
                >
                  {t('foodOrders.create')}
                </Button>
              </Stack>
            </Box>
            
            {/* Enhanced Tabs */}
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{ 
                mb: 3,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 1.5,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                },
                '& .MuiTab-root': {
                  borderRadius: 2,
                  mr: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-selected': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 'bold',
                  }
                }
              }}
            >
              <Tab value="all" label={t('common.all')} />
              <Tab value="pending" label={t('foodOrders.status.pending')} />
              <Tab value="preparing" label={t('foodOrders.status.preparing')} />
              <Tab value="ready" label={t('foodOrders.status.ready')} />
              <Tab value="delivered" label={t('foodOrders.status.delivered')} />
            </Tabs>
            
            {/* Enhanced DataGrid */}
            <Box sx={{ 
              height: 600, 
              width: '100%',
              '& .MuiDataGrid-root': {
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '& .MuiDataGrid-columnHeaders': {
                  background: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '& .MuiDataGrid-columnHeader': {
                    fontWeight: 'bold',
                  }
                },
                '& .MuiDataGrid-row': {
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.02),
                    transform: 'scale(1.001)',
                  }
                }
              }
            }}>
              <DataGrid
                rows={foodOrders.filter(order => {
                  if (currentTab !== 'all' && order.status !== currentTab) return false;
                  if (filterStatus !== 'all' && order.status !== filterStatus) return false;
                  
                  // Category filtering - check if any order items match the selected category
                  if (filterCategory !== 'all') {
                    const hasMatchingCategory = order.orderItems?.some(item => {
                      const menuItem = foodMenu.find(menu => menu.$id === item.itemId);
                      return menuItem?.categoryId === filterCategory || menuItem?.category === filterCategory;
                    });
                    if (!hasMatchingCategory) return false;
                  }
                  
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    return (
                      order.orderId?.toLowerCase().includes(query) ||
                      order.studentName?.toLowerCase().includes(query) ||
                      order.roomNumber?.toLowerCase().includes(query)
                    );
                  }
                  return true;
                })}
                columns={[
                  {
                    field: 'orderId',
                    headerName: t('foodOrders.orderId'),
                    flex: 0.8,
                    minWidth: 120,
                    renderCell: (params) => (
                      <Chip
                        label={params.value}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 'bold',
                          borderRadius: 2,
                        }}
                      />
                    ),
                  },
                  {
                    field: 'studentName',
                    headerName: t('foodOrders.studentName'),
                    flex: 1,
                    minWidth: 150,
                    renderCell: (params) => (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: theme.palette.primary.main,
                            fontSize: '0.875rem'
                          }}
                        >
                          {(params.value || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {params.value}
                        </Typography>
                      </Stack>
                    ),
                  },
                  {
                    field: 'itemCount',
                    headerName: t('foodOrders.itemCount'),
                    flex: 0.5,
                    minWidth: 80,
                    renderCell: (params) => (
                      <Badge
                        badgeContent={params.value}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          }
                        }}
                      >
                        <LocalDiningIcon />
                      </Badge>
                    ),
                  },
                  {
                    field: 'totalAmount',
                    headerName: t('foodOrders.totalAmount'),
                    flex: 0.7,
                    minWidth: 100,
                    renderCell: (params) => (
                      <Chip
                        label={`${params.value || 0} OMR`}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          fontWeight: 'bold',
                        }}
                      />
                    ),
                  },
                  {
                    field: 'roomNumber',
                    headerName: t('foodOrders.roomNumber'),
                    flex: 0.7,
                    minWidth: 100,
                    renderCell: (params) => (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MeetingRoomIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />
                        <Typography variant="body2">{params.value}</Typography>
                      </Stack>
                    ),
                  },
                  {
                    field: 'orderTime',
                    headerName: t('foodOrders.orderTime'),
                    flex: 0.9,
                    minWidth: 130,
                    valueFormatter: (params) => formatDate(params.value),
                  },
                  {
                    field: 'status',
                    headerName: t('foodOrders.statusLabel'),
                    flex: 0.8,
                    minWidth: 120,
                    renderCell: (params) => {
                      const statusConfig = {
                        pending: { color: 'warning', icon: ScheduleIcon },
                        preparing: { color: 'info', icon: KitchenIcon },
                        ready: { color: 'success', icon: CheckCircleIcon },
                        delivered: { color: 'success', icon: DeliveryIcon },
                        cancelled: { color: 'error', icon: CancelIcon },
                      };
                      
                      const config = statusConfig[params.value] || { color: 'default', icon: ScheduleIcon };
                      const IconComponent = config.icon;
                      
                      return (
                        <Chip
                          icon={<IconComponent sx={{ fontSize: 16 }} />}
                          label={t(`foodOrders.status.${params.value}`)}
                          color={config.color}
                          size="small"
                          sx={{
                            fontWeight: 'medium',
                            borderRadius: 2,
                          }}
                        />
                      );
                    },
                  },
                  {
                    field: 'actions',
                    headerName: t('common.actions'),
                    flex: 1,
                    minWidth: 200,
                    sortable: false,
                    renderCell: (params) => (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t('common.view')}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedFoodOrder(params.row);
                              setDialogMode('view');
                              setOpenDialog(true);
                            }}
                            sx={{
                              background: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              '&:hover': {
                                background: alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)',
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {params.row.status === 'pending' && (
                          <Tooltip title={t('foodOrders.startPreparing')}>
                            <IconButton
                              size="small"
                              onClick={() => handleStatusUpdate(params.row.$id, 'preparing')}
                              sx={{
                                background: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                '&:hover': {
                                  background: alpha(theme.palette.info.main, 0.2),
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              <KitchenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {params.row.status === 'preparing' && (
                          <Tooltip title={t('foodOrders.markReady')}>
                            <IconButton
                              size="small"
                              onClick={() => handleStatusUpdate(params.row.$id, 'ready')}
                              sx={{
                                background: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                '&:hover': {
                                  background: alpha(theme.palette.success.main, 0.2),
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {params.row.status === 'ready' && (
                          <Tooltip title={t('foodOrders.markDelivered')}>
                            <IconButton
                              size="small"
                              onClick={() => handleStatusUpdate(params.row.$id, 'delivered')}
                              sx={{
                                background: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  background: alpha(theme.palette.primary.main, 0.2),
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              <DeliveryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedFoodOrder(params.row);
                              setDialogMode('edit');
                              setOpenDialog(true);
                            }}
                            sx={{
                              background: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              '&:hover': {
                                background: alpha(theme.palette.warning.main, 0.2),
                                transform: 'scale(1.1)',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ),
                  },
                ]}
                getRowId={(row) => row.$id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                loading={loading}
                disableSelectionOnClick
                localeText={{
                  noRowsLabel: t('common.noData'),
                }}
              />
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Create/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                : `linear-gradient(145deg, ${alpha('#fff', 0.95)}, ${alpha('#fff', 0.8)})`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }
          }}
        >
          {dialogMode === 'view' ? (
            <>
              <DialogTitle sx={{
                background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
                borderRadius: '12px 12px 0 0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
                    <RestaurantIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {t('foodOrders.viewOrder', { id: selectedFoodOrder?.orderId })}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {formatDate(selectedFoodOrder?.orderTime)}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Enhanced Student Selection */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      p: 2, 
                      background: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        Student Selection
                      </Typography>
                      <FormControl fullWidth required>
                        <InputLabel>{t('foodOrders.student')}</InputLabel>
                        <Select
                          name="userId"
                          value={formData.userId}
                          onChange={handleInputChange}
                          label={t('foodOrders.student')}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        >
                          {students.map((student) => (
                            <MenuItem key={student.$id} value={student.$id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {(student.name || student.firstName || 'U').charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {student.email || 'No email'}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Student Details Card */}
                  {selectedStudentDetails && (
                    <Grid item xs={12}>
                      <Fade in={true} timeout={600}>
                        <Card sx={{ 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`,
                          color: 'white',
                          borderRadius: 3,
                          overflow: 'hidden',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                            pointerEvents: 'none',
                          }
                        }}>
                          <CardHeader
                            avatar={
                              <Avatar sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }}>
                                {(selectedStudentDetails.name || selectedStudentDetails.firstName || 'U').charAt(0).toUpperCase()}
                              </Avatar>
                            }
                            title={
                              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {t('students.studentInformation')}
                              </Typography>
                            }
                            sx={{ pb: 1 }}
                          />
                          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={2}>
                              {/* Student Basic Info */}
                              <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    {t('students.name')}
                                  </Typography>
                                  <Typography variant="body1" fontWeight="bold">
                                    {selectedStudentDetails.name || 
                                     `${selectedStudentDetails.firstName || ''} ${selectedStudentDetails.lastName || ''}`.trim() ||
                                     'Unknown Student'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    {t('students.email')}
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedStudentDetails.email || t('checkoutRequests.noEmail')}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    {t('students.phone')}
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedStudentDetails.phone || t('checkoutRequests.noPhone')}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6} md={3}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    {t('contracts.contract')}
                                  </Typography>
                                  <Chip
                                    label={selectedStudentDetails.hasActiveContract ? 
                                          t('contracts.status.active') : 
                                          t('contracts.noActiveContract')}
                                    color={selectedStudentDetails.hasActiveContract ? 'success' : 'error'}
                                    size="small"
                                    sx={{ 
                                      mt: 0.5,
                                      bgcolor: alpha('#fff', 0.2),
                                      color: 'white',
                                      border: `1px solid ${alpha('#fff', 0.3)}`
                                    }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  )}
                  
                  {/* Enhanced Room Information Card */}
                  {selectedStudentDetails && selectedStudentDetails.rooms && selectedStudentDetails.rooms.length > 0 && (
                    <Grid item xs={12}>
                      <Fade in={true} timeout={800}>
                        <Card sx={{ 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
                          color: 'white',
                          borderRadius: 3,
                          overflow: 'hidden',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                            pointerEvents: 'none',
                          }
                        }}>
                          <CardHeader
                            avatar={
                              <Avatar sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }}>
                                <MeetingRoomIcon />
                              </Avatar>
                            }
                            title={
                              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {t('rooms.assignedRooms')} ({selectedStudentDetails.rooms.length})
                              </Typography>
                            }
                            sx={{ pb: 1 }}
                          />
                          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={2}>
                              {selectedStudentDetails.rooms.map((room, index) => (
                                <Grid item xs={12} sm={6} md={4} key={room.$id}>
                                  <Card sx={{ 
                                    bgcolor: alpha('#fff', 0.15), 
                                    color: 'white',
                                    border: formData.roomId === room.$id ? `2px solid ${alpha('#fff', 0.8)}` : `1px solid ${alpha('#fff', 0.3)}`,
                                    borderRadius: 2,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: alpha('#fff', 0.2),
                                      transform: 'translateY(-2px)',
                                    }
                                  }}>
                                    <CardContent sx={{ p: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: alpha('#fff', 0.3), color: 'white', fontSize: '0.75rem' }}>
                                          {room.roomNumber}
                                        </Avatar>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                          Room {room.roomNumber}
                                        </Typography>
                                        {formData.roomId === room.$id && (
                                          <Chip 
                                            label="Selected" 
                                            size="small" 
                                            sx={{ 
                                              bgcolor: alpha('#fff', 0.3), 
                                              color: 'white',
                                              fontSize: '0.7rem'
                                            }} 
                                          />
                                        )}
                                      </Box>
                                      
                                      <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Building
                                          </Typography>
                                          <Typography variant="body2" fontWeight="bold">
                                            {room.building || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Floor
                                          </Typography>
                                          <Typography variant="body2" fontWeight="bold">
                                            {room.floor || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Type
                                          </Typography>
                                          <Typography variant="body2">
                                            {t(`rooms.types.${room.type}`) || room.type || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Status
                                          </Typography>
                                          <Chip
                                            label={t(`rooms.status.${room.status}`) || room.status}
                                            color={room.status === 'available' ? 'success' : 
                                                   room.status === 'occupied' ? 'warning' : 'error'}
                                            size="small"
                                            sx={{ 
                                              bgcolor: alpha('#fff', 0.2), 
                                              color: 'white',
                                              border: `1px solid ${alpha('#fff', 0.3)}`
                                            }}
                                          />
                                        </Grid>
                                      </Grid>
                                      
                                      <Button
                                        fullWidth
                                        variant={formData.roomId === room.$id ? "contained" : "outlined"}
                                        size="small"
                                        sx={{ 
                                          mt: 1,
                                          borderColor: alpha('#fff', 0.5),
                                          color: 'white',
                                          '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: alpha('#fff', 0.1)
                                          }
                                        }}
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            roomId: room.$id,
                                            roomNumber: room.roomNumber
                                          });
                                        }}
                                      >
                                        {formData.roomId === room.$id ? 'Selected' : 'Select Room'}
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  )}
                  
                  {/* Enhanced Manual Room Input */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      p: 2, 
                      background: alpha(theme.palette.warning.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                        Room Information
                      </Typography>
                      <TextField
                        fullWidth
                        label={t('foodOrders.roomNumber')}
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleInputChange}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                        helperText={selectedStudentDetails && selectedStudentDetails.rooms && selectedStudentDetails.rooms.length > 0 ? 
                                   "Room auto-filled from student assignment" : 
                                   "Enter room number manually"}
                      />
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Delivery Notes */}
                  <Grid item xs={12}>
                    <Card sx={{ 
                      p: 2, 
                      background: alpha(theme.palette.info.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                        Delivery Instructions
                      </Typography>
                      <TextField
                        fullWidth
                        label={t('foodOrders.deliveryNotes')}
                        name="deliveryNotes"
                        value={formData.deliveryNotes}
                        onChange={handleInputChange}
                        multiline
                        rows={2}
                        placeholder={t('foodOrders.deliveryNotesPlaceholder')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Menu Items Selection */}
                  <Grid item xs={12}>
                    <Card sx={{ 
                      p: 3, 
                      background: alpha(theme.palette.secondary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                      borderRadius: 3
                    }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: theme.palette.secondary.main,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <RestaurantIcon />
                        {t('foodOrders.selectItems')}
                      </Typography>
                      
                      {/* Enhanced Menu Grid */}
                      <Grid container spacing={2}>
                        {foodMenu.map((item) => (
                          <Grid item xs={12} sm={6} md={4} key={item.$id}>
                            <Card sx={{ 
                              height: '100%',
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                              }
                            }}>
                              {item.imageUrl && (
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={item.imageUrl}
                                  alt={item.itemName}
                                  sx={{ borderRadius: '8px 8px 0 0' }}
                                />
                              )}
                              <CardContent>
                                <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                                  {item.itemName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {item.itemDescription}
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                  color: theme.palette.success.main,
                                  fontWeight: 'bold'
                                }}>
                                  {item.price || 0} OMR
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Chip
                                    label={getCategoryName(item.categoryId) || item.category}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  />
                                  <Button
                                    size="small"
                                    onClick={() => handleAddMenuItem(item)}
                                    startIcon={<AddIcon />}
                                    sx={{
                                      borderRadius: 2,
                                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                      color: 'white',
                                      '&:hover': {
                                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                      }
                                    }}
                                  >
                                    {t('common.add')}
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Selected Items */}
                  {selectedItems.length > 0 && (
                    <Grid item xs={12}>
                      <Fade in={true} timeout={1000}>
                        <Card sx={{ 
                          p: 3, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
                          color: 'white',
                          borderRadius: 3,
                          overflow: 'hidden',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                            pointerEvents: 'none',
                          }
                        }}>
                          <Typography variant="h6" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            fontWeight: 'bold',
                            position: 'relative',
                            zIndex: 1
                          }}>
                            <ShoppingCartIcon />
                            {t('foodOrders.selectedItems')} ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'})
                          </Typography>
                          
                          <Grid container spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                            {selectedItems.map((item) => (
                              <Grid item xs={12} sm={6} md={4} key={item.itemId}>
                                <Card sx={{ 
                                  height: '100%', 
                                  bgcolor: alpha('#fff', 0.15),
                                  border: `2px solid ${alpha('#fff', 0.3)}`,
                                  borderRadius: 2,
                                  backdropFilter: 'blur(10px)'
                                }}>
                                  {/* Item Image */}
                                  {item.menuItem?.imageUrl && (
                                    <CardMedia
                                      component="img"
                                      height="120"
                                      image={item.menuItem.imageUrl}
                                      alt={item.itemName}
                                      sx={{ objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                                    />
                                  )}
                                  
                                  <CardContent sx={{ p: 2, color: 'white' }}>
                                    {/* Item Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold', flex: 1 }}>
                                        {item.itemName}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveMenuItem(item.itemId)}
                                        sx={{ 
                                          ml: 1,
                                          bgcolor: alpha('#fff', 0.2),
                                          color: 'white',
                                          '&:hover': {
                                            bgcolor: alpha('#fff', 0.3),
                                          }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                    
                                    {/* Category Badge */}
                                    {(item.menuItem?.categoryId || item.menuItem?.category) && (
                                      <Chip
                                        label={getCategoryName(item.menuItem?.categoryId) || item.menuItem?.category}
                                        size="small"
                                        sx={{ 
                                          mb: 1,
                                          bgcolor: alpha('#fff', 0.2),
                                          color: 'white',
                                          border: `1px solid ${alpha('#fff', 0.3)}`
                                        }}
                                      />
                                    )}
                                    
                                    {/* Price Information */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Unit Price: {item.pricePerItem} OMR
                                      </Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Total: {(item.pricePerItem * item.quantity).toFixed(2)} OMR
                                      </Typography>
                                    </Box>
                                    
                                    {/* Quantity Controls */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Quantity
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                                          disabled={item.quantity <= 1}
                                          sx={{ 
                                            bgcolor: alpha('#fff', 0.2), 
                                            color: 'white',
                                            '&:hover': { bgcolor: alpha('#fff', 0.3) },
                                            '&:disabled': { bgcolor: alpha('#fff', 0.1), opacity: 0.5 }
                                          }}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        
                                        <TextField
                                          type="number"
                                          size="small"
                                          value={item.quantity}
                                          onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value) || 1)}
                                          inputProps={{ 
                                            min: 1, 
                                            style: { textAlign: 'center', width: '60px', color: 'white' }
                                          }}
                                          sx={{ 
                                            '& .MuiOutlinedInput-root': {
                                              bgcolor: alpha('#fff', 0.1),
                                              borderRadius: 1,
                                              '& input': { color: 'white' },
                                              '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: alpha('#fff', 0.3)
                                              }
                                            }
                                          }}
                                        />
                                        
                                        <IconButton
                                          size="small"
                                          onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                                          sx={{ 
                                            bgcolor: alpha('#fff', 0.2), 
                                            color: 'white',
                                            '&:hover': { bgcolor: alpha('#fff', 0.3) }
                                          }}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                    
                                    {/* Special Instructions */}
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label={t('foodOrders.specialInstructions')}
                                      placeholder="Add any special instructions..."
                                      value={item.specialInstructions}
                                      onChange={(e) => handleInstructionsChange(item.itemId, e.target.value)}
                                      multiline
                                      rows={2}
                                      sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: alpha('#fff', 0.1),
                                          borderRadius: 1,
                                          '& input, & textarea': { color: 'white' },
                                          '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: alpha('#fff', 0.3)
                                          }
                                        },
                                        '& .MuiInputLabel-root': {
                                          color: alpha('#fff', 0.8)
                                        }
                                      }}
                                    />
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                          
                          {/* Enhanced Order Total Summary */}
                          <Card sx={{ 
                            mt: 3, 
                            bgcolor: alpha('#fff', 0.1), 
                            border: `2px solid ${alpha('#fff', 0.3)}`,
                            borderRadius: 2,
                            backdropFilter: 'blur(10px)',
                            position: 'relative',
                            zIndex: 1
                          }}>
                            <CardContent>
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="h5" fontWeight="bold" sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    color: 'white'
                                  }}>
                                    <ShoppingCartIcon />
                                    Order Total: {getTotalAmount().toFixed(2)} OMR
                                  </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                                        Total Items: {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                                        Different Items: {selectedItems.length}
                                      </Typography>
                                    </Box>
                                    
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => setSelectedItems([])}
                                      startIcon={<DeleteIcon />}
                                      sx={{ 
                                        borderColor: alpha('#fff', 0.5),
                                        color: 'white',
                                        '&:hover': {
                                          borderColor: 'white',
                                          bgcolor: alpha('#fff', 0.1)
                                        }
                                      }}
                                    >
                                      Clear All
                                    </Button>
                                  </Box>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Card>
                      </Fade>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                background: alpha(theme.palette.background.default, 0.5),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Button 
                  onClick={() => setOpenDialog(false)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={selectedItems.length === 0 || !formData.userId || !formData.roomNumber}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    }
                  }}
                >
                  {dialogMode === 'create' ? t('common.create') : t('common.save')}
                </Button>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogTitle sx={{
                background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
                borderRadius: '12px 12px 0 0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
                    <RestaurantIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {t('foodOrders.viewOrder', { id: selectedFoodOrder?.orderId })}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {formatDate(selectedFoodOrder?.orderTime)}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Enhanced Student Information Card */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`,
                      color: 'white',
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                        pointerEvents: 'none',
                      }
                    }}>
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 56, height: 56 }}>
                            {(selectedFoodOrder?.studentName || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {selectedFoodOrder?.studentName}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {selectedFoodOrder?.studentEmail || 'No email available'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2, borderColor: alpha('#fff', 0.3) }} />
                        
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              User ID:
                            </Typography>
                            <Chip
                              label={selectedFoodOrder?.userId}
                              size="small"
                              sx={{
                                bgcolor: alpha('#fff', 0.2),
                                color: 'white',
                                fontFamily: 'monospace'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              Order Status:
                            </Typography>
                            <Chip
                              label={t(`foodOrders.status.${selectedFoodOrder?.status}`)}
                              color={
                                selectedFoodOrder?.status === 'pending' ? 'warning' :
                                selectedFoodOrder?.status === 'preparing' ? 'info' :
                                selectedFoodOrder?.status === 'ready' ? 'success' :
                                selectedFoodOrder?.status === 'delivered' ? 'success' : 'error'
                              }
                              size="small"
                              sx={{ 
                                bgcolor: 'white', 
                                color: 'text.primary',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              Payment Status:
                            </Typography>
                            <Chip
                              label={t(`foodOrders.paymentStatus.${selectedFoodOrder?.paymentStatus || 'pending'}`)}
                              color={selectedFoodOrder?.paymentStatus === 'paid' ? 'success' : 'warning'}
                              size="small"
                              sx={{ 
                                bgcolor: 'white', 
                                color: 'text.primary',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Room Information Card */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
                      color: 'white',
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                        pointerEvents: 'none',
                      }
                    }}>
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 56, height: 56 }}>
                            <MeetingRoomIcon sx={{ fontSize: 28 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Room {selectedFoodOrder?.roomNumber}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              Delivery Location
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2, borderColor: alpha('#fff', 0.3) }} />
                        
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              Room Number:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedFoodOrder?.roomNumber}
                            </Typography>
                          </Box>
                          
                          {selectedFoodOrder?.roomId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Room ID:
                              </Typography>
                              <Chip
                                label={selectedFoodOrder?.roomId}
                                size="small"
                                sx={{
                                  bgcolor: alpha('#fff', 0.2),
                                  color: 'white',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          )}
                          
                          {selectedFoodOrder?.deliveryNotes && (
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                Delivery Notes:
                              </Typography>
                              <Paper sx={{ 
                                p: 2, 
                                bgcolor: alpha('#fff', 0.1),
                                border: `1px solid ${alpha('#fff', 0.3)}`,
                                borderRadius: 2
                              }}>
                                <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic' }}>
                                  "{selectedFoodOrder?.deliveryNotes}"
                                </Typography>
                              </Paper>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Order Summary Card */}
                  <Grid item xs={12}>
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.8)}, ${alpha(theme.palette.warning.dark, 0.9)})`,
                      color: 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
                        pointerEvents: 'none',
                      }
                    }}>
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          fontWeight: 'bold',
                          mb: 3
                        }}>
                          <AnalyticsIcon />
                          Order Summary
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {[
                            {
                              label: 'Total Amount',
                              value: `${selectedFoodOrder?.totalAmount || 0} OMR`,
                              icon: TrendingUpIcon
                            },
                            {
                              label: 'Total Items',
                              value: selectedFoodOrder?.itemCount || 0,
                              icon: ShoppingCartIcon
                            },
                            {
                              label: 'Order Time',
                              value: formatDate(selectedFoodOrder?.orderTime),
                              icon: AccessTimeIcon
                            },
                            {
                              label: 'Estimated Delivery',
                              value: selectedFoodOrder?.estimatedDeliveryTime ? 
                                     formatDate(selectedFoodOrder.estimatedDeliveryTime) : 
                                     'Not set',
                              icon: DeliveryIcon
                            }
                          ].map((item, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                              <Card sx={{ 
                                bgcolor: alpha('#fff', 0.1),
                                border: `1px solid ${alpha('#fff', 0.3)}`,
                                borderRadius: 2,
                                p: 2,
                                textAlign: 'center'
                              }}>
                                <item.icon sx={{ fontSize: 32, mb: 1, color: 'white' }} />
                                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                  {item.label}
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                                  {item.value}
                                </Typography>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Enhanced Order Items */}
                  {selectedFoodOrder?.orderItems && selectedFoodOrder.orderItems.length > 0 && (
                    <Grid item xs={12}>
                      <Card sx={{ 
                        borderRadius: 3,
                        background: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                              <LocalDiningIcon />
                            </Avatar>
                          }
                          title={
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {t('foodOrders.orderItems')}
                            </Typography>
                          }
                        />
                        <CardContent>
                          <List>
                            {selectedFoodOrder.orderItems.map((item, index) => (
                              <ListItem 
                                key={index} 
                                divider={index < selectedFoodOrder.orderItems.length - 1}
                                sx={{
                                  borderRadius: 2,
                                  mb: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.05)}`
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocalDiningIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                                        {item.itemName}
                                      </Typography>
                                      <Chip
                                        label={`${item.totalPrice} OMR`}
                                        color="primary"
                                        sx={{ fontWeight: 'bold' }}
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <Box sx={{ mt: 1 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {item.pricePerItem} OMR × {item.quantity} = {item.totalPrice} OMR
                                      </Typography>
                                      {item.specialInstructions && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                          <strong>Special Instructions:</strong> {item.specialInstructions}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                background: alpha(theme.palette.background.default, 0.5),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Button 
                  onClick={() => setOpenDialog(false)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('common.close')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Fade>
  );
};

export default FoodOrders; 