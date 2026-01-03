import { Box, Container, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageMenu from '../components/navigation/LanguageMenu';

/**
 * Fullscreen layout component for login and error pages
 */
const FullscreenLayout = ({ children }) => {
  const { isRTL } = useLanguage();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: (theme) => theme.palette.background.default,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Language selector at the top right */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          [isRTL ? 'left' : 'right']: 16,
          zIndex: 10,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <LanguageMenu color="primary" />
      </Box>
      
      {/* Main content centered on the page */}
      <Container 
        component="main" 
        maxWidth="sm" 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
          py: 8,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: '100%',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
            '& .MuiTextField-root': {
              direction: isRTL ? 'rtl' : 'ltr',
            },
            '& .MuiInputBase-input': {
              textAlign: isRTL ? 'right' : 'left',
            },
            '& .MuiFormLabel-root': {
              transformOrigin: isRTL ? 'top right' : 'top left',
              left: isRTL ? 'auto' : 0,
              right: isRTL ? 0 : 'auto',
            },
            '& .MuiButton-root': {
              direction: isRTL ? 'rtl' : 'ltr',
            },
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default FullscreenLayout; 