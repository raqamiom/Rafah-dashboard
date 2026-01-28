import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { appwriteConfig } from '../config/appwrite';

const RequestApproval = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [responseHtml, setResponseHtml] = useState(null);

  useEffect(() => {
    executeFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeFunction = async () => {
    const action = searchParams.get('action');
    const requestId = searchParams.get('requestId');
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    // Validate required parameters
    if (!action || !requestId || !userId || !token) {
      setError({
        title: 'خطأ في الرابط',
        message: 'الرابط غير صالح. يرجى استخدام الرابط من البريد الإلكتروني.',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${appwriteConfig.endpoint}/functions/${appwriteConfig.functions.requestApproval}/executions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': appwriteConfig.projectId,
          },
          body: JSON.stringify({
            body: JSON.stringify({
              action: action,
              requestId: requestId,
              userId: userId,
              token: token,
            }),
            async: false,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.responseBody) {
        // Check if the response is HTML
        if (data.responseBody.trim().startsWith('<!DOCTYPE') || data.responseBody.trim().startsWith('<html')) {
          // If it's HTML, set it to be rendered
          setResponseHtml(data.responseBody);
        } else {
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(data.responseBody);
            if (parsed.success) {
              setResult({
                success: true,
                title: parsed.title || 'تم بنجاح',
                message: parsed.message || 'تم معالجة الطلب بنجاح.',
              });
            } else {
              setError({
                title: parsed.title || 'خطأ',
                message: parsed.message || 'حدث خطأ أثناء معالجة الطلب.',
              });
            }
          } catch {
            // If not JSON, treat as success message
            setResult({
              success: true,
              title: 'تم بنجاح',
              message: data.responseBody,
            });
          }
        }
      } else if (data.message) {
        setError({
          title: 'خطأ',
          message: data.message,
        });
      } else {
        setError({
          title: 'خطأ',
          message: 'حدث خطأ غير متوقع.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError({
        title: 'خطأ في الاتصال',
        message: 'تعذر الاتصال بالخادم.',
      });
    } finally {
      setLoading(false);
    }
  };

  // If we have HTML response, render it
  if (responseHtml) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: responseHtml }}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 500,
          width: '100%',
          padding: 5,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        {loading && (
          <>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                marginBottom: 3,
                color: '#667eea',
              }}
            />
            <Typography variant="h5" component="h1" sx={{ mb: 2, color: '#333' }}>
              جاري معالجة طلبك...
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              يرجى الانتظار قليلاً
            </Typography>
          </>
        )}

        {error && (
          <>
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                marginBottom: 2,
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{
                mb: 2,
                color: 'error.main',
              }}
            >
              {error.title}
            </Typography>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error.message}
            </Alert>
          </>
        )}

        {result && (
          <>
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: 'success.main',
                marginBottom: 2,
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{
                mb: 2,
                color: 'success.main',
              }}
            >
              {result.title}
            </Typography>
            <Alert severity="success" sx={{ mt: 2 }}>
              {result.message}
            </Alert>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RequestApproval;

