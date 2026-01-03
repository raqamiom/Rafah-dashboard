import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tab,
  Tabs,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  ButtonGroup,
  Badge,
  Container,
  Stack,
  LinearProgress,
  Fade,
  Zoom,
  Skeleton,
  CardHeader,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Restaurant as RestaurantIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  LocalAtm as LocalAtmIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import React from 'react';

const Payments = () => {
  const theme = useTheme();
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  
  // State for payment data
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // State for students, services, and contracts
  const [students, setStudents] = useState([]);
  const [services, setServices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  
  // State for selected student details
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [submitting, setSubmitting] = useState(false);
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('all');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // State for payment form
  const [formData, setFormData] = useState({
    userId: '',
    paymentType: 'service',
    serviceOrderId: '',
    contractId: '',
    foodOrderId: '',
    amount: 0,
    status: 'pending',
    paymentMethod: 'cash',
    dueDate: new Date(),
    description: '',
    notes: '',
    taxAmount: 0,
    discountAmount: 0,
    paymentMonth: new Date(), // For contract monthly payments
  });
  const [formErrors, setFormErrors] = useState({});
  
  // State for payment validation
  const [paymentValidation, setPaymentValidation] = useState({
    isOrderPaid: false,
    isContractMonthPaid: false,
    existingPayments: [],
  });
  
  // State for selected bill details
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  
  // State for refund reason
  const [refundReason, setRefundReason] = useState('');
  
  // State for stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalRefunded: 0,
    totalFailed: 0,
    totalByType: {
      service: 0,
      contract: 0,
      food: 0,
    },
  });

  // Payment type configurations - using dynamic translations
  const paymentTypeConfig = {
    service: {
      label: t('payments.types.service'),
      icon: BuildIcon,
      color: 'primary',
      bgColor: 'primary.light',
    },
    contract: {
      label: t('payments.types.contract'),
      icon: HomeIcon,
      color: 'success',
      bgColor: 'success.light',
    },
    food: {
      label: t('payments.types.food'),
      icon: RestaurantIcon,
      color: 'warning',
      bgColor: 'warning.light',
    },
  };

  // Payment status configurations - using dynamic translations
  const statusConfig = {
    pending: { 
      label: t('payments.status.pending'), 
      color: 'warning', 
      icon: PendingIcon 
    },
    paid: { 
      label: t('payments.status.paid'), 
      color: 'success', 
      icon: CheckCircleIcon 
    },
    failed: { 
      label: t('payments.status.failed'), 
      color: 'error', 
      icon: ErrorIcon 
    },
    refunded: { 
      label: t('payments.status.refunded'), 
      color: 'info', 
      icon: MoneyOffIcon 
    },
    partial: { 
      label: t('payments.status.partial'), 
      color: 'secondary', 
      icon: ScheduleIcon 
    },
  };

  // Payment method configurations - using dynamic translations
  const methodConfig = {
    cash: { 
      label: t('payments.methods.cash'), 
      icon: LocalAtmIcon, 
      color: 'success' 
    },
    card: { 
      label: t('payments.methods.card'), 
      icon: CreditCardIcon, 
      color: 'primary' 
    },
    bank_transfer: { 
      label: t('payments.methods.bankTransfer'), 
      icon: AccountBalanceIcon, 
      color: 'info' 
    },
    online: { 
      label: t('payments.methods.online'), 
      icon: AttachMoneyIcon, 
      color: 'secondary' 
    },
  };

  // Generate payment ID
  const generatePaymentId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `PAY${year}${month}${day}${timestamp}`;
  };

  // Fetch payments from database
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      if (!collections.payments) {
        console.warn('Payments collection ID not found');
        setPayments([]);
        setTotalPayments(0);
        calculateStats([]);
        return;
      }

            const response = await databases.listDocuments(
        databaseId,
        collections.payments
      );

      console.log('Payments fetched:', response.documents.length);
      
      // Enrich payment data with student names
      const enrichedPayments = await Promise.all(
        response.documents.map(async (payment) => {
          let studentName = t('common.unknownStudent');
          
          // Fetch student name if userId exists
          if (payment.userId && collections.users) {
            try {
              const userResponse = await databases.getDocument(
                databaseId,
                collections.users,
                payment.userId
              );
              studentName = userResponse.name || t('common.unknownStudent');
            } catch (error) {
              console.warn(`Failed to fetch user ${payment.userId}:`, error);
            }
          }
          
          return {
            ...payment,
            studentName,
          };
        })
      );

      setPayments(enrichedPayments);
      setTotalPayments(enrichedPayments.length);
      calculateStats(enrichedPayments);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      showError(t('payments.fetchError'));
      setPayments([]);
      setTotalPayments(0);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      setLoadingReferences(true);
      
      console.log('Collections available:', collections); // Debug log
      
      // Fetch students
      if (collections.users) {
        try {
          const studentsResponse = await databases.listDocuments(
            databaseId,
            collections.users,
            [],
            100,
            0
          );
          setStudents(studentsResponse.documents);
          console.log('Students fetched:', studentsResponse.documents.length);
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      } else {
        console.warn('Users collection ID not found');
      }

      // Fetch services
      if (collections.services) {
        try {
          const servicesResponse = await databases.listDocuments(
            databaseId,
            collections.services,
            [],
            100,
            0
          );
          setServices(servicesResponse.documents);
          console.log('Services fetched:', servicesResponse.documents.length);
        } catch (error) {
          console.error('Error fetching services:', error);
        }
      } else {
        console.warn('Services collection ID not found');
      }

      // Fetch contracts
      if (collections.contracts) {
        try {
          const contractsResponse = await databases.listDocuments(
            databaseId,
            collections.contracts,
            [],
            100,
            0
          );
          setContracts(contractsResponse.documents);
          console.log('Contracts fetched:', contractsResponse.documents.length);
        } catch (error) {
          console.error('Error fetching contracts:', error);
        }
      } else {
        console.warn('Contracts collection ID not found');
      }

      // Fetch food orders
      if (collections.foodOrders) {
        try {
          const foodOrdersResponse = await databases.listDocuments(
            databaseId,
            collections.foodOrders,
            [],
            100,
            0
          );
          setFoodOrders(foodOrdersResponse.documents);
          console.log('Food orders fetched:', foodOrdersResponse.documents.length);
        } catch (error) {
          console.error('Error fetching food orders:', error);
        }
      } else {
        console.warn('Food orders collection ID not found');
      }

      // Fetch service orders
      if (collections.serviceOrders) {
        try {
          const serviceOrdersResponse = await databases.listDocuments(
            databaseId,
            collections.serviceOrders,
            [],
            100,
            0
          );
          setServiceOrders(serviceOrdersResponse.documents);
          console.log('Service orders fetched:', serviceOrdersResponse.documents.length);
        } catch (error) {
          console.error('Error fetching service orders:', error);
        }
      } else {
        console.warn('Service orders collection ID not found');
      }

    } catch (error) {
      console.error('Error fetching reference data:', error);
      showError(t('payments.fetchError'));
    } finally {
      setLoadingReferences(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchPayments();
    fetchReferenceData();
  }, []);
      
      // Calculate statistics
  const calculateStats = (paymentsData) => {
    const totalPaid = paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.finalAmount || p.amount || 0), 0);
    
    const totalPending = paymentsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.finalAmount || p.amount || 0), 0);
    
    const totalRefunded = paymentsData
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.finalAmount || p.amount || 0), 0);

    const totalFailed = paymentsData
      .filter(p => p.status === 'failed')
      .reduce((sum, p) => sum + (p.finalAmount || p.amount || 0), 0);

    const totalByType = {
      service: paymentsData.filter(p => p.paymentType === 'service').length,
      contract: paymentsData.filter(p => p.paymentType === 'contract').length,
      food: paymentsData.filter(p => p.paymentType === 'food').length,
    };
      
      setStats({
        totalPaid,
        totalPending,
        totalRefunded,
      totalFailed,
      totalByType,
    });
  };

  // Refresh data
  const handleRefresh = () => {
    fetchPayments();
    fetchReferenceData();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'OMR',
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
    return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return '-';
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle input change
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'amount' || name === 'taxAmount' || name === 'discountAmount') {
      // Allow only numeric values with decimals
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // If user selection changed, fetch student details
    if (name === 'userId' && value) {
      await fetchStudentDetails(value);
    } else if (name === 'userId' && !value) {
      setSelectedStudentDetails(null);
    }
    
    // Validate service order payment status and set bill details
    if (name === 'serviceOrderId') {
      if (value) {
        const isPaid = checkServiceOrderPaymentStatus(value);
        const billDetails = getBillDetails('service', value);
        setPaymentValidation(prev => ({
          ...prev,
          isOrderPaid: isPaid
        }));
        setSelectedBillDetails(billDetails);
      } else {
        setSelectedBillDetails(null);
      }
    }
    
    // Validate food order payment status and set bill details
    if (name === 'foodOrderId') {
      if (value) {
        const isPaid = checkFoodOrderPaymentStatus(value);
        const billDetails = getBillDetails('food', value);
        setPaymentValidation(prev => ({
          ...prev,
          isOrderPaid: isPaid
        }));
        setSelectedBillDetails(billDetails);
      } else {
        setSelectedBillDetails(null);
      }
    }
    
    // Validate contract monthly payment and set bill details
    if (name === 'contractId') {
      if (value) {
        if (formData.paymentMonth) {
          const monthStatus = checkContractMonthlyPaymentStatus(value, formData.paymentMonth);
          setPaymentValidation(prev => ({
            ...prev,
            isContractMonthPaid: monthStatus.isPaid,
            existingPayments: monthStatus.existingPayments
          }));
        }
        const billDetails = getBillDetails('contract', value);
        setSelectedBillDetails(billDetails);
      } else {
        setSelectedBillDetails(null);
      }
    }
    
    // Clear related errors
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: false });
    }
  };

  // Handle date change
  const handleDateChange = (name, date) => {
    setFormData({ ...formData, [name]: date });
    
    // If payment month changed and contract is selected, validate
    if (name === 'paymentMonth' && formData.contractId && date) {
      const monthStatus = checkContractMonthlyPaymentStatus(formData.contractId, date);
      setPaymentValidation(prev => ({
        ...prev,
        isContractMonthPaid: monthStatus.isPaid,
        existingPayments: monthStatus.existingPayments
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: false });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.userId) errors.userId = true;
    
    // Validate amount fields
    const amount = parseFloat(formData.amount);
    const taxAmount = parseFloat(formData.taxAmount) || 0;
    const discountAmount = parseFloat(formData.discountAmount) || 0;
    
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = true;
    }
    
    if (formData.taxAmount && isNaN(taxAmount)) {
      errors.taxAmount = true;
    }
    
    if (formData.discountAmount && isNaN(discountAmount)) {
      errors.discountAmount = true;
    }
    
    if (!formData.description.trim()) errors.description = true;
    if (!formData.dueDate) errors.dueDate = true;
    
    // Type-specific validation
    if (formData.paymentType === 'service' && !formData.serviceOrderId) {
      errors.serviceOrderId = true;
    }
    if (formData.paymentType === 'contract') {
      if (!formData.contractId) {
        errors.contractId = true;
      }
      if (!formData.paymentMonth) {
        errors.paymentMonth = true;
      }
    }
    if (formData.paymentType === 'food' && !formData.foodOrderId) {
      errors.foodOrderId = true;
    }
    
    // Payment validation checks
    if (paymentValidation.isOrderPaid && (formData.paymentType === 'service' || formData.paymentType === 'food')) {
      showError(t('payments.orderAlreadyPaid'));
      return false;
    }
    
    if (paymentValidation.isContractMonthPaid && formData.paymentType === 'contract') {
      showError(t('payments.monthlyPaymentExists'));
      return false;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create payment
  const handleCreatePayment = () => {
    setFormData({
      userId: '',
      paymentType: 'service',
      serviceOrderId: '',
      contractId: '',
      foodOrderId: '',
      amount: 0,
      status: 'pending',
      paymentMethod: 'cash',
      dueDate: new Date(),
      description: '',
      notes: '',
      taxAmount: 0,
      discountAmount: 0,
      paymentMonth: new Date(),
    });
    setFormErrors({});
    setPaymentValidation({
      isOrderPaid: false,
      isContractMonthPaid: false,
      existingPayments: [],
    });
    setSelectedStudentDetails(null); // Reset student details
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle submit payment
  const handleSubmitPayment = async () => {
    if (!validateForm()) {
      showError(t('common.requiredField'));
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert string values to numbers
      const amount = parseFloat(formData.amount) || 0;
      const taxAmount = parseFloat(formData.taxAmount) || 0;
      const discountAmount = parseFloat(formData.discountAmount) || 0;
      const finalAmount = amount - discountAmount + taxAmount;
      
      const paymentData = {
        paymentId: generatePaymentId(),
        userId: formData.userId,
        paymentType: formData.paymentType,
        serviceOrderId: formData.paymentType === 'service' ? formData.serviceOrderId : null,
        contractId: formData.paymentType === 'contract' ? formData.contractId : null,
        foodOrderId: formData.paymentType === 'food' ? formData.foodOrderId : null,
        paymentMonth: formData.paymentType === 'contract' ? formData.paymentMonth.toISOString() : null,
        amount: amount,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        dueDate: formData.dueDate.toISOString(),
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databases.createDocument(
        databaseId,
        collections.payments,
        ID.unique(),
        paymentData
      );

      showSuccess(t('payments.paymentCreated'));
      setOpenDialog(false);
      
      // Refresh payments list
      fetchPayments();
      
    } catch (error) {
      console.error('Error creating payment:', error);
      showError(t('payments.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view payment details
  const handleViewPayment = async (payment) => {
    setSelectedPayment(payment);
    setDialogMode('view');
    setOpenDialog(true);
    
    // Fetch comprehensive student details for the payment
    if (payment.userId) {
      await fetchStudentDetails(payment.userId);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (payment) => {
    try {
      const updatedData = {
        status: 'paid',
        paidDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databases.updateDocument(
        databaseId,
        collections.payments,
        payment.$id,
        updatedData
      );

      showSuccess(t('payments.markedAsPaidSuccess'));
      setOpenDialog(false);
      
      // Refresh payments list
      fetchPayments();
      
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      showError(t('payments.createError'));
    }
  };

  // Handle refund
  const handleRefund = async (payment, refundReason) => {
    try {
      const updatedData = {
        status: 'refunded',
        refundDate: new Date().toISOString(),
        refundReason: refundReason,
        updatedAt: new Date().toISOString(),
      };

      await databases.updateDocument(
        databaseId,
        collections.payments,
        payment.$id,
        updatedData
      );

      showSuccess(t('payments.refundSuccess'));
      setOpenDialog(false);
      
      // Refresh payments list
      fetchPayments();
      
    } catch (error) {
      console.error('Error refunding payment:', error);
      showError(t('payments.createError'));
    }
  };
  
  // Handle mark as paid dialog
  const handleMarkAsPaidDialog = (payment) => {
    setSelectedPayment(payment);
    setDialogMode('markPaid');
    setOpenDialog(true);
  };
  
  // Handle refund dialog
  const handleRefundDialog = (payment) => {
    setSelectedPayment(payment);
    setDialogMode('refund');
    setOpenDialog(true);
  };
  
  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayment(null);
    setFormErrors({});
    setRefundReason(''); // Reset refund reason
    setSelectedStudentDetails(null); // Reset student details
    setSelectedBillDetails(null); // Reset bill details
    setPaymentValidation({
      isOrderPaid: false,
      isContractMonthPaid: false,
      existingPayments: [],
    }); // Reset validation
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'paymentId',
      headerName: t('payments.paymentId'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'paymentType',
      headerName: t('payments.type'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const config = paymentTypeConfig[params.value];
        const IconComponent = config?.icon || BuildIcon;
        return (
        <Chip
            icon={<IconComponent fontSize="small" />}
            label={config?.label || params.value}
            color={config?.color || 'default'}
          size="small"
          variant="outlined"
        />
        );
      },
    },
    {
      field: 'studentName',
      headerName: t('payments.studentName'),
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
            {params.value?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="body2">
            {params.value || 'Unknown'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: t('payments.description'),
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'finalAmount',
      headerName: t('payments.amount'),
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'paymentMethod',
      headerName: t('payments.method'),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const config = methodConfig[params.value];
        const IconComponent = config?.icon || AttachMoneyIcon;
        return (
          <Tooltip title={config?.label || params.value}>
            <IconComponent 
              fontSize="small" 
              color={config?.color || 'default'} 
            />
          </Tooltip>
        );
      },
    },
    {
      field: 'status',
      headerName: t('payments.statusLabel'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const config = statusConfig[params.value];
        return (
        <Chip
            label={config?.label || params.value}
            color={config?.color || 'default'}
          size="small"
        />
        );
      },
    },
    {
      field: 'dueDate',
      headerName: t('payments.dueDate'),
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title={t('common.view')}>
            <IconButton
              size="small"
              onClick={() => handleViewPayment(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('payments.markAsPaid')}>
            <IconButton
              size="small"
              onClick={() => handleMarkAsPaidDialog(params.row)}
              disabled={params.row.status !== 'pending'}
              color="success"
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('payments.refund')}>
            <IconButton
              size="small"
              onClick={() => handleRefundDialog(params.row)}
              disabled={params.row.status !== 'paid'}
              color="error"
            >
              <MoneyOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      ),
    },
  ];
  
  // Filter payments based on current tab and filters
  const filteredPayments = payments.filter(payment => {
    // Tab filter
    if (currentTab === 'pending') return payment.status === 'pending';
    if (currentTab === 'paid') return payment.status === 'paid';
    if (currentTab === 'failed') return payment.status === 'failed';
    if (currentTab === 'refunded') return payment.status === 'refunded';
    if (currentTab === 'late') {
      const dueDate = startOfDay(new Date(payment.dueDate));
      const today = startOfDay(new Date());
      return payment.status === 'pending' && isBefore(dueDate, today);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!payment.paymentId.toLowerCase().includes(query) &&
          !payment.studentName.toLowerCase().includes(query) &&
          !payment.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Type filter
    if (filterPaymentType !== 'all' && payment.paymentType !== filterPaymentType) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && payment.status !== filterStatus) {
      return false;
    }
    
    // Method filter
    if (filterMethod !== 'all' && payment.paymentMethod !== filterMethod) {
      return false;
    }
    
    // Date range filter
    if (dateFrom && isBefore(new Date(payment.dueDate), startOfDay(dateFrom))) {
      return false;
    }
    if (dateTo && isAfter(new Date(payment.dueDate), startOfDay(dateTo))) {
      return false;
    }
    
    return true;
  });
  
  // Fetch student details including contracts, orders, etc.
  const fetchStudentDetails = async (userId) => {
    try {
      setLoadingStudentDetails(true);
      
      // Fetch student basic info
      const studentResponse = await databases.getDocument(
        databaseId,
        collections.users,
        userId
      );
      
      // Fetch student's contracts
      let studentContracts = [];
      if (collections.contracts) {
        try {
          const contractsResponse = await databases.listDocuments(
            databaseId,
            collections.contracts,
            [], // Remove the filter and fetch all, then filter locally
            100,
            0
          );
          // Filter contracts for this student
          studentContracts = contractsResponse.documents.filter(contract => contract.userId === userId);
          
          // Enhance contracts with room details
          for (let contract of studentContracts) {
            if (contract.roomIds && contract.roomIds.length > 0 && collections.rooms) {
              try {
                const roomPromises = contract.roomIds.map(roomId => 
                  databases.getDocument(databaseId, collections.rooms, roomId)
                );
                contract.roomDetails = await Promise.all(roomPromises);
                
                // Calculate total rent from all assigned rooms
                contract.totalRent = contract.roomDetails.reduce((total, room) => 
                  total + (room.rentAmount || 0), 0
                );
                
                // Get room numbers for display
                contract.roomNumbers = contract.roomDetails.map(room => room.roomNumber).join(', ');
              } catch (error) {
                console.warn('Error fetching room details for contract:', error);
                contract.roomDetails = [];
                contract.totalRent = 0;
                contract.roomNumbers = t('common.unknown');
              }
            } else {
              contract.roomDetails = [];
              contract.totalRent = 0;
              contract.roomNumbers = t('contracts.noRoomsAssigned');
            }
          }
        } catch (error) {
          console.warn('Error fetching student contracts:', error);
        }
      }

      // Fetch student's service orders
      let studentServiceOrders = [];
      if (collections.serviceOrders) {
        try {
          const serviceOrdersResponse = await databases.listDocuments(
            databaseId,
            collections.serviceOrders,
            [], // Remove the filter and fetch all, then filter locally
            100,
            0
          );
          // Filter service orders for this student
          studentServiceOrders = serviceOrdersResponse.documents.filter(order => order.userId === userId);
        } catch (error) {
          console.warn('Error fetching student service orders:', error);
        }
      }

      // Fetch student's food orders
      let studentFoodOrders = [];
      if (collections.foodOrders) {
        try {
          const foodOrdersResponse = await databases.listDocuments(
            databaseId,
            collections.foodOrders,
            [], // Remove the filter and fetch all, then filter locally
            100,
            0
          );
          // Filter food orders for this student
          studentFoodOrders = foodOrdersResponse.documents.filter(order => order.userId === userId);
        } catch (error) {
          console.warn('Error fetching student food orders:', error);
        }
      }

      console.log('Student details loaded:', {
        student: studentResponse.name,
        contracts: studentContracts.length,
        serviceOrders: studentServiceOrders.length,
        foodOrders: studentFoodOrders.length
      });

      setSelectedStudentDetails({
        ...studentResponse,
        contracts: studentContracts,
        serviceOrders: studentServiceOrders,
        foodOrders: studentFoodOrders,
      });
      
    } catch (error) {
      console.error('Error fetching student details:', error);
      setSelectedStudentDetails(null);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Check if service order is already paid
  const checkServiceOrderPaymentStatus = (serviceOrderId) => {
    const existingPayments = payments.filter(payment => 
      payment.serviceOrderId === serviceOrderId && 
      payment.status === 'paid'
    );
    return existingPayments.length > 0;
  };

  // Check if food order is already paid
  const checkFoodOrderPaymentStatus = (foodOrderId) => {
    const existingPayments = payments.filter(payment => 
      payment.foodOrderId === foodOrderId && 
      payment.status === 'paid'
    );
    return existingPayments.length > 0;
  };

  // Check if contract payment exists for specific month
  const checkContractMonthlyPaymentStatus = (contractId, paymentMonth) => {
    const monthStart = new Date(paymentMonth.getFullYear(), paymentMonth.getMonth(), 1);
    const monthEnd = new Date(paymentMonth.getFullYear(), paymentMonth.getMonth() + 1, 0);
    
    const existingPayments = payments.filter(payment => 
      payment.contractId === contractId && 
      payment.status === 'paid' &&
      payment.paymentMonth && 
      new Date(payment.paymentMonth) >= monthStart && 
      new Date(payment.paymentMonth) <= monthEnd
    );
    
    return {
      isPaid: existingPayments.length > 0,
      existingPayments: existingPayments
    };
  };

  // Get detailed bill information
  const getBillDetails = (billType, billId) => {
    if (!selectedStudentDetails || !billId) return null;
    
    switch (billType) {
      case 'service':
        return selectedStudentDetails.serviceOrders?.find(order => order.$id === billId);
      case 'food':
        return selectedStudentDetails.foodOrders?.find(order => order.$id === billId);
      case 'contract':
        return selectedStudentDetails.contracts?.find(contract => contract.$id === billId);
      default:
        return null;
    }
  };

  // Get filtered options based on selected student
  const getFilteredContracts = () => {
    if (!selectedStudentDetails) return [];
    return selectedStudentDetails.contracts || [];
  };

  const getFilteredServiceOrders = () => {
    if (!selectedStudentDetails) return [];
    return selectedStudentDetails.serviceOrders?.map(order => ({
      ...order,
      isPaid: checkServiceOrderPaymentStatus(order.$id)
    })) || [];
  };

  const getFilteredFoodOrders = () => {
    if (!selectedStudentDetails) return [];
    return selectedStudentDetails.foodOrders?.map(order => ({
      ...order,
      isPaid: checkFoodOrderPaymentStatus(order.$id)
    })) || [];
  };
  
  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Enhanced Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <ReceiptIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}>
                {t('payments.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('payments.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreatePayment}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {t('payments.create')}
          </Button>
        </Box>

        {/* Enhanced Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={600}>
              <Card sx={{ 
                height: '100%', 
                position: 'relative', 
                overflow: 'visible',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.light, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.success.main, 0.2)}`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ 
                        color: theme.palette.success.dark,
                        mb: 1,
                        background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {formatCurrency(stats.totalPaid)}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.success.dark,
                        fontWeight: 600,
                        mb: 1,
                      }}>
                        {t('payments.totalPaid')}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      color: theme.palette.success.main,
                      width: 56, 
                      height: 56,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.3)}`,
                    }}>
                      <TrendingUpIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={700}>
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.light, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.warning.main, 0.2)}`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ 
                        color: theme.palette.warning.dark,
                        mb: 1,
                        background: `linear-gradient(45deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {formatCurrency(stats.totalPending)}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.warning.dark,
                        fontWeight: 600,
                        mb: 1,
                      }}>
                        {t('payments.totalPending')}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.2),
                      color: theme.palette.warning.main,
                      width: 56, 
                      height: 56,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.3)}`,
                    }}>
                      <ScheduleIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={800}>
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.info.main, 0.2)}`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ 
                        color: theme.palette.info.dark,
                        mb: 1,
                        background: `linear-gradient(45deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {formatCurrency(stats.totalRefunded)}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.info.dark,
                        fontWeight: 600,
                        mb: 1,
                      }}>
                        {t('payments.totalRefunded')}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                      color: theme.palette.info.main,
                      width: 56, 
                      height: 56,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.3)}`,
                    }}>
                      <MoneyOffIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} timeout={900}>
              <Card sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.light, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.error.main, 0.2)}`,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3" fontWeight="bold" sx={{ 
                        color: theme.palette.error.dark,
                        mb: 1,
                        background: `linear-gradient(45deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {formatCurrency(stats.totalFailed)}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.error.dark,
                        fontWeight: 600,
                        mb: 1,
                      }}>
                        {t('payments.totalFailed')}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                      color: theme.palette.error.main,
                      width: 56, 
                      height: 56,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.3)}`,
                    }}>
                      <ErrorIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Enhanced Payment Type Summary */}
        <Fade in={true} timeout={1000}>
          <Card sx={{ 
            mb: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
              : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 32px ${alpha('#000', 0.3)}`
              : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AnalyticsIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    {t('payments.paymentsByType')}
                  </Typography>
                </Box>
              }
              sx={{
                background: alpha(theme.palette.primary.main, 0.02),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {Object.entries(stats.totalByType).map(([type, count], index) => {
                  const config = paymentTypeConfig[type];
                  const IconComponent = config?.icon || BuildIcon;
                  return (
                    <Grid item xs={12} sm={4} key={type}>
                      <Zoom in={true} timeout={1100 + (index * 100)}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 3, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.1)}, ${alpha(theme.palette[config?.color]?.light || theme.palette.primary.light, 0.05)})`,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.2)}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px ${alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.2)}`,
                            border: `1px solid ${alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.4)}`,
                          }
                        }}>
                          <Avatar sx={{ 
                            bgcolor: alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.2),
                            color: theme.palette[config?.color]?.main || theme.palette.primary.main,
                            width: 48, 
                            height: 48, 
                            mr: 2,
                            boxShadow: `0 4px 12px ${alpha(theme.palette[config?.color]?.main || theme.palette.primary.main, 0.3)}`,
                          }}>
                            <IconComponent sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h4" fontWeight="bold" sx={{ 
                              color: theme.palette[config?.color]?.dark || theme.palette.primary.dark,
                              mb: 0.5,
                            }}>
                              {count}
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              color: theme.palette[config?.color]?.dark || theme.palette.primary.dark,
                              fontWeight: 600,
                            }}>
                              {config?.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Zoom>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        <Fade in={true} timeout={1200}>
          <Paper sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
              : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 32px ${alpha('#000', 0.3)}`
              : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          }}>
            {/* Enhanced Search and Filters */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label={t('common.search')}
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        </InputAdornment>
                      ),
                    }}
                    placeholder={t('payments.searchPlaceholder')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(10px)',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:hover fieldset': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('payments.type', 'Type')}</InputLabel>
                    <Select
                      value={filterPaymentType}
                      onChange={(e) => setFilterPaymentType(e.target.value)}
                      label={t('payments.type', 'Type')}
                      sx={{
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(10px)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
                      {Object.entries(paymentTypeConfig).map(([type, config]) => (
                        <MenuItem key={type} value={type}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('payments.statusLabel', 'Status')}</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label={t('payments.statusLabel', 'Status')}
                      sx={{
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(10px)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <MenuItem key={status} value={status}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('payments.method', 'Method')}</InputLabel>
                    <Select
                      value={filterMethod}
                      onChange={(e) => setFilterMethod(e.target.value)}
                      label={t('payments.method', 'Method')}
                      sx={{
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(10px)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      }}
                    >
                      <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
                      {Object.entries(methodConfig).map(([method, config]) => (
                        <MenuItem key={method} value={method}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={1}>
                  <Tooltip title={t('common.refresh', 'Refresh')}>
                    <IconButton
                      onClick={handleRefresh}
                      color="primary"
                      size="large"
                      sx={{
                        borderRadius: 2,
                        background: alpha(theme.palette.primary.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.2),
                          transform: 'rotate(180deg)',
                          borderColor: theme.palette.primary.main,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreatePayment}
                    size="large"
                    sx={{
                      borderRadius: 2,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {t('payments.create', 'Create')}
                  </Button>
                </Grid>
              </Grid>
              
              {/* Enhanced Date Range Filters */}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label={t('payments.dateFrom')}
                      value={dateFrom}
                      onChange={(date) => setDateFrom(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.6),
                              backdropFilter: 'blur(10px)',
                              '& fieldset': {
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                              },
                              '&:hover fieldset': {
                                borderColor: alpha(theme.palette.primary.main, 0.4),
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label={t('payments.dateTo')}
                      value={dateTo}
                      onChange={(date) => setDateTo(date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.6),
                              backdropFilter: 'blur(10px)',
                              '& fieldset': {
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                              },
                              '&:hover fieldset': {
                                borderColor: alpha(theme.palette.primary.main, 0.4),
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  {(dateFrom || dateTo) && (
                    <Grid item xs={12} sm={6} md={2}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setDateFrom(null);
                          setDateTo(null);
                        }}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            background: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        {t('common.clearDates')}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </LocalizationProvider>
            </Box>
          </Paper>
        </Fade>
        
        {/* Enhanced Payment Tabs */}
        <Fade in={true} timeout={1400}>
          <Paper sx={{ 
            p: 0, 
            mb: 4,
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`
              : `linear-gradient(145deg, ${alpha('#fff', 0.9)}, ${alpha('#fff', 0.6)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 32px ${alpha('#000', 0.3)}`
              : `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            overflow: 'hidden',
          }}>
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              background: alpha(theme.palette.primary.main, 0.02),
              px: 3,
              pt: 2,
            }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    borderRadius: 2,
                    mx: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                      background: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: 2,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              >
                <Tab 
                  value="all" 
                  label={
                    <Badge 
                      badgeContent={payments.length} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('common.all', 'All')}
                    </Badge>
                  } 
                />
                <Tab 
                  value="pending" 
                  label={
                    <Badge 
                      badgeContent={payments.filter(p => p.status === 'pending').length} 
                      color="warning"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('payments.status.pending', 'Pending')}
                    </Badge>
                  } 
                />
                <Tab 
                  value="paid" 
                  label={
                    <Badge 
                      badgeContent={payments.filter(p => p.status === 'paid').length} 
                      color="success"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('payments.status.paid', 'Paid')}
                    </Badge>
                  } 
                />
                <Tab 
                  value="failed" 
                  label={
                    <Badge 
                      badgeContent={payments.filter(p => p.status === 'failed').length} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('payments.status.failed', 'Failed')}
                    </Badge>
                  } 
                />
                <Tab 
                  value="refunded" 
                  label={
                    <Badge 
                      badgeContent={payments.filter(p => p.status === 'refunded').length} 
                      color="info"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('payments.status.refunded', 'Refunded')}
                    </Badge>
                  } 
                />
                <Tab 
                  value="late" 
                  label={
                    <Badge 
                      badgeContent={payments.filter(p => {
                        const dueDate = startOfDay(new Date(p.dueDate));
                        const today = startOfDay(new Date());
                        return p.status === 'pending' && isBefore(dueDate, today);
                      }).length} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                        }
                      }}
                    >
                      {t('payments.latePayments', 'Late')}
                    </Badge>
                  } 
                />
              </Tabs>
            </Box>
            
            {/* Results Summary */}
            {searchQuery || filterPaymentType !== 'all' || filterStatus !== 'all' || filterMethod !== 'all' || dateFrom || dateTo ? (
              <Alert 
                severity="info" 
                sx={{ 
                  m: 3,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  '& .MuiAlert-icon': {
                    color: theme.palette.info.main,
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {t('payments.showingResults', 'Showing {{count}} of {{total}} payments', {
                    count: filteredPayments.length,
                    total: payments.length
                  })}
                </Typography>
              </Alert>
            ) : null}
            
            {/* Enhanced Data Grid */}
            <Box sx={{ height: 700, width: '100%', p: 3 }}>
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: 400,
                  gap: 3,
                }}>
                  <CircularProgress 
                    size={60} 
                    sx={{ 
                      color: theme.palette.primary.main,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }} 
                  />
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                  }}>
                    {t('common.loading')}
                  </Typography>
                  <LinearProgress 
                    sx={{ 
                      width: 200,
                      borderRadius: 2,
                      height: 6,
                      background: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        borderRadius: 2,
                      }
                    }} 
                  />
                </Box>
              ) : filteredPayments.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 400,
                  gap: 3,
                }}>
                  <Avatar sx={{ 
                    width: 120, 
                    height: 120, 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}>
                    <AttachMoneyIcon sx={{ 
                      fontSize: 60, 
                      color: alpha(theme.palette.text.secondary, 0.6),
                    }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.text.secondary,
                    textAlign: 'center',
                  }}>
                    {payments.length === 0 
                      ? t('payments.noPayments')
                      : t('payments.noResults')
                    }
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: theme.palette.text.disabled,
                    textAlign: 'center',
                    maxWidth: 400,
                  }}>
                    {payments.length === 0 
                      ? t('payments.getStartedMessage')
                      : t('payments.tryAdjustingFilters')
                    }
                  </Typography>
                  {payments.length === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleCreatePayment}
                      size="large"
                      sx={{
                        mt: 2,
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {t('payments.create')}
                    </Button>
                  )}
                </Box>
              ) : (
                <DataGrid
                  rows={filteredPayments}
                  columns={columns}
                  getRowId={(row) => row.$id}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[10, 25, 50, 100]}
                  rowCount={filteredPayments.length}
                  loading={loading}
                  disableSelectionOnClick
                  disableColumnMenu
                  disableRowSelectionOnClick
                  sx={{
                    border: 'none',
                    borderRadius: 2,
                    '& .MuiDataGrid-main': {
                      borderRadius: 2,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      background: alpha(theme.palette.primary.main, 0.05),
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '& .MuiDataGrid-columnHeader': {
                        '&:focus': {
                          outline: 'none',
                        },
                        '&:focus-within': {
                          outline: 'none',
                        },
                      },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold',
                        color: theme.palette.text.primary,
                      },
                    },
                    '& .MuiDataGrid-row': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.04),
                        transform: 'scale(1.00)',
                        '& .MuiDataGrid-cell': {
                          color: theme.palette.text.primary,
                        },
                      },
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    },
                    '& .MuiDataGrid-cell': {
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                      '&:focus': {
                        outline: 'none',
                      },
                      '&:focus-within': {
                        outline: 'none',
                      },
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      background: alpha(theme.palette.primary.main, 0.02),
                    },
                    '& .MuiDataGrid-selectedRowCount': {
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                    },
                  }}
                  localeText={{
                    noRowsLabel: t('payments.noPayments'),
                  }}
                />
              )}
            </Box>
          </Paper>
        </Fade>

        {/* Payment Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                : `linear-gradient(145deg, ${alpha('#fff', 0.95)}, ${alpha('#fff', 0.8)})`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? `0 24px 48px ${alpha('#000', 0.4)}`
                : `0 24px 48px ${alpha(theme.palette.primary.main, 0.15)}`,
            }
          }}
        >
          <DialogTitle sx={{
            background: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            {dialogMode === 'create' && (
              <>
                <AddIcon sx={{ color: theme.palette.primary.main }} />
                {t('payments.createPayment', 'Create New Payment')}
              </>
            )}
            {dialogMode === 'view' && selectedPayment && (
              <>
                <VisibilityIcon sx={{ color: theme.palette.info.main }} />
                {t('payments.paymentDetails', 'Payment Details')} - {selectedPayment.paymentId}
              </>
            )}
            {dialogMode === 'markPaid' && selectedPayment && (
              <>
                <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                {t('payments.markAsPaid', 'Mark as Paid')} - {selectedPayment.paymentId}
              </>
            )}
            {dialogMode === 'refund' && selectedPayment && (
              <>
                <MoneyOffIcon sx={{ color: theme.palette.error.main }} />
                {t('payments.refund', 'Refund Payment')} - {selectedPayment.paymentId}
              </>
            )}
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            {dialogMode === 'create' && (
              <Grid container spacing={3}>
                {/* Student Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth required error={formErrors.userId}>
                    <InputLabel>{t('payments.student', 'Student')}</InputLabel>
                    <Select
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      label={t('payments.student', 'Student')}
                      disabled={loadingReferences}
                    >
                      {students.map((student) => (
                        <MenuItem key={student.$id} value={student.$id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                              {student.name?.charAt(0) || 'U'}
                            </Avatar>
                            {student.name || student.email || t('common.unknownStudent')}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Payment Type */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('payments.type', 'Payment Type')}</InputLabel>
                    <Select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleInputChange}
                      label={t('payments.type', 'Payment Type')}
                    >
                      {Object.entries(paymentTypeConfig).map(([type, config]) => (
                        <MenuItem key={type} value={type}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('payments.method', 'Payment Method')}</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      label={t('payments.method', 'Payment Method')}
                    >
                      {Object.entries(methodConfig).map(([method, config]) => (
                        <MenuItem key={method} value={method}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Service Order Selection (if service type) */}
                {formData.paymentType === 'service' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={formErrors.serviceOrderId}>
                      <InputLabel>{t('payments.serviceOrder', 'Service Order')}</InputLabel>
                      <Select
                        name="serviceOrderId"
                        value={formData.serviceOrderId}
                        onChange={handleInputChange}
                        label={t('payments.serviceOrder', 'Service Order')}
                        disabled={!formData.userId || loadingStudentDetails}
                      >
                        {getFilteredServiceOrders().map((order) => (
                          <MenuItem 
                            key={order.$id} 
                            value={order.$id}
                            disabled={order.isPaid}
                            sx={{
                              backgroundColor: order.isPaid ? alpha(theme.palette.error.main, 0.1) : 'inherit',
                              '&.Mui-disabled': {
                                opacity: 0.7,
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <Box>
                                {order.description || order.serviceId || order.$id} - {formatCurrency(order.totalAmount || 0)}
                              </Box>
                              {order.isPaid && (
                                <Chip 
                                  label={t('payments.alreadyPaid', 'Already Paid')} 
                                  color="error" 
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {paymentValidation.isOrderPaid && formData.serviceOrderId && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {t('payments.serviceOrderPaidWarning', 'This service order has already been paid. Please select a different order.')}
                      </Alert>
                    )}
                  </Grid>
                )}

                {/* Contract Selection (if contract type) */}
                {formData.paymentType === 'contract' && (
                  <>
                    <Grid item xs={12} sm={8}>
                      <FormControl fullWidth required error={formErrors.contractId}>
                        <InputLabel>{t('payments.contract', 'Contract')}</InputLabel>
                        <Select
                          name="contractId"
                          value={formData.contractId}
                          onChange={handleInputChange}
                          label={t('payments.contract', 'Contract')}
                          disabled={!formData.userId || loadingStudentDetails}
                        >
                          {getFilteredContracts().map((contract) => (
                            <MenuItem key={contract.$id} value={contract.$id}>
                              <Box>
                                {contract.roomNumbers} - {formatCurrency(contract.totalRent || 0)}/month
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: 'block' }}>
                                  ({formatDate(contract.startDate)} - {formatDate(contract.endDate)})
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label={t('payments.paymentMonth', 'Payment Month')}
                          value={formData.paymentMonth}
                          onChange={(date) => handleDateChange('paymentMonth', date)}
                          views={['year', 'month']}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              error: formErrors.paymentMonth,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    
                    {paymentValidation.isContractMonthPaid && formData.contractId && formData.paymentMonth && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          {t('payments.contractMonthPaidWarning', 'Payment for this contract month already exists. Please select a different month.')}
                          {paymentValidation.existingPayments.length > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Existing payments:</strong>
                              {paymentValidation.existingPayments.map((payment, index) => (
                                <span key={payment.$id}>
                                  {index > 0 && ', '}
                                  {payment.paymentId} ({formatCurrency(payment.finalAmount || payment.amount)})
                                </span>
                              ))}
                            </Typography>
                          )}
                        </Alert>
                      </Grid>
                    )}
                  </>
                )}

                {/* Food Order Selection (if food type) */}
                {formData.paymentType === 'food' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={formErrors.foodOrderId}>
                      <InputLabel>{t('payments.foodOrder', 'Food Order')}</InputLabel>
                      <Select
                        name="foodOrderId"
                        value={formData.foodOrderId}
                        onChange={handleInputChange}
                        label={t('payments.foodOrder', 'Food Order')}
                        disabled={!formData.userId || loadingStudentDetails}
                      >
                        {getFilteredFoodOrders().map((order) => (
                          <MenuItem 
                            key={order.$id} 
                            value={order.$id}
                            disabled={order.isPaid}
                            sx={{
                              backgroundColor: order.isPaid ? alpha(theme.palette.error.main, 0.1) : 'inherit',
                              '&.Mui-disabled': {
                                opacity: 0.7,
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <Box>
                                Order #{order.orderNumber || order.orderId} - {formatCurrency(order.totalAmount || 0)}
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: 'block' }}>
                                  ({formatDate(order.orderDate || order.createdAt)})
                                </Typography>
                              </Box>
                              {order.isPaid && (
                                <Chip 
                                  label={t('payments.alreadyPaid', 'Already Paid')} 
                                  color="error" 
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {paymentValidation.isOrderPaid && formData.foodOrderId && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {t('payments.foodOrderPaidWarning', 'This food order has already been paid. Please select a different order.')}
                      </Alert>
                    )}
                  </Grid>
                )}

                {/* Amount */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="amount"
                    label={t('payments.amount', 'Amount')}
                    type="text"
                    value={formData.amount}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={formErrors.amount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">OMR</InputAdornment>,
                    }}
                  />
                </Grid>

                {/* Tax Amount */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="taxAmount"
                    label={t('payments.taxAmount', 'Tax Amount')}
                    type="text"
                    value={formData.taxAmount}
                    onChange={handleInputChange}
                    fullWidth
                    error={formErrors.taxAmount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">OMR</InputAdornment>,
                    }}
                  />
                </Grid>

                {/* Discount Amount */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="discountAmount"
                    label={t('payments.discountAmount', 'Discount Amount')}
                    type="text"
                    value={formData.discountAmount}
                    onChange={handleInputChange}
                    fullWidth
                    error={formErrors.discountAmount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">OMR</InputAdornment>,
                    }}
                  />
                </Grid>

                {/* Final Amount Display */}
                {(formData.amount || formData.taxAmount || formData.discountAmount) && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        {t('payments.finalAmount', 'Final Amount')}: {formatCurrency(
                          (parseFloat(formData.amount) || 0) + 
                          (parseFloat(formData.taxAmount) || 0) - 
                          (parseFloat(formData.discountAmount) || 0)
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Due Date */}
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label={t('payments.dueDate', 'Due Date')}
                      value={formData.dueDate}
                      onChange={(date) => handleDateChange('dueDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: formErrors.dueDate,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Status */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('payments.statusLabel', 'Status')}</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label={t('payments.statusLabel', 'Status')}
                    >
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <MenuItem key={status} value={status}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <config.icon fontSize="small" sx={{ mr: 1, color: theme.palette[config.color]?.main }} />
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label={t('payments.description', 'Description')}
                    value={formData.description}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={formErrors.description}
                    multiline
                    rows={2}
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={12}>
                  <TextField
                    name="notes"
                    label={t('payments.notes', 'Notes')}
                    value={formData.notes}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>

                {/* Enhanced Student Details Preview */}
                {selectedStudentDetails && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.04)})`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2
                    }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ 
                            bgcolor: theme.palette.primary.main,
                            width: 56,
                            height: 56,
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                          }}>
                            {(selectedStudentDetails.name || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                            {selectedStudentDetails.name || t('common.unknownStudent')}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="text.secondary">
                            Student ID: {selectedStudentDetails.$id}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={3}>
                          {/* Basic Information */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                              Contact Information
                            </Typography>
                            <Stack spacing={1}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {selectedStudentDetails.email || t('common.notProvided')}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {selectedStudentDetails.phone || t('common.notProvided')}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Address</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {selectedStudentDetails.address || t('common.notProvided')}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">Join Date</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {selectedStudentDetails.createdAt ? formatDate(selectedStudentDetails.createdAt) : t('common.unknown')}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          
                          {/* Summary Statistics */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                              Account Summary
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Paper sx={{ 
                                  p: 2, 
                                  textAlign: 'center',
                                  background: alpha(theme.palette.success.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                    {selectedStudentDetails.contracts?.length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Contracts
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper sx={{ 
                                  p: 2, 
                                  textAlign: 'center',
                                  background: alpha(theme.palette.warning.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                                    {selectedStudentDetails.serviceOrders?.length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Service Orders
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper sx={{ 
                                  p: 2, 
                                  textAlign: 'center',
                                  background: alpha(theme.palette.info.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                                }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                                    {selectedStudentDetails.foodOrders?.length || 0}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Food Orders
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper sx={{ 
                                  p: 2, 
                                  textAlign: 'center',
                                  background: alpha(theme.palette.secondary.main, 0.1),
                                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                                }}>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                                    {payments.filter(p => p.userId === selectedStudentDetails.$id).length}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Total Payments
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          </Grid>
                          
                          {/* Active Contracts Details */}
                          {selectedStudentDetails.contracts && selectedStudentDetails.contracts.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                                Active Contracts ({selectedStudentDetails.contracts.length})
                              </Typography>
                              <Grid container spacing={2}>
                                {selectedStudentDetails.contracts.map((contract, index) => (
                                  <Grid item xs={12} sm={6} md={4} key={contract.$id}>
                                    <Card sx={{ 
                                      height: '100%',
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                      background: alpha(theme.palette.background.paper, 0.8)
                                    }}>
                                      <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                          <HomeIcon sx={{ fontSize: 16, color: theme.palette.primary.main, mr: 1 }} />
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {contract.roomNumbers || t('contracts.unknownRooms')}
                                          </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                          {formatCurrency(contract.totalRent || 0)}/month
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                          <Chip 
                                            label={contract.status || 'active'}
                                            color={contract.status === 'active' ? 'success' : 'default'}
                                            size="small"
                                          />
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </Grid>
                          )}
                          
                          {/* Recent Payment History */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: theme.palette.primary.main }}>
                              Recent Payment History
                            </Typography>
                            {(() => {
                              const studentPayments = payments
                                .filter(p => p.userId === selectedStudentDetails.$id)
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 5);
                              
                              return studentPayments.length > 0 ? (
                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                  {studentPayments.map((payment) => (
                                    <Paper 
                                      key={payment.$id} 
                                      sx={{ 
                                        p: 2, 
                                        mb: 1, 
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                        '&:last-child': { mb: 0 }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {payment.paymentId}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {payment.description} • {formatDate(payment.createdAt)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {formatCurrency(payment.finalAmount || payment.amount)}
                                          </Typography>
                                          <Chip
                                            label={statusConfig[payment.status]?.label || payment.status}
                                            color={statusConfig[payment.status]?.color || 'default'}
                                            size="small"
                                          />
                                        </Box>
                                      </Box>
                                    </Paper>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                  {t('payments.noPaymentHistory')}
                                </Typography>
                              );
                            })()}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Selected Bill Details */}
                {selectedBillDetails && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.secondary.light, 0.04)})`,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      borderRadius: 2
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
                            Selected Bill Details
                          </Typography>
                        }
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                            {formData.paymentType === 'service' && <BuildIcon />}
                            {formData.paymentType === 'food' && <RestaurantIcon />}
                            {formData.paymentType === 'contract' && <HomeIcon />}
                          </Avatar>
                        }
                      />
                      <CardContent>
                        {formData.paymentType === 'service' && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Service Order Information
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.orderNumber || selectedBillDetails.$id}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Service</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.serviceName || selectedBillDetails.serviceId || t('services.unknownService')}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Description</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.description || t('common.noDescription')}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Order Date</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatDate(selectedBillDetails.orderDate || selectedBillDetails.createdAt)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Financial Details
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Base Amount</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatCurrency(selectedBillDetails.baseAmount || selectedBillDetails.amount || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Tax Amount</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatCurrency(selectedBillDetails.taxAmount || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                    {formatCurrency(selectedBillDetails.totalAmount || selectedBillDetails.amount || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Status</Typography>
                                  <Chip
                                    label={selectedBillDetails.status || 'pending'}
                                    color={selectedBillDetails.status === 'completed' ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </Box>
                              </Stack>
                            </Grid>
                          </Grid>
                        )}
                        
                        {formData.paymentType === 'food' && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Food Order Information
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Order ID</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.orderId || selectedBillDetails.orderNumber || selectedBillDetails.$id}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Room Number</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.roomNumber || t('common.unknown')}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Order Date</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatDate(selectedBillDetails.orderTime || selectedBillDetails.createdAt)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Delivery Notes</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.deliveryNotes || t('orders.noSpecialInstructions')}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Order Summary
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                    {formatCurrency(selectedBillDetails.totalAmount || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Order Status</Typography>
                                  <Chip
                                    label={selectedBillDetails.status || 'pending'}
                                    color={
                                      selectedBillDetails.status === 'delivered' ? 'success' :
                                      selectedBillDetails.status === 'preparing' ? 'info' :
                                      selectedBillDetails.status === 'ready' ? 'warning' : 'default'
                                    }
                                    size="small"
                                  />
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                                  <Chip
                                    label={selectedBillDetails.paymentStatus || 'pending'}
                                    color={selectedBillDetails.paymentStatus === 'paid' ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </Box>
                              </Stack>
                            </Grid>
                          </Grid>
                        )}
                        
                        {formData.paymentType === 'contract' && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Contract Information
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Contract ID</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.contractNumber || selectedBillDetails.$id}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Room(s)</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.roomNumbers || t('contracts.unknownRooms')}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Contract Period</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatDate(selectedBillDetails.startDate)} - {formatDate(selectedBillDetails.endDate)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Contract Type</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {selectedBillDetails.contractType || 'Standard'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                                Monthly Rent Details
                              </Typography>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Monthly Rent</Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                                    {formatCurrency(selectedBillDetails.totalRent || selectedBillDetails.monthlyRent || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Security Deposit</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {formatCurrency(selectedBillDetails.securityDeposit || 0)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Contract Status</Typography>
                                  <Chip
                                    label={selectedBillDetails.status || 'active'}
                                    color={selectedBillDetails.status === 'active' ? 'success' : 'default'}
                                    size="small"
                                  />
                                </Box>
                                {formData.paymentMonth && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Payment Month</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {format(new Date(formData.paymentMonth), 'MMMM yyyy')}
                                    </Typography>
                                  </Box>
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {dialogMode === 'view' && selectedPayment && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.paymentId', 'Payment ID')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {selectedPayment.paymentId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.studentName', 'Student')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.studentName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.type', 'Type')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(() => {
                      const config = paymentTypeConfig[selectedPayment.paymentType];
                      const IconComponent = config?.icon || BuildIcon;
                      return (
                        <Chip
                          icon={<IconComponent fontSize="small" />}
                          label={config?.label || selectedPayment.paymentType}
                          color={config?.color || 'default'}
                          variant="outlined"
                        />
                      );
                    })()}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.statusLabel', 'Status')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(() => {
                      const config = statusConfig[selectedPayment.status];
                      return (
                        <Chip
                          label={config?.label || selectedPayment.status}
                          color={config?.color || 'default'}
                        />
                      );
                    })()}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.amount', 'Amount')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    {formatCurrency(selectedPayment.finalAmount || selectedPayment.amount)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.method', 'Payment Method')}
                  </Typography>
                  <Typography variant="body1">
                    {methodConfig[selectedPayment.paymentMethod]?.label || selectedPayment.paymentMethod}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.dueDate', 'Due Date')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPayment.dueDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.createdAt', 'Created At')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(selectedPayment.createdAt)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('payments.description', 'Description')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.description || '-'}
                  </Typography>
                </Grid>
                
                {selectedPayment.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('payments.notes', 'Notes')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.notes}
                    </Typography>
                  </Grid>
                )}

                {/* Student Details in View Mode */}
                {selectedStudentDetails && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {t('payments.studentDetails', 'Student Details')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Name:</strong> {selectedStudentDetails.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Email:</strong> {selectedStudentDetails.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Contracts:</strong> {selectedStudentDetails.contracts?.length || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Service Orders:</strong> {selectedStudentDetails.serviceOrders?.length || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          <strong>Food Orders:</strong> {selectedStudentDetails.foodOrders?.length || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            )}

            {dialogMode === 'markPaid' && selectedPayment && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {t('payments.markAsPaidConfirm', 'Are you sure you want to mark this payment as paid?')}
                </Alert>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Payment ID:</strong> {selectedPayment.paymentId}<br/>
                  <strong>Amount:</strong> {formatCurrency(selectedPayment.finalAmount || selectedPayment.amount)}<br/>
                  <strong>Student:</strong> {selectedPayment.studentName}
                </Typography>
              </Box>
            )}

            {dialogMode === 'refund' && selectedPayment && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('payments.refundConfirm', 'Are you sure you want to refund this payment?')}
                </Alert>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Payment ID:</strong> {selectedPayment.paymentId}<br/>
                  <strong>Amount:</strong> {formatCurrency(selectedPayment.finalAmount || selectedPayment.amount)}<br/>
                  <strong>Student:</strong> {selectedPayment.studentName}
                </Typography>
                <TextField
                  fullWidth
                  label={t('payments.refundReason', 'Refund Reason')}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  multiline
                  rows={3}
                  required
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.default, 0.5),
          }}>
            <Button 
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            
            {dialogMode === 'create' && (
              <Button
                onClick={handleSubmitPayment}
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }}
              >
                {submitting ? t('common.creating', 'Creating...') : t('payments.create', 'Create Payment')}
              </Button>
            )}
            
            {dialogMode === 'markPaid' && (
              <Button
                onClick={() => handleMarkAsPaid(selectedPayment)}
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                sx={{ borderRadius: 2 }}
              >
                {t('payments.markAsPaid', 'Mark as Paid')}
              </Button>
            )}
            
            {dialogMode === 'refund' && (
              <Button
                onClick={() => handleRefund(selectedPayment, refundReason)}
                variant="contained"
                color="error"
                disabled={!refundReason.trim()}
                startIcon={<MoneyOffIcon />}
                sx={{ borderRadius: 2 }}
              >
                {t('payments.processRefund', 'Process Refund')}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Fade>
  );
};

export default Payments; 