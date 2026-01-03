import { useAppWrite } from '../contexts/AppWriteContext';
import { Query } from 'appwrite';

// Helper function to create an instance of the service
const createAppwriteService = () => {
  const { databases, databaseId, collections, storage, ID } = useAppWrite();

  // Database operations
  const getDocuments = async (collectionName, queries = []) => {
    try {
      return await databases.listDocuments(
        databaseId,
        collections[collectionName],
        queries
      );
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  };

  const getDocument = async (collectionName, documentId) => {
    try {
      return await databases.getDocument(
        databaseId,
        collections[collectionName],
        documentId
      );
    } catch (error) {
      console.error(`Error fetching ${collectionName} document:`, error);
      throw error;
    }
  };

  const createDocument = async (collectionName, data, documentId = null) => {
    try {
      return await databases.createDocument(
        databaseId,
        collections[collectionName],
        documentId || ID.unique(),
        data
      );
    } catch (error) {
      console.error(`Error creating ${collectionName} document:`, error);
      throw error;
    }
  };

  const updateDocument = async (collectionName, documentId, data) => {
    try {
      return await databases.updateDocument(
        databaseId,
        collections[collectionName],
        documentId,
        data
      );
    } catch (error) {
      console.error(`Error updating ${collectionName} document:`, error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName, documentId) => {
    try {
      return await databases.deleteDocument(
        databaseId,
        collections[collectionName],
        documentId
      );
    } catch (error) {
      console.error(`Error deleting ${collectionName} document:`, error);
      throw error;
    }
  };

  // File storage operations
  const uploadFile = async (fileBlob, name) => {
    try {
      return await storage.createFile(
        'default', // or your specific storage bucket ID
        ID.unique(),
        fileBlob,
        undefined,
        { fileName: name }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const getFilePreview = (fileId) => {
    return storage.getFilePreview('default', fileId);
  };

  return {
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    getFilePreview,
    Query, // Export Query for building queries
  };
};

export default createAppwriteService; 