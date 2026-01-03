import React from 'react';
import { Box } from '@mui/material';

const PrintLayout = ({ children }) => {
  return (
    <Box sx={{ 
      p: 2, 
      maxWidth: '100%',
      margin: '0 auto',
      '@media print': {
        p: 0,
      }
    }}>
      {children}
    </Box>
  );
};

export default PrintLayout; 