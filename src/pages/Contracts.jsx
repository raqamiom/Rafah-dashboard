import { useState, useEffect } from 'react';
import {
  Box, 
  Paper, 
  Button, 
  Typography, 
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
  Chip,
  Tooltip,
  Tab, 
  Tabs,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  Stack,
  Badge,
  LinearProgress,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  FileCopy as FileCopyIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as ContractIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';
import { generateContractPDF } from '../utils/contractPdfGenerator';

const Contracts = () => {
  const { databases, databaseId, collections, ID, storage, bucketId } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const theme = useTheme();
  
  // State for contract data
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalContracts, setTotalContracts] = useState(0);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // State for users and rooms
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete', 'print', 'renew'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('active');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    studentName: '', // Keep for display purposes, but don't store in DB
    roomIds: [], // Keep as array for backward compatibility, but only allow one room in create mode
    roomNumbers: [],
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    status: 'active',
    isDiscounted: false,
    discountedAmount: 0,
    discountPeriod: '',
    documentUrl: '',
    documentFileId: '',
    documentFileName: '',
  });
  
  // State to store student details for display
  const [contractStudentDetails, setContractStudentDetails] = useState(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null); // For form dialog
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState([]); // For form dialog
  const [loadingRoomDetails, setLoadingRoomDetails] = useState(false);
  
  // State for PDF generation
  const [printRoomDetails, setPrintRoomDetails] = useState([]); // For print dialog
  const [loadingPrintRooms, setLoadingPrintRooms] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // State for document upload
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  
  // Get student details by userId
  const getStudentDetails = async (userId) => {
    try {
      const student = await databases.getDocument(
        databaseId,
        collections.users,
        userId
      );
      return student;
    } catch (error) {
      console.error('Error fetching student details:', error);
      return null;
    }
  };
  
  // Fetch student details when viewing contract details
  const fetchStudentDetailsForContract = async (contract) => {
    if (contract && contract.userId) {
      const studentDetails = await getStudentDetails(contract.userId);
      setContractStudentDetails(studentDetails);
    }
  };
  
  // Fetch student details for form dialog
  const fetchSelectedStudentDetails = async (userId) => {
    if (!userId) {
      setSelectedStudentDetails(null);
      return;
    }

    try {
      setLoadingStudentDetails(true);
      const studentDetails = await getStudentDetails(userId);
      setSelectedStudentDetails(studentDetails);
    } catch (error) {
      console.error('Error fetching selected student details:', error);
      setSelectedStudentDetails(null);
    } finally {
      setLoadingStudentDetails(false);
    }
  };
  
  // Fetch room details for form dialog
  const fetchSelectedRoomDetails = async (roomIds) => {
    if (!roomIds || roomIds.length === 0) {
      setSelectedRoomDetails([]);
      return;
    }

    try {
      setLoadingRoomDetails(true);
      const roomDetailsPromises = roomIds.map(async (roomId) => {
        try {
          const roomDetails = await databases.getDocument(
            databaseId,
            collections.rooms,
            roomId
          );
          return roomDetails;
        } catch (error) {
          console.error('Error fetching room details:', error);
          return null;
        }
      });

      const roomDetails = await Promise.all(roomDetailsPromises);
      setSelectedRoomDetails(roomDetails.filter(room => room !== null));
    } catch (error) {
      console.error('Error fetching selected room details:', error);
      setSelectedRoomDetails([]);
    } finally {
      setLoadingRoomDetails(false);
    }
  };
  
  // Fetch students (users) from the database
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      
      // Only get users with student role
      const filters = [Query.equal('role', 'student')];
      
      const response = await databases.listDocuments(
        databaseId,
        collections.users,
        filters,
        100, // Fetch up to 100 students
        0
      );
      
      setStudents(response.documents);
    } catch (error) {
      console.error('Error fetching students:', error);
      showError(t('users.fetchError'));
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // Fetch available rooms with capacity information
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      
      // Get all rooms (not filtered by status anymore)
      const response = await databases.listDocuments(
        databaseId,
        collections.rooms,
        [],
        100, // Fetch up to 100 rooms
        0
      );
      
      // Get all active contracts to calculate occupancy
      const contractsResponse = await databases.listDocuments(
        databaseId,
        collections.contracts,
        [Query.equal('status', 'active')],
        1000, // Get all active contracts
        0
      );
      
      // Calculate available capacity for each room
      const roomsWithCapacity = response.documents.map(room => {
        // Count active contracts for this room
        const activeContractsCount = contractsResponse.documents.filter(contract => {
          return contract.roomIds && Array.isArray(contract.roomIds) && contract.roomIds.includes(room.$id);
        }).length;
        
        const availableCapacity = room.capacity - activeContractsCount;
        const isAvailable = availableCapacity > 0 && room.status !== 'maintenance';
        
        return {
          ...room,
          activeContractsCount,
          availableCapacity,
          isAvailable
        };
      });
      
      setRooms(roomsWithCapacity);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showError(t('rooms.fetchError'));
    } finally {
      setLoadingRooms(false);
    }
  };
  
  // Fetch contracts from the database
  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterStatus !== 'all') {
        filters.push(Query.equal('status', filterStatus));
      }
      
      if (searchQuery) {
        filters.push(Query.search('studentName', searchQuery));
      }
      
      if (currentTab === 'active') {
        filters.push(Query.equal('status', 'active'));
      } else if (currentTab === 'expired') {
        filters.push(Query.equal('status', 'expired'));
      } else if (currentTab === 'terminated') {
        filters.push(Query.equal('status', 'terminated'));
      }
      
      // Fetch contracts
      const response = await databases.listDocuments(
        databaseId,
        collections.contracts,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        'contractId', // Sort by contractId
        'DESC' // Most recent first
      );
      
      setContracts(response.documents);
      setTotalContracts(response.total);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showError(t('contracts.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Generate contract ID
  const generateContractId = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Get month (01-12)
      
      // Get all contracts for this year and month to check used IDs
      const response = await databases.listDocuments(
        databaseId,
        collections.contracts,
        [
          Query.search('contractId', `C${year}${month}`),
          Query.orderDesc('contractId')
        ]
      );
      
      // Get all used sequence numbers
      const usedSequences = response.documents.map(doc => {
        const sequence = parseInt(doc.contractId.slice(-5));
        return sequence;
      });
      
      // Find the first available sequence number
      let sequence = 1;
      while (usedSequences.includes(sequence)) {
        sequence++;
      }
      
      // Format: C[YEAR][MONTH][SEQUENCE] where sequence is 5 digits
      return `C${year}${month}${sequence.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating contract ID:', error);
      // Fallback to timestamp-based ID if there's an error
      const timestamp = Date.now().toString().slice(-5);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      return `C${new Date().getFullYear()}${month}${timestamp}`;
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchContracts();
  }, [paginationModel, searchQuery, filterStatus, currentTab]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Handle dialog open for create
  const handleCreateContract = () => {
    setFormData({
      userId: '',
      studentName: '',
      roomIds: [],
      roomNumbers: [],
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      status: 'active',
      isDiscounted: false,
      discountedAmount: 0,
      discountPeriod: '',
      IDnumber: '',
      documentUrl: '',
      documentFileId: '',
      documentFileName: '',
    });
    setSelectedStudentDetails(null); // Clear selected student details
    setSelectedRoomDetails([]); // Clear selected room details
    setDocumentFile(null);
    setDocumentPreview(null);
    setDialogMode('create');
    setOpenDialog(true);
    
    // Fetch students and available rooms
    fetchStudents();
    fetchRooms();
  };
  
  // Handle dialog open for edit
  const handleEditContract = (contract) => {
    setSelectedContract(contract);
    setFormData({
      userId: contract.userId,
      studentName: contract.studentName,
      roomIds: contract.roomIds || [],
      roomNumbers: contract.roomNumbers,
      startDate: new Date(contract.startDate),
      endDate: new Date(contract.endDate),
      status: contract.status,
      isDiscounted: contract.isDiscounted || false,
      discountedAmount: contract.discountedAmount || 0,
      discountPeriod: contract.discountPeriod || '',
      documentUrl: contract.documentUrl || '',
      documentFileId: contract.documentFileId || '',
      documentFileName: contract.documentFileName || '',
    });
    setDocumentFile(null);
    setDocumentPreview(contract.documentUrl || null);
    setDialogMode('edit');
    setOpenDialog(true);
    
    // Fetch students and all rooms (including occupied ones)
    fetchStudents();
    fetchRooms();
    
    // Fetch student details for the selected contract
    if (contract.userId) {
      fetchSelectedStudentDetails(contract.userId);
    }
    
    // Fetch room details for the selected contract
    if (contract.roomIds && contract.roomIds.length > 0) {
      fetchSelectedRoomDetails(contract.roomIds);
    }
  };
  
  // Handle dialog open for delete
  const handleDeleteContract = (contract) => {
    setSelectedContract(contract);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog open for print
  const handlePrintContract = async (contract) => {
    setSelectedContract(contract);
    setDialogMode('print');
    setOpenDialog(true);
    
    // Fetch student details for the contract
    await fetchStudentDetailsForContract(contract);
    
    // Fetch room details for the contract
    if (contract.roomIds && contract.roomIds.length > 0) {
      try {
        setLoadingPrintRooms(true);
        const roomDetailsPromises = contract.roomIds.map(async (roomId) => {
          try {
            const roomDetails = await databases.getDocument(
              databaseId,
              collections.rooms,
              roomId
            );
            return roomDetails;
          } catch (error) {
            console.error('Error fetching room details:', error);
            return null;
          }
        });

        const roomDetails = await Promise.all(roomDetailsPromises);
        setPrintRoomDetails(roomDetails.filter(room => room !== null));
      } catch (error) {
        console.error('Error fetching print room details:', error);
        setPrintRoomDetails([]);
      } finally {
        setLoadingPrintRooms(false);
      }
    } else {
      setPrintRoomDetails([]);
    }
  };
  
  // Handle dialog open for renew
  const handleRenewContract = (contract) => {
    setSelectedContract(contract);
    const endDate = new Date(contract.endDate);
    
    setFormData({
      userId: contract.userId,
      studentName: contract.studentName,
      roomIds: contract.roomIds || [],
      roomNumbers: contract.roomNumbers,
      startDate: new Date(endDate),
      endDate: new Date(new Date(endDate).setMonth(new Date(endDate).getMonth() + 6)),
      status: 'active',
      isDiscounted: contract.isDiscounted || false,
      discountedAmount: contract.discountedAmount || 0,
      discountPeriod: contract.discountPeriod || '',
      documentUrl: '',
      documentFileId: '',
      documentFileName: '',
    });
    setDocumentFile(null);
    setDocumentPreview(null);
    
    setDialogMode('renew');
    setOpenDialog(true);
    
    // Fetch students and available rooms
    fetchStudents();
    fetchRooms();
    
    // Fetch student details for the contract being renewed
    if (contract.userId) {
      fetchSelectedStudentDetails(contract.userId);
    }
    
    // Fetch room details for the contract being renewed
    if (contract.roomIds && contract.roomIds.length > 0) {
      fetchSelectedRoomDetails(contract.roomIds);
    }
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContract(null);
    setContractStudentDetails(null); // Clear student details
    setSelectedStudentDetails(null); // Clear selected student details
    setSelectedRoomDetails([]); // Clear selected room details
    setPrintRoomDetails([]); // Clear print room details
    setDocumentFile(null);
    if (documentPreview && documentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(documentPreview);
    }
    setDocumentPreview(null);
  };
  
  // Handle document file selection
  const handleDocumentFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      showError(t('contracts.documentFileType'));
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      showError(t('contracts.documentFileSize'));
      return;
    }
    
    setDocumentFile(file);
    // Create preview URL for display
    const previewUrl = URL.createObjectURL(file);
    setDocumentPreview(previewUrl);
  };
  
  // Handle document removal
  const handleRemoveDocument = () => {
    setDocumentFile(null);
    if (documentPreview && documentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(documentPreview);
    }
    setDocumentPreview(null);
    setFormData({
      ...formData,
      documentUrl: '',
      documentFileId: '',
      documentFileName: '',
    });
  };
  
  // Upload contract document to Appwrite storage
  const uploadContractDocument = async (file) => {
    if (!file) {
      return null;
    }
    
    // Use specific bucket for contract documents
    const contractsBucketId = '6972023e000528158c0e';
    
    try {
      setUploadingDocument(true);
      
      // Generate unique file ID
      const fileId = ID.unique();
      
      // Upload file to Appwrite storage
      const uploadedFile = await storage.createFile(
        contractsBucketId,
        fileId,
        file,
        ['read("any")'] // Public read permission
      );
      
      // Get file URL
      const { appwriteConfig } = await import('../config/appwrite');
      const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${contractsBucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
      
      setUploadingDocument(false);
      return {
        fileId: uploadedFile.$id,
        fileUrl: fileUrl,
        fileName: file.name
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadingDocument(false);
      showError(t('contracts.documentUploadError'));
      return null;
    }
  };
  
  // Handle document download
  const handleDownloadDocument = async (contract) => {
    if (!contract.documentUrl && !contract.documentFileId) {
      showError(t('contracts.documentNotFound'));
      return;
    }
    
    try {
      let downloadUrl = contract.documentUrl;
      
      // If we have fileId but no URL, construct the URL using contracts bucket
      if (!downloadUrl && contract.documentFileId) {
        const contractsBucketId = '6972023e000528158c0e';
        const { appwriteConfig } = await import('../config/appwrite');
        downloadUrl = `${appwriteConfig.endpoint}/storage/buckets/${contractsBucketId}/files/${contract.documentFileId}/view?project=${appwriteConfig.projectId}`;
      }
      
      if (downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = contract.documentFileName || `contract_${contract.contractId}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess(t('contracts.documentDownloaded'));
      } else {
        showError(t('contracts.documentDownloadError'));
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      showError(t('contracts.documentDownloadError'));
    }
  };
  
  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!selectedContract) {
      showError(t('contracts.contractNotFound'));
      return;
    }

    try {
      setGeneratingPDF(true);
      
      // Ensure we have student and room details
      let studentData = contractStudentDetails;
      if (!studentData && selectedContract.userId) {
        studentData = await getStudentDetails(selectedContract.userId);
      }
      
      let roomData = printRoomDetails;
      if (!roomData || roomData.length === 0) {
        if (selectedContract.roomIds && selectedContract.roomIds.length > 0) {
          const roomDetailsPromises = selectedContract.roomIds.map(async (roomId) => {
            try {
              return await databases.getDocument(
                databaseId,
                collections.rooms,
                roomId
              );
            } catch (error) {
              console.error('Error fetching room details:', error);
              return null;
            }
          });
          roomData = (await Promise.all(roomDetailsPromises)).filter(room => room !== null);
        }
      }
      
      // Generate PDF
      await generateContractPDF(selectedContract, studentData, roomData);
      showSuccess(t('contracts.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError(t('contracts.pdfGenerationError'));
    } finally {
      setGeneratingPDF(false);
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'userId' && value) {
      // When user selects a student, get their name and fetch details
      const student = students.find(s => s.$id === value);
      if (student) {
        setFormData({
          ...formData,
          [name]: value,
          studentName: student.name || `${student.firstName} ${student.lastName}`,
          IDnumber: student.idNumber
        });
        
        // Fetch detailed student information
        fetchSelectedStudentDetails(value);
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
        setSelectedStudentDetails(null);
      }
    } else if (name === 'roomIds' && value !== undefined) {
      // Handle both single room (create mode) and multiple rooms (edit mode)
      const roomIdsArray = dialogMode === 'create' ? [value] : value;
      const roomNumbers = roomIdsArray.map(id => {
        const room = rooms.find(r => r.$id === id);
        return room ? room.roomNumber : '';
      });
      
      setFormData({
        ...formData,
        [name]: roomIdsArray,
        roomNumbers: roomNumbers
      });
      
      // Fetch detailed room information
      fetchSelectedRoomDetails(roomIdsArray);
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };
  
  // Handle date change
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };
  
  // Validate form
  const validateForm = () => {
    if (!formData.userId) {
      showError(t('contracts.selectStudent'));
      return false;
    }
    
    if (!formData.roomIds || formData.roomIds.length === 0) {
      showError(dialogMode === 'create' ? t('contracts.selectSingleRoom') : t('contracts.selectRoom'));
      return false;
    }
    
    if (dialogMode === 'create' && formData.roomIds.length > 1) {
      showError(t('contracts.onlyOneRoom'));
      return false;
    }
    
    // Validate room capacity for new contracts
    if (dialogMode === 'create') {
      for (const roomId of formData.roomIds) {
        const room = rooms.find(r => r.$id === roomId);
        if (room && !room.isAvailable) {
          showError(`Room ${room.roomNumber} is not available (${room.status === 'maintenance' ? 'under maintenance' : 'at full capacity'})`);
          return false;
        }
      }
    }
    
    if (!formData.startDate || !formData.endDate) {
      showError(t('contracts.invalidDates'));
      return false;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showError(t('contracts.startDateBeforeEnd'));
      return false;
    }
    
    return true;
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Get student information for the contract
      const student = students.find(s => s.$id === formData.userId);
      if (!student) {
        showError(t('contracts.studentNotFound'));
        return;
      }
      
      // Upload document if a new file is selected
      let documentData = {
        documentUrl: formData.documentUrl || '',
        documentFileId: formData.documentFileId || '',
        documentFileName: formData.documentFileName || '',
      };
      
      // If editing and a new file is selected, delete the old file first
      if (dialogMode === 'edit' && documentFile && selectedContract?.documentFileId) {
        try {
          const contractsBucketId = '6972023e000528158c0e';
          await storage.deleteFile(contractsBucketId, selectedContract.documentFileId);
          console.log('Old document deleted successfully');
        } catch (error) {
          console.warn('Error deleting old document (continuing with upload):', error);
          // Continue with upload even if deletion fails
        }
      }
      
      if (documentFile) {
        const uploadResult = await uploadContractDocument(documentFile);
        if (uploadResult) {
          documentData = {
            documentUrl: uploadResult.fileUrl,
            documentFileId: uploadResult.fileId,
            documentFileName: uploadResult.fileName,
          };
          showSuccess(t('contracts.documentUploaded'));
        }
      }
      
      // If document was removed (no file selected and existing document cleared)
      if (dialogMode === 'edit' && !documentFile && !formData.documentUrl && selectedContract?.documentFileId) {
        try {
          const contractsBucketId = '6972023e000528158c0e';
          await storage.deleteFile(contractsBucketId, selectedContract.documentFileId);
          console.log('Document removed and deleted from storage');
        } catch (error) {
          console.warn('Error deleting document:', error);
          // Continue with update even if deletion fails
        }
        // Clear document data
        documentData = {
          documentUrl: '',
          documentFileId: '',
          documentFileName: '',
        };
      }
      
      const contractData = {
        contractId: dialogMode === 'create' ? await generateContractId() : selectedContract.contractId,
        userId: formData.userId,
        studentName: student.name || `${student.firstName} ${student.lastName}`, // Store for easy access
        roomIds: formData.roomIds,
        roomNumbers: formData.roomNumbers,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        status: formData.status,
        isDiscounted: formData.isDiscounted,
        discountedAmount: parseFloat(formData.discountedAmount) || 0,
        discountPeriod: formData.discountPeriod,
        updatedAt: new Date().toISOString(),
        IDnumber: parseInt(student.idNumber, 10) || 0,
        documentUrl: documentData.documentUrl,
        documentFileId: documentData.documentFileId,
        documentFileName: documentData.documentFileName,
      };
      
      if (dialogMode === 'create' || dialogMode === 'renew') {
        // Add createdAt for new contracts
        contractData.createdAt = new Date().toISOString();
        
        // Create a new contract
        await databases.createDocument(
          databaseId,
          collections.contracts,
          ID.unique(),
          contractData
        );
        
        // Room status will be automatically calculated based on active contracts
        
        if (dialogMode === 'create') {
          showSuccess(t('contracts.contractCreated'));
        } else {
          showSuccess(t('contracts.contractRenewed'));
        }
      } else if (dialogMode === 'edit') {
        // Update the contract - room status will be automatically recalculated
        await databases.updateDocument(
          databaseId,
          collections.contracts,
          selectedContract.$id,
          contractData
        );
        
        showSuccess(t('contracts.contractUpdated'));
      }
      
      handleCloseDialog();
      fetchContracts();
    } catch (error) {
      console.error(`Error ${dialogMode} contract:`, error);
      showError(t(`contracts.${dialogMode}Error`));
    }
  };
  
  // Handle contract deletion
  const handleConfirmDelete = async () => {
    try {
      // Delete the contract - room status will be automatically recalculated
      await databases.deleteDocument(
        databaseId,
        collections.contracts,
        selectedContract.$id
      );
      
      showSuccess(t('contracts.contractDeleted'));
      handleCloseDialog();
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      showError(t('contracts.deleteError'));
    }
  };
  
  // Handle contract termination
  const handleTerminateContract = async (contract) => {
    try {
      // Update contract status to terminated - room status will be automatically recalculated
      await databases.updateDocument(
        databaseId,
        collections.contracts,
        contract.$id,
        {
          status: 'terminated',
          updatedAt: new Date().toISOString()
          
        }
      );
      
      showSuccess(t('contracts.contractTerminated'));
      fetchContracts();
    } catch (error) {
      console.error('Error terminating contract:', error);
      showError(t('contracts.terminateError'));
    }
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'contractId',
      headerName: t('contracts.contractId'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <ContractIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'studentName',
      headerName: t('contracts.studentName'),
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'roomNumbers',
      headerName: t('contracts.roomNumbers'),
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {Array.isArray(params.value) ? params.value.join(', ') : params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'startDate',
      headerName: t('contracts.startDate'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'endDate',
      headerName: t('contracts.endDate'),
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: t('contracts.statusLabel'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'active': return 'success';
            case 'expired': return 'warning';
            case 'terminated': return 'error';
            default: return 'default';
          }
        };
        
        const getStatusIcon = (status) => {
          switch (status) {
            case 'active': return <CheckCircleIcon fontSize="small" />;
            case 'expired': return <ScheduleIcon fontSize="small" />;
            case 'terminated': return <CancelIcon fontSize="small" />;
            default: return null;
          }
        };
        
        return (
          <Chip
            icon={getStatusIcon(params.value)}
            label={t(`contracts.status.${params.value}`)}
            color={getStatusColor(params.value)}
            size="small"
            variant="filled"
            sx={{ fontWeight: 'medium' }}
          />
        );
      },
    },
    {
      field: 'isDiscounted',
      headerName: t('contracts.isDiscounted'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip
            label={`${params.row.discountedAmount} OMR`}
            color="secondary"
            size="small"
            variant="outlined"
            icon={<TrendingUpIcon fontSize="small" />}
          />
        ) : (
          <Chip
            label={t('common.no')}
            variant="outlined"
            size="small"
            color="default"
          />
        )
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('common.edit')}>
            <IconButton
              size="small"
              onClick={() => handleEditContract(params.row)}
              disabled={params.row.status !== 'active'}
              sx={{ 
                bgcolor: params.row.status === 'active' ? 'primary.lighter' : 'action.disabledBackground',
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('contracts.generateDocument')}>
            <IconButton
              size="small"
              onClick={() => handlePrintContract(params.row)}
              sx={{ 
                bgcolor: 'info.lighter',
                '&:hover': { bgcolor: 'info.light' }
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {(params.row.documentUrl || params.row.documentFileId) && (
            <Tooltip title={t('contracts.downloadDocument')}>
              <IconButton
                size="small"
                onClick={() => handleDownloadDocument(params.row)}
                sx={{ 
                  bgcolor: 'success.lighter',
                  '&:hover': { bgcolor: 'success.light' }
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {params.row.status === 'active' && (
            <Tooltip title={t('contracts.terminateContract')}>
              <IconButton
                size="small"
                onClick={() => handleTerminateContract(params.row)}
                sx={{ 
                  bgcolor: 'warning.lighter',
                  '&:hover': { bgcolor: 'warning.light' }
                }}
              >
                <FileCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={t('contracts.renewContract')}>
            <IconButton
              size="small"
              onClick={() => handleRenewContract(params.row)}
              disabled={params.row.status === 'active'}
              sx={{ 
                bgcolor: params.row.status !== 'active' ? 'success.lighter' : 'action.disabledBackground',
                '&:hover': { bgcolor: 'success.light' }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('common.delete')}>
            <IconButton
              size="small"
              onClick={() => handleDeleteContract(params.row)}
              sx={{ 
                bgcolor: 'error.lighter',
                '&:hover': { bgcolor: 'error.light' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];
  
  // Calculate statistics
  const stats = {
    total: totalContracts,
    active: contracts.filter(c => c.status === 'active').length,
    expired: contracts.filter(c => c.status === 'expired').length,
    terminated: contracts.filter(c => c.status === 'terminated').length,
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={t('contracts.title')}
        actionLabel={t('contracts.create')}
        onAction={handleCreateContract}
      />

      {/* Statistics Cards */}
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
                      {t('contracts.title')}
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
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('contracts.status.active')}
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
                ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: theme.palette.warning.contrastText,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'inherit' }}>
                      {stats.expired}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('contracts.status.expired')}
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
                      {stats.terminated}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: 'inherit' }}>
                      {t('contracts.status.terminated')}
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
              {t('contracts.list')}
            </Typography>
            
            {/* Search and Filter Controls */}
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('common.search')}
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)' }} />
                      </InputAdornment>
                    ),
                    sx: { 
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.2)' 
                          : 'rgba(255,255,255,0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.4)' 
                          : 'rgba(255,255,255,0.5)'
                      },
                      '& input': { color: theme.palette.primary.contrastText },
                      '& .MuiInputLabel-root': { 
                        color: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.8)' 
                          : 'rgba(255,255,255,0.7)' 
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)' }}>
                    {t('contracts.statusLabel')}
                  </InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label={t('contracts.statusLabel')}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.2)' 
                          : 'rgba(255,255,255,0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.4)' 
                          : 'rgba(255,255,255,0.5)'
                      },
                      '& .MuiSelect-select': { color: theme.palette.primary.contrastText }
                    }}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    <MenuItem value="active">{t('contracts.status.active')}</MenuItem>
                    <MenuItem value="expired">{t('contracts.status.expired')}</MenuItem>
                    <MenuItem value="terminated">{t('contracts.status.terminated')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={t('common.refresh')}>
                    <IconButton
                      onClick={() => fetchContracts()}
                      sx={{ 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.08)' 
                          : 'rgba(255,255,255,0.1)',
                        color: theme.palette.primary.contrastText,
                        '&:hover': { 
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.15)' 
                            : 'rgba(255,255,255,0.2)' 
                        }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateContract}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.15)' 
                        : 'rgba(255,255,255,0.2)',
                      color: theme.palette.primary.contrastText,
                      '&:hover': { 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.25)' 
                          : 'rgba(255,255,255,0.3)' 
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'medium'
                    }}
                  >
                    {t('contracts.create')}
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
                value="active" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    {t('contracts.status.active')}
                    <Badge badgeContent={stats.active} color="success" />
                  </Box>
                } 
              />
              <Tab 
                value="expired" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    {t('contracts.status.expired')}
                    <Badge badgeContent={stats.expired} color="warning" />
                  </Box>
                } 
              />
              <Tab 
                value="terminated" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelIcon fontSize="small" />
                    {t('contracts.status.terminated')}
                    <Badge badgeContent={stats.terminated} color="error" />
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
              rows={contracts}
              columns={columns}
              getRowId={(row) => row.$id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              rowCount={totalContracts}
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
      
      {/* Enhanced Contract CRUD Dialog */}
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
        {dialogMode === 'delete' ? (
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
                  {t('contracts.deleteConfirm')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '60vh',
                overflowY: 'auto'
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
                    {t('contracts.deleteWarning', { 
                      contractId: selectedContract?.contractId, 
                      studentName: selectedContract?.studentName 
                    })}
                  </Typography>
                </Alert>
                
                {/* Additional Warning Information */}
                <Card elevation={1} sx={{ 
                  mt: 2, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? theme.palette.background.paper 
                    : theme.palette.grey[50],
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      This action will:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                        • Permanently delete the contract
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                        • Release assigned rooms to available status
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        • Remove all contract history
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </DialogContent>
              <DialogActions sx={{ 
                p: 3, 
                gap: 1, 
                borderTop: `1px solid ${theme.palette.divider}`, 
                bgcolor: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper 
                  : theme.palette.grey[50],
                position: 'sticky',
                bottom: 0,
                zIndex: 1
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.divider,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.05)'
                    }
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
        ) : dialogMode === 'print' ? (
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
                  <PrintIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {t('contracts.generateDocument')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.4)' 
                      : 'rgba(0,0,0,0.4)',
                  }
                }
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  color="primary" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 3,
                    color: theme.palette.primary.main
                  }}
                >
                  <AssignmentIcon />
                  {t('contracts.contractPreview')}
                </Typography>
                
                <Card 
                  elevation={2} 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 2, 
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <CardHeader 
                    title={t('contracts.contractAgreement')}
                    sx={{ 
                      bgcolor: theme.palette.mode === 'dark' 
                        ? theme.palette.primary.dark 
                        : theme.palette.primary.light,
                      textAlign: 'center',
                      color: theme.palette.primary.contrastText,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '& .MuiCardHeader-title': {
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: 'inherit'
                      }
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      {[
                        { label: t('contracts.contractId'), value: selectedContract?.contractId },
                        { label: t('contracts.studentName'), value: selectedContract?.studentName },
                        { label: t('contracts.roomNumbers'), value: selectedContract?.roomNumbers },
                        { label: t('contracts.startDate'), value: formatDate(selectedContract?.startDate) },
                        { label: t('contracts.endDate'), value: formatDate(selectedContract?.endDate) }
                      ].map((item, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Card 
                            elevation={0} 
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
                                boxShadow: 1
                              }
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {item.label}
                            </Typography>
                            <Typography variant="body1" fontWeight="medium" color="text.primary">
                              {item.value || t('common.notAvailable')}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </DialogContent>
              <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : 'grey.50' }}>
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
                  onClick={handleGeneratePDF}
                  color="success" 
                  variant="contained"
                  startIcon={generatingPDF ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                  disabled={generatingPDF || loadingPrintRooms}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    boxShadow: 2
                  }}
                >
                  {generatingPDF ? t('contracts.generatingPDF') : t('contracts.downloadPDF')}
                </Button>
                {(selectedContract?.documentUrl || selectedContract?.documentFileId) && (
                  <Button 
                    onClick={() => handleDownloadDocument(selectedContract)}
                    color="info" 
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      textTransform: 'none',
                      fontWeight: 'medium',
                      boxShadow: 2
                    }}
                  >
                    {t('contracts.downloadDocument')}
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    window.print();
                    showSuccess(t('contracts.documentGenerated'));
                  }} 
                  color="primary" 
                  variant="contained"
                  startIcon={<PrintIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    boxShadow: 2
                  }}
                >
                  {t('common.print')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        ) : (
          <Fade in={true}>
            <Box>
              <DialogTitle sx={{ 
                background: `linear-gradient(135deg, ${
                  dialogMode === 'create' 
                    ? theme.palette.mode === 'dark' 
                      ? `${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%`
                      : '#667eea 0%, #764ba2 100%'
                    : dialogMode === 'edit' 
                      ? theme.palette.mode === 'dark'
                        ? `${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%`
                        : '#f093fb 0%, #f5576c 100%'
                      : theme.palette.mode === 'dark'
                        ? `${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%`
                        : '#4facfe 0%, #00f2fe 100%'
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
                  {dialogMode === 'create' ? <AddIcon /> : 
                   dialogMode === 'edit' ? <EditIcon /> : <ContentCopyIcon />}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'inherit' }}>
                  {dialogMode === 'create' 
                    ? t('contracts.create') 
                    : dialogMode === 'edit' 
                      ? t('contracts.edit') 
                      : t('contracts.renewContract')}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ 
                p: 3, 
                bgcolor: theme.palette.background.default,
                maxHeight: '70vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.4)' 
                      : 'rgba(0,0,0,0.4)',
                  }
                }
              }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
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
                          <PersonIcon />
                          {t('contracts.studentName')}
                        </Typography>
                        {loadingStudents ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} color="primary" />
                          </Box>
                        ) : (
                          <FormControl fullWidth>
                            <InputLabel sx={{ 
                              color: theme.palette.text.primary,
                              '&.Mui-focused': {
                                color: theme.palette.primary.main
                              }
                            }}>
                              {t('contracts.studentName')}
                            </InputLabel>
                            <Select
                              name="userId"
                              value={formData.userId}
                              onChange={handleInputChange}
                              label={t('contracts.studentName')}
                              sx={{ 
                                borderRadius: 2,
                                '& .MuiSelect-select': { 
                                  color: theme.palette.text.primary 
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.divider
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main
                                }
                              }}
                            >
                              {students.map((student) => (
                                <MenuItem 
                                  key={student.$id} 
                                  value={student.$id}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.05)' 
                                        : 'rgba(0,0,0,0.05)'
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                                      <PersonIcon fontSize="small" />
                                    </Avatar>
                                    <Typography sx={{ color: theme.palette.text.primary }}>
                                      {student.name || `${student.firstName} ${student.lastName}`}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Card>
                    </Grid>
                    
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
                          <HomeIcon />
                          {dialogMode === 'create' ? t('contracts.selectRoom') : t('contracts.roomNumbers')}
                        </Typography>
                        {loadingRooms ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} color="primary" />
                          </Box>
                        ) : (
                          <FormControl fullWidth>
                            <InputLabel sx={{ 
                              color: theme.palette.text.primary,
                              '&.Mui-focused': {
                                color: theme.palette.primary.main
                              }
                            }}>
                              {t('contracts.roomNumbers')}
                            </InputLabel>
                            <Select
                              name="roomIds"
                              multiple={dialogMode === 'edit'}
                              value={dialogMode === 'create' ? (formData.roomIds[0] || '') : formData.roomIds}
                              onChange={handleInputChange}
                              label={dialogMode === 'create' ? t('contracts.selectRoom') : t('contracts.roomNumbers')}
                              sx={{ 
                                borderRadius: 2,
                                '& .MuiSelect-select': { 
                                  color: theme.palette.text.primary 
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.divider
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main
                                }
                              }}
                              renderValue={dialogMode === 'edit' ? (selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map(id => {
                                    const room = rooms.find(r => r.$id === id);
                                    return room ? (
                                      <Chip 
                                        key={id} 
                                        label={room.roomNumber} 
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                        sx={{
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? alpha(theme.palette.primary.main, 0.2)
                                            : alpha(theme.palette.primary.light, 0.3),
                                          borderColor: theme.palette.primary.main,
                                          color: theme.palette.primary.main
                                        }}
                                      />
                                    ) : null;
                                  })}
                                </Box>
                              ) : undefined}
                            >
                              {rooms
                                .filter(room => {
                                  if (dialogMode === 'create') {
                                    return room.isAvailable;
                                  } else {
                                    return room.isAvailable || selectedContract?.roomIds?.includes(room.$id);
                                  }
                                })
                                .map((room) => (
                                <MenuItem 
                                  key={room.$id} 
                                  value={room.$id}
                                  disabled={!room.isAvailable && !(dialogMode === 'edit' && selectedContract?.roomIds?.includes(room.$id))}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.05)' 
                                        : 'rgba(0,0,0,0.05)'
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <HomeIcon 
                                      fontSize="small" 
                                      color={room.isAvailable ? "action" : "disabled"} 
                                    />
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography 
                                        variant="body2" 
                                        fontWeight="medium" 
                                        sx={{ 
                                          color: room.isAvailable 
                                            ? theme.palette.text.primary 
                                            : theme.palette.text.disabled 
                                        }}
                                      >
                                        {room.roomNumber}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {t(`rooms.types.${room.type}`)} - Capacity: {room.capacity}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {room.status === 'maintenance' 
                                          ? 'Maintenance' 
                                          : `Available: ${room.availableCapacity}/${room.capacity} spaces`
                                        }
                                      </Typography>
                                    </Box>
                                    {room.availableCapacity > 0 && room.status !== 'maintenance' && (
                                      <Chip 
                                        label={`${room.availableCapacity} left`} 
                                        size="small" 
                                        color="success"
                                        variant="outlined"
                                      />
                                    )}
                                    {room.status === 'maintenance' && (
                                      <Chip 
                                        label="Maintenance" 
                                        size="small" 
                                        color="warning"
                                        variant="outlined"
                                      />
                                    )}
                                    {room.availableCapacity === 0 && room.status !== 'maintenance' && (
                                      <Chip 
                                        label="Full" 
                                        size="small" 
                                        color="error"
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Card>
                    </Grid>
                    
                    {/* Enhanced Student Information Display */}
                    {formData.userId && (
                      <Grid item xs={12}>
                        <Zoom in={Boolean(formData.userId)}>
                          <Card 
                            elevation={3} 
                            sx={{ 
                              borderRadius: 2, 
                              overflow: 'hidden',
                              bgcolor: theme.palette.background.paper,
                              border: `2px solid ${theme.palette.primary.main}`,
                              boxShadow: theme.palette.mode === 'dark' 
                                ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
                                : `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
                            }}
                          >
                            <CardHeader 
                              title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PersonIcon />
                                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                                    {t('students.studentInformation')}
                                  </Typography>
                                </Box>
                              }
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? theme.palette.primary.dark 
                                  : theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                '& .MuiCardHeader-title': {
                                  color: 'inherit'
                                }
                              }}
                            />
                            <CardContent sx={{ p: 3 }}>
                              {loadingStudentDetails ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                                  <CircularProgress size={24} sx={{ mr: 2, color: theme.palette.primary.main }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Loading student details...
                                  </Typography>
                                </Box>
                              ) : selectedStudentDetails ? (
                                <Grid container spacing={2}>
                                  {[
                                    { label: t('students.email'), value: selectedStudentDetails.email },
                                    { label: t('students.phone'), value: selectedStudentDetails.phone },
                                    { label: t('students.idNumber'), value: selectedStudentDetails.idNumber },
                                    { label: t('students.statusLabel'), value: selectedStudentDetails.status },
                                    { label: t('students.emergencyContactName'), value: selectedStudentDetails.emergencyContactName },
                                    { label: t('students.emergencyContactPhone'), value: selectedStudentDetails.emergencyContactPhone }
                                  ].map((item, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                      <Box sx={{ 
                                        p: 2, 
                                        bgcolor: theme.palette.mode === 'dark' 
                                          ? alpha(theme.palette.primary.main, 0.2)
                                          : alpha(theme.palette.primary.light, 0.3),
                                        borderRadius: 2, 
                                        height: '100%',
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.05)' 
                                            : theme.palette.grey[100],
                                          transform: 'translateY(-1px)',
                                          boxShadow: 1
                                        }
                                      }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          {item.label}
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="text.primary">
                                          {item.value || t('common.notAvailable')}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  ))}
                                </Grid>
                              ) : (
                                <Alert 
                                  severity="info"
                                  sx={{
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.info.dark, 0.2)
                                      : alpha(theme.palette.info.light, 0.2),
                                    color: theme.palette.text.primary,
                                    border: `1px solid ${theme.palette.info.main}`,
                                    '& .MuiAlert-icon': {
                                      color: theme.palette.info.main
                                    }
                                  }}
                                >
                                  <Typography>
                                    {t('students.noInformationAvailable')}
                                  </Typography>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    )}
                    
                    {/* Enhanced Room Information Display */}
                    {formData.roomIds && formData.roomIds.length > 0 && (
                      <Grid item xs={12}>
                        <Zoom in={Boolean(formData.roomIds && formData.roomIds.length > 0)}>
                          <Card 
                            elevation={3} 
                            sx={{ 
                              borderRadius: 2, 
                              overflow: 'hidden',
                              bgcolor: theme.palette.background.paper,
                              border: `2px solid ${theme.palette.secondary.main}`,
                              boxShadow: theme.palette.mode === 'dark' 
                                ? `0 8px 32px ${alpha(theme.palette.secondary.main, 0.2)}`
                                : `0 8px 32px ${alpha(theme.palette.secondary.main, 0.15)}`
                            }}
                          >
                            <CardHeader 
                              title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <HomeIcon />
                                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                                    {dialogMode === 'create' ? t('contracts.selectedRoomInfo') : t('rooms.roomInformation')}
                                  </Typography>
                                </Box>
                              }
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? theme.palette.secondary.dark 
                                  : theme.palette.secondary.main,
                                color: theme.palette.secondary.contrastText,
                                '& .MuiCardHeader-title': {
                                  color: 'inherit'
                                }
                              }}
                            />
                            <CardContent sx={{ p: 3 }}>
                              {loadingRoomDetails ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                                  <CircularProgress size={24} sx={{ mr: 2, color: theme.palette.secondary.main }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Loading room details...
                                  </Typography>
                                </Box>
                              ) : selectedRoomDetails && selectedRoomDetails.length > 0 ? (
                                <Grid container spacing={2}>
                                  {selectedRoomDetails.map((room) => (
                                    <Grid item xs={12} key={room.$id}>
                                      <Card 
                                        elevation={2} 
                                        sx={{ 
                                          borderRadius: 2, 
                                          bgcolor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.03)' 
                                            : theme.palette.action.hover,
                                          border: `1px solid ${theme.palette.divider}`,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: theme.palette.mode === 'dark' 
                                              ? 'rgba(255,255,255,0.05)' 
                                              : theme.palette.action.selected,
                                            transform: 'translateY(-1px)',
                                            boxShadow: 3
                                          }
                                        }}
                                      >
                                        <CardContent sx={{ p: 2.5 }}>
                                          <Typography 
                                            variant="subtitle1" 
                                            fontWeight="bold" 
                                            gutterBottom 
                                            sx={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: 1,
                                              color: theme.palette.text.primary
                                            }}
                                          >
                                            <HomeIcon color="primary" />
                                            {dialogMode === 'create' ? t('rooms.room') : t('rooms.room')} {room.roomNumber}
                                          </Typography>
                                          
                                          <Grid container spacing={2}>
                                            {[
                                              { label: t('rooms.type'), value: t(`rooms.types.${room.type}`) },
                                              { label: t('rooms.totalCapacity'), value: room.capacity },
                                              { label: t('rooms.availableCapacity'), value: `${room.availableCapacity || 0}/${room.capacity}` },
                                              { label: t('rooms.currentOccupants'), value: room.activeContractsCount || 0 },
                                              { label: t('rooms.rentAmount'), value: room.rentAmount ? `${room.rentAmount} OMR` : null },
                                              { label: t('rooms.availabilityStatus'), value: room.status === 'maintenance' ? t('rooms.status.maintenance') : room.isAvailable ? t('rooms.status.not_occupied') : t('rooms.status.full') },
                                              { label: t('rooms.building'), value: room.building },
                                              { label: t('rooms.floor'), value: room.floor }
                                            ].map((item, index) => (
                                              <Grid item xs={12} sm={6} md={4} key={index}>
                                                <Box sx={{ 
                                                  p: 1.5, 
                                                  bgcolor: theme.palette.background.paper, 
                                                  borderRadius: 1.5, 
                                                  border: `1px solid ${theme.palette.divider}`,
                                                  transition: 'all 0.2s ease',
                                                  '&:hover': {
                                                    bgcolor: theme.palette.mode === 'dark' 
                                                      ? 'rgba(255,255,255,0.05)' 
                                                      : theme.palette.grey[100],
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: 1
                                                  }
                                                }}>
                                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {item.label}
                                                  </Typography>
                                                  <Typography variant="body1" fontWeight="medium" color="text.primary">
                                                    {item.value || t('common.notAvailable')}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            ))}
                                          </Grid>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              ) : (
                                <Alert 
                                  severity="info"
                                  sx={{
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.info.dark, 0.2) 
                                      : alpha(theme.palette.info.light, 0.2),
                                    color: theme.palette.text.primary,
                                    border: `1px solid ${theme.palette.info.main}`,
                                    '& .MuiAlert-icon': {
                                      color: theme.palette.info.main
                                    }
                                  }}
                                >
                                  <Typography>
                                    {t('rooms.noInformationAvailable')}
                                  </Typography>
                                </Alert>
                              )}
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    )}
                    
                    {/* Date Selection Section */}
                    <Grid item xs={12}>
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
                            mb: 3,
                            color: theme.palette.primary.main
                          }}
                        >
                          <CalendarIcon />
                          Contract Period
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <DatePicker
                              label={t('contracts.startDate')}
                              value={formData.startDate}
                              onChange={(date) => handleDateChange('startDate', date)}
                              sx={{ 
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '& fieldset': {
                                    borderColor: theme.palette.divider
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main
                                  },
                                  '& input': {
                                    color: theme.palette.text.primary
                                  }
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.palette.text.primary,
                                  '&.Mui-focused': {
                                    color: theme.palette.primary.main
                                  }
                                }
                              }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <DatePicker
                              label={t('contracts.endDate')}
                              value={formData.endDate}
                              onChange={(date) => handleDateChange('endDate', date)}
                              sx={{ 
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '& fieldset': {
                                    borderColor: theme.palette.divider
                                  },
                                  '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main
                                  },
                                  '& input': {
                                    color: theme.palette.text.primary
                                  }
                                },
                                '& .MuiInputLabel-root': {
                                  color: theme.palette.text.primary,
                                  '&.Mui-focused': {
                                    color: theme.palette.primary.main
                                  }
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                    
                    {/* Contract Status Section */}
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
                          <CheckCircleIcon />
                          {t('contracts.statusLabel')}
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel sx={{
                            color: theme.palette.text.primary,
                            '&.Mui-focused': {
                              color: theme.palette.primary.main
                            }
                          }}>
                            {t('contracts.statusLabel')}
                          </InputLabel>
                          <Select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            label={t('contracts.statusLabel')}
                            sx={{ 
                              borderRadius: 2,
                              '& .MuiSelect-select': { 
                                color: theme.palette.text.primary 
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            <MenuItem 
                              value="active"
                              sx={{
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon fontSize="small" color="success" />
                                <Typography sx={{ color: theme.palette.text.primary }}>
                                  {t('contracts.status.active')}
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem 
                              value="expired"
                              sx={{
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon fontSize="small" color="warning" />
                                <Typography sx={{ color: theme.palette.text.primary }}>
                                  {t('contracts.status.expired')}
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem 
                              value="terminated"
                              sx={{
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CancelIcon fontSize="small" color="error" />
                                <Typography sx={{ color: theme.palette.text.primary }}>
                                  {t('contracts.status.terminated')}
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Card>
                    </Grid>
                    
                    {/* Discount Section */}
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
                          <TrendingUpIcon />
                          {t('contracts.isDiscounted')}
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel sx={{
                            color: theme.palette.text.primary,
                            '&.Mui-focused': {
                              color: theme.palette.primary.main
                            }
                          }}>
                            {t('contracts.isDiscounted')}
                          </InputLabel>
                          <Select
                            name="isDiscounted"
                            value={formData.isDiscounted}
                            onChange={handleInputChange}
                            label={t('contracts.isDiscounted')}
                            sx={{ 
                              borderRadius: 2,
                              '& .MuiSelect-select': { 
                                color: theme.palette.text.primary 
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            <MenuItem 
                              value={true}
                              sx={{
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon fontSize="small" color="success" />
                                <Typography sx={{ color: theme.palette.text.primary }}>
                                  {t('common.yes')}
                                </Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem 
                              value={false}
                              sx={{
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CancelIcon fontSize="small" color="error" />
                                <Typography sx={{ color: theme.palette.text.primary }}>
                                  {t('common.no')}
                                </Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Card>
                    </Grid>
                    
                    {/* Discount Details Section */}
                    {formData.isDiscounted && (
                      <Grid item xs={12}>
                        <Zoom in={formData.isDiscounted}>
                          <Card 
                            elevation={3} 
                            sx={{ 
                              borderRadius: 2, 
                              border: `2px solid ${theme.palette.success.main}`, 
                              overflow: 'hidden',
                              bgcolor: theme.palette.background.paper,
                              boxShadow: theme.palette.mode === 'dark' 
                                ? `0 8px 32px ${alpha(theme.palette.success.main, 0.2)}`
                                : `0 8px 32px ${alpha(theme.palette.success.main, 0.15)}`
                            }}
                          >
                            <CardHeader 
                              title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TrendingUpIcon />
                                  <Typography variant="h6" sx={{ color: 'inherit' }}>
                                    Discount Information
                                  </Typography>
                                </Box>
                              }
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? theme.palette.success.dark 
                                  : theme.palette.success.main,
                                color: theme.palette.success.contrastText,
                                '& .MuiCardHeader-title': {
                                  color: 'inherit'
                                }
                              }}
                            />
                            <CardContent sx={{ p: 3 }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label={t('contracts.discountedAmount')}
                                    name="discountedAmount"
                                    type="number"
                                    value={formData.discountedAmount}
                                    onChange={handleInputChange}
                                    InputProps={{
                                      endAdornment: <InputAdornment position="end">OMR</InputAdornment>,
                                    }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '& fieldset': {
                                          borderColor: theme.palette.divider
                                        },
                                        '&:hover fieldset': {
                                          borderColor: theme.palette.success.main
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: theme.palette.success.main
                                        },
                                        '& input': {
                                          color: theme.palette.text.primary
                                        }
                                      },
                                      '& .MuiInputLabel-root': {
                                        color: theme.palette.text.primary,
                                        '&.Mui-focused': {
                                          color: theme.palette.success.main
                                        }
                                      },
                                      '& .MuiInputAdornment-root': {
                                        color: theme.palette.text.secondary
                                      }
                                    }}
                                  />
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label={t('contracts.discountPeriod')}
                                    name="discountPeriod"
                                    value={formData.discountPeriod}
                                    onChange={handleInputChange}
                                    placeholder="e.g., First 3 months"
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '& fieldset': {
                                          borderColor: theme.palette.divider
                                        },
                                        '&:hover fieldset': {
                                          borderColor: theme.palette.success.main
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: theme.palette.success.main
                                        },
                                        '& input': {
                                          color: theme.palette.text.primary
                                        }
                                      },
                                      '& .MuiInputLabel-root': {
                                        color: theme.palette.text.primary,
                                        '&.Mui-focused': {
                                          color: theme.palette.success.main
                                        }
                                      }
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    )}
                    
                    {/* Contract Document Upload Section */}
                    <Grid item xs={12}>
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
                          <AssignmentIcon />
                          {t('contracts.uploadDocument')}
                        </Typography>
                        
                        {uploadingDocument && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" color="text.secondary">
                              {t('contracts.uploadingDocument')}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Existing Document Display */}
                        {!documentFile && formData.documentUrl && (
                          <Box sx={{ mb: 2 }}>
                            <Alert 
                              severity="info"
                              sx={{
                                mb: 2,
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.info.dark, 0.2)
                                  : alpha(theme.palette.info.light, 0.2),
                                border: `1px solid ${theme.palette.info.main}`,
                                '& .MuiAlert-icon': {
                                  color: theme.palette.info.main
                                }
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium" gutterBottom>
                                {t('contracts.existingDocument')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {formData.documentFileName || t('contracts.documentFile')}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadDocument({
                                  documentUrl: formData.documentUrl,
                                  documentFileId: formData.documentFileId,
                                  documentFileName: formData.documentFileName,
                                  contractId: selectedContract?.contractId || ''
                                })}
                                sx={{ mt: 1 }}
                              >
                                {t('contracts.downloadDocument')}
                              </Button>
                            </Alert>
                          </Box>
                        )}
                        
                        {/* File Input */}
                        <Box sx={{ mb: 2 }}>
                          <input
                            accept=".pdf,.doc,.docx,.txt"
                            style={{ display: 'none' }}
                            id="contract-document-upload"
                            type="file"
                            onChange={handleDocumentFileChange}
                            disabled={uploadingDocument}
                          />
                          <label htmlFor="contract-document-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<AssignmentIcon />}
                              disabled={uploadingDocument}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 'medium',
                                borderColor: theme.palette.divider,
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)'
                                }
                              }}
                            >
                              {t('contracts.selectDocument')}
                            </Button>
                          </label>
                        </Box>
                        
                        {/* Selected File Display */}
                        {documentFile && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.03)' 
                              : theme.palette.grey[50],
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AssignmentIcon color="primary" />
                              <Typography variant="body2" fontWeight="medium">
                                {documentFile.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={handleRemoveDocument}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,0,0,0.1)' 
                                    : 'rgba(255,0,0,0.05)'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {t('contracts.documentUploadHint')}
                        </Typography>
                      </Card>
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
                  : theme.palette.grey[50],
                position: 'sticky',
                bottom: 0,
                zIndex: 1
              }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.divider,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  color="primary" 
                  variant="contained"
                  startIcon={
                    dialogMode === 'create' ? <AddIcon /> :
                    dialogMode === 'edit' ? <EditIcon /> : <ContentCopyIcon />
                  }
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
                  {dialogMode === 'create' 
                    ? t('common.create') 
                    : dialogMode === 'edit' 
                      ? t('common.save') 
                      : t('contracts.renew')}
                </Button>
              </DialogActions>
            </Box>
          </Fade>
        )}
      </Dialog>
    </Box>
  );
};

export default Contracts; 