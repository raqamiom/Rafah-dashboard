import React, { useState, useEffect } from 'react';
import { useAppWrite } from '../contexts/AppWriteContext';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';

const AppwriteConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(null);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  
  // Get Appwrite context
  const { client, databases, databaseId, collections: collectionIds } = useAppWrite();
  
  // Define the expected schema collections
  const expectedCollections = [
    { name: 'Users', id: collectionIds.users, description: 'Stores user account information' },
    { name: 'Rooms', id: collectionIds.rooms, description: 'Stores information about available rooms' },
    { name: 'Contracts', id: collectionIds.contracts, description: 'Stores housing contracts between students and the facility' },
    { name: 'Payments', id: collectionIds.payments, description: 'Tracks rent payments and due amounts' },
    { name: 'Services', id: collectionIds.services, description: 'Contains services available for ordering' },
    { name: 'Orders', id: collectionIds.orders, description: 'Tracks service orders by students' },
    { name: 'Activities', id: collectionIds.activities, description: 'Records upcoming trips and activities' },
    { name: 'Activity Registrations', id: collectionIds.activityRegistrations, description: 'Tracks student registrations for activities' },
    { name: 'Checkout Requests', id: collectionIds.checkoutRequests, description: 'Manages temporary checkout requests' }
  ];
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        setConnectionStatus('testing');
        
        // Try to fetch collections
        const response = await databases.listCollections(databaseId);
        
        if (response && response.collections) {
          setCollections(response.collections);
          setDatabaseInfo({
            id: databaseId,
            total: response.total
          });
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('failed');
          setError('No collections found in the response');
        }
      } catch (err) {
        console.error('Error testing Appwrite connection:', err);
        setConnectionStatus('failed');
        setError(err.message);
      }
    };
    
    testConnection();
  }, [databases, databaseId]);
  
  const getStatusChip = (id) => {
    const collection = collections.find(col => col.$id === id);
    
    if (!collection) {
      return <Chip size="small" label="Not Found" color="error" />;
    }
    
    return <Chip size="small" label="Connected" color="success" />;
  };
  
  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', padding: '16px' }}>
      <Typography variant="h6" gutterBottom>Appwrite Connection Status</Typography>
      
      {connectionStatus === 'testing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Testing connection...</Typography>
        </Box>
      )}
      
      {connectionStatus === 'failed' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Connection Failed</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
      
      {connectionStatus === 'connected' && (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Connected to Appwrite Database</Typography>
            <Typography variant="body2">
              Database ID: {databaseInfo?.id}, Total Collections: {databaseInfo?.total}
            </Typography>
          </Alert>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Required Schema Collections:</Typography>
          <List dense>
            {expectedCollections.map((item, index) => (
              <React.Fragment key={item.name}>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.name}
                        {getStatusChip(item.id)}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="span" color="text.secondary">
                          {item.description}
                        </Typography>
                        <br />
                        <Typography variant="caption" component="span" color="text.secondary">
                          ID: {item.id}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < expectedCollections.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>All Collections ({collections.length}):</Typography>
          <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {collections.map((collection, index) => (
              <React.Fragment key={collection.$id}>
                <ListItem>
                  <ListItemText 
                    primary={collection.name}
                    secondary={`ID: ${collection.$id}`}
                  />
                </ListItem>
                {index < collections.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default AppwriteConnectionTest; 