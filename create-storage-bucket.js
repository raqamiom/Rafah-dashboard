// Script to create a storage bucket in Appwrite
const { Client, Storage } = require('node-appwrite');
const { appwriteConfig } = require('./src/config/appwrite');

// Initialize the Appwrite client
const client = new Client();

client
  .setEndpoint('http://rafah-housing.com/v1') // Replace with your Appwrite endpoint
  .setProject('67c3fca1001ace9f6ff6')          // Replace with your project ID
  .setKey(process.env.APPWRITE_API_KEY);       // Set your API key as environment variable

const storage = new Storage(client);

async function createStorageBucket() {
  try {
    console.log('Creating storage bucket for food menu images...');
    
    // Create the storage bucket
    const bucket = await storage.createBucket(
      '682c90bf000aaf2577e7', // Bucket ID from config
      'Food Menu Images',      // Bucket name
      ['create', 'read', 'update', 'delete'], // Permissions for authenticated users
      false,  // File security - set to false for now
      true,   // Enabled
      104857600, // Maximum file size (100MB)
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], // Allowed file extensions
      'lzw',  // Compression
      false,  // Encryption
      false   // Antivirus
    );
    
    console.log('✅ Storage bucket created successfully:', bucket);
    console.log('Bucket ID:', bucket.$id);
    
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Storage bucket already exists!');
    } else {
      console.error('❌ Error creating storage bucket:', error);
    }
  }
}

// Run the script
createStorageBucket(); 