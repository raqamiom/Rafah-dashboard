// Appwrite Configuration
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'http://rafah-housing.com/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '67c3fca1001ace9f6ff6',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '67b596520007b70f3783',
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || '682c90bf000aaf2577e7',
  collections: {
    // Map to the required schema collections
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '68249b10003c16083520',
    rooms: import.meta.env.VITE_APPWRITE_ROOMS_COLLECTION_ID || '68249cb00025da201b9d',
    contracts: import.meta.env.VITE_APPWRITE_CONTRACTS_COLLECTION_ID || '68249e34003899ffa4a3',
    payments: import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID || '683f10a3002fcff81e8a',
    services: import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_ID || '682a0ec9001ac190ae4f',
    serviceOrders: import.meta.env.VITE_APPWRITE_SERVICE_ORDERS_COLLECTION_ID || '6829f67b0021379e8dd5',
    serviceOrderItems: import.meta.env.VITE_APPWRITE_SERVICE_ORDER_ITEMS_COLLECTION_ID || '6829fcd5000167123c60',
    activities: import.meta.env.VITE_APPWRITE_ACTIVITIES_COLLECTION_ID || '68272809001203a3f60e',
    activityRegistrations: import.meta.env.VITE_APPWRITE_ACTIVITY_REGISTRATIONS_COLLECTION_ID || '68272bc9003898ae7976',
    checkoutRequests: import.meta.env.VITE_APPWRITE_CHECKOUT_REQUESTS_COLLECTION_ID || '68272c59001081a0f67c',
    busTrips: import.meta.env.VITE_APPWRITE_BUS_TRIPS_COLLECTION_ID || '6862b55f0011edc952df',
    
    // Food system collections
    foodMenu: import.meta.env.VITE_APPWRITE_FOOD_MENU_COLLECTION_ID || '68373009002a61f5cf07',
    foodOrders: import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID || '6837318d0033889a6907',
    foodOrderItems: import.meta.env.VITE_APPWRITE_FOOD_ORDER_ITEMS_COLLECTION_ID || '683732e800333949b399',
    
    // Additional collections specific to the app (deprecated/legacy)
    orders: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || '67b6eb9d0027b9c3ba4a', // Legacy orders
    rentClaims: '67b59a850029b3546a8c',
    foodMenuLegacy: '67b5af620019539ec9f1', // Legacy food menu
    foodCategory: '67b5afc000163a4598c3',
    foodCarts: '67b6ec5900333d93defc',
    busTimeline: '67bd9fbf002fa31d8885',
    chats: '67c9589d002c3ebd1c5e',
    messages: '67c95917002fa48c440d',
    cleaningOrders: '67d180ea003d8d79bd1b',
    cleaningCart: '67d18179001a09abace3'
  }
} 