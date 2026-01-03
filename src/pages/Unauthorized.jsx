// pages/Unauthorized.js
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      gap: 2
    }}>
      <Typography variant="h4" color="error">
        Unauthorized Access
      </Typography>
      <Typography variant="body1">
        You don't have permission to access this page.
      </Typography>
      <Button onClick={() => navigate(-1)} variant="contained">
        Go Back
      </Button>
    </Box>
  );
};

export default Unauthorized;