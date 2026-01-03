# Room History Management - Production Implementation Guide

## 📊 Database Schema Design

### 1. Required Collections

#### **roomHistory** Collection
```javascript
{
  // Document ID (auto-generated)
  $id: "unique_id",
  
  // Reference to the room
  roomId: "room_document_id",
  
  // Action performed
  action: "created" | "updated" | "deleted" | "status_changed" | "rent_changed",
  
  // JSON string of old values (for updates)
  oldValues: "{\"rentAmount\": 3000, \"status\": \"available\"}",
  
  // JSON string of new values
  newValues: "{\"rentAmount\": 3500, \"status\": \"occupied\"}",
  
  // User who made the change
  changedBy: "user_id",
  changedByName: "admin@example.com",
  
  // Human-readable description
  details: "Rent changed from 3000 OMR to 3500 OMR, status changed from available to occupied",
  
  // Timestamps
  timestamp: "2024-01-15T10:30:00.000Z",
  $createdAt: "2024-01-15T10:30:00.000Z",
  $updatedAt: "2024-01-15T10:30:00.000Z"
}
```

#### **rooms** Collection (Enhanced)
```javascript
{
  $id: "unique_id",
  roomNumber: "A101",
  type: "single" | "double" | "suite",
  capacity: 2,
  rentAmount: 3000,
  status: "available" | "occupied" | "maintenance",
  building: "A" | "B" | "C" | "D",
  floor: 1,
  
  // Audit fields
  createdBy: "user_id",
  updatedBy: "user_id",
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

#### **tenants** Collection
```javascript
{
  $id: "unique_id",
  roomId: "room_document_id",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+968123456789",
  
  // Tenancy dates
  checkIn: "2024-01-01T00:00:00.000Z",
  checkOut: "2024-06-30T00:00:00.000Z", // null if still active
  
  // Lease details
  leaseStart: "2024-01-01T00:00:00.000Z",
  leaseEnd: "2024-12-31T00:00:00.000Z",
  monthlyRent: 3000,
  deposit: 1000,
  
  // Status
  status: "active" | "inactive" | "terminated",
  
  $createdAt: "2024-01-01T00:00:00.000Z",
  $updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### **maintenance** Collection
```javascript
{
  $id: "unique_id",
  roomId: "room_document_id",
  
  // Maintenance details
  type: "routine" | "emergency" | "request",
  category: "plumbing" | "electrical" | "hvac" | "general",
  description: "Air conditioning unit repair",
  priority: "low" | "medium" | "high" | "critical",
  
  // Status tracking
  status: "pending" | "in_progress" | "completed" | "cancelled",
  
  // Personnel
  assignedTo: "maintenance_staff_id",
  reportedBy: "user_id",
  
  // Dates
  reportedDate: "2024-01-15T10:30:00.000Z",
  scheduledDate: "2024-01-16T09:00:00.000Z",
  completedDate: "2024-01-16T15:30:00.000Z",
  
  // Costs
  estimatedCost: 150,
  actualCost: 175,
  
  $createdAt: "2024-01-15T10:30:00.000Z",
  $updatedAt: "2024-01-16T15:30:00.000Z"
}
```

#### **payments** Collection
```javascript
{
  $id: "unique_id",
  roomId: "room_document_id",
  tenantId: "tenant_document_id",
  
  // Payment details
  amount: 3000,
  type: "rent" | "deposit" | "utilities" | "penalty",
  paymentMethod: "cash" | "bank_transfer" | "card" | "cheque",
  
  // Status
  status: "pending" | "completed" | "failed" | "refunded",
  
  // Dates
  dueDate: "2024-01-01T00:00:00.000Z",
  paidDate: "2024-01-01T10:30:00.000Z",
  
  // Reference
  referenceNumber: "PAY001234",
  description: "Monthly rent for January 2024",
  
  $createdAt: "2024-01-01T10:30:00.000Z",
  $updatedAt: "2024-01-01T10:30:00.000Z"
}
```

## 🔧 Implementation Steps

### 1. Create Collections in AppWrite

```javascript
// In your database setup script
const collections = {
  rooms: "rooms_collection_id",
  roomHistory: "room_history_collection_id",
  tenants: "tenants_collection_id",
  maintenance: "maintenance_collection_id",
  payments: "payments_collection_id"
};
```

### 2. Set Up Indexes

```javascript
// For roomHistory collection
- roomId (key index)
- action (key index)  
- timestamp (key index)
- changedBy (key index)

// For tenants collection
- roomId (key index)
- status (key index)
- checkIn (key index)
- checkOut (key index)

// For maintenance collection
- roomId (key index)
- status (key index)
- reportedDate (key index)

// For payments collection
- roomId (key index)
- tenantId (key index)
- status (key index)
- dueDate (key index)
```

### 3. Set Up Permissions

```javascript
// roomHistory collection permissions
- Read: Admin, Manager roles
- Create: Admin, Manager roles
- Update: Admin role only
- Delete: Admin role only

// Other collections
- Read: Admin, Manager, Staff roles
- Create: Admin, Manager roles
- Update: Admin, Manager roles
- Delete: Admin role only
```

## 🚀 Production Features

### 1. Automated History Tracking

```javascript
// Trigger history creation on any room operation
const trackRoomChange = async (roomId, action, oldData, newData, userId) => {
  try {
    await databases.createDocument(
      databaseId,
      collections.roomHistory,
      ID.unique(),
      {
        roomId,
        action,
        oldValues: JSON.stringify(oldData),
        newValues: JSON.stringify(newData),
        changedBy: userId,
        changedByName: await getUserName(userId),
        timestamp: new Date().toISOString(),
        details: generateChangeDescription(action, oldData, newData)
      }
    );
  } catch (error) {
    console.error('Failed to track room change:', error);
  }
};
```

### 2. Real-time Updates

```javascript
// Set up real-time subscriptions for room changes
useEffect(() => {
  const unsubscribe = client.subscribe(
    `databases.${databaseId}.collections.${collections.rooms}.documents`,
    response => {
      // Update local state when rooms change
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        fetchRooms();
      }
    }
  );
  
  return () => unsubscribe();
}, []);
```

### 3. Data Retention Policy

```javascript
// Clean up old history records (run as scheduled job)
const cleanupOldHistory = async () => {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Keep 2 years
  
  try {
    const oldRecords = await databases.listDocuments(
      databaseId,
      collections.roomHistory,
      [Query.lessThan('timestamp', cutoffDate.toISOString())]
    );
    
    for (const record of oldRecords.documents) {
      await databases.deleteDocument(
        databaseId,
        collections.roomHistory,
        record.$id
      );
    }
  } catch (error) {
    console.error('Failed to cleanup old history:', error);
  }
};
```

### 4. Export Functionality

```javascript
// Export room history to CSV/Excel
const exportRoomHistory = async (roomId, format = 'csv') => {
  try {
    const history = await databases.listDocuments(
      databaseId,
      collections.roomHistory,
      [
        Query.equal('roomId', roomId),
        Query.orderDesc('timestamp'),
        Query.limit(1000) // Adjust as needed
      ]
    );
    
    // Convert to desired format
    if (format === 'csv') {
      return convertToCSV(history.documents);
    } else if (format === 'excel') {
      return convertToExcel(history.documents);
    }
  } catch (error) {
    console.error('Failed to export history:', error);
  }
};
```

## 📈 Analytics & Reporting

### 1. Room Performance Metrics

```javascript
// Calculate key metrics
const calculateRoomMetrics = async (roomId) => {
  const [tenantHistory, maintenanceHistory, paymentHistory] = await Promise.all([
    getTenantHistory(roomId),
    getMaintenanceHistory(roomId),
    getPaymentHistory(roomId)
  ]);
  
  return {
    occupancyRate: calculateOccupancyRate(tenantHistory),
    averageStayDuration: calculateAverageStay(tenantHistory),
    maintenanceCosts: calculateMaintenanceCosts(maintenanceHistory),
    revenue: calculateRevenue(paymentHistory),
    maintenanceFrequency: maintenanceHistory.length
  };
};
```

### 2. Trend Analysis

```javascript
// Track rent changes over time
const getRentTrends = async (roomId) => {
  const history = await databases.listDocuments(
    databaseId,
    collections.roomHistory,
    [
      Query.equal('roomId', roomId),
      Query.equal('action', 'rent_changed'),
      Query.orderAsc('timestamp')
    ]
  );
  
  return history.documents.map(record => ({
    date: record.timestamp,
    oldRent: JSON.parse(record.oldValues).rentAmount,
    newRent: JSON.parse(record.newValues).rentAmount
  }));
};
```

## 🔒 Security Considerations

### 1. Data Encryption
- Encrypt sensitive data in oldValues/newValues
- Use AppWrite's built-in encryption for sensitive fields

### 2. Access Control
- Implement role-based access to history data
- Log who accesses history records

### 3. Audit Trail
- Never delete history records in production
- Implement soft deletes if necessary

## 🚨 Monitoring & Alerts

### 1. Set up alerts for:
- Failed history record creation
- Unusual room activity patterns
- Long-term vacant rooms
- High maintenance frequency

### 2. Performance monitoring:
- Track history query performance
- Monitor database growth
- Set up automated backups

## 📋 Maintenance Tasks

### Daily
- Backup history data
- Monitor error logs

### Weekly  
- Review room performance metrics
- Check for data inconsistencies

### Monthly
- Generate comprehensive reports
- Archive old records (if needed)
- Performance optimization

### Yearly
- Data retention policy review
- Security audit
- Schema optimization 