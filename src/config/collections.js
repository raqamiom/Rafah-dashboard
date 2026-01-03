// Collections configuration for room history management
export const COLLECTIONS_CONFIG = {
  // Main rooms collection
  rooms: {
    name: 'rooms',
    attributes: [
      { key: 'roomNumber', type: 'string', required: true, array: false },
      { key: 'type', type: 'string', required: true, array: false },
      { key: 'capacity', type: 'integer', required: true, array: false },
      { key: 'rentAmount', type: 'double', required: true, array: false },
      { key: 'status', type: 'string', required: true, array: false },
      { key: 'building', type: 'string', required: true, array: false },
      { key: 'floor', type: 'integer', required: true, array: false },
      { key: 'createdBy', type: 'string', required: false, array: false },
      { key: 'updatedBy', type: 'string', required: false, array: false },
    ],
    indexes: [
      { key: 'roomNumber', type: 'key', status: 'available' },
      { key: 'status', type: 'key', status: 'available' },
      { key: 'building', type: 'key', status: 'available' },
      { key: 'type', type: 'key', status: 'available' },
    ]
  },

  // Room history tracking
  roomHistory: {
    name: 'roomHistory',
    attributes: [
      { key: 'roomId', type: 'string', required: true, array: false },
      { key: 'action', type: 'string', required: true, array: false },
      { key: 'oldValues', type: 'string', required: false, array: false },
      { key: 'newValues', type: 'string', required: false, array: false },
      { key: 'changedBy', type: 'string', required: true, array: false },
      { key: 'changedByName', type: 'string', required: true, array: false },
      { key: 'timestamp', type: 'datetime', required: true, array: false },
      { key: 'details', type: 'string', required: false, array: false },
    ],
    indexes: [
      { key: 'roomId', type: 'key', status: 'available' },
      { key: 'action', type: 'key', status: 'available' },
      { key: 'timestamp', type: 'key', status: 'available' },
      { key: 'changedBy', type: 'key', status: 'available' },
    ]
  },

  // Tenants collection
  tenants: {
    name: 'tenants',
    attributes: [
      { key: 'roomId', type: 'string', required: true, array: false },
      { key: 'firstName', type: 'string', required: true, array: false },
      { key: 'lastName', type: 'string', required: true, array: false },
      { key: 'email', type: 'string', required: true, array: false },
      { key: 'phone', type: 'string', required: true, array: false },
      { key: 'checkIn', type: 'datetime', required: false, array: false },
      { key: 'checkOut', type: 'datetime', required: false, array: false },
      { key: 'leaseStart', type: 'datetime', required: true, array: false },
      { key: 'leaseEnd', type: 'datetime', required: true, array: false },
      { key: 'monthlyRent', type: 'double', required: true, array: false },
      { key: 'deposit', type: 'double', required: false, array: false },
      { key: 'status', type: 'string', required: true, array: false },
    ],
    indexes: [
      { key: 'roomId', type: 'key', status: 'available' },
      { key: 'status', type: 'key', status: 'available' },
      { key: 'email', type: 'unique', status: 'available' },
      { key: 'checkIn', type: 'key', status: 'available' },
      { key: 'checkOut', type: 'key', status: 'available' },
    ]
  },

  // Maintenance records
  maintenance: {
    name: 'maintenance',
    attributes: [
      { key: 'roomId', type: 'string', required: true, array: false },
      { key: 'type', type: 'string', required: true, array: false },
      { key: 'category', type: 'string', required: true, array: false },
      { key: 'description', type: 'string', required: true, array: false },
      { key: 'priority', type: 'string', required: true, array: false },
      { key: 'status', type: 'string', required: true, array: false },
      { key: 'assignedTo', type: 'string', required: false, array: false },
      { key: 'reportedBy', type: 'string', required: true, array: false },
      { key: 'reportedDate', type: 'datetime', required: true, array: false },
      { key: 'scheduledDate', type: 'datetime', required: false, array: false },
      { key: 'completedDate', type: 'datetime', required: false, array: false },
      { key: 'estimatedCost', type: 'double', required: false, array: false },
      { key: 'actualCost', type: 'double', required: false, array: false },
    ],
    indexes: [
      { key: 'roomId', type: 'key', status: 'available' },
      { key: 'status', type: 'key', status: 'available' },
      { key: 'priority', type: 'key', status: 'available' },
      { key: 'reportedDate', type: 'key', status: 'available' },
      { key: 'assignedTo', type: 'key', status: 'available' },
    ]
  },

  // Payment records
  payments: {
    name: 'payments',
    attributes: [
      { key: 'roomId', type: 'string', required: true, array: false },
      { key: 'tenantId', type: 'string', required: true, array: false },
      { key: 'amount', type: 'double', required: true, array: false },
      { key: 'type', type: 'string', required: true, array: false },
      { key: 'paymentMethod', type: 'string', required: true, array: false },
      { key: 'status', type: 'string', required: true, array: false },
      { key: 'dueDate', type: 'datetime', required: true, array: false },
      { key: 'paidDate', type: 'datetime', required: false, array: false },
      { key: 'referenceNumber', type: 'string', required: false, array: false },
      { key: 'description', type: 'string', required: false, array: false },
    ],
    indexes: [
      { key: 'roomId', type: 'key', status: 'available' },
      { key: 'tenantId', type: 'key', status: 'available' },
      { key: 'status', type: 'key', status: 'available' },
      { key: 'dueDate', type: 'key', status: 'available' },
      { key: 'referenceNumber', type: 'unique', status: 'available' },
    ]
  }
};

// Collection IDs mapping (update with your actual collection IDs)
export const collections = {
  rooms: process.env.REACT_APP_ROOMS_COLLECTION_ID || 'rooms',
  roomHistory: process.env.REACT_APP_ROOM_HISTORY_COLLECTION_ID || 'roomHistory',
  tenants: process.env.REACT_APP_TENANTS_COLLECTION_ID || 'tenants',
  maintenance: process.env.REACT_APP_MAINTENANCE_COLLECTION_ID || 'maintenance',
  payments: process.env.REACT_APP_PAYMENTS_COLLECTION_ID || 'payments',
};

// Validation schemas
export const ROOM_STATUS_OPTIONS = ['available', 'occupied', 'maintenance'];
export const ROOM_TYPE_OPTIONS = ['single', 'double', 'suite'];
export const BUILDING_OPTIONS = ['A', 'B', 'C', 'D'];

export const TENANT_STATUS_OPTIONS = ['active', 'inactive', 'terminated'];

export const MAINTENANCE_TYPE_OPTIONS = ['routine', 'emergency', 'request'];
export const MAINTENANCE_CATEGORY_OPTIONS = ['plumbing', 'electrical', 'hvac', 'general'];
export const MAINTENANCE_PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
export const MAINTENANCE_STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'cancelled'];

export const PAYMENT_TYPE_OPTIONS = ['rent', 'deposit', 'utilities', 'penalty'];
export const PAYMENT_METHOD_OPTIONS = ['cash', 'bank_transfer', 'card', 'cheque'];
export const PAYMENT_STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'];

export const HISTORY_ACTION_OPTIONS = [
  'created',
  'updated', 
  'deleted',
  'status_changed',
  'rent_changed',
  'tenant_assigned',
  'tenant_moved_out',
  'maintenance_requested',
  'maintenance_completed'
];

// Helper function to validate data against schemas
export const validateRoomData = (data) => {
  const errors = {};
  
  if (!data.roomNumber?.trim()) errors.roomNumber = 'Room number is required';
  if (!ROOM_TYPE_OPTIONS.includes(data.type)) errors.type = 'Invalid room type';
  if (!data.capacity || data.capacity < 1) errors.capacity = 'Capacity must be at least 1';
  if (!data.rentAmount || data.rentAmount < 0) errors.rentAmount = 'Rent amount must be positive';
  if (!ROOM_STATUS_OPTIONS.includes(data.status)) errors.status = 'Invalid status';
  if (!BUILDING_OPTIONS.includes(data.building)) errors.building = 'Invalid building';
  if (!data.floor || data.floor < 1) errors.floor = 'Floor must be at least 1';
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateTenantData = (data) => {
  const errors = {};
  
  if (!data.firstName?.trim()) errors.firstName = 'First name is required';
  if (!data.lastName?.trim()) errors.lastName = 'Last name is required';
  if (!data.email?.trim()) errors.email = 'Email is required';
  if (!data.phone?.trim()) errors.phone = 'Phone is required';
  if (!data.leaseStart) errors.leaseStart = 'Lease start date is required';
  if (!data.leaseEnd) errors.leaseEnd = 'Lease end date is required';
  if (!data.monthlyRent || data.monthlyRent < 0) errors.monthlyRent = 'Monthly rent must be positive';
  if (!TENANT_STATUS_OPTIONS.includes(data.status)) errors.status = 'Invalid status';
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

// Database setup helper
export const setupCollections = async (databases, databaseId) => {
  try {
    console.log('Setting up collections for room history management...');
    
    for (const [collectionName, config] of Object.entries(COLLECTIONS_CONFIG)) {
      try {
        // Create collection
        const collection = await databases.createCollection(
          databaseId,
          collections[collectionName],
          config.name,
          config.permissions || [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        console.log(`Created collection: ${config.name}`);
        
        // Create attributes
        for (const attr of config.attributes) {
          await databases.createStringAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.size || 255,
            attr.required || false,
            attr.default || null,
            attr.array || false
          );
        }
        
        // Create indexes
        for (const index of config.indexes) {
          await databases.createIndex(
            databaseId,
            collection.$id,
            index.key,
            index.type,
            [index.key]
          );
        }
        
        console.log(`Set up attributes and indexes for: ${config.name}`);
        
      } catch (error) {
        if (error.code === 409) {
          console.log(`Collection ${config.name} already exists`);
        } else {
          console.error(`Error creating collection ${config.name}:`, error);
        }
      }
    }
    
    console.log('Collections setup completed');
    
  } catch (error) {
    console.error('Error setting up collections:', error);
    throw error;
  }
}; 