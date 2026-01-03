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
  Alert,
  Avatar,
  Divider,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  CardHeader,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  EventNote as EventNoteIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  Add as AddIcon,
  MeetingRoom as MeetingRoomIcon,
  ContactMail as ContactMailIcon,
  TravelExplore as TravelExploreIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { useAuth } from '../contexts/AuthContext';
import { alpha } from '@mui/material/styles';

const CheckoutRequests = () => {
  const { databases, databaseId, collections, ID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  // State for checkout request data
  const [checkoutRequests, setCheckoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  
  // State for students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'approve', 'reject', 'create'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('all');
  
  // State for form data
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notesError, setNotesError] = useState(false);
  const [reasonError, setReasonError] = useState(false);
  
  // State for create form
  const [formData, setFormData] = useState({
    userId: '',
    startDate: null,
    endDate: null,
    reason: '',
    accompaniedBy: '',
    status: 'pending',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // State for errors
  const [error, setError] = useState(null);
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Generate checkout request ID
  const generateCheckoutRequestId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `CR${year}${month}${day}${timestamp}`;
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await databases.listDocuments(
        databaseId,
        collections.users,
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

  // Fetch student details for create form
  const fetchStudentDetailsForCreate = async (userId) => {
    try {
      setLoadingStudentDetails(true);
      
      const userResponse = await databases.getDocument(
        databaseId,
        collections.users,
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
      
    } catch (error) {
      console.error('Error fetching student details:', error);
      setSelectedStudentDetails(null);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  // Handle student selection for create form
  const handleStudentSelect = (studentId) => {
    setFormData({ 
      ...formData, 
      userId: studentId 
    });
    if (studentId) {
      fetchStudentDetailsForCreate(studentId);
    } else {
      setSelectedStudentDetails(null);
    }
    // Clear related form errors
    if (formErrors.userId) {
      setFormErrors({ ...formErrors, userId: false });
    }
  };

  // Handle input change for create form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userId') {
      handleStudentSelect(value);
    } else {
      setFormData({ ...formData, [name]: value });
      // Clear related form errors
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: false });
      }
    }
  };

  // Handle date change
  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear related form errors
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: false });
    }
  };

  // Validate create form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.userId) {
      errors.userId = true;
    }
    
    if (!formData.startDate) {
      errors.startDate = true;
    }
    
    if (!formData.endDate) {
      errors.endDate = true;
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = true;
      errors.dateRange = true;
    }
    
    if (!formData.reason.trim()) {
      errors.reason = true;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create checkout request
  const handleCreateCheckout = async () => {
    if (!validateForm()) {
      showError(t('checkoutRequests.validationError'));
      return;
    }

    try {
      setSubmitting(true);
      
      const checkoutData = {
        requestId: generateCheckoutRequestId(),
        userId: formData.userId,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        reason: formData.reason.trim(),
        accompaniedBy: formData.accompaniedBy.trim() || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databases.createDocument(
        databaseId,
        collections.checkoutRequests,
        ID.unique(),
        checkoutData
      );

      showSuccess(t('checkoutRequests.requestCreated'));
      setOpenDialog(false);
      fetchCheckoutRequests();
      
      // Reset form
      setFormData({
        userId: '',
        startDate: null,
        endDate: null,
        reason: '',
        accompaniedBy: '',
        status: 'pending',
      });
      setSelectedStudentDetails(null);
      setFormErrors({});
      
    } catch (error) {
      console.error('Error creating checkout request:', error);
      showError(t('checkoutRequests.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-complete expired approved checkout requests
  const autoCompleteExpiredRequests = async () => {
    try {
      const now = new Date();
      
      // Fetch all approved requests
      const approvedRequestsResponse = await databases.listDocuments(
        databaseId,
        collections.checkoutRequests,
        [Query.equal('status', 'approved')]
      );
      
      // Filter requests that have passed their end date
      const expiredRequests = approvedRequestsResponse.documents.filter(request => {
        const endDate = new Date(request.endDate);
        return endDate < now;
      });
      
      // Update expired requests to completed status
      if (expiredRequests.length > 0) {
        console.log(`Auto-completing ${expiredRequests.length} expired checkout requests`);
        
        const updatePromises = expiredRequests.map(request => 
          databases.updateDocument(
            databaseId,
            collections.checkoutRequests,
            request.$id,
            {
              status: 'completed',
              actionNotes: 'Automatically completed - checkout period ended',
              actionBy: 'System',
              actionAt: now.toISOString(),
              updatedAt: now.toISOString()
            }
          )
        );
        
        await Promise.all(updatePromises);
        console.log(`Successfully auto-completed ${expiredRequests.length} expired requests`);
        
        // Show notification if requests were auto-completed
        if (expiredRequests.length === 1) {
          showSuccess(t('checkoutRequests.autoCompletedSingle'));
        } else {
          showSuccess(t('checkoutRequests.autoCompletedMultiple', { count: expiredRequests.length }));
        }
      }
      
    } catch (error) {
      console.error('Error auto-completing expired requests:', error);
    }
  };

  // Fetch checkout requests from the database
  const fetchCheckoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Auto-complete expired requests before fetching
      await autoCompleteExpiredRequests();
      
      // Prepare filters
      const filters = [];
      
      if (searchQuery) {
        filters.push(Query.search('reason', searchQuery));
      }
      
      if (filterStatus !== 'all') {
        filters.push(Query.equal('status', filterStatus));
      }
      
      // Add filters based on the current tab
      if (currentTab !== 'all') {
        filters.push(Query.equal('status', currentTab));
      }
      
      // Fetch checkout requests
      const response = await databases.listDocuments(
        databaseId,
        collections.checkoutRequests,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        'createdAt', // Sort by creation date
        'DESC' // Most recent first
      );
      
      // Get userIds for fetching user details
      const userIds = [...new Set(response.documents.map(req => req.userId))];
      
      // Fetch user details if we have userIds
      let userMap = {};
      if (userIds.length > 0) {
        try {
          // Fetch user details individually for each userId
          const userPromises = userIds.map(async (userId) => {
            try {
              const user = await databases.getDocument(
                databaseId,
                collections.users,
                userId
              );
              return user;
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              return null;
            }
          });
          
          const users = await Promise.all(userPromises);
          
          // Create a map of userId -> user details
          users.forEach(user => {
            if (user) {
              userMap[user.$id] = user;
            }
          });
        } catch (userError) {
          console.error('Error fetching user details:', userError);
        }
      }
      
      // Combine checkout request data with user data and ensure proper field handling
      const checkoutRequestsWithUsers = response.documents.map(req => {
        // Get the user details
        const user = userMap[req.userId] || {};
        
        // Handle potential missing fields with defaults
        return {
          ...req,
          studentName: user.name || user.firstName || 'Unknown Student',
          studentEmail: user.email || '',
          studentPhone: user.phone || '',
          // Ensure all required fields exist even if missing in the database
          startDate: req.startDate || new Date().toISOString(),
          endDate: req.endDate || new Date().toISOString(),
          reason: req.reason || '',
          accompaniedBy: req.accompaniedBy || '',
          status: req.status || 'pending'
        };
      });
      
      setCheckoutRequests(checkoutRequestsWithUsers);
      setTotalRequests(response.total);
    } catch (err) {
      console.error('Error fetching checkout requests:', err);
      setError('Error fetching checkout requests. Please try again.');
      showError(t('checkoutRequests.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchCheckoutRequests();
    fetchStudents();
  }, [paginationModel, currentTab, filterStatus]);

  // Periodic auto-completion check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      autoCompleteExpiredRequests().then(() => {
        // Silently refresh the data if we're on the current page
        if (!loading) {
          fetchCheckoutRequests();
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading]);
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCheckoutRequests();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Calculate days between two dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Date calculation error:', error);
      return 0;
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Fetch student details
  const fetchStudentDetails = async (userId) => {
    try {
      if (!userId) return null;
      
      const response = await databases.getDocument(
        databaseId,
        collections.users,
        userId
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching student details:', error);
      return null;
    }
  };
  
  // Handle dialog open for view
  const handleViewRequest = async (request) => {
    setSelectedRequest(request);
    setDialogMode('view');
    setOpenDialog(true);
    
    // Fetch student details
    const student = await fetchStudentDetails(request.userId);
    setStudentDetails(student);
  };
  
  // Handle dialog open for approval
  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setDialogMode('approve');
    setApprovalNotes('');
    setNotesError(false);
    setOpenDialog(true);
  };
  
  // Handle dialog open for rejection
  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setDialogMode('reject');
    setRejectionReason('');
    setReasonError(false);
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setStudentDetails(null);
    setSelectedStudentDetails(null);
    setFormErrors({});
    setApprovalNotes('');
    setRejectionReason('');
    setNotesError(false);
    setReasonError(false);
  };
  
  // Handle approve checkout request
  const handleApproveCheckout = async () => {
    try {
      if (!selectedRequest) return;
      
      // Optional validation for approval notes
      // Uncomment if you want to make notes required
      // if (!approvalNotes.trim()) {
      //   setNotesError(true);
      //   return;
      // }
      
      setLoading(true);
      
      // Prepare approval data
      const approvalData = {
        status: 'approved',
        actionNotes: approvalNotes,
        actionBy: currentUser ? currentUser.name || currentUser.$id : 'Admin User',
        actionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update the checkout request
      await databases.updateDocument(
        databaseId,
        collections.checkoutRequests,
        selectedRequest.$id,
        approvalData
      );
      
      showSuccess(t('checkoutRequests.requestApproved'));
      handleCloseDialog();
      fetchCheckoutRequests();
    } catch (error) {
      console.error('Error approving checkout request:', error);
      showError(t('checkoutRequests.approveError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reject checkout request
  const handleRejectCheckout = async () => {
    try {
      if (!selectedRequest) return;
      
      // Validate rejection reason
      if (!rejectionReason.trim()) {
        setReasonError(true);
        showError(t('checkoutRequests.reasonRequired'));
        return;
      }
      
      setLoading(true);
      
      // Prepare rejection data
      const rejectionData = {
        status: 'rejected',
        actionNotes: rejectionReason,
        actionBy: currentUser ? currentUser.name || currentUser.$id : 'Admin User',
        actionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update the checkout request
      await databases.updateDocument(
        databaseId,
        collections.checkoutRequests,
        selectedRequest.$id,
        rejectionData
      );
      
      showSuccess(t('checkoutRequests.requestRejected'));
      handleCloseDialog();
      fetchCheckoutRequests();
    } catch (error) {
      console.error('Error rejecting checkout request:', error);
      showError(t('checkoutRequests.rejectError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle marking a request as completed (student returned)
  const handleMarkCompleted = async (request) => {
    try {
      setLoading(true);
      
      // Prepare completion data
      const completionData = {
        status: 'completed',
        actionNotes: 'Marked as completed by admin',
        actionBy: currentUser ? currentUser.name || currentUser.$id : 'Admin User',
        actionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update the checkout request
      await databases.updateDocument(
        databaseId,
        collections.checkoutRequests,
        request.$id,
        completionData
      );
      
      showSuccess(t('checkoutRequests.requestCompleted'));
      fetchCheckoutRequests();
    } catch (error) {
      console.error('Error marking checkout request as completed:', error);
      showError(t('checkoutRequests.completeError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to change status from one state to another
  const handleChangeStatus = async (request, newStatus) => {
    try {
      setLoading(true);
      
      let actionNotes = '';
      let successMessage = '';
      
      if (newStatus === 'approved') {
        actionNotes = 'Status changed to approved by admin';
        successMessage = t('checkoutRequests.requestApproved');
      } else if (newStatus === 'rejected') {
        actionNotes = 'Status changed to rejected by admin';
        successMessage = t('checkoutRequests.requestRejected');
      } else if (newStatus === 'pending') {
        actionNotes = 'Status changed back to pending by admin';
        successMessage = t('checkoutRequests.requestPending');
      } else if (newStatus === 'completed') {
        actionNotes = 'Status changed to completed by admin';
        successMessage = t('checkoutRequests.requestCompleted');
      }
      
      // Prepare status change data
      const statusChangeData = {
        status: newStatus,
        actionNotes: actionNotes,
        actionBy: currentUser ? currentUser.name || currentUser.$id : 'Admin User',
        actionAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update the checkout request
      await databases.updateDocument(
        databaseId,
        collections.checkoutRequests,
        request.$id,
        statusChangeData
      );
      
      showSuccess(successMessage);
      fetchCheckoutRequests();
    } catch (error) {
      console.error('Error changing checkout request status:', error);
      showError(t('checkoutRequests.statusChangeError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle email student
  const handleEmailStudent = (request) => {
    try {
      // In a real implementation, this would call an API to send an email
      // For now, we'll simulate this with a success message
      
      if (!request.studentEmail) {
        showError(t('checkoutRequests.noEmailAvailable'));
        return;
      }
      
      // Example of what would happen in a real implementation:
      // 1. Call a serverless function or backend API to send email
      // 2. The email would contain details about the checkout request
      
      // For demo purposes, simulate a successful email sending
      const emailData = {
        to: request.studentEmail,
        subject: t('checkoutRequests.emailSubject', { id: request.$id }),
        body: t('checkoutRequests.emailBody', { 
          name: request.studentName,
          status: t(`checkoutRequests.status.${request.status}`),
          startDate: formatDate(request.startDate),
          endDate: formatDate(request.endDate)
        })
      };
      
      console.log('Email would be sent with data:', emailData);
      
      // Show success message
      showSuccess(t('checkoutRequests.emailSent'));
      
      // In a real implementation, you would:
      // 1. Set a loading state while sending the email
      // 2. Handle success and error responses from the API
      // 3. Update the UI accordingly
    } catch (error) {
      console.error('Error sending email:', error);
      showError(t('checkoutRequests.emailError'));
    }
  };
  
  // Data grid columns
  const columns = [
    {
      field: '$id',
      headerName: t('checkoutRequests.requestId'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: 'primary.main',
            fontSize: '0.75rem'
          }}>
            <EventNoteIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium" color="primary.main">
            {params.value.slice(-8)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'studentName',
      headerName: t('checkoutRequests.studentName'),
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
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'startDate',
      headerName: t('checkoutRequests.startDate'),
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (params) => formatDate(params.value),
      renderCell: (params) => (
        <Chip
          label={formatDate(params.value)}
          size="small"
          icon={<CalendarIcon />}
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
      field: 'endDate',
      headerName: t('checkoutRequests.endDate'),
      flex: 0.8,
      minWidth: 120,
      valueFormatter: (params) => formatDate(params.value),
      renderCell: (params) => {
        const now = new Date();
        const endDate = new Date(params.value);
        const isExpired = endDate < now;
        const isExpiringSoon = !isExpired && endDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000); // Within 24 hours
        
        let chipColor = 'warning';
        let chipIcon = <CalendarIcon />;
        
        if (isExpired && params.row.status === 'approved') {
          chipColor = 'error';
          chipIcon = <AccessTimeIcon />;
        } else if (isExpiringSoon && params.row.status === 'approved') {
          chipColor = 'warning';
          chipIcon = <AccessTimeIcon />;
        } else if (params.row.status === 'completed') {
          chipColor = 'success';
          chipIcon = <CheckCircleIcon />;
        }
        
        return (
          <Chip
            label={formatDate(params.value)}
            size="small"
            icon={chipIcon}
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette[chipColor].main, 0.2)
                : alpha(theme.palette[chipColor].light, 0.3),
              color: theme.palette[chipColor].main,
              fontWeight: 'medium'
            }}
          />
        );
      },
    },
    {
      field: 'duration',
      headerName: t('checkoutRequests.duration'),
      flex: 0.5,
      minWidth: 80,
      valueGetter: (params) => calculateDays(params.row.startDate, params.row.endDate),
      renderCell: (params) => (
        <Chip
          label={`${params.value} ${params.value === 1 ? t('checkoutRequests.day') : t('checkoutRequests.days')}`}
          size="small"
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.success.main, 0.2)
              : alpha(theme.palette.success.light, 0.3),
            color: theme.palette.success.main,
            fontWeight: 'bold'
          }}
        />
      ),
    },
    {
      field: 'reason',
      headerName: t('checkoutRequests.reason'),
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: 'info.main',
            fontSize: '0.65rem'
          }}>
            <CommentIcon fontSize="small" />
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
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: t('checkoutRequests.statusLabel'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => {
        const statusColors = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error',
          completed: 'info'
        };
        
        const statusIcons = {
          pending: <HourglassEmptyIcon />,
          approved: <CheckCircleIcon />,
          rejected: <CancelIcon />,
          completed: <CheckIcon />
        };
        
        const statusTranslation = {
          pending: t('checkoutRequests.pendingStatus'),
          approved: t('checkoutRequests.approvedStatus'),
          rejected: t('checkoutRequests.rejectedStatus'),
          completed: t('checkoutRequests.completedStatus')
        };
        
        return (
          <Chip
            label={statusTranslation[params.value] || params.value}
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
              onClick={() => handleViewRequest(params.row)}
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
            <>
              <Tooltip title={t('checkoutRequests.approveAction')}>
                <IconButton
                  size="small"
                  onClick={() => handleApproveRequest(params.row)}
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
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={t('checkoutRequests.rejectAction')}>
                <IconButton
                  size="small"
                  onClick={() => handleRejectRequest(params.row)}
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
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {params.row.status === 'approved' && (
            <Tooltip title={t('checkoutRequests.completeAction')}>
              <IconButton
                size="small"
                onClick={() => handleMarkCompleted(params.row)}
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
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={t('common.email')}>
            <IconButton
              size="small"
              onClick={() => handleEmailStudent(params.row)}
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.secondary.main, 0.2)
                  : alpha(theme.palette.secondary.light, 0.3),
                color: theme.palette.secondary.main,
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.secondary.main, 0.3)
                    : alpha(theme.palette.secondary.light, 0.5),
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];
  
  // Calculate stats
  const stats = {
    total: totalRequests,
    pending: checkoutRequests.filter(request => request.status === 'pending').length,
    approved: checkoutRequests.filter(request => request.status === 'approved').length,
    rejected: checkoutRequests.filter(request => request.status === 'rejected').length,
  };
  
  return (
    <>
      <PageHeader
        title={t('checkoutRequests.title')}
        actionLabel={t('checkoutRequests.create')}
        onAction={() => {
          setFormData({
            userId: '',
            startDate: null,
            endDate: null,
            reason: '',
            accompaniedBy: '',
            status: 'pending',
          });
          setSelectedStudentDetails(null);
          setFormErrors({});
          setDialogMode('create');
          setOpenDialog(true);
        }}
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
                      {t('checkoutRequests.totalRequests')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <EventNoteIcon />
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
                      {t('checkoutRequests.pendingStatus')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <AccessTimeIcon />
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
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('checkoutRequests.approvedStatus')}
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
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
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
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('checkoutRequests.rejectedStatus')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 56, 
                    height: 56,
                    color: 'inherit'
                  }}>
                    <CloseIcon />
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
              {t('checkoutRequests.list') || 'Checkout Requests List'}
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
                    {t('checkoutRequests.statusLabel')}
                  </InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label={t('checkoutRequests.statusLabel')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    <MenuItem value="pending">{t('checkoutRequests.pendingStatus')}</MenuItem>
                    <MenuItem value="approved">{t('checkoutRequests.approvedStatus')}</MenuItem>
                    <MenuItem value="rejected">{t('checkoutRequests.rejectedStatus')}</MenuItem>
                    <MenuItem value="completed">{t('checkoutRequests.completedStatus')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={() => fetchCheckoutRequests()}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: theme.palette.primary.contrastText
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={t('checkoutRequests.checkExpiredTooltip')}>
                    <IconButton
                      onClick={async () => {
                        setLoading(true);
                        await autoCompleteExpiredRequests();
                        await fetchCheckoutRequests();
                        setLoading(false);
                      }}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: theme.palette.primary.contrastText
                      }}
                    >
                      <ScheduleIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFormData({
                        userId: '',
                        startDate: null,
                        endDate: null,
                        reason: '',
                        accompaniedBy: '',
                        status: 'pending',
                      });
                      setSelectedStudentDetails(null);
                      setFormErrors({});
                      setDialogMode('create');
                      setOpenDialog(true);
                    }}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    {t('checkoutRequests.create')}
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
                    <EventNoteIcon fontSize="small" />
                    {t('common.all')}
                    <Badge badgeContent={stats.total} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                value="pending" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" />
                    {t('checkoutRequests.pendingStatus')}
                    <Badge badgeContent={stats.pending} color="warning" />
                  </Box>
                } 
              />
              <Tab 
                value="approved" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    {t('checkoutRequests.approvedStatus')}
                    <Badge badgeContent={stats.approved} color="success" />
                  </Box>
                } 
              />
              <Tab 
                value="rejected" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloseIcon fontSize="small" />
                    {t('checkoutRequests.rejectedStatus')}
                    <Badge badgeContent={stats.rejected} color="error" />
                  </Box>
                } 
              />
              <Tab 
                value="completed" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon fontSize="small" />
                    {t('checkoutRequests.completedStatus')}
                    <Badge badgeContent={checkoutRequests.filter(r => r.status === 'completed').length} color="info" />
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

          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Enhanced Data Grid */}
          <Box sx={{ height: 600, width: '100%', p: 2 }}>
            <DataGrid
              rows={checkoutRequests}
              columns={columns}
              getRowId={(row) => row.$id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              rowCount={totalRequests}
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
                    <TravelExploreIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
      
      {/* Enhanced Dialogs */}
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
        {dialogMode === 'create' && (
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
                  <AddIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                    {t('checkoutRequests.createTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {t('checkoutRequests.createSubtitle')}
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
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Student Selection */}
                    <Grid item xs={12}>
                      <FormControl fullWidth required error={formErrors.userId}>
                        <InputLabel>{t('checkoutRequests.selectStudent')}</InputLabel>
                        <Select
                          name="userId"
                          value={formData.userId}
                          onChange={handleInputChange}
                          label={t('checkoutRequests.selectStudent')}
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
                        {formErrors.userId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {t('checkoutRequests.studentRequired')}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    {/* Student Details Card */}
                    {loadingStudentDetails && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress />
                        </Box>
                      </Grid>
                    )}
                    
                    {selectedStudentDetails && (
                      <Grid item xs={12}>
                        <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ bgcolor: 'primary.dark' }}>
                                {(selectedStudentDetails.name || selectedStudentDetails.firstName || 'U').charAt(0).toUpperCase()}
                              </Avatar>
                              {t('students.studentInformation')}
                            </Typography>
                            
                            <Grid container spacing={2}>
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
                              
                              <Grid item xs={12} sm={6} md={4}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                    {t('students.email')}
                                  </Typography>
                                  <Tooltip 
                                    title={selectedStudentDetails.email || t('checkoutRequests.noEmail')} 
                                    placement="top"
                                    arrow
                                  >
                                    <Typography 
                                      variant="body2" 
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%',
                                        cursor: selectedStudentDetails.email ? 'help' : 'default'
                                      }}
                                    >
                                      {selectedStudentDetails.email || t('checkoutRequests.noEmail')}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={6} md={2}>
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
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {/* Room Information Card */}
                    {selectedStudentDetails && selectedStudentDetails.rooms && selectedStudentDetails.rooms.length > 0 && (
                      <Grid item xs={12}>
                        <Card sx={{ mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MeetingRoomIcon />
                              {t('rooms.assignedRooms')} ({selectedStudentDetails.rooms.length})
                            </Typography>
                            
                            <Grid container spacing={2}>
                              {selectedStudentDetails.rooms.map((room, index) => (
                                <Grid item xs={12} sm={6} md={4} key={room.$id}>
                                  <Card sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
                                    <CardContent sx={{ p: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main', fontSize: '0.75rem' }}>
                                          {room.roomNumber}
                                        </Avatar>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                          Room {room.roomNumber}
                                        </Typography>
                                      </Box>
                                      
                                      <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">
                                            Building
                                          </Typography>
                                          <Typography variant="body2" fontWeight="bold">
                                            {room.building || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">
                                            Floor
                                          </Typography>
                                          <Typography variant="body2" fontWeight="bold">
                                            {room.floor || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">
                                            Type
                                          </Typography>
                                          <Typography variant="body2">
                                            {t(`rooms.types.${room.type}`) || room.type || 'N/A'}
                                          </Typography>
                                        </Grid>
                                        
                                        <Grid item xs={6}>
                                          <Typography variant="caption" color="text.secondary">
                                            Status
                                          </Typography>
                                          <Chip
                                            label={t(`rooms.status.${room.status}`) || room.status}
                                            color={room.status === 'available' ? 'success' : 
                                                   room.status === 'occupied' ? 'warning' : 'error'}
                                            size="small"
                                          />
                                        </Grid>
                                      </Grid>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {/* Date Selection */}
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label={t('checkoutRequests.startDate')}
                        value={formData.startDate}
                        onChange={(value) => handleDateChange('startDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: formErrors.startDate,
                            helperText: formErrors.startDate ? t('checkoutRequests.startDateRequired') : '',
                          },
                        }}
                        minDate={new Date()}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label={t('checkoutRequests.endDate')}
                        value={formData.endDate}
                        onChange={(value) => handleDateChange('endDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: formErrors.endDate || formErrors.dateRange,
                            helperText: formErrors.endDate ? 
                              (formErrors.dateRange ? t('checkoutRequests.invalidDateRange') : t('checkoutRequests.endDateRequired')) : '',
                          },
                        }}
                        minDate={formData.startDate || new Date()}
                      />
                    </Grid>
                    
                    {/* Duration Display */}
                    {formData.startDate && formData.endDate && formData.startDate < formData.endDate && (
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                          <CardContent sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon fontSize="small" />
                              <strong>{t('checkoutRequests.duration')}:</strong> 
                              {calculateDays(formData.startDate, formData.endDate)} 
                              {calculateDays(formData.startDate, formData.endDate) === 1 ? 
                                ` ${t('checkoutRequests.day')}` : 
                                ` ${t('checkoutRequests.days')}`}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {/* Reason */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('checkoutRequests.reason')}
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        required
                        error={formErrors.reason}
                        helperText={formErrors.reason ? t('checkoutRequests.reasonRequired') : t('checkoutRequests.reasonHelperText')}
                        placeholder={t('checkoutRequests.reasonPlaceholder')}
                      />
                    </Grid>
                    
                    {/* Accompanied By */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('checkoutRequests.accompaniedBy')}
                        name="accompaniedBy"
                        value={formData.accompaniedBy}
                        onChange={handleInputChange}
                        placeholder={t('checkoutRequests.accompaniedByPlaceholder')}
                        helperText={t('checkoutRequests.accompaniedByHelperText')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ContactMailIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    {/* Summary Card */}
                    {formData.userId && formData.startDate && formData.endDate && formData.reason && (
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventNoteIcon />
                              {t('checkoutRequests.requestSummary')}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                  {t('checkoutRequests.student')}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {selectedStudentDetails?.name || 
                                   `${selectedStudentDetails?.firstName || ''} ${selectedStudentDetails?.lastName || ''}`.trim() ||
                                   'Selected Student'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                  {t('checkoutRequests.duration')}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {calculateDays(formData.startDate, formData.endDate)} 
                                  {calculateDays(formData.startDate, formData.endDate) === 1 ? 
                                    ` ${t('checkoutRequests.day')}` : 
                                    ` ${t('checkoutRequests.days')}`}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                  {t('checkoutRequests.reason')}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {formData.reason.length > 100 ? 
                                    `${formData.reason.substring(0, 100)}...` : 
                                    formData.reason}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </LocalizationProvider>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                <Button 
                  variant="contained" 
                  onClick={handleCreateCheckout}
                  disabled={submitting || !formData.userId || !formData.startDate || !formData.endDate || !formData.reason}
                  startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
                >
                  {submitting ? t('checkoutRequests.creating') : t('checkoutRequests.createRequest')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        )}

        {dialogMode === 'view' && selectedRequest && (
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
                    {t('checkoutRequests.viewRequest')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    ID: {selectedRequest.$id.slice(-8)}
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
                  {/* Request ID as the first and most prominent item */}
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
                            {t('checkoutRequests.requestId')}
                          </Typography>
                          <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                            {selectedRequest.$id.slice(-8)}
                          </Typography>
                        </Box>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          width: 56, 
                          height: 56,
                          color: 'inherit'
                        }}>
                          <TravelExploreIcon />
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
                  
                  {/* Student Information Card */}
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
                        title={t('checkoutRequests.studentInfo')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <PersonIcon />
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
                                {t('checkoutRequests.studentName')}
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {selectedRequest.studentName}
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
                                {t('students.email')}
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {selectedRequest.studentEmail || t('checkoutRequests.noEmail')}
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
                                {t('students.phone')}
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" color="text.primary">
                                {selectedRequest.studentPhone || t('checkoutRequests.noPhone')}
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
                                {t('checkoutRequests.statusLabel')}
                              </Typography>
                              <Chip
                                label={
                                  selectedRequest.status === 'pending' ? t('checkoutRequests.pendingStatus') :
                                  selectedRequest.status === 'approved' ? t('checkoutRequests.approvedStatus') : 
                                  selectedRequest.status === 'rejected' ? t('checkoutRequests.rejectedStatus') :
                                  selectedRequest.status === 'completed' ? t('checkoutRequests.completedStatus') :
                                  selectedRequest.status
                                }
                                color={
                                  selectedRequest.status === 'pending' ? 'warning' :
                                  selectedRequest.status === 'approved' ? 'success' : 
                                  selectedRequest.status === 'rejected' ? 'error' :
                                  selectedRequest.status === 'completed' ? 'info' :
                                  'default'
                                }
                                size="small"
                                variant="filled"
                                sx={{ borderRadius: 2, fontWeight: 'medium' }}
                              />
                            </Card>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Request Details Card */}
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
                        title={t('checkoutRequests.requestDetails')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <CalendarIcon />
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
                          {(() => {
                            const now = new Date();
                            const endDate = new Date(selectedRequest.endDate);
                            const isExpired = endDate < now;
                            const isExpiringSoon = !isExpired && endDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
                            
                            let expirationStatus = '';
                            if (selectedRequest.status === 'approved') {
                              if (isExpired) {
                                expirationStatus = t('checkoutRequests.expired');
                              } else if (isExpiringSoon) {
                                expirationStatus = t('checkoutRequests.expiringSoon');
                              } else {
                                expirationStatus = t('checkoutRequests.active');
                              }
                            } else {
                              expirationStatus = selectedRequest.status;
                            }

                            return [
                              { label: t('checkoutRequests.startDate'), value: formatDate(selectedRequest.startDate) },
                              { label: t('checkoutRequests.endDate'), value: formatDate(selectedRequest.endDate) },
                              { label: t('checkoutRequests.duration'), value: `${calculateDays(selectedRequest.startDate, selectedRequest.endDate)} ${calculateDays(selectedRequest.startDate, selectedRequest.endDate) === 1 ? t('checkoutRequests.day') : t('checkoutRequests.days')}` },
                              { label: t('checkoutRequests.expirationStatus'), value: expirationStatus, isStatus: true, expired: isExpired, expiringSoon: isExpiringSoon },
                              { label: t('common.createdAt'), value: new Date(selectedRequest.createdAt).toLocaleString() },
                              { label: t('common.updatedAt'), value: new Date(selectedRequest.updatedAt).toLocaleString() }
                            ];
                          })().map((item, index) => (
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
                                {item.isStatus ? (
                                  <Chip
                                    label={item.value}
                                    color={
                                      item.expired ? 'error' :
                                      item.expiringSoon ? 'warning' :
                                      'success'
                                    }
                                    size="small"
                                    variant="filled"
                                    sx={{ borderRadius: 2, fontWeight: 'medium' }}
                                  />
                                ) : (
                                  <Typography variant="body1" fontWeight="medium" color="text.primary">
                                    {item.value}
                                  </Typography>
                                )}
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Reason Card */}
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
                        title={t('checkoutRequests.reason')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <CommentIcon />
                          </Avatar>
                        }
                        sx={{ 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? theme.palette.warning.dark 
                            : theme.palette.warning.light,
                          color: theme.palette.warning.contrastText,
                          '& .MuiCardHeader-title': {
                            fontSize: '1rem',
                            fontWeight: 'medium',
                            color: 'inherit'
                          }
                        }}
                      />
                      <CardContent>
                        <Typography variant="body1" color="text.primary">
                          {selectedRequest.reason}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Accompanied By Card */}
                  {selectedRequest.accompaniedBy && (
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
                          title={t('checkoutRequests.accompaniedBy')}
                          avatar={
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                              <ContactMailIcon />
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
                          <Typography variant="body1" color="text.primary">
                            {selectedRequest.accompaniedBy}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {/* Action Information Card */}
                  {selectedRequest.status !== 'pending' && selectedRequest.actionNotes && (
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
                          title={
                            selectedRequest.status === 'approved' 
                              ? t('checkoutRequests.approvalNotes')
                              : selectedRequest.status === 'rejected' 
                              ? t('checkoutRequests.rejectionReason')
                              : t('checkoutRequests.actionNotes')
                          }
                          avatar={
                            <Avatar sx={{ 
                              bgcolor: selectedRequest.status === 'approved' ? 'success.main' :
                                       selectedRequest.status === 'rejected' ? 'error.main' : 'info.main'
                            }}>
                              <CommentIcon />
                            </Avatar>
                          }
                          sx={{ 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? (selectedRequest.status === 'approved' ? theme.palette.success.dark :
                                 selectedRequest.status === 'rejected' ? theme.palette.error.dark : 
                                 theme.palette.info.dark)
                              : (selectedRequest.status === 'approved' ? theme.palette.success.light :
                                 selectedRequest.status === 'rejected' ? theme.palette.error.light : 
                                 theme.palette.info.light),
                            color: selectedRequest.status === 'approved' ? theme.palette.success.contrastText :
                                   selectedRequest.status === 'rejected' ? theme.palette.error.contrastText :
                                   theme.palette.info.contrastText,
                            '& .MuiCardHeader-title': {
                              fontSize: '1rem',
                              fontWeight: 'medium',
                              color: 'inherit'
                            }
                          }}
                        />
                        <CardContent>
                          <Typography variant="body1" color="text.primary" paragraph>
                            {selectedRequest.actionNotes}
                          </Typography>
                          {selectedRequest.actionBy && (
                            <Typography variant="body2" color="text.secondary">
                              {t('checkoutRequests.actionBy')}: {selectedRequest.actionBy}
                            </Typography>
                          )}
                          {selectedRequest.actionAt && (
                            <Typography variant="body2" color="text.secondary">
                              {t('checkoutRequests.actionAt')}: {new Date(selectedRequest.actionAt).toLocaleString()}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  {/* Status Change Section */}
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
                        title={t('checkoutRequests.changeStatus')}
                        avatar={
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <ScheduleIcon />
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.primary">
                            {t('checkoutRequests.currentStatus')}:
                          </Typography>
                          <Chip 
                            label={
                              selectedRequest.status === 'pending' ? t('checkoutRequests.pendingStatus') :
                              selectedRequest.status === 'approved' ? t('checkoutRequests.approvedStatus') : 
                              selectedRequest.status === 'rejected' ? t('checkoutRequests.rejectedStatus') :
                              selectedRequest.status === 'completed' ? t('checkoutRequests.completedStatus') :
                              selectedRequest.status
                            }
                            color={
                              selectedRequest.status === 'pending' ? 'warning' :
                              selectedRequest.status === 'approved' ? 'success' : 
                              selectedRequest.status === 'rejected' ? 'error' :
                              selectedRequest.status === 'completed' ? 'info' :
                              'default'
                            }
                            variant="filled"
                            sx={{ borderRadius: 2, fontWeight: 'medium' }}
                          />
                          
                          <FormControl size="small" sx={{ ml: 'auto', minWidth: 200 }}>
                            <InputLabel id="change-status-label">{t('checkoutRequests.newStatus')}</InputLabel>
                            <Select
                              labelId="change-status-label"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleCloseDialog();
                                  handleChangeStatus(selectedRequest, e.target.value);
                                }
                              }}
                              label={t('checkoutRequests.newStatus')}
                            >
                              <MenuItem value="" disabled>
                                <em>{t('checkoutRequests.selectStatus')}</em>
                              </MenuItem>
                              {selectedRequest.status !== 'pending' && (
                                <MenuItem value="pending">{t('checkoutRequests.pendingStatus')}</MenuItem>
                              )}
                              {selectedRequest.status !== 'approved' && (
                                <MenuItem value="approved">{t('checkoutRequests.approvedStatus')}</MenuItem>
                              )}
                              {selectedRequest.status !== 'rejected' && (
                                <MenuItem value="rejected">{t('checkoutRequests.rejectedStatus')}</MenuItem>
                              )}
                              {selectedRequest.status !== 'completed' && (
                                <MenuItem value="completed">{t('checkoutRequests.completedStatus')}</MenuItem>
                              )}
                            </Select>
                          </FormControl>
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
                
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button 
                      onClick={() => {
                        handleCloseDialog();
                        handleApproveRequest(selectedRequest);
                      }} 
                      color="success"
                      variant="contained"
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }}
                    >
                      {t('checkoutRequests.approveAction')}
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        handleCloseDialog();
                        handleRejectRequest(selectedRequest);
                      }} 
                      color="error"
                      variant="contained"
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 'medium'
                      }}
                    >
                      {t('checkoutRequests.rejectAction')}
                    </Button>
                  </>
                )}
              </DialogActions>
            </Box>
          </Fade>
        )}
        
        {dialogMode === 'approve' && selectedRequest && (
          <Fade in={true}>
            <Box>
              <DialogTitle sx={{ 
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                  : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                color: theme.palette.success.contrastText,
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
                  <CheckIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {t('checkoutRequests.approveAction')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default
              }}>
                <Typography paragraph sx={{ mt: 1 }}>
                  {t('checkoutRequests.approveConfirmText', { name: selectedRequest.studentName })}
                </Typography>
                
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
                        {t('checkoutRequests.startDate')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="text.primary">
                        {formatDate(selectedRequest.startDate)}
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
                        {t('checkoutRequests.endDate')}
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="text.primary">
                        {formatDate(selectedRequest.endDate)}
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('checkoutRequests.notesLabel')}
                      multiline
                      rows={3}
                      placeholder={t('checkoutRequests.notesPlaceholder')}
                      value={approvalNotes}
                      onChange={(e) => {
                        setApprovalNotes(e.target.value);
                        if (notesError) setNotesError(false);
                      }}
                      error={notesError}
                      helperText={notesError ? t('checkoutRequests.notesRequired') : ''}
                      sx={{ mt: 2 }}
                    />
                  </Grid>
                </Grid>
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
                  onClick={handleApproveCheckout} 
                  color="success" 
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    boxShadow: 2
                  }}
                >
                  {loading ? t('checkoutRequests.approving') : t('checkoutRequests.approveAction')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        )}
        
        {dialogMode === 'reject' && selectedRequest && (
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
                  <CloseIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {t('checkoutRequests.rejectAction')}
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
                    {t('checkoutRequests.rejectConfirmText', { name: selectedRequest.studentName })}
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  label={t('checkoutRequests.reasonLabel')}
                  multiline
                  rows={3}
                  placeholder={t('checkoutRequests.reasonPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (reasonError) setReasonError(false);
                  }}
                  error={reasonError}
                  helperText={reasonError ? t('checkoutRequests.reasonRequired') : ''}
                  sx={{ mt: 2 }}
                />
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
                  onClick={handleRejectCheckout} 
                  color="error" 
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CloseIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    boxShadow: 2
                  }}
                >
                  {loading ? t('checkoutRequests.rejecting') : t('checkoutRequests.rejectAction')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        )}
      </Dialog>
    </>
  );
};

export default CheckoutRequests; 