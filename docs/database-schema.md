# 🎖️ Sayeret Givati Database Schema

## 📋 Overview

This document defines the complete Firestore database structure for the Sayeret Givati military equipment management system. Each collection serves a specific purpose in tracking soldiers, equipment, and military workflows.

## 🗂️ Collections Overview

| Collection | Purpose | Status | Priority |
|------------|---------|---------|----------|
| [`authorized_personnel`](#authorized_personnel-collection) | Pre-authorized personnel for registration | ✅ Implemented | Core |
| [`users`](#users-collection) | Soldier profiles and authentication | ✅ Implemented | Core |
| [`itemTypes`](#itemtypes-collection) | Equipment templates and categories | ✅ Implemented | High |
| [`equipment`](#equipment-collection) | Military equipment tracking | ✅ Implemented | High |
| [`transfers`](#transfers-collection) | Equipment transfer history | 📋 Planned | High |
| [`retirement_requests`](#retirement_requests-collection) | Equipment retirement workflow | 📋 Planned | Medium |
| [`daily_reports`](#daily_reports-collection) | Daily equipment status reports | 📋 Planned | Medium |
| [`units`](#units-collection) | Military unit information | 📋 Planned | Low |

---

## 👤 `users` Collection

### Purpose

Stores soldier profiles, authentication data, and role-based permissions for the military equipment management system.

### Document ID

- **Format**: `{hash_id_uid}` or `TEST-{hash_id_uid}` for test users
- **Example**: `abc123xyz789` or `TEST-abc123xyz789`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | ✅ | Hash military Id UID (matches document ID) |
| `email` | `string` | ✅ | Soldier's military email address |
| `firstName` | `string` | ✅ | First name in Hebrew or English |
| `lastName` | `string` | ✅ | Last name in Hebrew or English |
| `gender` | `string` | ❌ | Gender (e.g., "male", "female") |
| `birthday` | `timestamp` | ❌ | Date of birth |
| `profileImage` | `string` | ❌ | Profile image URL or storage path |
| `rank` | `string` | ✅ | Military rank (e.g., "רב סמל", "סגן", "רס״ן") |
| `role` | `UserRole` | ✅ | Permission level (see UserRole enum) |
| `phoneNumber` | `string` | ❌ | Israeli phone number (+972-XX-XXXXXXX) for OTP |
| `permissions` | `string[]` | ✅ | Computed permissions array |
| `status` | `UserStatus` | ✅ | Active, inactive, transferred, discharged |
| `joinDate` | `timestamp` | ✅ | Date joined the unit |
| `testUser` | `boolean` | ❌ | Flag for test/development users - TEST- prefix in document ID |
| `createdAt` | `timestamp` | ✅ | Document creation timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

### Test User Flag Explanation

The `testUser` flag is used for development and testing purposes:

- **Purpose**: Identifies accounts created for testing/development
- **Document ID**: Test users have `TEST-` prefix (e.g., `TEST-abc123xyz789`)
- **Security**: Test documents have relaxed security rules for development
- **Data**: Test data can be safely deleted without affecting production
- **Usage**: Set to `true` only for non-production testing accounts

### Role Approval System

The system implements a secure role approval workflow:

1. **Default Role**: All new users start with `soldier` role
2. **Role Request**: Users cannot choose privileged roles during registration
3. **Admin Approval**: Only admins with proper privileges can assign higher roles
4. **Role Hierarchy**:
   - `soldier` - Basic access (auto-approved)
   - `team_leader` - Team management (requires approval)
   - `officer` - Enhanced permissions (requires approval)
   - `equipment_manager` - Full equipment access (requires approval)
   - `commander` - Full system access (requires approval)
   - `admin` - System administration (requires approval)
5. **Audit Trail**: All role changes are logged with approver information

### Enums

#### `UserRole`

- `soldier` - Basic user, can view own equipment
- `team_leader` - Can manage team equipment
- `officer` - Can approve transfers and manage platoon equipment
- `equipment_manager` - Full equipment management access
- `commander` - Full system access including user management
- `admin` - System administrator access

#### `UserStatus`

- `active` - Currently serving
- `inactive` - Temporarily inactive
- `transferred` - Transferred to another unit
- `discharged` - Completed service

### Security Rules

- Users can read/write their own document
- Users can read other users for UI purposes
- Only officers+ can modify other user documents
- Test documents (TEST- prefix) allow full access for development

### Important Notes

- **militaryPersonalNumber (מספר אישי) is NOT stored** in this collection for security
- מספר אישי is only stored as hash in `authorized_personnel` collection
- User identification relies on Firebase Auth UID and email

---

## 🔐 `authorized_personnel` Collection

### Purpose

Stores pre-authorized military personnel allowed to register in the system. Used for secure registration flow with מספר אישי verification.

### Document ID

- **Format**: SHA-256 hash of military personal number (מספר אישי)
- **Example**: `7a3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d`
- **Purpose**: Enables O(1) lookup for user registration verification

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `militaryPersonalNumberHash` | `string` | ✅ | SHA-256 hash of מספר אישי (also used as document ID) |
| `phoneNumber` | `string` | ✅ | Pre-assigned phone for MFA (+972-XX-XXXXXXX) |
| `firstName` | `string` | ✅ | Expected first name |
| `lastName` | `string` | ✅ | Expected last name |
| `rank` | `string` | ✅ | Expected military rank |
| `registered` | `boolean` | ❌ | Flag indicating complete registration (Firebase Auth + Firestore profile) |
| `createdAt` | `timestamp` | ✅ | When record was added |
| `createdBy` | `string` | ✅ | Who authorized this person |

### Security Rules

- Only administrators can read/write this collection
- No access from client applications
- Server-side only operations for registration verification

---

## 🏷️ `itemTypes` Collection

### Purpose

Contains equipment templates that serve as blueprints for creating individual equipment items. Templates ensure consistency in equipment categorization and provide default values for new equipment creation.

### Document ID

- **Format**: `TEMPLATE_{CATEGORY}_{MODEL_IDENTIFIER}`
- **Examples**: `TEMPLATE_RADIO_PRC-152`, `TEMPLATE_OPTICS_ACOG`, `TEMPLATE_EXTRACTION_ROPE_30M`

### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | `string` | ✅ | Unique template identifier (also document ID) | `"TEMPLATE_RADIO_PRC-152"` |
| `category` | `string` | ✅ | Equipment category | `"radio"` |
| `model` | `string` | ✅ | Equipment model name | `"PRC-152"` |
| `manufacturer` | `string` | ✅ | Manufacturer name | `"Harris"` |
| `assignmentType` | `'team' \| 'personal'` | ✅ | Assignment type | `"team"` |
| `defaultDepot` | `string` | ✅ | Default storage depot | `"Radio Depot"` |
| `defaultImageUrl` | `string` | ❌ | Optional default image URL | `"https://storage.googleapis.com/..."` |
| `defaultStatus` | `string` | ✅ | Default status for new items | `"work"` |
| `createdAt` | `timestamp` | ❌ | Creation timestamp (auto-generated) | Auto-set |
| `updatedAt` | `timestamp` | ❌ | Last update timestamp (auto-generated) | Auto-set |

### Security Rules

- **Read**: All authenticated users with equipment access permissions
- **Write**: Only `equipment_manager`, `commander`, and `admin` roles
- **Delete**: Only test documents with `TEST-` or `DEBUG-` prefixes

---

## 🎖️ `equipment` Collection

### Purpose

Tracks individual military equipment items based on itemTypes templates. Each equipment document represents a specific piece of equipment with unique identification, assignment, and status tracking.

### Document ID

- **Format**: `EQ-{CATEGORY}-{NUMBER}`
- **Examples**: `EQ-RADIO-001`, `EQ-OPTICS-001`, `EQ-ROPE-001`

### Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | `string` | ✅ | Unique equipment identifier (also document ID) | `"EQ-RADIO-001"` |
| `itemTypeId` | `string` | ✅ | Reference to itemTypes template | `"TEMPLATE_RADIO_PRC-152"` |
| `category` | `string` | ✅ | Equipment category (from template) | `"radio"` |
| `model` | `string` | ✅ | Equipment model (from template) | `"PRC-152"` |
| `manufacturer` | `string` | ✅ | Manufacturer name (from template) | `"Harris"` |
| `assignmentType` | `'team' \| 'personal'` | ✅ | Assignment type (from template) | `"team"` |
| `equipmentDepot` | `string` | ✅ | Storage depot (from template or override) | `"Radio Depot"` |
| `assignedUserId` | `string` | ✅ | User ID of assigned person/team | `"user-001"` |
| `assignedUserName` | `string` | ❌ | Display name of assigned user | `"דני כהן"` |
| `status` | `string` | ✅ | Current status (from template or override) | `"active"` |
| `registeredAt` | `timestamp` | ✅ | When equipment was registered | Auto-set |
| `imageUrl` | `string` | ❌ | Firebase Storage URL for item photo | `"https://storage.googleapis.com/..."` |
| `createdAt` | `timestamp` | ❌ | Document creation timestamp (auto-generated) | Auto-set |
| `updatedAt` | `timestamp` | ❌ | Last update timestamp (auto-generated) | Auto-set |

### Template Integration

Equipment items are created based on itemTypes templates following this process:

1. **Template Selection**: User selects an itemType template
2. **Field Population**: Core fields (category, model, manufacturer, etc.) populated from template
3. **User Customization**: User adds specific assignment and identification details
4. **Document Creation**: Equipment document created with combined template and user data

### Security Rules

- **Read**: All authenticated users with equipment access permissions
- **Write**: Only `equipment_manager`, `commander`, and `admin` roles
- **Delete**: Only test documents with `TEST-` or `DEBUG-` prefixes

### Sample Equipment Document

```json
{
  "id": "EQ-RADIO-001",
  "itemTypeId": "TEMPLATE_RADIO_PRC-152",
  "category": "radio",
  "model": "PRC-152",
  "manufacturer": "Harris",
  "assignmentType": "team",
  "equipmentDepot": "Radio Depot",
  "assignedUserId": "user-001",
  "assignedUserName": "דני כהן",
  "status": "active",
  "registeredAt": "2024-01-15T10:30:00Z",
  "imageUrl": "https://storage.googleapis.com/sayeret-givati/equipment/radio-prc152-001.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Equipment System Workflow

### Adding Equipment Process

1. **Template Selection**: User selects from available itemTypes
2. **Form Pre-fill**: System populates template fields automatically
3. **User Input**: User adds equipment-specific details (ID, assignment, etc.)
4. **Validation**: System validates required fields and data types
5. **Creation**: Equipment document created in Firestore
6. **Confirmation**: User receives success feedback with equipment ID

### Template Management Process

1. **Template Creation**: Admin creates new equipment templates
2. **Category Assignment**: Template assigned to appropriate category
3. **Default Values**: Default depot, status, and other values set
4. **Availability**: Template immediately available for equipment creation
5. **Updates**: Templates can be modified (affects future equipment only)

---

## 📚 Related Documentation

For detailed implementation guides and workflows, see:

- [Equipment Schema & Workflow Documentation](./equipment-schema-and-workflow.md) - Complete schema details and step-by-step workflows
- [Equipment Collection Documentation](./equipment-collection.md) - Detailed equipment collection information
- [ItemTypes Collection Documentation](./item-types-collection.md) - Template management documentation
- [Firestore Security & Indexes](./firestore-security-and-indexes.md) - Security rules and database optimization
- [Firestore Deployment Guide](./firestore-deployment-guide.md) - Deployment instructions

## 🚀 Implementation Status

### Completed ✅

- **User Authentication**: Complete registration and login system
- **ItemTypes Collection**: Equipment template management system
- **Equipment Collection**: Individual equipment tracking system
- **Security Rules**: Comprehensive role-based access control
- **Database Indexes**: Optimized query performance
- **Admin Interface**: Template and equipment management UI

### Planned 📋

- **Equipment Transfers**: Transfer history and approval workflow
- **Retirement Requests**: Equipment retirement management
- **Daily Reports**: Equipment status reporting system
- **Units Management**: Military unit organization
- **Analytics Dashboard**: Equipment usage and performance metrics

## 🔐 Security Overview

The database implements comprehensive security measures:

- **Authentication**: All operations require Firebase Authentication
- **Authorization**: Role-based permissions for different user types
- **Data Validation**: Strict field validation and type checking
- **Access Control**: Collection-level and operation-level restrictions
- **Audit Trail**: Comprehensive logging of all equipment operations

## 🎯 Performance Optimization

- **Indexed Queries**: All common query patterns are indexed
- **Efficient Pagination**: Cursor-based pagination for large datasets
- **Caching Strategy**: Template and user data caching
- **Regional Replication**: Data replicated for global availability

---

*Last Updated: January 2025*  
*Status: Current - Schema Implemented and Deployed*

- `initial_assignment` - First assignment to user
- `transfer` - Transferred between users
- `location_change` - Moved to different location
- `status_change` - Status updated
- `condition_change` - Condition updated
- `daily_report` - Daily status report
- `maintenance_start` - Sent for maintenance
- `maintenance_complete` - Returned from maintenance
- `lost_report` - Reported as lost
- `found_report` - Previously lost item found
- `retirement_request` - Request to retire equipment

#### `ApprovalType`

- `otp_sms` - SMS-based OTP verification
- `otp_app` - In-app OTP verification
- `commander_override` - Emergency override by commander
- `dual_approval` - Two-person verification
- `no_approval_required` - For initial assignments

---

## 🔄 `transfers` Collection

### Purpose

Dedicated collection for tracking equipment transfers between soldiers, providing detailed audit trail and approval workflow.

### Document ID

- **Format**: Auto-generated UUID
- **Example**: `transfer_abc123xyz789`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Transfer ID (same as document ID) |
| `equipmentId` | `string` | ✅ | Reference to equipment document |
| `fromUser` | `string` | ✅ | Previous holder (user UID) |
| `toUser` | `string` | ✅ | New holder (user UID) |
| `fromLocation` | `string` | ✅ | Previous location |
| `toLocation` | `string` | ✅ | New location |
| `initiatedBy` | `string` | ✅ | Who initiated the transfer |
| `reason` | `string` | ✅ | Reason for transfer |
| `status` | `TransferStatus` | ✅ | Current transfer status |
| `priority` | `TransferPriority` | ✅ | Transfer priority level |
| `approvalRequired` | `boolean` | ✅ | Whether approval is needed |
| `approvals` | `ApprovalEntry[]` | ❌ | Approval chain |
| `scheduledDate` | `timestamp` | ❌ | When transfer should happen |
| `completedDate` | `timestamp` | ❌ | When transfer was completed |
| `notes` | `string` | ❌ | Additional transfer notes |
| `createdAt` | `timestamp` | ✅ | Transfer request timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

### Enums

#### `TransferStatus`

- `pending` - Waiting for approval
- `approved` - Approved, ready for transfer
- `in_progress` - Transfer happening now
- `completed` - Transfer finished
- `rejected` - Transfer denied
- `cancelled` - Transfer cancelled

#### `TransferPriority`

- `low` - Regular transfer
- `normal` - Standard priority
- `high` - Important transfer
- `urgent` - Emergency transfer

---

## 🗑️ `retirement_requests` Collection

### Purpose

Manages requests to permanently remove equipment from service, with approval workflow.

### Document ID

- **Format**: Auto-generated UUID
- **Example**: `retirement_abc123xyz789`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Request ID (same as document ID) |
| `equipmentId` | `string` | ✅ | Reference to equipment document |
| `requestedBy` | `string` | ✅ | Who requested retirement (user UID) |
| `reason` | `RetirementReason` | ✅ | Why equipment is being retired |
| `description` | `string` | ✅ | Detailed explanation |
| `status` | `RetirementStatus` | ✅ | Current request status |
| `priority` | `RetirementPriority` | ✅ | Request priority |
| `approvals` | `ApprovalEntry[]` | ❌ | Approval chain |
| `estimatedValue` | `number` | ❌ | Current estimated value |
| `disposalMethod` | `string` | ❌ | How equipment will be disposed |
| `completedDate` | `timestamp` | ❌ | When retirement was completed |
| `notes` | `string` | ❌ | Additional notes |
| `attachments` | `string[]` | ❌ | URLs to supporting documents/photos |
| `createdAt` | `timestamp` | ✅ | Request timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

### Enums

#### `RetirementReason`

- `broken_irreparable` - Cannot be fixed
- `obsolete` - Technology is outdated
- `end_of_life` - Reached end of service life
- `lost_permanent` - Permanently lost
- `stolen` - Confirmed stolen
- `damaged_beyond_repair` - Too damaged to use
- `safety_concern` - Safety issues identified

#### `RetirementStatus`

- `pending` - Waiting for review
- `approved` - Approved for retirement
- `in_progress` - Retirement being processed
- `completed` - Equipment retired
- `rejected` - Request denied

#### `RetirementPriority`

- `low` - Can wait
- `normal` - Standard priority
- `high` - Should be processed soon
- `urgent` - Safety or security concern

---

## 📊 `daily_reports` Collection

### Purpose

Stores daily equipment status reports and check-ins to ensure accountability and track equipment location.

### Document ID

- **Format**: `{date}_{user_uid}`
- **Example**: `2024-01-15_abc123xyz789`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Report ID (same as document ID) |
| `reportDate` | `timestamp` | ✅ | Date of the report |
| `reportedBy` | `string` | ✅ | Who submitted the report (user UID) |
| `equipmentChecks` | `EquipmentCheck[]` | ✅ | List of equipment checked |
| `status` | `ReportStatus` | ✅ | Report completion status |
| `totalItems` | `number` | ✅ | Total equipment items to check |
| `checkedItems` | `number` | ✅ | Number of items actually checked |
| `issuesFound` | `number` | ✅ | Number of issues identified |
| `location` | `string` | ✅ | Where report was conducted |
| `notes` | `string` | ❌ | General report notes |
| `submittedAt` | `timestamp` | ✅ | When report was submitted |
| `createdAt` | `timestamp` | ✅ | Report creation timestamp |

### Sub-Objects

#### `EquipmentCheck`

```typescript
{
  equipmentId: string;         // Equipment being checked
  found: boolean;              // Was equipment located
  condition: EquipmentCondition; // Current condition
  location: string;            // Where it was found
  notes?: string;              // Check-specific notes
  issuesFound?: string[];      // List of problems identified
  photoUrl?: string;           // Photo evidence if needed
  checkedAt: timestamp;        // When this item was checked
}
```

### Enums

#### `ReportStatus`

- `in_progress` - Report being filled out
- `completed` - All items checked
- `submitted` - Report submitted for review
- `reviewed` - Report has been reviewed
- `issues_found` - Problems identified

---

## 🏛️ `units` Collection

### Purpose

Defines military unit structure, hierarchy, and relationships for organizational management.

### Document ID

- **Format**: Unit code/name
- **Example**: `sayeret-givati`, `company-a`, `platoon-1`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unit ID (same as document ID) |
| `name` | `string` | ✅ | Unit name in Hebrew and English |
| `nameHebrew` | `string` | ✅ | Hebrew unit name |
| `nameEnglish` | `string` | ✅ | English unit name |
| `type` | `UnitType` | ✅ | Type of military unit |
| `parentUnit` | `string` | ❌ | Parent unit ID (if applicable) |
| `subUnits` | `string[]` | ❌ | Array of sub-unit IDs |
| `commander` | `string` | ❌ | Current commander (user UID) |
| `location` | `string` | ✅ | Primary unit location |
| `establishedDate` | `timestamp` | ❌ | When unit was established |
| `status` | `UnitStatus` | ✅ | Current unit status |
| `description` | `string` | ❌ | Unit description and mission |
| `contactInfo` | `object` | ❌ | Contact information |
| `createdAt` | `timestamp` | ✅ | Document creation timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

### Enums

#### `UnitType`

- `brigade` - Brigade level
- `battalion` - Battalion level
- `company` - Company level
- `platoon` - Platoon level
- `squad` - Squad level
- `team` - Team level

#### `UnitStatus`

- `active` - Currently operational
- `inactive` - Temporarily inactive
- `disbanded` - No longer exists
- `reorganizing` - Under reorganization

---

## 📦 `categories` Collection

### Purpose

Defines equipment categories, types, and classification system for better organization and reporting.

### Document ID

- **Format**: Category name/code
- **Example**: `weapons`, `communication`, `protective-gear`

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Category ID (same as document ID) |
| `name` | `string` | ✅ | Category name |
| `nameHebrew` | `string` | ✅ | Hebrew category name |
| `nameEnglish` | `string` | ✅ | English category name |
| `description` | `string` | ✅ | Category description |
| `parentCategory` | `string` | ❌ | Parent category (for subcategories) |
| `subcategories` | `string[]` | ❌ | Array of subcategory IDs |
| `requiredFields` | `string[]` | ❌ | Additional required fields for this category |
| `defaultCondition` | `EquipmentCondition` | ✅ | Default condition for new equipment |
| `requiresApproval` | `boolean` | ✅ | Whether transfers need approval |
| `maintenanceInterval` | `number` | ❌ | Days between maintenance (if applicable) |
| `averageLifespan` | `number` | ❌ | Expected lifespan in months |
| `color` | `string` | ❌ | UI color for this category |
| `icon` | `string` | ❌ | Icon name for UI |
| `sortOrder` | `number` | ✅ | Display order |
| `isActive` | `boolean` | ✅ | Whether category is in use |
| `createdAt` | `timestamp` | ✅ | Document creation timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

---

## 🔍 Indexes Required

### Composite Indexes

#### Users Collection

- `role` + `status` - For team management queries (active users by role)
- `status` + `createdAt` - For user registration analytics

#### Equipment Collection

- `currentHolder` + `status` - For user equipment status queries
- `assignedUnit` + `status` - For unit equipment management
- `category` + `status` - For equipment type filtering
- `lastReportUpdate` + `status` - For equipment accountability

#### Transfers Collection

- `fromUser` + `status` - For user transfer history
- `toUser` + `status` - For incoming transfer queries
- `status` + `createdAt` - For transfer workflow management

#### Daily Reports Collection

- `reportedBy` + `reportDate` - For user report history
- `reportDate` + `status` - For daily report analytics

#### Authorized Personnel Collection

- `createdBy` + `createdAt` - For admin audit queries

### Single Field Indexes

#### Users Collection

- `users.role` - For role-based queries and permissions  
- `users.status` - For filtering active/inactive users

> **Note**: `unit` field was removed from users collection. Unit-based queries will be handled through equipment assignments.

#### Equipment Collection  

- `equipment.status` - For equipment status filtering
- `equipment.currentHolder` - For user equipment queries
- `equipment.assignedUnit` - For unit-based equipment queries

#### Other Collections

- `transfers.status` - For transfer workflow queries
- `retirement_requests.status` - For retirement request filtering
- `authorized_personnel.createdBy` - For admin management queries

---

## 🛡️ Security Rules Summary

### Access Patterns

- **Soldiers**: Read own equipment, limited write access
- **Team Leaders**: Manage team equipment
- **Officers**: Approve transfers, manage unit equipment
- **Equipment Managers**: Full equipment access
- **Commanders**: Full system access

### Key Rules

- Users can always read their own profile
- Equipment reads based on assignment and role
- Transfers require proper approval chain
- Test documents (TEST- prefix) allow development access
- All writes are logged with user attribution

---

## 🚀 Implementation Priority

### Phase 1 (Core)

1. ✅ `users` - Already implemented
2. 📋 `equipment` - Next priority
3. 📋 `transfers` - Core functionality

### Phase 2 (Enhanced)

4; 📋 `retirement_requests` - Workflow management
5; 📋 `daily_reports` - Accountability

### Phase 3 (Organizational)

6; 📋 `units` - Structure
7; 📋 `categories` - Classification

---

## 📝 Notes

- All timestamps use Firebase `serverTimestamp()`
- All user references use Firebase Auth UIDs
- Hebrew text support required throughout
- QR code integration planned for equipment
- Photo/document attachment support planned
- Real-time updates for critical status changes

---

*Last Updated: January 2025*
*Status: Draft - Awaiting Review and Updates*
