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
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Email as EmailIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAppWrite } from '../contexts/AppWriteContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/common/PageHeader';
import { Query } from 'appwrite';

const Users = () => {
  const { databases, databaseId, collections } = useAppWrite();
  const { showSuccess, showError } = useNotification();
  const { t, isRTL } = useLanguage();
  const { user: currentUser } = useAuth();
  
  // State for user data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'delete'
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState('active');
  
  // State for pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // State for action menu
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    status: 'active',
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Fetch users from the database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Prepare filters
      const filters = [];
      
      if (filterRole !== 'all') {
        filters.push(Query.equal('role', filterRole));
      }
      
      if (filterStatus !== 'all') {
        filters.push(Query.equal('status', filterStatus));
      }
      
      if (searchQuery) {
        filters.push(Query.search('name', searchQuery));
      }
      
      if (currentTab === 'active') {
        filters.push(Query.equal('status', 'active'));
      } else if (currentTab === 'inactive') {
        filters.push(Query.equal('status', 'inactive'));
      }
      
      // Fetch users
      const response = await databases.listDocuments(
        databaseId,
        collections.users,
        filters,
        paginationModel.pageSize,
        paginationModel.page * paginationModel.pageSize,
        'name',
        'ASC'
      );
      
      setUsers(response.documents);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError(t('users.fetchError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    // Mock data for demo
    const mockUsers = Array(25).fill().map((_, i) => ({
      $id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `+966 5${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
      role: i < 2 ? 'admin' : i < 8 ? 'staff' : 'student',
      status: i % 10 === 0 ? 'inactive' : 'active',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
    }));
    
    setUsers(mockUsers);
    setTotalUsers(mockUsers.length);
    setLoading(false);
    
    // Uncomment to use real data
    // fetchUsers();
  }, [paginationModel, searchQuery, filterRole, filterStatus, currentTab]);
  
  // Handle dialog open for create
  const handleCreateUser = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'student',
      status: 'active',
    });
    setFormErrors({
      name: '',
      email: '',
      phone: '',
    });
    setDialogMode('create');
    setOpenDialog(true);
  };
  
  // Handle dialog open for edit
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setFormErrors({
      name: '',
      email: '',
      phone: '',
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Handle dialog open for delete
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDialogMode('delete');
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
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
    
    if (!formData.name.trim()) {
      errors.name = t('common.requiredField');
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = t('common.requiredField');
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = t('common.invalidEmail');
      isValid = false;
    }
    
    if (formData.phone && !/^\+?[0-9\s-]{8,15}$/.test(formData.phone.trim())) {
      errors.phone = t('common.invalidPhone');
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (dialogMode === 'create') {
        // Create user logic would go here
        showSuccess(t('users.userCreated'));
      } else if (dialogMode === 'edit') {
        // Edit user logic would go here
        showSuccess(t('users.userUpdated'));
      }
      
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error(`Error ${dialogMode === 'create' ? 'creating' : 'updating'} user:`, error);
      showError(dialogMode === 'create' ? t('users.createError') : t('users.updateError'));
    }
  };
  
  // Handle user deletion
  const handleConfirmDelete = async () => {
    try {
      // Delete user logic would go here
      showSuccess(t('users.userDeleted'));
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError(t('users.deleteError'));
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setActionUser(user);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionUser(null);
  };
  
  // Data grid columns
  const columns = [
    {
      field: 'name',
      headerName: t('users.name'),
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'email',
      headerName: t('users.email'),
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: t('users.phone'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'role',
      headerName: t('users.role'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={t(`users.roles.${params.value}`)}
          color={
            params.value === 'admin' 
              ? 'error' 
              : params.value === 'staff' 
                ? 'warning' 
                : 'info'
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: t('users.status'),
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={t(`users.status.${params.value}`)}
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('users.createdAt'),
      flex: 1,
      minWidth: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
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
              onClick={() => handleEditUser(params.row)}
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
  
  return (
    <>
      <PageHeader
        title={t('users.title')}
        actionLabel={t('users.create')}
        onAction={handleCreateUser}
      />
      
      <Paper sx={{ mb: 3, p: 2 }}>
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
            sx={{ minWidth: 220 }}
          />
          
          {/* Role filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="role-filter-label">{t('users.role')}</InputLabel>
            <Select
              labelId="role-filter-label"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label={t('users.role')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="admin">{t('users.roles.admin')}</MenuItem>
              <MenuItem value="staff">{t('users.roles.staff')}</MenuItem>
              <MenuItem value="student">{t('users.roles.student')}</MenuItem>
            </Select>
          </FormControl>
          
          {/* Status filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">{t('users.status')}</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label={t('users.status')}
            >
              <MenuItem value="all">{t('common.all')}</MenuItem>
              <MenuItem value="active">{t('users.status.active')}</MenuItem>
              <MenuItem value="inactive">{t('users.status.inactive')}</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Refresh button */}
          <Tooltip title={t('common.refresh')}>
            <IconButton 
              onClick={() => fetchUsers()}
              color="default"
              aria-label={t('common.refresh')}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {/* Add user button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            color="primary"
          >
            {t('users.create')}
          </Button>
        </Box>
        
        {/* User tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="all" label={t('common.all')} />
          <Tab value="active" label={t('users.status.active')} />
          <Tab value="inactive" label={t('users.status.inactive')} />
        </Tabs>
        
        {/* Users data grid */}
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            getRowId={(row) => row.$id}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={totalUsers}
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
      
      {/* User CRUD Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {dialogMode === 'delete' ? (
          <>
            <DialogTitle>{t('users.deleteConfirm')}</DialogTitle>
            <DialogContent>
              <Typography>
                {t('users.deleteWarning', { name: selectedUser?.name })}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
              <Button onClick={handleConfirmDelete} color="error" variant="contained">
                {t('common.delete')}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>
              {dialogMode === 'create' ? t('users.create') : t('users.edit')}
            </DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label={t('users.name')}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  label={t('users.email')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  disabled={dialogMode === 'edit'}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  label={t('users.phone')}
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('users.role')}</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label={t('users.role')}
                  >
                    <MenuItem value="admin">{t('users.roles.admin')}</MenuItem>
                    <MenuItem value="staff">{t('users.roles.staff')}</MenuItem>
                    <MenuItem value="student">{t('users.roles.student')}</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>{t('users.status')}</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label={t('users.status')}
                  >
                    <MenuItem value="active">{t('users.status.active')}</MenuItem>
                    <MenuItem value="inactive">{t('users.status.inactive')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
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
      >
        <MenuItem onClick={() => {
          handleActionMenuClose();
          handleEditUser(actionUser);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleActionMenuClose();
          // Copy email logic
          navigator.clipboard.writeText(actionUser?.email);
          showSuccess(t('common.copied'));
        }}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.copyEmail')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleActionMenuClose();
          // Send email logic
          window.location.href = `mailto:${actionUser?.email}`;
        }}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.sendEmail')}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleActionMenuClose();
          // Toggle status logic
          const newStatus = actionUser?.status === 'active' ? 'inactive' : 'active';
          // API call would go here
          showSuccess(t('users.statusChanged'));
        }}>
          <ListItemIcon>
            {actionUser?.status === 'active' ? 
              <BlockIcon fontSize="small" /> : 
              <CheckCircleIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText>
            {actionUser?.status === 'active' ? 
              t('users.deactivate') : 
              t('users.activate')
            }
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleActionMenuClose();
          handleDeleteUser(actionUser);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Users; 