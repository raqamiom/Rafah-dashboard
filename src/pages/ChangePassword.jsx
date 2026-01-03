import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

const ResetPassword = () => {
  const { resetPassword } = useAuth(); // removed validateResetToken
  const { t, isRTL } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // ✅ Token validation simplified (no backend check)
  useEffect(() => {
    if (!userId || !secret) {
      setTokenError(t('auth.invalidResetLink'));
      setIsTokenValid(false);
    } else {
      setIsTokenValid(true);
    }
  }, [userId, secret, t]);

  useEffect(() => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordRequirements(requirements);
    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [password]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    let isValid = true;

    if (!password) {
      setPasswordError(t('common.requiredField'));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(t('auth.passwordTooShort'));
      isValid = false;
    } else if (passwordStrength < 4) {
      setPasswordError(t('auth.passwordTooWeak'));
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('common.requiredField'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordsDoNotMatch'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword({
        userId,
        secret,
        password,
        confirmPassword,
      });

      if (result.success) {
        setIsSuccess(true);
        showSuccess(t('auth.passwordResetSuccess'));
      } else {
        showError(result.error || t('auth.passwordResetError'));
      }
    } catch (error) {
      showError(error.message || t('auth.passwordResetError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'error';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return t('auth.weak');
    if (passwordStrength <= 3) return t('auth.medium');
    return t('auth.strong');
  };

  if (isTokenValid === false) {
    return (
      <>
        <Avatar sx={{ m: 1, bgcolor: 'error.main' }}>
          <LockResetIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.invalidLink')}
        </Typography>
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          <Typography variant="body1">{tokenError}</Typography>
        </Alert>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleGoToLogin}
          sx={{ mt: 2, mb: 2, py: 1.5 }}
        >
          {t('auth.backToLogin')}
        </Button>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Rafah Admin Dashboard
        </Typography>
      </>
    );
  }

  if (isSuccess) {
    return (
      <>
        <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
          <CheckCircleIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.passwordResetComplete')}
        </Typography>
        <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
          <Typography variant="body1">{t('auth.passwordResetCompleteMessage')}</Typography>
        </Alert>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleGoToLogin}
          sx={{ mt: 2, mb: 2, py: 1.5 }}
        >
          {t('auth.signIn')}
        </Button>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Rafah Admin Dashboard
        </Typography>
      </>
    );
  }

  if (isTokenValid === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
        <LockResetIcon />
      </Avatar>
      <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
        {t('auth.resetPassword')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label={t('auth.newPassword')}
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={handlePasswordChange}
          error={!!passwordError}
          helperText={passwordError}
          dir="ltr"
          InputProps={{
            dir: 'ltr',
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {password && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.passwordStrength')}:
              </Typography>
              <Typography variant="body2" color={`${getStrengthColor()}.main`}>
                {getStrengthText()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(passwordStrength / 5) * 100}
              color={getStrengthColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t('auth.passwordRequirements')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {Object.entries(passwordRequirements).map(([key, met]) => (
                  <Typography
                    key={key}
                    variant="caption"
                    color={met ? 'success.main' : 'text.secondary'}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {met ? '✓' : '•'} {t(`auth.requirement.${key}`)}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label={t('auth.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={!!confirmPasswordError}
          helperText={confirmPasswordError}
          dir="ltr"
          InputProps={{
            dir: 'ltr',
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={toggleConfirmPasswordVisibility}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3, mb: 2, py: 1.5 }}
          disabled={isLoading || passwordStrength < 4}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : t('auth.resetPassword')}
        </Button>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} Rafah Admin Dashboard
        </Typography>
      </Box>
    </>
  );
};

export default ResetPassword;
