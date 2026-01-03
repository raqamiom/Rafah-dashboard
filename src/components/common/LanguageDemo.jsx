import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
  FormatTextdirection as RTLIcon,
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import LanguageMenu from '../navigation/LanguageMenu';

const LanguageDemo = () => {
  const { t, isRTL, language, isTransitioning } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const features = [
    {
      icon: <LanguageIcon color="primary" />,
      title: t('common.language'),
      description: 'Seamless language switching with smooth transitions',
    },
    {
      icon: <RTLIcon color="primary" />,
      title: 'RTL Support',
      description: 'Complete right-to-left layout support for Arabic',
    },
    {
      icon: <TranslateIcon color="primary" />,
      title: 'Typography',
      description: 'Optimized fonts and text rendering for both languages',
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Performance',
      description: 'Memoized translations and efficient re-renders',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('common.language')} & RTL Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the enhanced internationalization features including 
        smooth language transitions, complete RTL support, and optimized performance.
      </Typography>

      <Grid container spacing={3}>
        {/* Language Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Language Controls
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Icon Variant:
                </Typography>
                <LanguageMenu variant="icon" />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Button Variant:
                </Typography>
                <LanguageMenu variant="button" />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Chip Variant:
                </Typography>
                <LanguageMenu variant="chip" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                  />
                }
                label="Dark Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Current State */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current State
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Language"
                    secondary={language === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <RTLIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Direction"
                    secondary={isRTL ? 'Right-to-Left' : 'Left-to-Right'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Transitioning"
                    secondary={isTransitioning ? 'Yes' : 'No'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PaletteIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Theme"
                    secondary={isDarkMode ? 'Dark' : 'Light'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Features */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enhanced Features
              </Typography>
              
              <Grid container spacing={2}>
                {features.map((feature, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      {feature.icon}
                      <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Demo */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form Components Demo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('common.name')}
                    placeholder="Enter your name"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('common.email')}
                    placeholder="Enter your email"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('common.status')}</InputLabel>
                    <Select
                      value=""
                      label={t('common.status')}
                    >
                      <MenuItem value="active">{t('common.active')}</MenuItem>
                      <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
                      <MenuItem value="pending">{t('common.pending')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CheckIcon />}
                  >
                    {t('common.submit')}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Typography Demo */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Typography Demo
              </Typography>
              
              <Typography variant="h1" gutterBottom>
                {t('app.title')} - H1
              </Typography>
              <Typography variant="h2" gutterBottom>
                {t('app.title')} - H2
              </Typography>
              <Typography variant="h3" gutterBottom>
                {t('app.title')} - H3
              </Typography>
              <Typography variant="h4" gutterBottom>
                {t('app.title')} - H4
              </Typography>
              <Typography variant="h5" gutterBottom>
                {t('app.title')} - H5
              </Typography>
              <Typography variant="h6" gutterBottom>
                {t('app.title')} - H6
              </Typography>
              
              <Typography variant="body1" paragraph>
                This is body1 text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                This is body2 text with secondary color. Ut enim ad minim veniam, 
                quis nostrud exercitation ullamco laboris.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LanguageDemo; 