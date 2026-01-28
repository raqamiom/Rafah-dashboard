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
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  LinearProgress,
  useTheme,
  CardHeader,
  Alert,
  AlertTitle,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  CameraAlt as CameraAltIcon,
  Build as BuildIcon,
  ElectricalServices as ElectricalServicesIcon,
  Plumbing as PlumbingIcon,
  CleaningServices as CleaningServicesIcon,
  Security as SecurityIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteOutlineIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { appwriteConfig } from '../config/appwrite';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/dashboard/StatCard';
import { Query } from 'appwrite';
import { alpha } from '@mui/material/styles';

const Compliance = () => {
  const { databases, databaseId, collections, storage, bucketId, ID: AppwriteID } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const theme = useTheme();

  // State for compliance records
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [lastError, setLastError] = useState(null);

  // State for users (students and staff)
  const [students, setStudents] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');

  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'

  // State for selected record
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: 'maintenance',
    location: '',
    roomNumber: '',
    apartmentNumber: '',
    paidBy: 'management',
    paidByUserId: '',
    paidByUserName: '',
    assignedTo: '',
    assignedToName: '',
    workCost: 0,
    toolsCost: 0,
    totalCost: 0,
    notes: '',
    imageUrls: [],
  });

  // State for image upload
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  // Category icons mapping
  const categoryIcons = {
    maintenance: <BuildIcon />,
    electrical: <ElectricalServicesIcon />,
    plumbing: <PlumbingIcon />,
    cleaning: <CleaningServicesIcon />,
    safety: <SecurityIcon />,
    other: <MoreVertIcon />,
  };

  // Priority colors
  const priorityColors = {
    low: { color: 'info', bg: alpha(theme.palette.info.main, 0.1) },
    medium: { color: 'warning', bg: alpha(theme.palette.warning.main, 0.1) },
    high: { color: 'error', bg: alpha(theme.palette.error.main, 0.1) },
    critical: { color: 'error', bg: alpha(theme.palette.error.main, 0.2) },
  };

  // Status colors
  const statusColors = {
    pending: { color: 'warning', bg: alpha(theme.palette.warning.main, 0.1) },
    in_progress: { color: 'info', bg: alpha(theme.palette.info.main, 0.1) },
    completed: { color: 'success', bg: alpha(theme.palette.success.main, 0.1) },
    rejected: { color: 'error', bg: alpha(theme.palette.error.main, 0.1) },
  };

  // Fetch all compliance records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setLastError(null);

      const response = await databases.listDocuments(
        databaseId,
        collections.compliance,
        [Query.orderDesc('$createdAt')],
        100
      );

      // Normalize image URLs
      const normalizedRecords = response.documents.map(record => ({
        ...record,
        imageUrls: normalizeImageUrls(record.imageUrls),
      }));

      setRecords(normalizedRecords);
      applyFilters(normalizedRecords, searchQuery, filterPriority, filterStatus, currentTab);
    } catch (error) {
      console.error('Error fetching compliance records:', error);
      setLastError(t('compliance.fetchError', 'Error fetching compliance records'));
      showError(t('compliance.fetchError', 'Error fetching compliance records'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch users (students and staff)
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      // Fetch students
      const studentsResponse = await databases.listDocuments(
        databaseId,
        collections.users,
        [
          Query.equal('role', ['student']),
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]
      );

      // Fetch staff members
      const staffResponse = await databases.listDocuments(
        databaseId,
        collections.users,
        [
          Query.equal('role', ['admin', 'staff', 'service', 'restaurant']),
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]
      );

      setStudents(studentsResponse.documents);
      setStaffMembers(staffResponse.documents);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError(t('compliance.fetchUsersError', 'Error fetching users'));
    } finally {
      setLoadingUsers(false);
    }
  };

  // Normalize stored images.
  // Supports legacy formats:
  // - JSON string of string URLs
  // - array of string URLs
  // New format:
  // - JSON string / array of { id, url }
  const normalizeImageUrls = (imageUrls) => {
    if (!imageUrls) return [];

    try {
      const raw = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
      if (!Array.isArray(raw)) return [];

      const normalizeUrl = (u) => {
        if (!u) return '';

        // If just file ID (no http/https)
        if (!u.includes('://')) {
          return `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${u}/view?project=${appwriteConfig.projectId}`;
        }

        // Replace old endpoint if needed
        return u
          .replace('http://rafah-housing.com/v1', appwriteConfig.endpoint)
          .replace('http://appwrite.rafah-housing.com/v1', appwriteConfig.endpoint);
      };

      return raw
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'object') {
            const id = item.id || item.$id || item.fileId || '';
            const url = normalizeUrl(item.url || item.href || '');
            if (!url) return null;
            return { id, url };
          }
          const url = normalizeUrl(String(item));
          if (!url) return null;
          return { id: '', url };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error parsing image URLs:', error);
      return [];
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const total = records.length;
    const pending = records.filter(r => r.status === 'pending').length;
    const inProgress = records.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const totalCost = records.reduce((sum, r) => sum + (parseFloat(r.totalCost) || 0), 0);

    return { total, pending, inProgress, completed, totalCost };
  };

  // Apply filters
  const applyFilters = (recordsToFilter, search, priority, status, tab) => {
    let filtered = [...recordsToFilter];

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(record => 
        (record.title || '').toLowerCase().includes(query) ||
        (record.description || '').toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (priority !== 'all') {
      filtered = filtered.filter(record => record.priority === priority);
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(record => record.status === status);
    }

    // Tab filter
    if (tab !== 'all') {
      filtered = filtered.filter(record => record.status === tab);
    }

    setFilteredRecords(filtered);
  };

  // Handle filter changes
  useEffect(() => {
    applyFilters(records, searchQuery, filterPriority, filterStatus, currentTab);
  }, [searchQuery, filterPriority, filterStatus, currentTab, records]);

  // Initial fetch
  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle create button click
  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      category: 'maintenance',
      location: '',
      roomNumber: '',
      apartmentNumber: '',
      paidBy: 'management',
      paidByUserId: '',
      paidByUserName: '',
      assignedTo: '',
      assignedToName: '',
      workCost: 0,
      toolsCost: 0,
      totalCost: 0,
      notes: '',
      imageUrls: [],
    });
    setNewImages([]);
    setExistingImages([]);
    setSelectedRecord(null);
    setDialogMode('create');
    setOpenDialog(true);
  };

  // Handle view button click
  const handleView = (record) => {
    setSelectedRecord(record);
    setFormData({
      title: record.title || '',
      description: record.description || '',
      priority: record.priority || 'medium',
      status: record.status || 'pending',
      category: record.category || 'maintenance',
      location: record.location || '',
      roomNumber: record.roomNumber || '',
      apartmentNumber: record.apartmentNumber || '',
      paidBy: record.paidBy || 'management',
      paidByUserId: record.paidByUserId || '',
      paidByUserName: record.paidByUserName || '',
      assignedTo: record.assignedTo || '',
      assignedToName: record.assignedToName || '',
      workCost: parseFloat(record.workCost) || 0,
      toolsCost: parseFloat(record.toolsCost) || 0,
      totalCost: parseFloat(record.totalCost) || 0,
      notes: record.notes || '',
      imageUrls: record.imageUrls || [],
    });
    setExistingImages(normalizeImageUrls(record.imageUrls || []));
    setNewImages([]);
    setDialogMode('view');
    setOpenDialog(true);
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      title: record.title || '',
      description: record.description || '',
      priority: record.priority || 'medium',
      status: record.status || 'pending',
      category: record.category || 'maintenance',
      location: record.location || '',
      roomNumber: record.roomNumber || '',
      apartmentNumber: record.apartmentNumber || '',
      paidBy: record.paidBy || 'management',
      paidByUserId: record.paidByUserId || '',
      paidByUserName: record.paidByUserName || '',
      assignedTo: record.assignedTo || '',
      assignedToName: record.assignedToName || '',
      workCost: parseFloat(record.workCost) || 0,
      toolsCost: parseFloat(record.toolsCost) || 0,
      totalCost: parseFloat(record.totalCost) || 0,
      notes: record.notes || '',
      imageUrls: record.imageUrls || [],
    });
    setExistingImages(normalizeImageUrls(record.imageUrls || []));
    setNewImages([]);
    setDialogMode('edit');
    setOpenDialog(true);
  };

  // Handle delete button click
  const handleDelete = async (record) => {
    if (!window.confirm(t('compliance.deleteConfirm', 'Are you sure you want to delete this compliance record?'))) {
      return;
    }

    try {
      await databases.deleteDocument(
        databaseId,
        collections.compliance,
        record.$id
      );
      showSuccess(t('compliance.deleteSuccess', 'Compliance record deleted successfully'));
      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      showError(t('compliance.deleteError', 'Error deleting compliance record'));
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Calculate total cost
      if (name === 'workCost' || name === 'toolsCost') {
        updated.totalCost = (parseFloat(updated.workCost) || 0) + (parseFloat(updated.toolsCost) || 0);
      }

      // Handle paidBy changes
      if (name === 'paidBy' && value === 'management') {
        updated.paidByUserId = '';
        updated.paidByUserName = '';
      }

      // Handle assignedTo changes
      if (name === 'assignedTo') {
        const staff = staffMembers.find(s => s.$id === value);
        updated.assignedToName = staff ? (staff.name || staff.firstName + ' ' + staff.lastName) : '';
      }

      // Handle paidByUserId changes
      if (name === 'paidByUserId') {
        const student = students.find(s => s.$id === value);
        updated.paidByUserName = student ? (student.name || student.firstName + ' ' + student.lastName) : '';
      }

      // Set completedDate when status changes to completed
      if (name === 'status' && value === 'completed' && prev.status !== 'completed') {
        // Will be set on save
      }

      return updated;
    });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;

    if (totalImages > 5) {
      showError(t('compliance.maxImagesError', 'Maximum 5 images allowed'));
      return;
    }

    // Compress images (simplified - in production, use a proper image compression library)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                setNewImages(prev => [...prev, { file: compressedFile, preview: URL.createObjectURL(compressedFile) }]);
              },
              'image/jpeg',
              0.7
            );
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove new image
  const handleRemoveNewImage = (index) => {
    setNewImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Remove existing image
  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Upload images
  // Returns: [{ id, url }]
  const uploadImages = async () => {
    if (newImages.length === 0) return [];

    setUploadingImages(true);
    const uploaded = [];

    try {
      for (const imageData of newImages) {
        const fileId = AppwriteID.unique();
        const uploadedFile = await storage.createFile(
          bucketId,
          fileId,
          imageData.file,
          ['read("any")']
        );

        // Always prefer the real uploaded file ID (stable reference)
        const actualFileId = uploadedFile?.$id || fileId;
        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${bucketId}/files/${actualFileId}/view?project=${appwriteConfig.projectId}`;
        uploaded.push({ id: actualFileId, url: fileUrl });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      showError(t('compliance.imageUploadError', 'Error uploading images'));
      throw error;
    } finally {
      setUploadingImages(false);
    }

    return uploaded;
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      showError(t('compliance.titleRequired', 'Title is required'));
      return false;
    }
    if (!formData.description.trim()) {
      showError(t('compliance.descriptionRequired', 'Description is required'));
      return false;
    }
    if (formData.paidBy === 'student' && !formData.paidByUserId) {
      showError(t('compliance.studentRequired', 'Student selection is required when paid by student'));
      return false;
    }
    return true;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Upload new images
      const uploadedImages = await uploadImages();
      const allImages = [...existingImages, ...uploadedImages];

      // Get current user info
      const reportedBy = user?.$id || user?.id || '';
      const reportedByName = user?.name || user?.firstName + ' ' + user?.lastName || '';

      // Prepare record data
      const recordData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        category: formData.category,
        location: formData.location.trim() || '',
        roomNumber: formData.roomNumber.trim() || '',
        apartmentNumber: formData.apartmentNumber.trim() || '',
        reportedBy,
        reportedByName,
        paidBy: formData.paidBy,
        paidByUserId: formData.paidBy === 'student' ? formData.paidByUserId : '',
        paidByUserName: formData.paidBy === 'student' ? formData.paidByUserName : '',
        assignedTo: formData.assignedTo || '',
        assignedToName: formData.assignedToName || '',
        workCost: parseFloat(formData.workCost) || 0,
        toolsCost: parseFloat(formData.toolsCost) || 0,
        totalCost: parseFloat(formData.totalCost) || 0,
        notes: formData.notes.trim() || '',
        // Store as array of {id, url} (backward compatible reader)
        imageUrls: JSON.stringify(allImages),
        updatedAt: new Date().toISOString(),
      };

      // Set completedDate if status is completed
      if (formData.status === 'completed') {
        if (!selectedRecord || selectedRecord.status !== 'completed') {
          recordData.completedDate = new Date().toISOString();
        } else {
          recordData.completedDate = selectedRecord.completedDate || new Date().toISOString();
        }
      }

      if (dialogMode === 'create') {
        recordData.createdAt = new Date().toISOString();
        await databases.createDocument(
          databaseId,
          collections.compliance,
          AppwriteID.unique(),
          recordData
        );
        showSuccess(t('compliance.createSuccess', 'Compliance record created successfully'));
      } else if (dialogMode === 'edit') {
        await databases.updateDocument(
          databaseId,
          collections.compliance,
          selectedRecord.$id,
          recordData
        );
        showSuccess(t('compliance.updateSuccess', 'Compliance record updated successfully'));
      }

      setOpenDialog(false);
      fetchRecords();
    } catch (error) {
      console.error('Error saving compliance record:', error);
      showError(t('compliance.saveError', 'Error saving compliance record'));
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    // Clean up image preview URLs
    newImages.forEach(img => URL.revokeObjectURL(img.preview));
    setOpenDialog(false);
    setNewImages([]);
  };

  // Gallery controls
  const openGalleryAt = (index) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleGalleryClose = () => setGalleryOpen(false);

  const handleGalleryPrev = () => {
    setGalleryIndex((prev) => (prev === 0 ? Math.max(existingImages.length - 1, 0) : prev - 1));
  };

  const handleGalleryNext = () => {
    setGalleryIndex((prev) => (prev === existingImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!galleryOpen || existingImages.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setGalleryIndex((prev) => (prev === 0 ? Math.max(existingImages.length - 1, 0) : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setGalleryIndex((prev) => (prev === existingImages.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, existingImages.length]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const stats = calculateStats();

  return (
    <Box>
      {/* Error Banner */}
      {lastError && (
        <Alert severity="error" onClose={() => setLastError(null)} sx={{ mb: 3 }}>
          <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
          {lastError}
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title={t('compliance.title', 'Compliance Management')}
        subtitle={t('compliance.subtitle', 'Manage and Track Compliance Issues')}
        action={
          <IconButton onClick={fetchRecords} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      />

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title={t('compliance.stats.total', 'Total')}
            value={stats.total}
            icon={<AssignmentIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title={t('compliance.stats.pending', 'Pending')}
            value={stats.pending}
            icon={<ScheduleIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title={t('compliance.stats.inProgress', 'In Progress')}
            value={stats.inProgress}
            icon={<ScheduleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title={t('compliance.stats.completed', 'Completed')}
            value={stats.completed}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title={t('compliance.stats.totalCost', 'Total Cost (OMR)')}
            value={stats.totalCost.toFixed(2)}
            icon={<AttachMoneyIcon />}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={t('common.all', 'All')} value="all" />
          <Tab label={t('common.pending', 'Pending')} value="pending" />
          <Tab label={t('compliance.status.inProgress', 'In Progress')} value="in_progress" />
          <Tab label={t('common.completed', 'Completed')} value="completed" />
        </Tabs>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder={t('compliance.searchPlaceholder', 'Search by title or description...')}
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
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>{t('compliance.priority', 'Priority')}</InputLabel>
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              label={t('compliance.priority', 'Priority')}
            >
              <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
              <MenuItem value="low">{t('compliance.priorityOptions.low', 'Low')}</MenuItem>
              <MenuItem value="medium">{t('compliance.priorityOptions.medium', 'Medium')}</MenuItem>
              <MenuItem value="high">{t('compliance.priorityOptions.high', 'High')}</MenuItem>
              <MenuItem value="critical">{t('compliance.priorityOptions.critical', 'Critical')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>{t('common.status', 'Status')}</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label={t('common.status', 'Status')}
            >
              <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
              <MenuItem value="pending">{t('common.pending', 'Pending')}</MenuItem>
              <MenuItem value="in_progress">{t('compliance.status.inProgress', 'In Progress')}</MenuItem>
              <MenuItem value="completed">{t('common.completed', 'Completed')}</MenuItem>
              <MenuItem value="rejected">{t('common.rejected', 'Rejected')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Records List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredRecords.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {t('compliance.noRecords', 'No compliance records found')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredRecords.map((record) => (
            <Grid item xs={12} sm={6} md={4} key={record.$id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleView(record)}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {categoryIcons[record.category] || categoryIcons.other}
                    </Avatar>
                  }
                  title={
                    <Typography variant="h6" noWrap>
                      {record.title}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      <Chip
                        label={t(`compliance.categories.${record.category}`, record.category)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip
                        label={t(`compliance.status.${record.status}`, record.status)}
                        size="small"
                        color={statusColors[record.status]?.color}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  }
                  action={
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(record);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record);
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Thumbnail to quickly identify the issue */}
                  {Array.isArray(record.imageUrls) && record.imageUrls.length > 0 && (
                    <Box
                      sx={{
                        mb: 1.5,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        height: 140,
                        bgcolor: 'background.default',
                      }}
                    >
                      <img
                        src={record.imageUrls[0]?.url || record.imageUrls[0]}
                        alt={record.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {record.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip
                      label={`${t('compliance.priority', 'Priority')}: ${t(`compliance.priorityOptions.${record.priority}`, record.priority)}`}
                      size="small"
                      color={priorityColors[record.priority]?.color}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={`${parseFloat(record.totalCost || 0).toFixed(2)} OMR`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(record.createdAt)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={handleCreate}
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          {dialogMode === 'create' && t('compliance.create', 'Create Compliance Record')}
          {dialogMode === 'edit' && t('compliance.edit', 'Edit Compliance Record')}
          {dialogMode === 'view' && t('compliance.view', 'View Compliance Record')}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Issue Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('compliance.sections.issueInfo', '1. Issue Information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('compliance.title', 'Title')}
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('compliance.description', 'Description')}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Categorization */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.categorization', '2. Categorization')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('compliance.category', 'Category')}</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label={t('compliance.category', 'Category')}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="maintenance">{t('compliance.categories.maintenance', 'Maintenance')}</MenuItem>
                  <MenuItem value="electrical">{t('compliance.categories.electrical', 'Electrical')}</MenuItem>
                  <MenuItem value="plumbing">{t('compliance.categories.plumbing', 'Plumbing')}</MenuItem>
                  <MenuItem value="cleaning">{t('compliance.categories.cleaning', 'Cleaning')}</MenuItem>
                  <MenuItem value="safety">{t('compliance.categories.safety', 'Safety')}</MenuItem>
                  <MenuItem value="other">{t('compliance.categories.other', 'Other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('compliance.priority', 'Priority')}</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label={t('compliance.priority', 'Priority')}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="low">{t('compliance.priorityOptions.low', 'Low')}</MenuItem>
                  <MenuItem value="medium">{t('compliance.priorityOptions.medium', 'Medium')}</MenuItem>
                  <MenuItem value="high">{t('compliance.priorityOptions.high', 'High')}</MenuItem>
                  <MenuItem value="critical">{t('compliance.priorityOptions.critical', 'Critical')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('common.status', 'Status')}</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label={t('common.status', 'Status')}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="pending">{t('common.pending', 'Pending')}</MenuItem>
                  <MenuItem value="in_progress">{t('compliance.status.inProgress', 'In Progress')}</MenuItem>
                  <MenuItem value="completed">{t('common.completed', 'Completed')}</MenuItem>
                  <MenuItem value="rejected">{t('common.rejected', 'Rejected')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Location Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.location', '3. Location Information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('compliance.location', 'Location')}
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('compliance.roomNumber', 'Room Number')}
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('compliance.apartmentNumber', 'Apartment Number')}
                name="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={handleInputChange}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Payment Responsibility */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.payment', '4. Payment Responsibility')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('compliance.paidBy', 'Paid By')}</InputLabel>
                <Select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleInputChange}
                  label={t('compliance.paidBy', 'Paid By')}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="management">{t('compliance.paidByOptions.management', 'Management')}</MenuItem>
                  <MenuItem value="student">{t('compliance.paidByOptions.student', 'Student')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.paidBy === 'student' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('compliance.student', 'Student')}</InputLabel>
                  <Select
                    name="paidByUserId"
                    value={formData.paidByUserId}
                    onChange={handleInputChange}
                    label={t('compliance.student', 'Student')}
                    disabled={dialogMode === 'view' || loadingUsers}
                  >
                    {students.map((student) => (
                      <MenuItem key={student.$id} value={student.$id}>
                        {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Staff Assignment */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.staff', '5. Staff Assignment')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('compliance.assignedTo', 'Assigned To')}</InputLabel>
                <Select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  label={t('compliance.assignedTo', 'Assigned To')}
                  disabled={dialogMode === 'view' || loadingUsers}
                >
                  <MenuItem value="">{t('common.none', 'None')}</MenuItem>
                  {staffMembers.map((staff) => (
                    <MenuItem key={staff.$id} value={staff.$id}>
                      {staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Cost Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.cost', '6. Cost Information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('compliance.workCost', 'Work Cost (OMR)')}
                name="workCost"
                type="number"
                value={formData.workCost}
                onChange={handleInputChange}
                required
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('compliance.toolsCost', 'Tools Cost (OMR)')}
                name="toolsCost"
                type="number"
                value={formData.toolsCost}
                onChange={handleInputChange}
                required
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: theme.palette.success.light,
                  color: theme.palette.success.contrastText,
                }}
              >
                <Typography variant="h6">
                  {t('compliance.totalCost', 'Total Cost')}: {formData.totalCost.toFixed(2)} OMR
                </Typography>
              </Paper>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {t('compliance.sections.additional', '7. Additional Information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('compliance.notes', 'Notes')}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Image Management */}
            {dialogMode !== 'view' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {t('compliance.sections.images', '8. Image Management')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CameraAltIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={existingImages.length + newImages.length >= 5}
                  >
                    {t('compliance.uploadImage', 'Upload Image')}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    ({existingImages.length + newImages.length}/5 {t('compliance.images', 'images')})
                  </Typography>
                </Stack>

                {uploadingImages && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="caption" color="text.secondary">
                      {t('compliance.uploading', 'Uploading images...')}
                    </Typography>
                  </Box>
                )}

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {existingImages.map((img, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={img?.url || img}
                            alt={`Existing ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                            onClick={() => openGalleryAt(index)}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                            onClick={() => handleRemoveExistingImage(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* New Images */}
                {newImages.length > 0 && (
                  <Grid container spacing={2}>
                    {newImages.map((imageData, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={imageData.preview}
                            alt={`New ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                            onClick={() => handleRemoveNewImage(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            )}

            {/* View Mode Images */}
            {dialogMode === 'view' && existingImages.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {t('compliance.sections.images', '8. Image Management')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {existingImages.map((img, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <img
                        src={img?.url || img}
                        alt={`Image ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                        onClick={() => openGalleryAt(index)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* View Mode - Additional Info */}
            {dialogMode === 'view' && selectedRecord && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {t('compliance.metadata', 'Metadata')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('compliance.reportedBy', 'Reported By')}
                  </Typography>
                  <Typography variant="body1">{selectedRecord.reportedByName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.createdAt', 'Created At')}
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedRecord.createdAt)}</Typography>
                </Grid>
                {selectedRecord.completedDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('compliance.completedDate', 'Completed Date')}
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedRecord.completedDate)}</Typography>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        {dialogMode !== 'view' && (
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel', 'Cancel')}</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={uploadingImages}
            >
              {dialogMode === 'create'
                ? t('common.create', 'Create')
                : t('common.update', 'Update')}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Image Gallery Viewer */}
      <Dialog
        open={galleryOpen && existingImages.length > 0}
        onClose={handleGalleryClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('compliance.imageGallery', 'Image Gallery')} ({galleryIndex + 1} / {existingImages.length})
          </Typography>
          <IconButton
            onClick={handleGalleryClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            bgcolor: 'background.default',
            p: 2,
            minHeight: '60vh',
          }}
        >
          {existingImages.length > 1 && (
            <IconButton
              onClick={handleGalleryPrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 1,
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          )}
          <Box
            component="img"
            src={existingImages[galleryIndex]?.url || existingImages[galleryIndex]}
            alt={`Compliance Image ${galleryIndex + 1}`}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: 3,
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {existingImages.length > 1 && (
            <IconButton
              onClick={handleGalleryNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                zIndex: 1,
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}
        </DialogContent>
        {existingImages.length > 1 && (
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('compliance.useArrows', 'Use arrow keys or buttons to navigate')}
            </Typography>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default Compliance;

