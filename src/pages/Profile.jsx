import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  IconButton,
  Alert,
  Card,
  CardContent,
  Tab,
  Tabs,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/common/PageHeader';

const Profile = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  
  const [currentTab, setCurrentTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Form errors
  const [errors, setErrors] = useState({});
  
  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        bio: user.bio || '',
      });
    }
  }, [user]);
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = t('common.requiredField');
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = t('common.requiredField');
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = t('common.invalidEmail');
    }
    
    if (profileData.phone && !/^\+?[0-9\s-()]+$/.test(profileData.phone)) {
      newErrors.phone = t('common.invalidPhone');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t('common.requiredField');
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = t('common.requiredField');
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = t('auth.passwordLength');
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = t('common.requiredField');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t('common.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    // Update profile logic would go here
    showSuccess(t('profile.profileUpdated'));
    setEditMode(false);
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    // Update password logic would go here
    showSuccess(t('profile.passwordChanged'));
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  
  return (
    <>
      <PageHeader
        title={t('profile.title')}
        actionLabel={editMode ? t('common.save') : t('common.edit')}
        actionIcon={editMode ? <SaveIcon /> : <EditIcon />}
        onAction={editMode ? handleProfileSubmit : toggleEditMode}
      />
      
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            value="profile" 
            label={t('profile.profileInfo')} 
            icon={<PersonIcon />} 
            iconPosition="start" 
          />
          <Tab 
            value="security" 
            label={t('profile.security')} 
            icon={<SecurityIcon />} 
            iconPosition="start" 
          />
        </Tabs>
      </Box>
      
      {currentTab === 'profile' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={user?.profileImage}
                    alt={user?.name}
                    sx={{ width: 120, height: 120, mb: 2 }}
                  />
                  {editMode && (
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'background.default' },
                      }}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  )}
                </Box>
                
                <Typography variant="h5" gutterBottom>
                  {user?.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                
                <Chip
                  label={t(`users.roles.${user?.role || 'staff'}`)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleProfileSubmit}>
                <Typography variant="h6" gutterBottom>
                  {t('profile.personalInfo')}
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('users.name')}
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileInputChange}
                      disabled={!editMode}
                      error={!!errors.name}
                      helperText={errors.name}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.email')}
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileInputChange}
                      disabled={!editMode}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('users.phone')}
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileInputChange}
                      disabled={!editMode}
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('profile.bio')}
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileInputChange}
                      disabled={!editMode}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
                
                {editMode && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      sx={{ mr: 1 }}
                      onClick={toggleEditMode}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      variant="contained" 
                      type="submit"
                    >
                      {t('common.save')}
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {currentTab === 'security' && (
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Typography variant="h6" gutterBottom>
              {t('profile.changePassword')}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('profile.passwordRequirements')}
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('profile.currentPassword')}
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('profile.newPassword')}
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('profile.confirmPassword')}
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                type="submit"
              >
                {t('profile.updatePassword')}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Profile; 