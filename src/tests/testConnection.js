import { Client, Databases } from 'appwrite';
import { appwriteConfig } from '../config/appwrite';

// Create a simple test function to check if we can connect to Appwrite
const testAppwriteConnection = async () => {
  try {
    console.log('Initializing Appwrite client...');
    const client = new Client();
    client
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);
    
    console.log('Creating database instance...');
    const databases = new Databases(client);
    
    console.log('Attempting to list collections...');
    const response = await databases.listCollections(appwriteConfig.databaseId);
    
    console.log('Connection successful!');
    console.log(`Found ${response.total} collections`);
    console.log('Collections:', response.collections.map(c => c.name));
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Connection failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Execute the test
testAppwriteConnection()
  .then(result => {
    if (result.success) {
      console.log('✅ Appwrite connection test passed!');
    } else {
      console.log('❌ Appwrite connection test failed!');
    }
  });

export default testAppwriteConnection; 