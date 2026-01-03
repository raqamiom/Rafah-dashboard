import { Box, Typography, Button, Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Page header component with title, breadcrumbs, and optional action button
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.action - Optional action button or component
 * @param {string} props.actionLabel - Text for the default action button if action is not provided
 * @param {Function} props.onAction - Function to call when default action button is clicked
 * @param {boolean} props.showBreadcrumbs - Whether to show breadcrumbs
 */
const PageHeader = ({
  title,
  subtitle,
  action,
  actionLabel,
  onAction,
  showBreadcrumbs = true,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Generate breadcrumbs from current location
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return [];
    }
    
    return [
      { path: '/', label: 'Home' },
      ...paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        // Convert path to title case and replace hyphens
        const label = path
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          path: url,
          label: t(`navigation.${path}`) || label,
        };
      }),
    ];
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 1 && (
        <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography color="text.primary" key={crumb.path}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                color="inherit"
                key={crumb.path}
                component="button"
                variant="body2"
                onClick={() => navigate(crumb.path)}
                sx={{ textDecoration: 'none' }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </MuiBreadcrumbs>
      )}
      
      {/* Title and action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action ? (
          action
        ) : actionLabel && onAction ? (
          <Button variant="contained" color="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

export default PageHeader; 