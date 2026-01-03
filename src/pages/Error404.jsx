import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Error404 = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '100vh',
          py: 5,
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 'bold',
            color: 'primary.main' 
          }}
        >
          404
        </Typography>
        
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ mb: 2, fontWeight: 'medium' }}
        >
          {t('common.pageNotFound')}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 600 }}
        >
          {t('common.pageNotFoundDesc')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
          >
            {t('common.backToHome')}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            {t('common.goBack')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Error404; 