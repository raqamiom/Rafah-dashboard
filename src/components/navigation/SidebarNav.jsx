import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Tooltip,
  Badge,
  Chip,
  Avatar,
  Typography,
  useTheme,
  Fade,
  Zoom,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EventIcon from '@mui/icons-material/Event';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

// Enhanced styled component for list item to handle RTL and modern styling
const StyledListItemIcon = styled(ListItemIcon)(({ theme, isRTL, isActive }) => ({
  minWidth: 0,
  marginRight: isRTL ? 0 : theme.spacing(3),
  marginLeft: isRTL ? theme.spacing(3) : 0,
  justifyContent: 'center',
  position: 'relative',
  '& .MuiSvgIcon-root': {
    fontSize: '1.4rem',
    color: isActive 
      ? theme.palette.primary.main 
      : theme.palette.text.secondary,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: isActive 
      ? `drop-shadow(0 2px 8px ${alpha(theme.palette.primary.main, 0.3)})` 
      : 'none',
  },
}));

// Enhanced styled component for main list item button
const StyledListItemButton = styled(ListItemButton)(({ theme, isActive, hasSubItems }) => ({
  minHeight: 48,
  borderRadius: theme.spacing(1.5),
  margin: theme.spacing(0.5, 1),
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Base styles
  background: isActive 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.light, 0.1)})`
    : 'transparent',
  border: isActive 
    ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` 
    : '1px solid transparent',
  backdropFilter: isActive ? 'blur(10px)' : 'none',
  
  // Hover effects
  '&:hover': {
    background: isActive 
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.light, 0.15)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.05)})`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateX(4px)',
    backdropFilter: 'blur(10px)',
    
    '& .MuiListItemIcon-root .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
      transform: 'scale(1.1)',
    },
    
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
  
  // Active state specific styling
  ...(isActive && {
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
    },
    
    // Active indicator line
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '60%',
      borderRadius: '0 2px 2px 0',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  }),
  
  // Focus styles
  '&.Mui-focusVisible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    outlineOffset: 2,
  },
}));

// Enhanced styled component for sub-menu items
const StyledSubListItemButton = styled(ListItemButton)(({ theme, isActive }) => ({
  minHeight: 40,
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.25, 2, 0.25, 3),
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  background: isActive 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)}, ${alpha(theme.palette.secondary.light, 0.08)})`
    : 'transparent',
  border: isActive 
    ? `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` 
    : '1px solid transparent',
  
  '&:hover': {
    background: isActive 
      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.18)}, ${alpha(theme.palette.secondary.light, 0.12)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.light, 0.06)})`,
    border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
    transform: 'translateX(6px)',
    
    '& .MuiListItemText-primary': {
      color: theme.palette.secondary.main,
      fontWeight: 600,
    },
  },
  
  ...(isActive && {
    '& .MuiListItemText-primary': {
      color: theme.palette.secondary.main,
      fontWeight: 'bold',
      fontSize: '0.9rem',
    },
    
    // Sub-item active indicator
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -8,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3,
      height: '50%',
      borderRadius: '0 2px 2px 0',
      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
    },
  }),
}));

// Enhanced container with glass-morphism effect
const StyledNavContainer = styled(Box)(({ theme, open }) => ({
  overflowY: 'auto',
  overflowX: 'hidden',
  height: 'calc(100% - 64px)',
  position: 'relative',
  
  // Custom scrollbar styling
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.background.paper, 0.1),
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(theme.palette.primary.dark, 0.5)})`,
    borderRadius: 3,
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(theme.palette.primary.dark, 0.7)})`,
    },
  },
  
  // Glass-morphism background effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark' 
      ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.02)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)`
      : `linear-gradient(180deg, ${alpha('#fff', 0.02)} 0%, ${alpha('#fff', 0.05)} 100%)`,
    backdropFilter: 'blur(10px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
}));

// Define navigation items with icons and routes
const navigationItems = [
  {
    key: 'dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    allowedRoles: ['admin'],
  },
  // {
  //   key: 'users',
  //   icon: <PeopleIcon />,
  //   path: '/users',
  //   allowedRoles: ['admin', 'staff'],
  // },
  {
    key: 'systemUsers',
    icon: <AdminPanelSettingsIcon />,
    path: '/system-users',
    allowedRoles: ['admin'],
  },
  {
    key: 'students',
    icon: <SchoolIcon />,
    path: '/students',
    allowedRoles: ['admin'],
  },
  {
    key: 'rooms',
    icon: <MeetingRoomIcon />,
    path: '/rooms',
    allowedRoles: ['admin'],
  },
  {
    key: 'contracts',
    icon: <DescriptionIcon />,
    path: '/contracts',
    allowedRoles: ['admin'],
  },
  {
    key: 'payments',
    icon: <PaymentIcon />,
    path: '/payments',
    allowedRoles: ['admin'],
  },
  {
    key: 'services',
    icon: <RoomServiceIcon />,
    path: '/services',
    allowedRoles: ['admin', 'service','staff'],
  },
  {
    key: 'orders',
    icon: <ShoppingCartIcon />,
    path: '/orders',
    allowedRoles: ['admin', 'service','staff'],
  },
  {
    key: 'activities',
    icon: <EventIcon />,
    path: '/activities',
    allowedRoles: ['admin'],
  },
  {
    key: 'activityRegistrations',
    icon: <HowToRegIcon />,
    path: '/activity-registrations',
    allowedRoles: ['admin'],
  },
  {
    key: 'checkoutRequests',
    icon: <AirplaneTicketIcon />,
    path: '/checkout-requests',
    allowedRoles: ['admin'],
  },
  {
    key: 'busTrips',
    icon: <DirectionsBusIcon />,
    path: '/bus-trips',
    allowedRoles: ['admin'],
  },
  {
    key: 'foodMenu',
    icon: <RestaurantMenuIcon />,
    path: '/food-menu',
    allowedRoles: ['admin', 'restaurant'],
  },
  {
    key: 'foodOrders',
    icon: <RestaurantIcon />,
    path: '/food-orders',
    allowedRoles: ['admin', 'restaurant'],
  },
  {
    key: 'reports',
    icon: <BarChartIcon />,
    path: '/reports',
    allowedRoles: ['admin'],
    subItems: [
      { key: 'occupancy', path: '/reports/occupancy' },
      { key: 'financial', path: '/reports/financial' },
      { key: 'service', path: '/reports/service' },
      { key: 'student', path: '/reports/student' },
      { key: 'custom', path: '/reports/custom' },
    ],
  },
  {
    key: 'settings',
    icon: <SettingsIcon />,
    path: '/settings',
    allowedRoles: ['admin'],
  },
];

const SidebarNav = ({ open }) => {
  const theme = useTheme();
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user role for filtering menu items
  const userRole = user?.role || 'staff';
  
  // Debug logging for user role
  console.log('Current user:', user);
  console.log('User role:', userRole);
  console.log('Admin has access to all items:', userRole === 'admin');
  
  // State for expanded sub-menus
  const [expanded, setExpanded] = useState({});
  
  // Toggle sub-menu expansion
  const handleToggleSubmenu = (key) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Filter navigation items based on user role
  // Admin users should have access to all navigation items
  const filteredNavItems = navigationItems.filter(
    (item) => userRole === 'admin' || item.allowedRoles.includes(userRole)
  );
  
  console.log('Filtered nav items:', filteredNavItems.map(item => item.key));
  
  return (
    <StyledNavContainer theme={theme} open={open}>
      <Fade in={true} timeout={600}>
        <List component="nav" sx={{ pt: 1, pb: 2 }}>
          {filteredNavItems.map((item, index) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const itemActive = isActive(item.path);
            
            return (
              <Zoom in={true} timeout={800 + (index * 100)} key={item.key}>
                <Box>
                  <StyledListItemButton
                    onClick={() => {
                      if (hasSubItems) {
                        handleToggleSubmenu(item.key);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    isActive={itemActive}
                    hasSubItems={hasSubItems}
                    theme={theme}
                    sx={{
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2 : 1.5,
                    }}
                  >
                    <Tooltip 
                      title={open ? '' : t(`navigation.${item.key}`)}
                      placement="right"
                      arrow
                      PopperProps={{
                        sx: {
                          '& .MuiTooltip-tooltip': {
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.95)})`,
                            backdropFilter: 'blur(10px)',
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          },
                          '& .MuiTooltip-arrow': {
                            color: alpha(theme.palette.primary.main, 0.9),
                          },
                        },
                      }}
                    >
                      <StyledListItemIcon isRTL={isRTL} isActive={itemActive} theme={theme}>
                        {item.icon}
                      </StyledListItemIcon>
                    </Tooltip>
                    
                    <ListItemText
                      primary={t(`navigation.${item.key}`)}
                      sx={{ 
                        opacity: open ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        '& .MuiListItemText-primary': {
                          fontSize: '0.95rem',
                          fontWeight: itemActive ? 'bold' : 500,
                          color: itemActive 
                            ? theme.palette.primary.main 
                            : theme.palette.text.primary,
                          transition: 'all 0.3s ease',
                        },
                      }}
                    />
                    
                    {hasSubItems && open && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        transition: 'transform 0.3s ease',
                        transform: expanded[item.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        {expanded[item.key] ? (
                          <ExpandLess sx={{ 
                            color: itemActive ? theme.palette.primary.main : theme.palette.text.secondary,
                            fontSize: '1.2rem',
                          }} />
                        ) : (
                          <ExpandMore sx={{ 
                            color: itemActive ? theme.palette.primary.main : theme.palette.text.secondary,
                            fontSize: '1.2rem',
                          }} />
                        )}
                      </Box>
                    )}
                  </StyledListItemButton>
                  
                  {/* Enhanced Sub-menu items */}
                  {hasSubItems && (
                    <Collapse 
                      in={open && expanded[item.key]} 
                      timeout={{
                        enter: 400,
                        exit: 300,
                      }}
                      unmountOnExit
                    >
                      <List component="div" disablePadding sx={{ position: 'relative' }}>
                        {/* Connection line for sub-items */}
                        <Box sx={{
                          position: 'absolute',
                          left: theme.spacing(3.5),
                          top: 0,
                          bottom: 0,
                          width: 2,
                          background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.3)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                          borderRadius: 1,
                        }} />
                        
                        {item.subItems.map((subItem, subIndex) => (
                          <Fade 
                            in={open && expanded[item.key]} 
                            timeout={300 + (subIndex * 100)}
                            key={subItem.key}
                          >
                            <StyledSubListItemButton
                              onClick={() => navigate(subItem.path)}
                              isActive={isActive(subItem.path)}
                              theme={theme}
                              sx={{
                                justifyContent: open ? 'initial' : 'center',
                                pl: 5,
                                py: 1,
                              }}
                            >
                              {/* Sub-item bullet point */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mr: 2,
                                position: 'relative',
                              }}>
                                <FiberManualRecordIcon sx={{ 
                                  fontSize: '0.5rem',
                                  color: isActive(subItem.path) 
                                    ? theme.palette.secondary.main 
                                    : alpha(theme.palette.text.secondary, 0.5),
                                  transition: 'all 0.3s ease',
                                }} />
                              </Box>
                              
                              <ListItemText
                                primary={t(`${item.key}.${subItem.key}`)}
                                sx={{
                                  '& .MuiListItemText-primary': {
                                    fontSize: '0.875rem',
                                    fontWeight: isActive(subItem.path) ? 'bold' : 500,
                                    color: isActive(subItem.path) 
                                      ? theme.palette.secondary.main 
                                      : theme.palette.text.secondary,
                                    transition: 'all 0.3s ease',
                                  },
                                }}
                              />
                            </StyledSubListItemButton>
                          </Fade>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              </Zoom>
            );
          })}
        </List>
      </Fade>
      
      {/* Enhanced Divider */}
      <Divider sx={{ 
        mx: 2, 
        my: 2,
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.5)}, transparent)`,
        height: 1,
      }} />
      
      {/* Enhanced Version information at the bottom */}
      {open && (
        <Fade in={open} timeout={1000}>
          <Box sx={{ 
            p: 3, 
            textAlign: 'center',
            position: 'relative',
          }}>
            <Chip
              label="v1.0.0"
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                color: theme.palette.text.secondary,
                fontSize: '0.75rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            />
            
            {/* User role indicator */}
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                mt: 1,
                color: alpha(theme.palette.text.secondary, 0.7),
                fontSize: '0.7rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {userRole} Access
            </Typography>
          </Box>
        </Fade>
      )}
    </StyledNavContainer>
  );
};

export default SidebarNav; 