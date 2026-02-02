import { useState, useEffect } from 'react';
import { Box, Toolbar, CssBaseline, Typography, Divider, IconButton, Container, useMediaQuery, Fade, Slide, alpha } from '@mui/material';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Import navigation components
import SidebarNav from '../components/navigation/SidebarNav';
import UserMenu from '../components/navigation/UserMenu';
import NotificationMenu from '../components/navigation/NotificationMenu';
import LanguageMenu from '../components/navigation/LanguageMenu';
import Breadcrumbs from '../components/navigation/Breadcrumbs';

// Drawer width
const drawerWidth = 280;
const drawerCollapsedWidth = 72;

// Enhanced Styled components for the AppBar with better theme integration
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isRTL',
})(({ theme, open, isRTL }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin', 'box-shadow'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  }),
  // Enhanced backdrop blur effect
  backdropFilter: 'blur(20px)',
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.9)
    : alpha(theme.palette.primary.main, 0.95),
  // Beautiful box shadow with theme awareness
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 16px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 5px rgba(0, 0, 0, 0.05)',
  // Subtle border for better definition
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  // Fix RTL positioning - ensure full width coverage
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  ...(open && {
    ...(isRTL ? {
      paddingRight: drawerWidth,
      paddingLeft: 0,
    } : {
      paddingLeft: drawerWidth,
      paddingRight: 0,
    }),
    transition: theme.transitions.create(['padding', 'box-shadow'], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(!open && {
    ...(isRTL ? {
      paddingRight: drawerCollapsedWidth,
      paddingLeft: 0,
    } : {
      paddingLeft: drawerCollapsedWidth,
      paddingRight: 0,
    }),
  }),
}));

// Enhanced Styled components for the Drawer with beautiful shadows and colors
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isRTL' && prop !== 'isMobile',
})(({ theme, open, isRTL, isMobile }) => ({
  // For permanent drawer (desktop), apply custom styles
  ...(!isMobile && {
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create(['width', 'transform', 'box-shadow'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      boxSizing: 'border-box',
      // Enhanced background with subtle gradient
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
        : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
      // Beautiful backdrop blur
      backdropFilter: 'blur(20px)',
      ...(isRTL && {
        right: 0,
        left: 'auto',
        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderRight: 'none',
      }),
      ...(!isRTL && {
        left: 0,
        right: 'auto',
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderLeft: 'none',
      }),
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create(['width', 'transform', 'box-shadow'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: drawerCollapsedWidth,
        '& .MuiTypography-root': {
          opacity: 0,
          transform: 'translateX(-10px)',
        },
      }),
      // Enhanced shadow system
      boxShadow: theme.palette.mode === 'dark' 
        ? '8px 0 32px rgba(0, 0, 0, 0.4), 4px 0 16px rgba(0, 0, 0, 0.2)'
        : '4px 0 24px rgba(0, 0, 0, 0.08), 2px 0 8px rgba(0, 0, 0, 0.04)',
      // Hover effect for better interactivity
      '&:hover': {
        boxShadow: theme.palette.mode === 'dark' 
          ? '12px 0 40px rgba(0, 0, 0, 0.5), 6px 0 20px rgba(0, 0, 0, 0.3)'
          : '6px 0 32px rgba(0, 0, 0, 0.12), 3px 0 12px rgba(0, 0, 0, 0.06)',
      },
    },
  }),
}));

// Enhanced Mobile Overlay with better animations
const MobileOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.common.black, 0.6),
  backdropFilter: 'blur(8px)',
  zIndex: theme.zIndex.drawer - 1,
  transition: theme.transitions.create(['opacity'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  }),
}));

// Enhanced Main Content wrapper
const MainContent = styled(Box)(({ theme, isRTL, open }) => ({
  backgroundColor: theme.palette.mode === 'light'
    ? theme.palette.background.default
    : theme.palette.background.default,
  flexGrow: 1,
  height: '100vh',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  direction: isRTL ? 'rtl' : 'ltr',
  position: 'relative',
  // Remove margins that were causing the gap
  // The content will fill the available space after the drawer
  // Smooth transitions for content area
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  }),
  // Enhanced scrollbar styling
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.3),
    borderRadius: '8px',
    '&:hover': {
      background: alpha(theme.palette.primary.main, 0.5),
    },
  },
  // Better scrolling behavior
  scrollBehavior: 'smooth',
}));

// Main Dashboard Layout component
const DashboardLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const { t, isRTL } = useLanguage();
  const muiTheme = useMuiTheme();
  // Use 'md' breakpoint (900px) for better mobile/tablet detection
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  // Drawer state - automatically close on mobile
  const [open, setOpen] = useState(!isMobile);
  
  // Handle responsive behavior
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);
  
  // Toggle drawer open/closed
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  // Render drawer content (shared between mobile and desktop)
  const renderDrawerContent = () => (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          minHeight: '64px !important',
          borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.12)}`,
          direction: isRTL ? 'rtl' : 'ltr',
          justifyContent: 'space-between',
          // Enhanced background
          background: muiTheme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.dark, 0.1)}, ${alpha(muiTheme.palette.background.paper, 0.95)})`
            : `linear-gradient(135deg, ${alpha(muiTheme.palette.primary.light, 0.05)}, ${muiTheme.palette.background.paper})`,
        }}
      >
        {/* Logo/Brand section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flex: 1,
          direction: 'inherit',
        }}>
          <Fade in={true} timeout={1000}>
            <Box
              component="img"
              src="/assets/logo/logo.svg"
              alt="Sukna Logo"
              sx={{
                height: 40,
                width: 'auto',
                marginRight: isRTL ? 0 : 2,
                marginLeft: isRTL ? 2 : 0,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: muiTheme.palette.mode === 'dark' 
                  ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' 
                  : 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))',
                ...(open && {
                  transform: 'scale(1.05)',
                }),
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
              }}
            />
          </Fade>
          <Slide direction={isRTL ? "left" : "right"} in={open || isMobile} timeout={600}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                display: (open || isMobile) ? 'block' : 'none',
                whiteSpace: 'nowrap',
                opacity: (open || isMobile) ? 1 : 0,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main}, ${muiTheme.palette.primary.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                direction: 'inherit',
                textAlign: isRTL ? 'right' : 'left',
                fontSize: '1.25rem',
                letterSpacing: '0.5px',
                textShadow: muiTheme.palette.mode === 'dark' 
                  ? '0 2px 4px rgba(0,0,0,0.3)' 
                  : '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {t('app.name')}
            </Typography>
          </Slide>
        </Box>
        
        {/* Enhanced Close drawer button */}
        <IconButton 
          onClick={toggleDrawer}
          size="small"
          sx={{ 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            borderRadius: '50%',
            padding: '6px',
            backgroundColor: alpha(muiTheme.palette.action.hover, 0.1),
            '&:hover': {
              backgroundColor: alpha(muiTheme.palette.primary.main, 0.1),
              transform: 'rotate(180deg) scale(1.1)',
              boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.3)}`,
            },
            '&:active': {
              transform: 'rotate(180deg) scale(0.95)',
            },
          }}
        >
          {isRTL ? (
            open ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />
          ) : (
            open ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
          )}
        </IconButton>
      </Toolbar>
      
      <Divider sx={{ 
        backgroundColor: alpha(muiTheme.palette.divider, 0.08),
        height: '1px',
      }} />
      
      {/* Sidebar navigation */}
      <Fade in timeout={800}>
        <Box>
          <SidebarNav open={open || isMobile} />
        </Box>
      </Fade>
    </>
  );
  
  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      direction: isRTL ? 'rtl' : 'ltr',
      overflow: 'hidden',
      // Enhanced background with subtle gradient
      background: muiTheme.palette.mode === 'dark'
        ? `linear-gradient(145deg, ${muiTheme.palette.background.default} 0%, ${alpha(muiTheme.palette.background.paper, 0.8)} 100%)`
        : `linear-gradient(145deg, ${muiTheme.palette.background.default} 0%, ${alpha(muiTheme.palette.primary.main, 0.02)} 100%)`,
    }}>
      <CssBaseline />
      
      {/* Enhanced App Bar */}
      <AppBar 
        position="absolute" 
        open={open} 
        isRTL={isRTL}
        elevation={0}
      >
        <Toolbar sx={{ 
          px: 3,
          minHeight: '64px !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {/* Left side (or right side in RTL) - Menu button and Title */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flex: 1,
            direction: 'inherit',
          }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="toggle drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: isRTL ? 0 : 2,
                marginLeft: isRTL ? 2 : 0,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '12px',
                padding: '8px',
                '&:hover': {
                  backgroundColor: alpha(muiTheme.palette.common.white, 0.15),
                  transform: 'scale(1.08) rotate(90deg)',
                  boxShadow: `0 4px 16px ${alpha(muiTheme.palette.common.black, 0.2)}`,
                },
                '&:active': {
                  transform: 'scale(0.95) rotate(90deg)',
                },
              }}
            >
              <MenuIcon sx={{ 
                fontSize: '1.4rem',
                transition: 'inherit',
              }} />
            </IconButton>
            
            <Fade in timeout={600}>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textAlign: 'left',
                  direction: 'inherit',
                  fontSize: '1.3rem',
                  background: muiTheme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${muiTheme.palette.common.white}, ${alpha(muiTheme.palette.primary.light, 0.8)})`
                    : `linear-gradient(135deg, ${muiTheme.palette.common.white}, ${alpha(muiTheme.palette.common.white, 0.9)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: muiTheme.palette.mode === 'dark' 
                    ? '0 2px 4px rgba(0,0,0,0.3)' 
                    : '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                {t('app.title')}
              </Typography>
            </Fade>
          </Box>
          
          {/* Right side (or left side in RTL) - Actions */}
          <Slide direction={isRTL ? "right" : "left"} in timeout={800}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5,
              direction: 'inherit',
              flexShrink: 0,
            }}>
              <LanguageMenu />
              <NotificationMenu />
              <UserMenu />
            </Box>
          </Slide>
        </Toolbar>
      </AppBar>
      
      {/* Enhanced Sidebar */}
      {isMobile ? (
        // Use base MuiDrawer for mobile to avoid styled component conflicts
        <MuiDrawer
          variant="temporary"
          open={open}
          anchor={isRTL ? 'right' : 'left'}
          onClose={toggleDrawer}
          ModalProps={{
            keepMounted: true,
            disableScrollLock: false,
          }}
          sx={{
            zIndex: muiTheme.zIndex.modal,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              background: muiTheme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${muiTheme.palette.background.paper} 0%, ${alpha(muiTheme.palette.background.paper, 0.98)} 100%)`
                : `linear-gradient(180deg, ${muiTheme.palette.background.paper} 0%, ${alpha(muiTheme.palette.background.default, 0.8)} 100%)`,
              backdropFilter: 'blur(20px)',
              boxShadow: muiTheme.palette.mode === 'dark' 
                ? '8px 0 32px rgba(0, 0, 0, 0.4), 4px 0 16px rgba(0, 0, 0, 0.2)'
                : '4px 0 24px rgba(0, 0, 0, 0.08), 2px 0 8px rgba(0, 0, 0, 0.04)',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: alpha(muiTheme.palette.common.black, 0.5),
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          {renderDrawerContent()}
        </MuiDrawer>
      ) : (
        <Drawer 
          variant="permanent"
          open={open} 
          isRTL={isRTL}
          isMobile={false}
        >
          {renderDrawerContent()}
        </Drawer>
      )}
      
      {/* Enhanced Main content */}
      <MainContent isRTL={isRTL} open={open}>
        {/* Spacer for fixed AppBar */}
        <Toolbar sx={{ minHeight: '64px !important' }} />
        
        {/* Enhanced Breadcrumbs */}
        <Fade in timeout={1000}>
          <Box sx={{ 
            px: 3, 
            pt: 3,
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
          }}>
            <Breadcrumbs />
          </Box>
        </Fade>
        
        {/* Enhanced Page content */}
        <Fade in timeout={1200}>
          <Container 
            maxWidth="xl" 
            sx={{ 
              flexGrow: 1, 
              py: 3,
              direction: isRTL ? 'rtl' : 'ltr',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Container>
        </Fade>
        
        {/* Enhanced Footer */}
        <Slide direction="up" in timeout={1400}>
          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 'auto',
              background: muiTheme.palette.mode === 'light'
                ? `linear-gradient(180deg, ${alpha(muiTheme.palette.grey[50], 0.8)}, ${muiTheme.palette.grey[100]})`
                : `linear-gradient(180deg, ${alpha(muiTheme.palette.grey[900], 0.8)}, ${muiTheme.palette.grey[800]})`,
              direction: isRTL ? 'rtl' : 'ltr',
              textAlign: 'center',
              borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.08)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: muiTheme.palette.mode === 'dark'
                ? '0 -4px 20px rgba(0, 0, 0, 0.3)'
                : '0 -2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Container maxWidth="xl">
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  opacity: 0.8,
                  direction: isRTL ? 'rtl' : 'ltr',
                  letterSpacing: '0.3px',
                  fontSize: '0.875rem',
                }}
              >
                {t('app.footer')} &copy; {new Date().getFullYear()}
              </Typography>
            </Container>
          </Box>
        </Slide>
      </MainContent>
    </Box>
  );
};

export default DashboardLayout;