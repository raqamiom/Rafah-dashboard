import React, { useState, useEffect } from 'react';
import createAppwriteService from '../services/appwriteService';

const AppwriteExample = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the Appwrite service
  const appwriteService = createAppwriteService();
  
  useEffect(() => {
    // Example function to fetch data from Appwrite
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace 'users' with your actual collection name
        const response = await appwriteService.getDocuments('users');
        setData(response.documents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please check your Appwrite configuration.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Example function to create a new document
  const handleCreateDocument = async () => {
    try {
      setLoading(true);
      const newData = {
        name: 'New User',
        email: 'user@example.com',
        createdAt: new Date().toISOString(),
      };
      
      const response = await appwriteService.createDocument('users', newData);
      setData(prevData => [...prevData, response]);
      setLoading(false);
    } catch (err) {
      console.error('Error creating document:', err);
      setError('Failed to create document. Please check your Appwrite configuration.');
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Appwrite Example</h2>
      <button onClick={handleCreateDocument}>Create New User</button>
      
      <h3>Users List</h3>
      {data.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {data.map(item => (
            <li key={item.$id}>
              {item.name} ({item.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppwriteExample; 