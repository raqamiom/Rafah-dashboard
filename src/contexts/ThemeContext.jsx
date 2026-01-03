import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useLanguage } from './LanguageContext';

// Import the theme configurations
import { createCustomTheme } from '../theme';

// Create the context
const ThemeContext = createContext(null);

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create LTR cache
const cacheLtr = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});

// Create the Theme provider component
export const ThemeProvider = ({ children }) => {
  const { isRTL, language } = useLanguage();
  
  // State for theme mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  
  // Toggle theme mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  };
  
  // Create enhanced theme with RTL support and typography
  const theme = createTheme({
    ...createCustomTheme(isDarkMode ? 'dark' : 'light'),
    direction: isRTL ? 'rtl' : 'ltr',
    typography: {
      ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography,
      fontFamily: isRTL 
        ? '"Noto Sans Arabic", "Tajawal", "Cairo", "Amiri", "Scheherazade", "Almarai", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        : '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h1,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 700 : 700,
      },
      h2: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h2,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 700 : 700,
      },
      h3: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h3,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 600 : 600,
      },
      h4: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h4,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 600 : 600,
      },
      h5: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h5,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 600 : 600,
      },
      h6: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.h6,
        textAlign: isRTL ? 'right' : 'left',
        fontWeight: isRTL ? 600 : 600,
      },
      body1: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.body1,
        textAlign: isRTL ? 'right' : 'left',
      },
      body2: {
        ...createCustomTheme(isDarkMode ? 'dark' : 'light').typography.body2,
        textAlign: isRTL ? 'right' : 'left',
      },
    },
    components: {
      ...createCustomTheme(isDarkMode ? 'dark' : 'light').components,
      // Enhanced RTL support for various Material-UI components
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              textAlign: isRTL ? 'right' : 'left',
              direction: isRTL ? 'rtl' : 'ltr',
            },
            '& .MuiFormLabel-root': {
              transformOrigin: isRTL ? 'top right' : 'top left',
              left: isRTL ? 'auto' : 0,
              right: isRTL ? 0 : 'auto',
            },
            '& .MuiInputLabel-root': {
              transformOrigin: isRTL ? 'top right' : 'top left',
              left: isRTL ? 'auto' : 0,
              right: isRTL ? 0 : 'auto',
              '&.Mui-focused': {
                transformOrigin: isRTL ? 'top right' : 'top left',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr',
          },
          head: {
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr',
            fontWeight: 600,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
            justifyContent: isRTL ? 'flex-end' : 'flex-start',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
          label: {
            textAlign: isRTL ? 'right' : 'left',
          },
        },
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
          separator: {
            margin: isRTL ? '0 4px' : '0 4px',
            transform: isRTL ? 'scaleX(-1)' : 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            direction: isRTL ? 'rtl' : 'ltr',
            marginLeft: isRTL ? 0 : -11,
            marginRight: isRTL ? -11 : 0,
          },
        },
      },
    },
  });
  
  // Create the context value
  const contextValue = {
    isDarkMode,
    toggleDarkMode,
    theme,
  };
  
  // Provide the context to the children
  return (
    <ThemeContext.Provider value={contextValue}>
      <CacheProvider value={isRTL ? cacheRtl : cacheLtr}>
        <MuiThemeProvider theme={theme}>
          {children}
        </MuiThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
};

// Create a custom hook to use the Theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext; 