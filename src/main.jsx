import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppWriteProvider } from './contexts/AppWriteContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWriteProvider>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              <CssBaseline />
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </AppWriteProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
