import { Box, Card, CardContent, Typography, Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';

/**
 * Stat card component for displaying KPIs in the dashboard
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Value to display
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.color - Primary color (primary, secondary, success, info, warning, error)
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {string} props.trend - Trend direction ('up', 'down', 'neutral')
 * @param {string|number} props.trendValue - Trend value (e.g., '+15%')
 */
const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  footer,
  trend,
  trendValue,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ textTransform: 'uppercase', fontWeight: 'medium', fontSize: '0.75rem' }}
            >
              {title}
            </Typography>
            
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            
            {trend && trendValue && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  color:
                    trend === 'up'
                      ? 'success.main'
                      : trend === 'down'
                      ? 'error.main'
                      : 'text.secondary',
                }}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </Typography>
            )}
          </Box>
          
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
              color: `${color}.main`,
              borderRadius: 2,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        {footer && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            {footer}
          </Box>
        )}
      </CardContent>
      
      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          top: -24,
          right: -24,
          borderRadius: '50%',
          width: 120,
          height: 120,
          background: (theme) => alpha(theme.palette[color].main, 0.07),
          zIndex: 0,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: -20,
          left: -20,
          borderRadius: '50%',
          width: 80,
          height: 80,
          background: (theme) => alpha(theme.palette[color].main, 0.05),
          zIndex: 0,
        }}
      />
    </Card>
  );
};

export default StatCard; 