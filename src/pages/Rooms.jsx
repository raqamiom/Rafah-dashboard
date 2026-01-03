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
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  Fade,
  Skeleton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Badge,
  Zoom,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Apartment as ApartmentIcon,
  Engineering as EngineeringIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MonetizationOn as MonetizationOnIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  HomeWork as HomeWorkIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';

// Room configuration constants
const ROOM_TYPE_OPTIONS = ['single', 'double', 'suite'];
const ROOM_STATUS_OPTIONS = ['not_occupied', 'remaining_space', 'full', 'maintenance'];
const BUILDING_OPTIONS = ['A', 'B', 'C', 'D'];

// Validation helper
const validateRoomData = (data) => {
  const errors = {};
  
  if (!data.roomNumber?.trim()) errors.roomNumber = 'Room number is required';
  if (!ROOM_TYPE_OPTIONS.includes(data.type)) errors.type = 'Invalid room type';
  if (!data.capacity || data.capacity < 1) errors.capacity = 'Capacity must be at least 1';
  if (!data.rentAmount || data.rentAmount < 0) errors.rentAmount = 'Rent amount must be positive';
  if (!ROOM_STATUS_OPTIONS.includes(data.status)) errors.status = 'Invalid status';
  if (!BUILDING_OPTIONS.includes(data.building)) errors.building = 'Invalid building';
  if (!data.floor || data.floor < 1) errors.floor = 'Floor must be at least 1';
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

const Rooms = () => {
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  
  // State for room data
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRooms, setTotalRooms] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // State for room history
  const [roomHistory, setRoomHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete', 'qr', 'history'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('all');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // State for action menu
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionRoom, setActionRoom] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'single',
    capacity: 1,
    rentAmount: 0,
    status: 'not_occupied',
    building: 'A',
    floor: 1,
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    roomNumber: '',
    capacity: '',
    rentAmount: '',
    floor: '',
  });
  
  // Buildings and floors data
  const buildings = ['A', 'B', 'C', 'D'];
  const floors = [1, 2, 3, 4, 5];
  
  // Fetch room history from existing collections based on actual database schema
  const fetchRoomHistory = async (roomId) => {
    try {
      setHistoryLoading(true);
      const history = [];
      
      console.log('🔍 Fetching history for roomId:', roomId);
      
      // Collection IDs from README
      const collectionIds = {
        users: '68249b10003c16083520',
        rooms: '68249cb00025da201b9d',
        contracts: '68249e34003899ffa4a3',
        payments: '683f10a3002fcff81e8a',
        services: '682a0ec9001ac190ae4f',
        serviceOrders: '6829f67b0021379e8dd5',
        foodMenu: '68373009002a61f5cf07',
        foodOrders: '6837318d0033889a6907',
        foodOrderItems: '683732e800333949b399',
        activities: '68272809001203a3f60e',
        activityRegistrations: '68272bc9003898ae7976',
        checkoutRequests: '68272c59001081a0f67c'
      };
      
      try {
        console.log('📋 Fetching contracts (occupancy history)...');
        
        // Since Query.arrayContains doesn't exist, fetch all contracts and filter client-side
        const contractsResponse = await databases.listDocuments(
          databaseId,
          collectionIds.contracts,
          [
            Query.orderDesc('$createdAt')
          ]
        );
        
        // Filter contracts that contain the roomId in their roomIds array
        const relevantContracts = contractsResponse.documents.filter(contract => {
          return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(roomId);
        });
        
        if (relevantContracts.length > 0) {
          console.log(`✅ Found ${relevantContracts.length} contracts`);
          console.log('📋 Contract documents:', relevantContracts);
          
          // Also fetch user details for each contract
          for (const contract of relevantContracts) {
            try {
              const userResponse = await databases.getDocument(
                databaseId,
                collectionIds.users,
                contract.userId
              );
              
              history.push({
                ...contract,
                type: 'contract',
                icon: <PersonIcon />,
                color: 'secondary',
                action: `Contract ${contract.status === 'active' ? 'started' : contract.status === 'terminated' ? 'ended' : contract.status || 'created'}`,
                details: `${userResponse.name} - ${contract.status === 'active' ? 'Lease active' : contract.status === 'terminated' ? 'Lease terminated' : contract.status === 'expired' ? 'Lease expired' : `Status: ${contract.status}`}`,
                studentName: userResponse.name,
                studentEmail: userResponse.email
              });
            } catch (userError) {
              // If user not found, still add contract with basic info
              history.push({
                ...contract,
                type: 'contract',
                icon: <PersonIcon />,
                color: 'secondary',
                action: `Contract ${contract.status || 'created'}`,
                details: `Contract ${contract.status || 'created'} - User ID: ${contract.userId}`
              });
            }
          }
        } else {
          console.log('⚠️ No contracts found for this room');
        }
      } catch (error) {
        console.error('❌ Error fetching contracts:', error);
      }
      
      try {
        console.log('💰 Fetching payments (financial history)...');
        
        // First get contracts for this room to find contractIds, then get payments for those contracts
        const contractsForPayments = await databases.listDocuments(
          databaseId,
          collectionIds.contracts,
          [
            Query.orderDesc('$createdAt')
          ]
        );
        
        // Filter contracts that contain the roomId in their roomIds array
        const relevantContractsForPayments = contractsForPayments.documents.filter(contract => {
          return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(roomId);
        });
        
        const contractIds = relevantContractsForPayments.map(contract => contract.$id);
        
        if (contractIds.length > 0) {
          // Get payments for these contracts
          for (const contractId of contractIds) {
            try {
              const paymentsResponse = await databases.listDocuments(
                databaseId,
                collectionIds.payments,
                [
                  Query.equal('contractId', contractId),
                  Query.orderDesc('$createdAt')
                ]
              );
              
              if (paymentsResponse.documents.length > 0) {
                console.log(`✅ Found ${paymentsResponse.documents.length} payments for contract ${contractId}`);
                
                history.push(...paymentsResponse.documents.map(payment => ({
                  ...payment,
                  type: 'payment',
                  icon: <MonetizationOnIcon />,
                  color: 'success',
                  action: `Payment ${payment.status || 'processed'}`,
                  details: `${formatCurrency(payment.finalAmount || payment.amount || 0)} - ${payment.description || payment.paymentType || 'Payment'} (${payment.paymentMethod || 'unknown method'})`
                })));
              }
            } catch (paymentError) {
              console.warn(`Error fetching payments for contract ${contractId}:`, paymentError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching payments:', error);
      }
      
      try {
        console.log('🛠️ Fetching service orders (maintenance & services)...');
        
        // ServiceOrders have roomId field directly
        const serviceOrdersResponse = await databases.listDocuments(
          databaseId,
          collectionIds.serviceOrders,
          [
            Query.equal('roomId', roomId),
            Query.orderDesc('$createdAt')
          ]
        );
        
        if (serviceOrdersResponse.documents.length > 0) {
          console.log(`✅ Found ${serviceOrdersResponse.documents.length} service orders`);
          console.log('🛠️ Service orders documents:', serviceOrdersResponse.documents);
          
          // Fetch service details for each order
          for (const order of serviceOrdersResponse.documents) {
            try {
              const serviceResponse = await databases.getDocument(
                databaseId,
                collectionIds.services,
                order.serviceId
              );
              
              history.push({
                ...order,
                type: 'service',
                icon: order.status === 'completed' ? <CheckCircleIcon /> : <BuildIcon />,
                color: order.status === 'completed' ? 'success' : 'warning',
                action: `Service Order ${order.status || 'placed'}`,
                details: `${serviceResponse.nameEn || serviceResponse.nameAr || order.serviceName || 'Service'} - ${order.specialInstructions || serviceResponse.descriptionEn || 'Service order'} (${formatCurrency(order.totalAmount || 0)})`
              });
            } catch (serviceError) {
              // If service details not found, use basic order info
              history.push({
                ...order,
                type: 'service',
                icon: <BuildIcon />,
                color: 'warning',
                action: `Service Order ${order.status || 'placed'}`,
                details: `${order.serviceName || 'Service'} - ${order.specialInstructions || 'Service order'} (${formatCurrency(order.totalAmount || 0)})`
              });
            }
          }
        } else {
          console.log('⚠️ No service orders found for this room');
        }
      } catch (error) {
        console.error('❌ Error fetching service orders:', error);
      }
      
      try {
        console.log('🍽️ Fetching food orders...');
        
        // FoodOrders have roomId field directly
        const foodOrdersResponse = await databases.listDocuments(
          databaseId,
          collectionIds.foodOrders,
          [
            Query.equal('roomId', roomId),
            Query.orderDesc('$createdAt')
          ]
        );
        
        if (foodOrdersResponse.documents.length > 0) {
          console.log(`✅ Found ${foodOrdersResponse.documents.length} food orders`);
          
          // Fetch food order items for each order to get details
          for (const order of foodOrdersResponse.documents) {
            try {
              const itemsResponse = await databases.listDocuments(
                databaseId,
                collectionIds.foodOrderItems,
                [
                  Query.equal('orderId', order.$id)
                ]
              );
              
              const itemNames = itemsResponse.documents.map(item => item.itemName).join(', ');
              
              history.push({
                ...order,
                type: 'food',
                icon: <EventIcon />,
                color: order.status === 'delivered' ? 'success' : 'info',
                action: `Food Order ${order.status || 'placed'}`,
                details: `${itemNames || 'Food order'} - ${formatCurrency(order.totalAmount || 0)} (${order.paymentStatus || 'payment pending'})`
              });
            } catch (itemsError) {
              // If items not found, use basic order info
              history.push({
                ...order,
                type: 'food',
                icon: <EventIcon />,
                color: 'info',
                action: `Food Order ${order.status || 'placed'}`,
                details: `Food order - ${formatCurrency(order.totalAmount || 0)}`
              });
            }
          }
        } else {
          console.log('⚠️ No food orders found for this room');
        }
      } catch (error) {
        console.error('❌ Error fetching food orders:', error);
      }
      
      // Sort all history by creation date
      const sortedHistory = history.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
      
      console.log('📊 Final history array:', sortedHistory);
      console.log(`✅ Total history items found: ${sortedHistory.length}`);
      
      setRoomHistory(sortedHistory);
      
    } catch (error) {
      console.error('❌ Error fetching room history:', error);
      showError('Failed to load room history. Please try again.');
      setRoomHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Calculate room status and occupancy details based on active contracts
  const calculateRoomStatus = async (room) => {
    try {
      // If room is manually set to maintenance, keep it
      if (room.status === 'maintenance') {
        return { 
          status: 'maintenance', 
          activeContractsCount: 0, 
          remainingSpace: room.capacity 
        };
      }
      
      // Fetch all active contracts
      const contractsResponse = await databases.listDocuments(
        databaseId,
        '68249e34003899ffa4a3', // contracts collection ID
        [
          Query.equal('status', 'active')
        ]
      );
      
      // Count active contracts for this room
      const activeContractsCount = contractsResponse.documents.filter(contract => {
        return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(room.$id);
      }).length;
      
      // Calculate remaining space
      const remainingSpace = Math.max(0, room.capacity - activeContractsCount);
      
      // Determine status based on occupancy - automatic calculation
      let status;
      if (activeContractsCount === 0) {
        status = 'not_occupied';
      } else if (activeContractsCount >= room.capacity) {
        status = 'full';
      } else {
        status = 'remaining_space';
      }
      
      return { status, activeContractsCount, remainingSpace };
    } catch (error) {
      console.error('Error calculating room status:', error);
      // Default to not_occupied if error
      return { 
        status: 'not_occupied', 
        activeContractsCount: 0, 
        remainingSpace: room.capacity 
      };
    }
  };

  // Fetch rooms from the database
  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // Prepare filters for basic room properties (not status)
      const filters = [];
      
      // Always filter out soft deleted rooms (rooms where isDeleted is not true)
      // Using notEqual to handle cases where isDeleted field might not exist
      filters.push(Query.notEqual('isDeleted', true));
      
      if (filterType !== 'all') {
        filters.push(Query.equal('type', filterType));
      }
      
      if (filterBuilding !== 'all') {
        filters.push(Query.equal('building', filterBuilding));
      }
      
      if (searchQuery) {
        filters.push(Query.search('roomNumber', searchQuery));
      }
      
      // Fetch rooms using actual collection ID
      const response = await databases.listDocuments(
        databaseId,
        '68249cb00025da201b9d', // rooms collection ID
        filters,
        1000, // Get all rooms first, then we'll filter and paginate client-side
        0,
        'roomNumber',
        'ASC'
      );
      
      // Calculate dynamic status and occupancy for each room
      const roomsWithStatus = await Promise.all(
        response.documents.map(async (room) => {
          const statusData = await calculateRoomStatus(room);
          return {
            ...room,
            calculatedStatus: statusData.status,
            displayStatus: statusData.status,
            activeContractsCount: statusData.activeContractsCount,
            remainingSpace: statusData.remainingSpace
          };
        })
      );
      
      // Apply status filter if needed
      let filteredRooms = roomsWithStatus;
      
      if (filterStatus !== 'all') {
        filteredRooms = roomsWithStatus.filter(room => room.displayStatus === filterStatus);
      }
      
      if (currentTab === 'not_occupied') {
        filteredRooms = roomsWithStatus.filter(room => room.displayStatus === 'not_occupied');
      } else if (currentTab === 'remaining_space') {
        filteredRooms = roomsWithStatus.filter(room => room.displayStatus === 'remaining_space');
      } else if (currentTab === 'full') {
        filteredRooms = roomsWithStatus.filter(room => room.displayStatus === 'full');
      } else if (currentTab === 'maintenance') {
        filteredRooms = roomsWithStatus.filter(room => room.displayStatus === 'maintenance');
      }
      
      // Apply pagination client-side
      const startIndex = paginationModel.page * paginationModel.pageSize;
      const endIndex = startIndex + paginationModel.pageSize;
      const paginatedRooms = filteredRooms.slice(startIndex, endIndex);
      
      setRooms(paginatedRooms);
      setTotalRooms(filteredRooms.length);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showError(t('rooms.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchRooms();
  }, [paginationModel, searchQuery, filterType, filterStatus, filterBuilding, currentTab]);
  
  // Handle dialog open for create
  const handleCreateRoom = () => {
    setFormData({
      roomNumber: '',
      type: 'single',
      capacity: 1,
      rentAmount: 3000,
      status: 'not_occupied',
      building: 'A',
      floor: 1,
    });
    setFormErrors({
      roomNumber: '',
      capacity: '',
      rentAmount: '',
      floor: '',
    });
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit
  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity,
      rentAmount: room.rentAmount,
      status: room.status || room.displayStatus, // Use current status or calculated status
      building: room.building,
      floor: room.floor,
    });
    setFormErrors({
      roomNumber: '',
      capacity: '',
      rentAmount: '',
      floor: '',
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Validate if room can be deleted
  const validateRoomDeletion = async (room) => {
    try {
      // Check if room is in maintenance
      if (room.displayStatus === 'maintenance' || room.status === 'maintenance') {
        return {
          canDelete: false,
          reason: 'Room is currently under maintenance and cannot be deleted.'
        };
      }
      
      // Check if room has active contracts (occupied)
      const contractsResponse = await databases.listDocuments(
        databaseId,
        '68249e34003899ffa4a3', // contracts collection ID
        [
          Query.equal('status', 'active')
        ]
      );
      
      // Count active contracts for this room
      const activeContractsCount = contractsResponse.documents.filter(contract => {
        return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(room.$id);
      }).length;
      
      if (activeContractsCount > 0) {
        return {
          canDelete: false,
          reason: `Room has ${activeContractsCount} active contract${activeContractsCount > 1 ? 's' : ''} and cannot be deleted.`
        };
      }
      
      // Check if room has any occupied status
      if (room.displayStatus === 'remaining_space' || room.displayStatus === 'full') {
        return {
          canDelete: false,
          reason: 'Room is currently occupied and cannot be deleted.'
        };
      }
      
      return { canDelete: true, reason: null };
    } catch (error) {
      console.error('Error validating room deletion:', error);
      return {
        canDelete: false,
        reason: 'Unable to validate room status. Please try again.'
      };
    }
  };

  // Handle dialog open for delete
  const handleDeleteRoom = async (room) => {
    const validation = await validateRoomDeletion(room);
    
    if (!validation.canDelete) {
      showError(validation.reason);
      return;
    }
    
    setSelectedRoom(room);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog open for QR code
  const handleGenerateQR = (room) => {
    setSelectedRoom(room);
    setDialogMode('qr');
    setOpenDialog(true);
  };
  
  // Diagnostic function to check data structure (for debugging)
  const diagnoseDatabaseStructure = async (roomId) => {
    console.log('🔍 DIAGNOSTIC: Checking database structure for roomId:', roomId);
    
    // Collection IDs from README
    const collectionIds = {
      users: '68249b10003c16083520',
      rooms: '68249cb00025da201b9d',
      contracts: '68249e34003899ffa4a3',
      payments: '683f10a3002fcff81e8a',
      services: '682a0ec9001ac190ae4f',
      serviceOrders: '6829f67b0021379e8dd5',
      foodMenu: '68373009002a61f5cf07',
      foodOrders: '6837318d0033889a6907',
      foodOrderItems: '683732e800333949b399',
      activities: '68272809001203a3f60e',
      activityRegistrations: '68272bc9003898ae7976',
      checkoutRequests: '68272c59001081a0f67c'
    };
    
    const collectionsToCheck = [
      'users',
      'rooms', 
      'contracts', 
      'payments', 
      'services',
      'serviceOrders',
      'foodOrders',
      'foodOrderItems',
      'foodMenu',
      'activities',
      'activityRegistrations',
      'checkoutRequests'
    ];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collectionId = collectionIds[collectionName];
        if (collectionId) {
          console.log(`\n📊 Checking collection: ${collectionName} (ID: ${collectionId})`);
          
          // Get a few sample documents to see the structure
          const sampleResponse = await databases.listDocuments(
            databaseId,
            collectionId,
            [],
            3 // Get only 3 samples
          );
          
          if (sampleResponse.documents.length > 0) {
            console.log(`✅ Collection ${collectionName} exists with ${sampleResponse.total} total documents`);
            console.log('📋 Sample document structure:', Object.keys(sampleResponse.documents[0]));
            console.log('📄 First document:', sampleResponse.documents[0]);
            
            // Check specific field relationships based on collection
            if (collectionName === 'contracts') {
              // Contracts have roomIds as array - test with client-side filtering
              try {
                const testResponse = await databases.listDocuments(
                  databaseId,
                  collectionId,
                  []
                );
                
                const matchingContracts = testResponse.documents.filter(contract => {
                  return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(roomId);
                });
                
                console.log(`🎯 Found ${matchingContracts.length} contracts with roomId ${roomId} using client-side filtering`);
              } catch (queryError) {
                console.log(`❌ Error testing contracts query:`, queryError.message);
              }
              
              // Show sample roomIds structure
              const sampleRoomIds = sampleResponse.documents
                .map(doc => doc.roomIds)
                .filter(ids => ids && ids.length > 0)
                .slice(0, 3);
              console.log(`📝 Sample roomIds arrays in contracts:`, sampleRoomIds);
            } else if (collectionName === 'serviceOrders' || collectionName === 'foodOrders') {
              // These have direct roomId field
              const roomIdMatches = sampleResponse.documents.filter(doc => 
                doc.roomId === roomId
              );
              console.log(`🎯 Found ${roomIdMatches.length} ${collectionName} with roomId = ${roomId}`);
              if (roomIdMatches.length === 0) {
                const sampleRoomIds = sampleResponse.documents
                  .map(doc => doc.roomId)
                  .filter(id => id)
                  .slice(0, 3);
                console.log(`📝 Sample roomIds in ${collectionName}:`, sampleRoomIds);
              }
            } else if (collectionName === 'payments') {
              // Payments are linked via contractId, serviceOrderId, or foodOrderId
              console.log(`💰 Payment types found:`, sampleResponse.documents.map(doc => doc.paymentType));
              console.log(`🔗 Payment references:`, sampleResponse.documents.map(doc => ({
                contractId: doc.contractId,
                serviceOrderId: doc.serviceOrderId,
                foodOrderId: doc.foodOrderId
              })));
            }
          } else {
            console.log(`⚠️ Collection ${collectionName} is empty`);
          }
        } else {
          console.log(`❌ Collection ${collectionName} ID not found`);
        }
      } catch (error) {
        console.error(`❌ Error accessing collection ${collectionName}:`, error);
      }
    }
    
    console.log('\n📚 Available collection IDs:');
    Object.entries(collectionIds).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  };

  // Enhanced handle view history with diagnostics
  const handleViewHistory = async (room) => {
    setSelectedRoom(room);
    setDialogMode('history');
    setOpenDialog(true);
    
    // Run diagnostics first
    await diagnoseDatabaseStructure(room.$id);
    
    // Then fetch history
    await fetchRoomHistory(room.$id);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoom(null);
    setRoomHistory([]);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation error
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
    let isValid = true;
    
    if (!formData.roomNumber.trim()) {
      errors.roomNumber = t('common.requiredField');
      isValid = false;
    }
    
    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = t('common.invalidValue');
      isValid = false;
    }
    
    if (!formData.rentAmount || formData.rentAmount < 0) {
      errors.rentAmount = t('common.invalidValue');
      isValid = false;
    }
    
    if (!formData.floor || formData.floor < 1) {
      errors.floor = t('common.invalidValue');
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Validate if room can be set to maintenance
  const validateMaintenanceStatus = async (roomId) => {
    try {
      if (!roomId) return true; // For new rooms, allow any status
      
      // Check if room has active contracts
      const contractsResponse = await databases.listDocuments(
        databaseId,
        '68249e34003899ffa4a3', // contracts collection ID
        [
          Query.equal('status', 'active')
        ]
      );
      
      // Count active contracts for this room
      const activeContractsCount = contractsResponse.documents.filter(contract => {
        return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(roomId);
      }).length;
      
      // Room can only be set to maintenance if not occupied
      return activeContractsCount === 0;
    } catch (error) {
      console.error('Error validating maintenance status:', error);
      return false;
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Validate maintenance status if user is trying to set it
    if (formData.status === 'maintenance' && dialogMode === 'edit') {
      const canSetMaintenance = await validateMaintenanceStatus(selectedRoom.$id);
      if (!canSetMaintenance) {
        showError(t('rooms.cannotSetMaintenance'));
        return;
      }
    }
    
    try {
      const roomData = {
        roomNumber: formData.roomNumber,
        type: formData.type,
        capacity: parseInt(formData.capacity),
        rentAmount: parseFloat(formData.rentAmount),
        building: formData.building,
        floor: parseInt(formData.floor),
        updatedAt: new Date().toISOString(),
      };
      
      // Handle status updates based on mode and conditions
      if (dialogMode === 'create') {
        // For new rooms, set the chosen status
        roomData.status = formData.status;
      } else if (dialogMode === 'edit') {
        // For existing rooms, only update status in specific cases
        if (formData.status === 'maintenance') {
          // Setting to maintenance - manual override
          roomData.status = 'maintenance';
        } else if (selectedRoom?.status === 'maintenance' && formData.status === 'not_occupied') {
          // Removing from maintenance - clear manual status to allow auto-calculation
          roomData.status = null; // This will trigger auto-calculation
        }
        // For all other cases, don't update status - let it be calculated automatically
      }
      
      if (dialogMode === 'create') {
        // Add createdAt for new rooms
        roomData.createdAt = new Date().toISOString();
        roomData.createdBy = currentUser.$id;
        roomData.isDeleted = false; // Set initial value for soft delete flag
        
        // Create a new room using actual collection ID
        const newRoom = await databases.createDocument(
          databaseId,
          '68249cb00025da201b9d', // rooms collection ID
          ID.unique(),
          roomData
        );
        
        showSuccess(t('rooms.roomCreated'));
      } else if (dialogMode === 'edit') {
        roomData.updatedBy = currentUser.$id;
        
        // Update existing room using actual collection ID
        await databases.updateDocument(
          databaseId,
          '68249cb00025da201b9d', // rooms collection ID
          selectedRoom.$id,
          roomData
        );
        
        showSuccess(t('rooms.roomUpdated'));
      }
      
      handleCloseDialog();
      fetchRooms();
    } catch (error) {
      console.error(`Error ${dialogMode === 'create' ? 'creating' : 'updating'} room:`, error);
      showError(dialogMode === 'create' ? t('rooms.createError') : t('rooms.updateError'));
    }
  };
  
  // Handle room deletion (soft delete)
  const handleConfirmDelete = async () => {
    try {
      // Soft delete the room by setting isDeleted flag
      await databases.updateDocument(
        databaseId,
        '68249cb00025da201b9d', // rooms collection ID
        selectedRoom.$id,
        {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.$id,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.$id
        }
      );
      
      showSuccess(t('rooms.roomDeleted'));
      handleCloseDialog();
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      showError(t('rooms.deleteError'));
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event, room) => {
    setActionMenuAnchor(event.currentTarget);
    setActionRoom(room);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionRoom(null);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'OMR',
    }).format(amount);
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'roomNumber',
      headerName: t('rooms.roomNumber'),
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'building',
      headerName: t('rooms.building'),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: 'floor',
      headerName: t('rooms.floor'),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: 'type',
      headerName: t('rooms.type'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={t(`rooms.types.${params.value}`)}
          color={
            params.value === 'single' 
              ? 'primary' 
              : params.value === 'double' 
                ? 'secondary' 
                : 'info'
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'capacity',
      headerName: t('rooms.capacity'),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: 'remainingSpace',
      headerName: t('rooms.remainingSpace'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const room = params.row;
        const remainingSpace = room.remainingSpace || 0;
        const activeContracts = room.activeContractsCount || 0;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${remainingSpace}/${room.capacity}`}
              color={
                room.displayStatus === 'maintenance' 
                  ? 'warning'
                  : remainingSpace === room.capacity
                    ? 'default'
                    : remainingSpace === 0
                      ? 'error'
                      : 'success'
              }
              size="small"
              variant="outlined"
            />
            {activeContracts > 0 && (
              <Tooltip title={`${activeContracts} active contract${activeContracts > 1 ? 's' : ''}`}>
                <PeopleIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'rentAmount',
      headerName: t('rooms.rentAmount'),
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'displayStatus',
      headerName: t('rooms.statusLabel'),
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={t(`rooms.status.${params.value || params.row.displayStatus}`)}
          color={
            params.value === 'not_occupied' || params.row.displayStatus === 'not_occupied'
              ? 'default' 
              : params.value === 'remaining_space' || params.row.displayStatus === 'remaining_space'
                ? 'info'
                : params.value === 'full' || params.row.displayStatus === 'full'
                  ? 'success'
                  : 'warning'
          }
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('common.createdAt'),
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 0.7,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton 
              size="small" 
              onClick={() => handleEditRoom(params.row)}
              aria-label={t('common.edit')}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('common.more')}>
            <IconButton
              size="small"
              onClick={(e) => handleActionMenuOpen(e, params.row)}
              aria-label={t('common.more')}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  
  // QR Code component (mock)
  const QRCodeDisplay = ({ room }) => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Box sx={{ 
        width: 200, 
        height: 200, 
        border: '1px solid',
        borderColor: 'divider',
        mx: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 2,
      }}>
        <QrCodeIcon sx={{ fontSize: 100, color: 'text.secondary' }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        {room.roomNumber}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('rooms.building')}: {room.building}, {t('rooms.floor')}: {room.floor}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t(`rooms.types.${room.type}`)} - {room.capacity} {t('rooms.capacity')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {formatCurrency(room.rentAmount)} / {t('common.month')}
      </Typography>
    </Box>
  );
  
  // Room stats (calculate from actual data)
  const stats = {
    total: totalRooms,
    not_occupied: rooms.filter(room => room.displayStatus === 'not_occupied').length,
    remaining_space: rooms.filter(room => room.displayStatus === 'remaining_space').length,
    full: rooms.filter(room => room.displayStatus === 'full').length,
    maintenance: rooms.filter(room => room.displayStatus === 'maintenance').length,
  };
  
  return (
    <>
      <PageHeader
        title={t('rooms.title')}
        actionLabel={t('rooms.create')}
        onAction={handleCreateRoom}
      />
      
      {/* Enhanced Stats cards with gradients and animations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={!loading} style={{ transitionDelay: '100ms' }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '140px',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease-in-out'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {loading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats.total}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {t('rooms.totalRooms')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 60, 
                    height: 60,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <HomeWorkIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1,
              }} />
            </Card>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={!loading} style={{ transitionDelay: '200ms' }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '140px',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease-in-out'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {loading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats.not_occupied}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {t('rooms.status.not_occupied')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {stats.total > 0 ? `${((stats.not_occupied / stats.total) * 100).toFixed(1)}%` : '0%'} of total
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 60, 
                    height: 60,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1,
              }} />
            </Card>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={!loading} style={{ transitionDelay: '300ms' }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              height: '140px',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease-in-out'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {loading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats.remaining_space}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {t('rooms.status.remaining_space')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {stats.total > 0 ? `${((stats.remaining_space / stats.total) * 100).toFixed(1)}%` : '0%'} partially occupied
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 60, 
                    height: 60,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <PeopleIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1,
              }} />
            </Card>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={!loading} style={{ transitionDelay: '400ms' }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)',
              color: 'white',
              height: '140px',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease-in-out'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {loading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats.full}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {t('rooms.status.full')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {stats.total > 0 ? `${((stats.full / stats.total) * 100).toFixed(1)}%` : '0%'} at capacity
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 60, 
                    height: 60,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <HomeWorkIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                </Box>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1,
              }} />
                          </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={!loading} style={{ transitionDelay: '500ms' }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                height: '140px',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
                transition: 'all 0.3s ease-in-out'
              }}>
                <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                        {loading ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats.maintenance}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        {t('rooms.status.maintenance')}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Requires attention
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 60, 
                      height: 60,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <EngineeringIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  zIndex: 1,
                }} />
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      
      <Paper sx={{ 
        mb: 3, 
        p: 3,
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Search */}
          <TextField
            label={t('common.search')}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 220,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          {/* Type filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="type-filter-label">{t('rooms.type')}</InputLabel>
            <Select
              labelId="type-filter-label"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label={t('rooms.type')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="single">{t('rooms.types.single')}</MenuItem>
              <MenuItem value="double">{t('rooms.types.double')}</MenuItem>
              <MenuItem value="suite">{t('rooms.types.suite')}</MenuItem>
            </Select>
          </FormControl>
          
          {/* Status filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">{t('rooms.statusLabel')}</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label={t('rooms.statusLabel')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="not_occupied">{t('rooms.status.not_occupied')}</MenuItem>
              <MenuItem value="remaining_space">{t('rooms.status.remaining_space')}</MenuItem>
              <MenuItem value="full">{t('rooms.status.full')}</MenuItem>
              <MenuItem value="maintenance">{t('rooms.status.maintenance')}</MenuItem>
            </Select>
          </FormControl>
          
          {/* Building filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="building-filter-label">{t('rooms.building')}</InputLabel>
            <Select
              labelId="building-filter-label"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              label={t('rooms.building')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              {buildings.map((building) => (
                <MenuItem key={building} value={building}>
                  {t('rooms.building')} {building}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Refresh button */}
          <Tooltip title={t('common.refresh')}>
            <IconButton 
              onClick={() => fetchRooms()}
              color="default"
              aria-label={t('common.refresh')}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {/* Add room button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRoom}
            color="primary"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease'
            }}
          >
            {t('rooms.create')}
          </Button>
        </Box>
        
        {/* Room tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ 
            mb: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              borderRadius: '8px 8px 0 0',
              '&.Mui-selected': {
                bgcolor: 'rgba(33, 150, 243, 0.08)',
              }
            }
          }}
        >
          <Tab value="all" label={t('common.all')} />
          <Tab value="not_occupied" label={t('rooms.status.not_occupied')} />
          <Tab value="remaining_space" label={t('rooms.status.remaining_space')} />
          <Tab value="full" label={t('rooms.status.full')} />
          <Tab value="maintenance" label={t('rooms.status.maintenance')} />
        </Tabs>
        
        {/* Rooms data grid */}
        <Box sx={{ 
          height: 600, 
          width: '100%',
          '& .MuiDataGrid-root': {
            borderRadius: 2,
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'grey.20',
              borderRadius: '8px 8px 0 0',
            }
          }
        }}>
          <DataGrid
            rows={rooms}
            columns={columns}
            getRowId={(row) => row.$id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={totalRooms}
            paginationMode="server"
            loading={loading}
            disableSelectionOnClick
            disableColumnMenu
            disableRowSelectionOnClick
            localeText={{
              noRowsLabel: t('common.noData'),
            }}
          />
        </Box>
      </Paper>
      
      {/* Room CRUD Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth={dialogMode === 'qr' ? 'xs' : dialogMode === 'history' ? 'md' : 'sm'}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }
        }}
      >
        {dialogMode === 'delete' ? (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'error.light', 
              color: 'error.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DeleteIcon />
              {t('rooms.deleteConfirm')}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('rooms.deleteWarning', { roomNumber: selectedRoom?.roomNumber })}
              </Alert>
              <Typography sx={{ mb: 2 }}>
                This room will be marked as deleted and hidden from the system. The room data will be preserved but no longer accessible through normal operations.
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Deletion Requirements:
                </Typography>
                <Typography variant="body2" component="div">
                  • Room must not be occupied (no active contracts)
                </Typography>
                <Typography variant="body2" component="div">
                  • Room must not be under maintenance
                </Typography>
                <Typography variant="body2" component="div">
                  • Room must have status "Not Occupied"
                </Typography>
              </Alert>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Status:</strong> {t(`rooms.status.${selectedRoom?.displayStatus}`)}
                {selectedRoom?.activeContractsCount > 0 && (
                  <span> • {selectedRoom.activeContractsCount} active contract{selectedRoom.activeContractsCount > 1 ? 's' : ''}</span>
                )}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} variant="outlined">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleConfirmDelete} color="error" variant="contained">
                {t('common.delete')}
              </Button>
            </DialogActions>
          </>
        ) : dialogMode === 'qr' ? (
          <>
            <DialogTitle sx={{ 
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <QrCodeIcon />
              {t('rooms.generateQR')}
            </DialogTitle>
            <DialogContent>
              <QRCodeDisplay room={selectedRoom} />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} variant="outlined">
                {t('common.close')}
              </Button>
              <Button 
                onClick={() => {
                  showSuccess(t('rooms.qrGenerated'));
                  handleCloseDialog();
                }} 
                color="primary" 
                variant="contained"
              >
                {t('common.download')}
              </Button>
            </DialogActions>
          </>
        ) : dialogMode === 'history' ? (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'info.light',
              color: 'info.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <HistoryIcon />
              {t('rooms.roomHistory')} - {selectedRoom?.roomNumber}
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {historyLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading room history...</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {/* Room Details Summary */}
                  <Paper sx={{ m: 2, p: 2, bgcolor: 'grey.20' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Room Number
                        </Typography>
                        <Typography variant="h6">{selectedRoom?.roomNumber}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Type
                        </Typography>
                        <Typography variant="h6">
                          {t(`rooms.types.${selectedRoom?.type}`)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Current Status
                        </Typography>
                        <Chip
                          label={t(`rooms.status.${selectedRoom?.status}`)}
                          color={
                            selectedRoom?.status === 'available' 
                              ? 'success' 
                              : selectedRoom?.status === 'occupied' 
                                ? 'primary' 
                                : 'warning'
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Rent Amount
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(selectedRoom?.rentAmount || 0)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* History Timeline */}
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon />
                      Activity Timeline
                    </Typography>
                    
                    {roomHistory.length === 0 ? (
                      <Alert severity="info">
                        No history records found for this room.
                      </Alert>
                    ) : (
                      <List>
                        {roomHistory.map((item, index) => (
                          <ListItem key={item.$id} sx={{ alignItems: 'flex-start' }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: `${item.color}.light` }}>
                                {item.icon}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {item.action}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {item.details}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.$createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>

                  {/* Additional Details Accordions */}
                  <Box sx={{ p: 2 }}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon />
                          Financial History ({roomHistory.filter(item => item.type === 'payment').length} records)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {roomHistory.filter(item => item.type === 'payment').length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No payment records found for this room.
                            </Typography>
                          ) : (
                            <List dense>
                              {roomHistory.filter(item => item.type === 'payment').slice(0, 10).map((payment) => (
                                <ListItem key={payment.$id}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: payment.status === 'paid' ? 'success.light' : payment.status === 'pending' ? 'warning.light' : 'info.light',
                                      width: 32, 
                                      height: 32 
                                    }}>
                                      <MonetizationOnIcon fontSize="small" />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {payment.details}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Payment ID: {payment.paymentId || payment.$id.slice(-8)} | Method: {payment.paymentMethod || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Status: <Chip label={payment.status || 'unknown'} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                                      {payment.paidDate && ` | Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
                                    </Typography>
                                    {payment.dueDate && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon />
                          Occupancy History ({roomHistory.filter(item => item.type === 'contract').length} contracts)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {roomHistory.filter(item => item.type === 'contract').length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No contract records found for this room.
                            </Typography>
                          ) : (
                            <List dense>
                              {roomHistory.filter(item => item.type === 'contract').map((contract) => (
                                <ListItem key={contract.$id}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: contract.status === 'active' ? 'success.light' : contract.status === 'terminated' ? 'error.light' : 'secondary.light',
                                      width: 32, 
                                      height: 32 
                                    }}>
                                      <PersonIcon fontSize="small" />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {contract.details}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Student: {contract.studentName || 'N/A'} | Contract Status: 
                                      <Chip 
                                        label={contract.status} 
                                        size="small" 
                                        sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }}
                                        color={contract.status === 'active' ? 'success' : contract.status === 'terminated' ? 'error' : 'default'}
                                      />
                                    </Typography>
                                    {contract.startDate && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Period: {new Date(contract.startDate).toLocaleDateString()} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}
                                      </Typography>
                                    )}
                                    {contract.emergencyContactName && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Emergency Contact: {contract.emergencyContactName} ({contract.emergencyContactPhone})
                                      </Typography>
                                    )}
                                    {contract.isDiscounted && (
                                      <Typography variant="caption" color="primary" display="block">
                                        Discounted: {formatCurrency(contract.discountedAmount)} for {contract.discountPeriod}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BuildIcon />
                          Services & Maintenance ({roomHistory.filter(item => item.type === 'service').length} orders)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {roomHistory.filter(item => item.type === 'service').length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No service orders found for this room.
                            </Typography>
                          ) : (
                            <List dense>
                              {roomHistory.filter(item => item.type === 'service').map((service) => (
                                <ListItem key={service.$id}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: service.status === 'completed' ? 'success.light' : service.status === 'processing' ? 'info.light' : 'warning.light', 
                                      width: 32, 
                                      height: 32 
                                    }}>
                                      {service.status === 'completed' ? <CheckCircleIcon fontSize="small" /> : <BuildIcon fontSize="small" />}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {service.details}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Order ID: {service.serviceOrderId || service.$id.slice(-8)} | Status: 
                                      <Chip 
                                        label={service.status || 'pending'} 
                                        size="small" 
                                        sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }}
                                        color={service.status === 'completed' ? 'success' : service.status === 'processing' ? 'info' : 'warning'}
                                      />
                                    </Typography>
                                    {service.orderTime && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Ordered: {new Date(service.orderTime).toLocaleString()}
                                      </Typography>
                                    )}
                                    {service.completionTime && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Completed: {new Date(service.completionTime).toLocaleString()}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon />
                          Food Orders ({roomHistory.filter(item => item.type === 'food').length} orders)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {roomHistory.filter(item => item.type === 'food').length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No food orders found for this room.
                            </Typography>
                          ) : (
                            <List dense>
                              {roomHistory.filter(item => item.type === 'food').slice(0, 10).map((food) => (
                                <ListItem key={food.$id}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: food.status === 'delivered' ? 'success.light' : food.status === 'preparing' ? 'warning.light' : 'info.light',
                                      width: 32, 
                                      height: 32 
                                    }}>
                                      <EventIcon fontSize="small" />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {food.details}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Order ID: {food.orderId || food.$id.slice(-8)} | Status: 
                                      <Chip 
                                        label={food.status || 'pending'} 
                                        size="small" 
                                        sx={{ ml: 0.5, height: 16, fontSize: '0.65rem' }}
                                        color={food.status === 'delivered' ? 'success' : food.status === 'preparing' ? 'warning' : 'info'}
                                      />
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Payment Status: <Chip label={food.paymentStatus || 'pending'} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                                    </Typography>
                                    {food.orderTime && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Ordered: {new Date(food.orderTime).toLocaleString()}
                                      </Typography>
                                    )}
                                    {food.actualDeliveryTime && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Delivered: {new Date(food.actualDeliveryTime).toLocaleString()}
                                      </Typography>
                                    )}
                                    {food.deliveryNotes && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Notes: {food.deliveryNotes}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} variant="outlined">
                {t('common.close')}
              </Button>
              <Button 
                onClick={() => {
                  // Export history functionality
                  showSuccess('History export feature coming soon!');
                }} 
                color="primary" 
                variant="contained"
                startIcon={<ContentCopyIcon />}
              >
                Export History
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{
              bgcolor: dialogMode === 'create' ? 'success.light' : 'primary.light',
              color: dialogMode === 'create' ? 'success.contrastText' : 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {dialogMode === 'create' ? <AddIcon /> : <EditIcon />}
              {dialogMode === 'create' ? t('rooms.create') : t('rooms.edit')}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box component="form" sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label={t('rooms.roomNumber')}
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      error={!!formErrors.roomNumber}
                      helperText={formErrors.roomNumber}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{t('rooms.type')}</InputLabel>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        label={t('rooms.type')}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="single">{t('rooms.types.single')}</MenuItem>
                        <MenuItem value="double">{t('rooms.types.double')}</MenuItem>
                        <MenuItem value="suite">{t('rooms.types.suite')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label={t('rooms.capacity')}
                      name="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      error={!!formErrors.capacity}
                      helperText={formErrors.capacity}
                      InputProps={{ inputProps: { min: 1 } }}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label={t('rooms.rentAmount')}
                      name="rentAmount"
                      type="number"
                      value={formData.rentAmount}
                      onChange={handleInputChange}
                      error={!!formErrors.rentAmount}
                      helperText={formErrors.rentAmount}
                      InputProps={{ 
                        inputProps: { min: 0 },
                        startAdornment: <InputAdornment position="start">OMR</InputAdornment>
                      }}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{t('rooms.building')}</InputLabel>
                      <Select
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        label={t('rooms.building')}
                        sx={{ borderRadius: 2 }}
                      >
                        {buildings.map((building) => (
                          <MenuItem key={building} value={building}>
                            {t('rooms.building')} {building}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{t('rooms.floor')}</InputLabel>
                      <Select
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        label={t('rooms.floor')}
                        sx={{ borderRadius: 2 }}
                      >
                        {floors.map((floor) => (
                          <MenuItem key={floor} value={floor}>
                            {floor}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="status-select-label">{t('rooms.statusLabel')}</InputLabel>
                      <Select
                        labelId="status-select-label"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        label={t('rooms.statusLabel')}
                        sx={{ borderRadius: 2 }}
                        disabled={dialogMode === 'edit' && selectedRoom?.displayStatus !== 'not_occupied' && selectedRoom?.displayStatus !== 'maintenance'}
                      >
                        {dialogMode === 'create' ? (
                          // For new rooms, allow setting initial status
                          [
                            <MenuItem key="not_occupied" value="not_occupied">{t('rooms.status.not_occupied')}</MenuItem>,
                            <MenuItem key="maintenance" value="maintenance">{t('rooms.status.maintenance')}</MenuItem>
                          ]
                        ) : (
                          // For existing rooms, show current status and allow maintenance toggle
                          [
                            selectedRoom?.displayStatus === 'not_occupied' && [
                              <MenuItem key="not_occupied" value="not_occupied">{t('rooms.status.not_occupied')} (Auto)</MenuItem>,
                              <MenuItem key="maintenance" value="maintenance">{t('rooms.status.maintenance')}</MenuItem>
                            ],
                            selectedRoom?.displayStatus === 'remaining_space' && (
                              <MenuItem key="remaining_space" value="remaining_space" disabled>{t('rooms.status.remaining_space')} (Auto - Occupied)</MenuItem>
                            ),
                            selectedRoom?.displayStatus === 'full' && (
                              <MenuItem key="full" value="full" disabled>{t('rooms.status.full')} (Auto - Occupied)</MenuItem>
                            ),
                            selectedRoom?.displayStatus === 'maintenance' && [
                              <MenuItem key="maintenance" value="maintenance">{t('rooms.status.maintenance')}</MenuItem>,
                              <MenuItem key="not_occupied" value="not_occupied">{t('rooms.status.not_occupied')} (Remove from maintenance)</MenuItem>
                            ]
                          ]
                        )}
                      </Select>
                    </FormControl>
                    {dialogMode === 'edit' && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {selectedRoom?.displayStatus === 'not_occupied' || selectedRoom?.displayStatus === 'maintenance'
                          ? 'Status can be changed to maintenance when room is not occupied'
                          : 'Room status is automatically calculated based on occupancy. Only maintenance can be set manually when not occupied.'
                        }
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} variant="outlined">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} color="primary" variant="contained">
                {dialogMode === 'create' ? t('common.create') : t('common.save')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.05)',
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => {
          handleActionMenuClose();
          handleEditRoom(actionRoom);
        }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleActionMenuClose();
          handleViewHistory(actionRoom);
        }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>{t('rooms.viewHistory')}</ListItemText>
        </MenuItem>
           
            
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={async () => {
          handleActionMenuClose();
          await handleDeleteRoom(actionRoom);
        }} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Rooms; 