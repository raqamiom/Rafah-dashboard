import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enTranslations from '../locales/en';
import arTranslations from '../locales/ar';

// Create the context
const LanguageContext = createContext(null);

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    dir: 'ltr',
    translations: enTranslations,
  },
  ar: {
    name: 'العربية',
    dir: 'rtl',
    translations: arTranslations,
  },
};

// Create the language provider component
export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or use English as default
  const getInitialLanguage = () => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage && SUPPORTED_LANGUAGES[savedLanguage] 
      ? savedLanguage 
      : 'en';
  };
  
  // State for current language
  const [language, setLanguage] = useState(getInitialLanguage);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Get current language settings
  const currentLanguage = SUPPORTED_LANGUAGES[language];
  
  // Change language with smooth transition
  const changeLanguage = useCallback((lang) => {
    if (SUPPORTED_LANGUAGES[lang] && lang !== language) {
      setIsTransitioning(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        
        // Reset transition state after DOM updates
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 150);
    }
  }, [language]);
  
  // Optimized translate function with memoization
  const translate = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let translation = currentLanguage.translations;
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      translation = translation[k];
    }
    
    // Handle simple string translation
    if (typeof translation === 'string') {
      // Replace parameters in the string (e.g., {{name}})
      return Object.entries(params).reduce((str, [param, value]) => {
        return str.replace(new RegExp(`{{${param}}}`, 'g'), value);
      }, translation);
    }
    
    return key;
  }, [currentLanguage.translations]);
  
  // Set the document direction and lang attributes with smooth transition
  useEffect(() => {
    const html = document.documentElement;
    
    // Add transition class for smooth direction change
    if (isTransitioning) {
      html.classList.add('language-transitioning');
    } else {
      html.classList.remove('language-transitioning');
    }
    
    html.setAttribute('dir', currentLanguage.dir);
    html.setAttribute('lang', language);
    
    // Add data attribute for CSS targeting
    html.setAttribute('data-language', language);
    html.setAttribute('data-direction', currentLanguage.dir);
    
    // Cleanup function
    return () => {
      html.classList.remove('language-transitioning');
    };
  }, [language, currentLanguage.dir, isTransitioning]);
  
  // Create the context value with memoization
  const contextValue = {
    language,
    languageName: currentLanguage.name,
    direction: currentLanguage.dir,
    isRTL: currentLanguage.dir === 'rtl',
    isTransitioning,
    changeLanguage,
    translate,
    t: translate, // Alias for convenience
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
  
  // Provide the context to the children
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext; 