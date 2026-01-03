import { createContext, useContext, useMemo } from 'react';
import { Client, Account, Databases, Storage, ID, Functions } from 'appwrite';
import { appwriteConfig } from '../config/appwrite';

// Create the context
const AppWriteContext = createContext(null);

// Create the Appwrite provider component
export const AppWriteProvider = ({ children }) => {
  // Initialize the Appwrite client
  const client = useMemo(() => {
    const client = new Client();
    
    // Set the endpoint and project ID from config
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);
    
    // Allow self-signed certs for development environments
    if (appwriteConfig.endpoint.startsWith('http://')) {
      console.warn('Using insecure HTTP connection for Appwrite. Not recommended for production.');
    }
    

    
    return client;

  }, []);
  
  // Initialize Appwrite services
  const account = useMemo(() => new Account(client), [client]);
  const databases = useMemo(() => new Databases(client), [client]);
  const storage = useMemo(() => new Storage(client), [client]);
  const functions = useMemo(() => new Functions(client), [client]);

  // Set up database and collection IDs from config
  const databaseId = appwriteConfig.databaseId;
  const collections = appwriteConfig.collections;
  const bucketId = appwriteConfig.bucketId;
  
  // Create the context value
  const contextValue = {
    client,
    account,
    databases,
    storage,
    databaseId,
    collections,
    bucketId,
    ID,
functions
  };
  
  // Provide the context to the children
  return (
    <AppWriteContext.Provider value={contextValue}>
      {children}
    </AppWriteContext.Provider>
  );
};

// Create a custom hook to use the Appwrite context
export const useAppWrite = () => {
  const context = useContext(AppWriteContext);
  
  if (!context) {
    throw new Error('useAppWrite must be used within an AppWriteProvider');
  }
  
  return context;
};

export default AppWriteContext;
