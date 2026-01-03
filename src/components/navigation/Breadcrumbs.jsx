import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Breadcrumbs navigation component
 * Displays a breadcrumb trail based on the current route
 */
const Breadcrumbs = () => {
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  useEffect(() => {
    // Skip generating breadcrumbs for the root path
    if (location.pathname === '/') {
      setBreadcrumbs([]);
      return;
    }
    
    // Split the path into segments, removing empty strings
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      setBreadcrumbs([]);
      return;
    }
    
    // Always include home as the first breadcrumb
    const breadcrumbItems = [
      {
        key: 'home',
        label: t('navigation.dashboard'),
        path: '/dashboard',
        icon: <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />,
      },
    ];
    
    // Generate breadcrumbs for each path segment
    pathSegments.forEach((segment, index) => {
      // Create the partial path up to this segment
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      
      // Convert kebab-case to camelCase for translation key
      const key = segment.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      
      // Attempt to get the translation, fallback to formatted segment
      let label = t(`navigation.${key}`);
      
      // If translation is the same as the key, it means no translation exists
      if (label === `navigation.${key}`) {
        // Format the segment (capitalize first letter of each word, replace hyphens with spaces)
        label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      breadcrumbItems.push({
        key,
        label,
        path,
      });
    });
    
    setBreadcrumbs(breadcrumbItems);
  }, [location, t]);
  
  // If no breadcrumbs, don't render anything
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={
          <NavigateNextIcon
            fontSize="small"
            className={isRTL ? 'mirrored-in-rtl' : ''}
          />
        }
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast) {
            return (
              <Typography
                key={breadcrumb.key}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {breadcrumb.icon && breadcrumb.icon}
                {breadcrumb.label}
              </Typography>
            );
          }
          
          return (
            <Link
              key={breadcrumb.key}
              color="inherit"
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => navigate(breadcrumb.path)}
            >
              {breadcrumb.icon && breadcrumb.icon}
              {breadcrumb.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs; 