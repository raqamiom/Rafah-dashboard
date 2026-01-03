import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAppWrite } from './AppWriteContext';
import { ID } from 'appwrite';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext(null);

// Create the Auth provider component
export const AuthProvider = ({ children }) => {
  const { account, databases, databaseId, collections } = useAppWrite();
  const navigate = useNavigate();
  
  // State for authentication
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already authenticated
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const session = await account.getSession('current');
      if (session) {
        const accountDetails = await account.get();
        
        try {
          // Get user details from the users collection
          const userDetails = await databases.getDocument(
            databaseId,
            collections.users,
            accountDetails.$id
          );
          
          // Check if the user has a valid system role
          if (userDetails && !['admin', 'staff', 'service', 'restaurant'].includes(userDetails.role)) {
            console.log('User does not have a valid system role, clearing session');
            // Don't call logout() to avoid circular dependency
            try {
              await account.deleteSession('current');
            } catch (deleteError) {
              console.error('Failed to delete session:', deleteError);
            }
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
          
          setUser({ ...accountDetails, ...userDetails });
        } catch (userError) {
          console.log('User document not found - using account details only');
          // If we can't get user details, just use account details
          // This is to handle cases where the users collection isn't set up yet
          setUser(accountDetails);
        }
        
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any stored session to be safe
      localStorage.removeItem('appwrite-session');
    } finally {
      setLoading(false);
    }
  }, [account, databases, databaseId, collections.users]);
  
  // Check authentication status on provider initialization
  useEffect(() => {
    if (account) {
      checkAuth();
    }
  }, [account, checkAuth]);
  
  // Auto-logout based on inactivity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let inactivityTimer;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };
    
    // Only set up the timer if the user is authenticated
    if (isAuthenticated) {
      resetTimer();
      
      // Events that reset the timer
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetTimer);
      });
      
      // Cleanup
      return () => {
        clearTimeout(inactivityTimer);
        events.forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [isAuthenticated]);
  
  // Enhanced signup function with FCM token support
  const signup = useCallback(async (email, password, name, role, fcmToken = null) => {
    try {
      setLoading(true);
  
      // 1. Create the user account — WITHOUT logging in
      const newUser = await account.create(ID.unique(), email, password, name);
  
      // 2. Save user data in your "users" collection with optional FCM token
      const userData = {
        name,
        email,
        role, // e.g. admin, staff, etc.
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add FCM token if provided
      if (fcmToken) {
        userData.fcm_token = fcmToken;
        console.log('FCM token included in user creation');
      }

      await databases.createDocument(
        databaseId,
        collections.users,
        newUser.$id, // Use same ID as the account
        userData
      );
  
      return { 
        success: true, 
        user: newUser,
        fcm_token_stored: fcmToken ? true : false 
      };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [account, databases, databaseId, collections.users]);
  
  // New function to update FCM token for existing users
  const updateFCMToken = useCallback(async (userId, fcmToken) => {
    try {
      setLoading(true);
      
      await databases.updateDocument(
        databaseId,
        collections.users,
        userId,
        { 
          fcm_token: fcmToken,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('FCM token updated for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('FCM token update failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [databases, databaseId, collections.users]);

  // Function to get all users with FCM tokens (for sending notifications)
  const getUsersWithFCMTokens = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        collections.users,
        [
          // Query for users that have FCM tokens
          Query.isNotNull('fcm_token')
        ]
      );
      
      return { success: true, users: response.documents };
    } catch (error) {
      console.error('Failed to get users with FCM tokens:', error);
      return { success: false, error: error.message };
    }
  }, [databases, databaseId, collections.users]);

  const resetPassword = async ({ userId, secret, password, confirmPassword }) => {
    try {
      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' };
      }

      await account.updateRecovery(userId, secret, password, confirmPassword);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      
      // First check if we already have a session and delete it
      try {
        await account.deleteSession('current');
        console.log('Deleted existing session');
      } catch (e) {
        // Ignore errors if no session exists
        console.log('No existing session to delete');
      }
      
      // Create a session with email and password
      console.log('Attempting to create email session...');
      const session = await account.createEmailSession(email, password);
      console.log('Session created:', session);
      
      // Get account details
      const accountDetails = await account.get();
      console.log('Account details retrieved');
      
      try {
        // Get user details from the users collection if it exists
        const userDetails = await databases.getDocument(
          databaseId,
          collections.users,
          accountDetails.$id
        );
        
        // Check if the user has a valid system role
        if (userDetails && !['admin', 'staff', 'service', 'restaurant'].includes(userDetails.role)) {
          throw new Error('Unauthorized: Only system users can access the dashboard');
        }
        
        // Set the user and authentication state
        setUser({ ...accountDetails, ...userDetails });
      } catch (userError) {
        console.log('User document not found - using account details only');
        // If we can't get user details, just use account details
        // This is to handle cases where the users collection isn't set up yet
        setUser(accountDetails);
      }
      
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials and try again.'
      };
    } finally {
      setLoading(false);
    }
  }, [account, databases, databaseId, collections.users]);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Delete the current session
      await account.deleteSession('current');
      
      // Reset user and authentication state
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login page
      navigate('/login');
      
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { 
        success: false, 
        error: error.message || 'Logout failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, [account, navigate]);
  
  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    try {
      setLoading(true);

      // Send a password reset email
      // Use the Appwrite server's IP for the reset URL to match allowed hosts
      await account.createRecovery(email, `https://rafah-housing.com/resetlink.php`);

      return { success: true };
    } catch (error) {
      console.error('Password reset request failed:', error);
      return {
        success: false,
        error: error.message || 'Password reset request failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, [account]);
  
  // Complete password reset
  const completePasswordReset = useCallback(async (userId, secret, password, confirmPassword) => {
    try {
      setLoading(true);
      
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Complete the password recovery
      await account.updateRecovery(userId, secret, password, confirmPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset completion failed:', error);
      return { 
        success: false, 
        error: error.message || 'Password reset failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, [account]);
  
  // Create the context value
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
    requestPasswordReset,
    completePasswordReset,
    signup,
    resetPassword,
    updateFCMToken,
    getUsersWithFCMTokens
  };
  
  // Provide the context to the children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;