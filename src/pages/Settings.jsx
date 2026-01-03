import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Translate as TranslateIcon,
  Palette as PaletteIcon,
  PersonOutline as PersonOutlineIcon,
  MailOutline as MailOutlineIcon,
  Backup as BackupIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Language as LanguageIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as StaffIcon,
  School as StudentIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import PageHeader from '../components/common/PageHeader';
import AppwriteConnectionTest from '../components/AppwriteConnectionTest';

const Settings = () => {
  const { t, language, changeLanguage, supportedLanguages } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useCustomTheme();
  const { showSuccess } = useNotification();
  const theme = useTheme();
  
  const [currentTab, setCurrentTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Rafah Admin Dashboard',
    siteDescription: 'Student Housing Management System',
    contactEmail: 'admin@sukna.com',
    supportPhone: '+966 12 345 6789',
    maintenanceMode: false,
    allowRegistration: true,
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newUserNotification: true,
    newContractNotification: true,
    paymentReminderNotification: true,
    maintenanceRequestNotification: true,
    checkoutRequestNotification: true,
  });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle general settings change
  const handleGeneralSettingsChange = (e) => {
    const { name, value, checked, type } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle notification settings change
  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked,
    });
  };
  
  // Handle theme change
  const handleThemeChange = (selectedTheme) => {
    const isCurrentlyDark = isDarkMode;
    const shouldBeDark = selectedTheme === 'dark';
    
    if (isCurrentlyDark !== shouldBeDark) {
      toggleDarkMode();
      showSuccess(t('settings.themeChanged'));
    }
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    showSuccess(t('settings.settingsSaved'));
  };
  
  // Create backup
  const handleCreateBackup = async () => {
    setSaving(true);
    // Simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    showSuccess(t('settings.backupCreated'));
  };

  const tabItems = [
    { value: 'general', label: t('settings.general'), icon: <SettingsIcon /> },
    { value: 'notifications', label: t('settings.notifications'), icon: <NotificationsIcon /> },
    { value: 'theme', label: t('settings.theme'), icon: <PaletteIcon /> },
    { value: 'language', label: t('settings.language'), icon: <LanguageIcon /> },
    { value: 'backup', label: t('settings.backup'), icon: <BackupIcon /> },
    { value: 'userRoles', label: t('settings.userRoles'), icon: <SecurityIcon /> },
  ];
  
  return (
    <>
      <PageHeader title={t('settings.title')} />
      
      <Grid container spacing={3}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Tabs
              orientation="vertical"
              value={currentTab}
              onChange={handleTabChange}
              sx={{ 
                '& .MuiTab-root': { 
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  minHeight: 56,
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mb: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiSvgIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {tabItems.map((item) => (
                <Tab 
                  key={item.value}
                  icon={item.icon} 
                  iconPosition="start"
                  label={item.label} 
                  value={item.value}
                />
              ))}
            </Tabs>
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              minHeight: 600,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            {/* General Settings */}
            {currentTab === 'general' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SettingsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.general')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.generalDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings.siteName')}
                      name="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralSettingsChange}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings.contactEmail')}
                      name="contactEmail"
                      value={generalSettings.contactEmail}
                      onChange={handleGeneralSettingsChange}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('settings.siteDescription')}
                      name="siteDescription"
                      value={generalSettings.siteDescription}
                      onChange={handleGeneralSettingsChange}
                      multiline
                      rows={2}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings.supportPhone')}
                      name="supportPhone"
                      value={generalSettings.supportPhone}
                      onChange={handleGeneralSettingsChange}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        bgcolor: generalSettings.maintenanceMode ? 'warning.light' : 'background.paper',
                        borderColor: generalSettings.maintenanceMode ? 'warning.main' : 'divider',
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {t('settings.maintenanceMode')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('settings.maintenanceModeDescription')}
                            </Typography>
                          </Box>
                          <Switch
                            checked={generalSettings.maintenanceMode}
                            onChange={handleGeneralSettingsChange}
                            name="maintenanceMode"
                            color="warning"
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {t('settings.allowRegistration')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('settings.allowRegistrationDescription')}
                            </Typography>
                          </Box>
                          <Switch
                            checked={generalSettings.allowRegistration}
                            onChange={handleGeneralSettingsChange}
                            name="allowRegistration"
                            color="primary"
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveSettings}
                        disabled={saving}
                        sx={{ px: 4 }}
                      >
                        {saving ? t('settings.saving') : t('settings.saveSettings')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Notification Settings */}
            {currentTab === 'notifications' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <NotificationsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.notifications')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.notificationsDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title={t('settings.emailNotifications')}
                        subheader={t('settings.emailNotificationsDescription')}
                        action={
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onChange={handleNotificationSettingsChange}
                            name="emailNotifications"
                          />
                        }
                      />
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardHeader
                        title={t('settings.pushNotifications')}
                        subheader={t('settings.pushNotificationsDescription')}
                        action={
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onChange={handleNotificationSettingsChange}
                            name="pushNotifications"
                          />
                        }
                      />
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      {t('settings.notificationEvents')}
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { key: 'newUserNotification', label: t('settings.newUserNotification') },
                        { key: 'newContractNotification', label: t('settings.newContractNotification') },
                        { key: 'paymentReminderNotification', label: t('settings.paymentReminderNotification') },
                        { key: 'maintenanceRequestNotification', label: t('settings.maintenanceRequestNotification') },
                        { key: 'checkoutRequestNotification', label: t('settings.checkoutRequestNotification') },
                      ].map((item) => (
                        <Grid item xs={12} md={6} key={item.key}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="subtitle2">
                                  {item.label}
                                </Typography>
                                <Switch
                                  checked={notificationSettings[item.key]}
                                  onChange={handleNotificationSettingsChange}
                                  name={item.key}
                                  size="small"
                                />
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveSettings}
                        disabled={saving}
                        sx={{ px: 4 }}
                      >
                        {saving ? t('settings.saving') : t('settings.saveSettings')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Theme Settings */}
            {currentTab === 'theme' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PaletteIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.theme')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.themeDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card 
                      onClick={() => handleThemeChange('light')}
                      sx={{ 
                        cursor: 'pointer',
                        border: !isDarkMode ? `2px solid` : '1px solid',
                        borderColor: !isDarkMode ? 'primary.main' : 'divider',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardHeader 
                        avatar={<LightModeIcon />}
                        title={t('settings.lightMode')}
                        subheader={t('settings.lightModeDescription')}
                        action={
                          !isDarkMode && (
                            <CheckCircleIcon color="primary" />
                          )
                        }
                      />
                      <CardContent>
                        <Box sx={{ 
                          bgcolor: '#f8fafc', 
                          p: 2, 
                          borderRadius: 1, 
                          height: 80,
                          display: 'flex',
                          gap: 1,
                        }}>
                          <Box sx={{ 
                            bgcolor: '#ffffff', 
                            flex: 1,
                            borderRadius: 0.5,
                            border: '1px solid #e2e8f0',
                          }} />
                          <Box sx={{ 
                            bgcolor: '#3b82f6', 
                            width: 40,
                            borderRadius: 0.5,
                          }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card 
                      onClick={() => handleThemeChange('dark')}
                      sx={{ 
                        cursor: 'pointer',
                        border: isDarkMode ? `2px solid` : '1px solid',
                        borderColor: isDarkMode ? 'primary.main' : 'divider',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardHeader 
                        avatar={<DarkModeIcon />}
                        title={t('settings.darkMode')}
                        subheader={t('settings.darkModeDescription')}
                        action={
                          isDarkMode && (
                            <CheckCircleIcon color="primary" />
                          )
                        }
                      />
                      <CardContent>
                        <Box sx={{ 
                          bgcolor: '#0f172a', 
                          p: 2, 
                          borderRadius: 1, 
                          height: 80,
                          display: 'flex',
                          gap: 1,
                        }}>
                          <Box sx={{ 
                            bgcolor: '#1e293b', 
                            flex: 1,
                            borderRadius: 0.5,
                          }} />
                          <Box sx={{ 
                            bgcolor: '#3b82f6', 
                            width: 40,
                            borderRadius: 0.5,
                          }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Language Settings */}
            {currentTab === 'language' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <LanguageIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.language')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.languageDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  {Object.keys(supportedLanguages).map((langCode) => (
                    <Grid item xs={12} md={6} key={langCode}>
                      <Card 
                        onClick={() => changeLanguage(langCode)}
                        sx={{ 
                          cursor: 'pointer',
                          border: language === langCode ? `2px solid` : '1px solid',
                          borderColor: language === langCode ? 'primary.main' : 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardHeader 
                          avatar={
                            <Typography variant="h4">
                              {langCode === 'en' ? '🇺🇸' : '🇸🇦'}
                            </Typography>
                          }
                          title={supportedLanguages[langCode].name}
                          subheader={langCode === 'en' ? 'Left to Right (LTR)' : 'Right to Left (RTL)'}
                          action={
                            language === langCode && (
                              <CheckCircleIcon color="primary" />
                            )
                          }
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Backup & Restore */}
            {currentTab === 'backup' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <BackupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.backup')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.backupDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={2} alignItems="center" textAlign="center">
                          <BackupIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          <Typography variant="h6">
                            {t('settings.createBackup')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                            {t('settings.createBackupDescription')}
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<BackupIcon />}
                            onClick={handleCreateBackup}
                            disabled={saving}
                            sx={{ mt: 2 }}
                          >
                            {saving ? t('settings.creatingBackup') : t('settings.backupNow')}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* User Roles */}
            {currentTab === 'userRoles' && (
              <Box>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SecurityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {t('settings.userRoles')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.userRolesDescription')}
                    </Typography>
                  </Box>
                </Stack>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                          <AdminIcon />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {t('settings.administrator')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {t('settings.adminDescription')}
                        </Typography>
                        <Chip label={t('settings.fullAccess')} color="error" size="small" />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                          <StaffIcon />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {t('settings.staff')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {t('settings.staffDescription')}
                        </Typography>
                        <Chip label={t('settings.limitedAccess')} color="warning" size="small" />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2, width: 56, height: 56 }}>
                          <StudentIcon />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {t('settings.student')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {t('settings.studentDescription')}
                        </Typography>
                        <Chip label={t('settings.basicAccess')} color="info" size="small" />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
    </>
  );
};

export default Settings; 