import React, { useState } from 'react';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Chip,
  Fade,
  Button,
  CircularProgress
} from '@mui/material';
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageMenu = ({ color = 'inherit', variant = 'icon', size = 'small' }) => {
  const { language, changeLanguage, t, isRTL, supportedLanguages, isTransitioning } = useLanguage();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (lang) => {
    handleClose();
    if (lang !== language) {
      changeLanguage(lang);
    }
  };
  
  const currentLang = supportedLanguages[language];
  
  // Icon variant (default)
  if (variant === 'icon') {
    return (
      <>
        <Tooltip 
          title={t('common.language')} 
          placement={isRTL ? 'bottom-start' : 'bottom-end'}
          arrow
        >
          <IconButton
            onClick={handleClick}
            size={size}
            color={color}
            disabled={isTransitioning}
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              },
              position: 'relative',
            }}
          >
            {isTransitioning ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <LanguageIcon />
            )}
          </IconButton>
        </Tooltip>
        
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          TransitionComponent={Fade}
          transformOrigin={{ 
            horizontal: isRTL ? 'left' : 'right', 
            vertical: 'top' 
          }}
          anchorOrigin={{ 
            horizontal: isRTL ? 'left' : 'right', 
            vertical: 'bottom' 
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 160,
              direction: isRTL ? 'rtl' : 'ltr',
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                margin: '2px 8px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            },
          }}
        >
          {Object.entries(supportedLanguages).map(([langCode, langData]) => (
            <MenuItem 
              key={langCode}
              onClick={() => handleLanguageChange(langCode)}
              selected={language === langCode}
              disabled={isTransitioning}
              sx={{
                direction: isRTL ? 'rtl' : 'ltr',
                justifyContent: 'space-between',
                minHeight: 48,
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                flex: 1,
              }}>
                <ListItemIcon sx={{ minWidth: 'auto' }}>
                  <span role="img" aria-label={langData.name}>
                    {langCode === 'en' ? '🇺🇸' : '🇸🇦'}
                  </span>
                </ListItemIcon>
                <ListItemText 
                  primary={langData.name}
                  secondary={langCode === 'en' ? 'English' : 'العربية'}
                  primaryTypographyProps={{
                    fontWeight: language === langCode ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              {language === langCode && (
                <CheckIcon 
                  color="primary" 
                  fontSize="small"
                  sx={{ 
                    ml: isRTL ? 0 : 1,
                    mr: isRTL ? 1 : 0,
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  
  // Button variant
  if (variant === 'button') {
    return (
      <>
        <Button
          onClick={handleClick}
          color={color}
          variant="outlined"
          size={size}
          disabled={isTransitioning}
          startIcon={isTransitioning ? <CircularProgress size={16} /> : <LanguageIcon />}
          endIcon={currentLang && !isTransitioning ? (
            <span role="img" aria-label={currentLang.name}>
              {language === 'en' ? '🇺🇸' : '🇸🇦'}
            </span>
          ) : null}
          sx={{
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
            minWidth: 120,
          }}
        >
          {currentLang?.name || t('common.language')}
        </Button>
        
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          TransitionComponent={Fade}
          transformOrigin={{ 
            horizontal: isRTL ? 'right' : 'left', 
            vertical: 'top' 
          }}
          anchorOrigin={{ 
            horizontal: isRTL ? 'right' : 'left', 
            vertical: 'bottom' 
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: anchorEl?.offsetWidth || 160,
              direction: isRTL ? 'rtl' : 'ltr',
            },
          }}
        >
          {Object.entries(supportedLanguages).map(([langCode, langData]) => (
            <MenuItem 
              key={langCode}
              onClick={() => handleLanguageChange(langCode)}
              selected={language === langCode}
              disabled={isTransitioning}
              sx={{
                direction: isRTL ? 'rtl' : 'ltr',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                flex: 1,
              }}>
                <span role="img" aria-label={langData.name}>
                  {langCode === 'en' ? '🇺🇸' : '🇸🇦'}
                </span>
                <Typography variant="body2">
                  {langData.name}
                </Typography>
              </Box>
              {language === langCode && (
                <CheckIcon color="primary" fontSize="small" />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  
  // Chip variant
  if (variant === 'chip') {
    return (
      <>
        <Chip
          icon={isTransitioning ? <CircularProgress size={16} /> : <LanguageIcon />}
          label={currentLang?.name || t('common.language')}
          onClick={handleClick}
          disabled={isTransitioning}
          variant="outlined"
          size={size}
          sx={{
            direction: isRTL ? 'rtl' : 'ltr',
            '& .MuiChip-icon': {
              order: isRTL ? 2 : 0,
              ml: isRTL ? 1 : 0,
              mr: isRTL ? 0 : 1,
            },
            '& .MuiChip-label': {
              order: isRTL ? 1 : 1,
            },
          }}
        />
        
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 140,
              direction: isRTL ? 'rtl' : 'ltr',
            },
          }}
        >
          {Object.entries(supportedLanguages).map(([langCode, langData]) => (
            <MenuItem 
              key={langCode}
              onClick={() => handleLanguageChange(langCode)}
              selected={language === langCode}
              disabled={isTransitioning}
            >
              <ListItemIcon>
                <span role="img" aria-label={langData.name}>
                  {langCode === 'en' ? '🇺🇸' : '🇸🇦'}
                </span>
              </ListItemIcon>
              <ListItemText>{langData.name}</ListItemText>
              {language === langCode && (
                <CheckIcon color="primary" fontSize="small" />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  
  return null;
};

export default LanguageMenu; 