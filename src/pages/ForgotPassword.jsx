import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const { t, isRTL } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Handle form input changes
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError('');
  };
  
  // Validate form
  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError(t('common.requiredField'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('common.invalidEmail'));
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setIsSubmitted(true);
        showSuccess(t('auth.resetLinkSent'));
      } else {
        showError(result.error || t('auth.resetRequestError'));
      }
    } catch (error) {
      showError(error.message || t('auth.resetRequestError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back to login
  const handleBackToLogin = () => {
    navigate('/login');
  };
  
  if (isSubmitted) {
    return (
      <>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <EmailOutlinedIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.checkYourEmail')}
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
          <Typography variant="body1">
            {t('auth.resetLinkSentMessage', { email })}
          </Typography>
        </Alert>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          {t('auth.didNotReceiveEmail')}
        </Typography>
        
        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={() => setIsSubmitted(false)}
          sx={{ mt: 2, mb: 2, py: 1.5 }}
        >
          {t('auth.resendLink')}
        </Button>
        
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={handleBackToLogin}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mt: 2 
          }}
        >
          <ArrowBackIcon fontSize="small" />
          {t('auth.backToLogin')}
        </Link>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Rafah Admin Dashboard
        </Typography>
      </>
    );
  }
  
  return (
    <>
      <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
        <EmailOutlinedIcon />
      </Avatar>
      
      <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
        {t('auth.forgotPassword')}
      </Typography>
      

      
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label={t('auth.email')}
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={handleEmailChange}
          error={!!emailError}
          helperText={emailError}
          dir="ltr"
          inputProps={{
            dir: 'ltr',
          }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t('auth.sendResetLink')
          )}
        </Button>
        
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={handleBackToLogin}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mt: 2 
          }}
        >
          <ArrowBackIcon fontSize="small" />
          {t('auth.backToLogin')}
        </Link>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Rafah Admin Dashboard
        </Typography>
      </Box>
    </>
  );
};

export default ForgotPassword;