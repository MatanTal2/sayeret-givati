# Equipment Tracking System (צלם) Documentation

## Overview

The Equipment Tracking System (צלם) is designed to manage military equipment with serial numbers, providing comprehensive tracking of item locations, holders, transfers, and maintenance history. The system ensures accountability and provides audit trails for all equipment operations.

## Core Concepts

- **צלם (Tzelem)**: Military items with serial numbers that require sign-out/sign-in tracking
- **Accountability**: Every equipment item must have a designated holder at all times
- **Audit Trail**: Complete history of all transfers and status changes
- **Security**: OTP-based approval system for transfers and critical operations

## Firestore Database Structure

### Collections

#### 1. `equipment` Collection

**Document ID**: Equipment serial number (e.g., `M4-12345`, `RAD-5678`)

**Document Structure**:

```typescript
{
  id: string;                    // Serial number (same as document ID)
  productName: string;           // Item name (e.g., "M4 Rifle", "Radio Set")
  category: string;              // Equipment category
  dateSigned: string;            // ISO date - initial sign-in
  signedBy: string;              // Who initially signed the item
  currentHolder: string;         // Current responsible person
  assignedUnit: string;          // Unit/platoon assignment
  status: EquipmentStatus;       // Current status (active/lost/broken/etc.)
  location: string;              // Physical location
  condition: EquipmentCondition; // Physical condition
  notes?: string;                // Optional notes
  lastReportUpdate: string;      // ISO date - last daily check
  trackingHistory: Array<{       // Complete audit trail
    holder: string;
    fromDate: string;
    toDate?: string;
    action: EquipmentAction;
    updatedBy: string;
    notes?: string;
    approval?: {
      approvedBy: string;
      approvedAt: string;
      approvalType: ApprovalType;
      phoneLast4?: string;
      emergencyOverride?: {
        overrideBy: string;
        overrideReason: string;
        originalHolder: string;
        overrideAt: string;
        justification: string;
      };
    };
    timestamp: string;
  }>;
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
}
```

#### 2. `users` Collection

**Document ID**: User ID from Firebase Auth

**Document Structure**:

```typescript
{
  uid: string;                   // Firebase Auth UID
  name: string;                  // Full name
  unit: string;                  // Assigned unit/platoon
  role: UserRole;                // Permission level
  phoneNumber?: string;          // For OTP verification
  permissions: EquipmentPermission[]; // Computed permissions
  createdAt: string;
  updatedAt: string;
}
```

#### 3. `retirement_requests` Collection

**Document ID**: Auto-generated

**Document Structure**:

```typescript
{
  equipmentId: string;           // Reference to equipment
  requestedBy: string;           // Who requested retirement
  requestedAt: string;           // ISO date
  reason: string;                // Reason for retirement
  approvedBy?: string;           // Who approved (if approved)
  approvedAt?: string;           // ISO date
  status: RetirementStatus;      // pending/approved/rejected
  notes?: string;
}
```

## Data Types and Enums

### EquipmentStatus

- `active`: Equipment in normal use
- `lost`: Equipment is missing
- `broken`: Equipment is damaged/non-functional
- `maintenance`: Equipment under repair
- `retired`: Equipment removed from service
- `pending_transfer`: Transfer in progress
- `pending_retirement`: Retirement request pending

### EquipmentCondition

- `excellent`: Perfect condition
- `good`: Minor wear, fully functional
- `fair`: Noticeable wear, functional
- `poor`: Significant wear, limited function
- `damaged`: Partially damaged but usable
- `broken`: Non-functional

### UserRole

- `soldier`: Basic user, limited permissions
- `officer`: Enhanced permissions, can approve transfers
- `equipment_manager`: Full equipment management access
- `commander`: Full system access including user management

### ApprovalType

- `otp_sms`: SMS-based OTP verification
- `otp_app`: In-app OTP verification
- `commander_override`: Emergency override by commander
- `dual_approval`: Two-person verification
- `no_approval_required`: For initial sign-ins

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for UI
      
      // Allow test documents with TEST- prefix for development/testing
      allow read, write, delete: if request.auth != null && userId.matches('^TEST-.*');
    }
    
    // Equipment collection
    match /equipment/{equipmentId} {
      // Allow read access to authenticated users
      allow read: if request.auth != null;
      
      // Allow write access only to authorized users
      allow create: if request.auth != null 
        && isAuthorizedUser(request.auth.uid)
        && validateEquipmentCreate(resource.data);
      
      allow update: if request.auth != null 
        && isAuthorizedUser(request.auth.uid)
        && validateEquipmentUpdate(resource.data, request.resource.data);
      
      // Prevent deletion (use retirement instead)
      allow delete: if false;
    }
    
    // Retirement requests
    match /retirement_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && isAuthorizedUser(request.auth.uid);
      allow update: if request.auth != null && canApproveRetirement(request.auth.uid);
      allow delete: if false;
    }
    
    // Helper functions
    function isAuthorizedUser(uid) {
      return exists(/databases/$(database)/documents/users/$(uid));
    }
    
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
    
    function canApproveRetirement(uid) {
      let role = getUserRole(uid);
      return role in ['equipment_manager', 'commander'];
    }
    
    function validateEquipmentCreate(data) {
      return data.keys().hasAll(['id', 'productName', 'category', 'currentHolder', 'assignedUnit', 'status', 'condition'])
        && data.id is string
        && data.productName is string
        && data.category is string
        && data.currentHolder is string
        && data.assignedUnit is string
        && data.status in ['active', 'lost', 'broken', 'maintenance', 'retired']
        && data.condition in ['excellent', 'good', 'fair', 'poor', 'damaged', 'broken'];
    }
    
    function validateEquipmentUpdate(before, after) {
      // Ensure required fields are not removed
      return after.keys().hasAll(['id', 'productName', 'category', 'currentHolder', 'assignedUnit', 'status', 'condition'])
        && after.id == before.id // Cannot change ID
        && after.createdAt == before.createdAt // Cannot change creation date
        && after.trackingHistory.size() >= before.trackingHistory.size(); // Can only add to history, not remove
    }
  }
}
```

## API Patterns

### Creating Equipment

```typescript
import { createNewEquipment } from '@/lib/equipmentUtils';

const equipment = createNewEquipment(
  'M4-12345',
  'M4 Carbine',
  'Weapons',
  'Alpha Company',
  'Armory',
  EquipmentCondition.EXCELLENT,
  'Sgt. Cohen',
  'Initial sign-in'
);

await db.collection('equipment').doc(equipment.id).set(equipment);
```

### Transferring Equipment

```typescript
import { transferEquipment } from '@/lib/equipmentUtils';

const updatedEquipment = transferEquipment(
  currentEquipment,
  'Cpl. Levi',
  'Sgt. Cohen',
  {
    approvedBy: 'Cpl. Levi',
    approvalType: ApprovalType.OTP_SMS,
    phoneLast4: '1234'
  },
  'Bravo Company', // new unit
  'Field Base',    // new location
  'Transfer for mission'
);

await db.collection('equipment').doc(equipment.id).update(updatedEquipment);
```

### Daily Check-in

```typescript
import { performDailyCheckIn } from '@/lib/equipmentUtils';

const updatedEquipment = performDailyCheckIn(
  equipment,
  'Cpl. Levi',
  'All equipment accounted for'
);

await db.collection('equipment').doc(equipment.id).update({
  lastReportUpdate: updatedEquipment.lastReportUpdate,
  trackingHistory: updatedEquipment.trackingHistory,
  updatedAt: updatedEquipment.updatedAt
});
```

## Indexing Strategy

### Recommended Composite Indexes

1. **Equipment List Queries**:
   - `assignedUnit` (Ascending) → `status` (Ascending) → `lastReportUpdate` (Descending)
   - `currentHolder` (Ascending) → `status` (Ascending) → `createdAt` (Descending)
   - `category` (Ascending) → `condition` (Ascending) → `updatedAt` (Descending)

2. **Search Queries**:
   - `assignedUnit` (Ascending) → `productName` (Ascending)
   - `status` (Ascending) → `condition` (Ascending) → `lastReportUpdate` (Descending)

3. **Audit Queries**:
   - `trackingHistory.updatedBy` (Ascending) → `updatedAt` (Descending)
   - `trackingHistory.action` (Ascending) → `trackingHistory.timestamp` (Descending)

## Performance Considerations

### Data Size Management

- **History Limit**: Consider archiving history entries older than 2 years
- **Pagination**: Use Firestore's `startAfter()` for large equipment lists
- **Caching**: Cache frequently accessed equipment lists on the client

### Query Optimization

- **Use specific filters**: Always filter by `assignedUnit` when possible
- **Limit results**: Use `.limit()` for list views
- **Order by indexed fields**: Ensure queries use indexed fields for ordering

## Security Considerations

### Authentication

- All users must authenticate via Firebase Auth
- Phone verification required for OTP operations
- Role-based permissions enforced at multiple layers

### Data Protection

- Equipment serial numbers may be sensitive military information
- Audit trails must be immutable once created
- User permissions should follow principle of least privilege

### OTP Security

- OTP codes should expire after 5 minutes
- Limit OTP generation to prevent abuse
- Log all OTP attempts for security monitoring

## Backup and Recovery

### Backup Strategy

- **Daily backups**: Full Firestore export to Cloud Storage
- **Real-time replication**: Consider multi-region setup for critical deployments
- **Audit trail preservation**: Ensure history data is never lost

### Recovery Procedures

- Equipment data recovery from daily backups
- User data restoration procedures
- Emergency access protocols for system administrators

---

## Next Steps

1. **Set up Firestore collections** with proper indexing
2. **Configure security rules** and test with different user roles
3. **Implement authentication flow** with phone verification
4. **Create basic CRUD operations** for equipment management
5. **Build user interface** components for equipment tracking

This documentation will be updated as the system evolves and new features are added.
