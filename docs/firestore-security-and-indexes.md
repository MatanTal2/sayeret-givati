# 🔒 Firestore Security Rules & Indexes Configuration

## Overview

This document outlines the comprehensive security rules and database indexes configured for the Sayeret Givati equipment management system's Firestore database. The configuration ensures proper authentication, authorization, and data validation while optimizing query performance.

## 🛡️ Security Rules Architecture

### Authentication Requirements

All operations on `equipment` and `itemTypes` collections require:

1. **User Authentication**: `request.auth != null`
2. **User Authorization**: User must exist in the `users` collection
3. **Role-Based Access**: User must have appropriate role permissions

### Role-Based Access Control (RBAC)

| Role | Equipment Read | Equipment Write | ItemTypes Read | ItemTypes Write |
|------|----------------|-----------------|----------------|-----------------|
| `soldier` | ✅ | ❌ | ✅ | ❌ |
| `officer` | ✅ | ❌ | ✅ | ❌ |
| `equipment_manager` | ✅ | ✅ | ✅ | ✅ |
| `commander` | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ |

### Collection-Specific Rules

#### Equipment Collection (`/equipment/{equipmentId}`)

**Read Access:**

- Requires authentication
- Must be authorized user (exists in users collection)
- Must have equipment access permission (any valid role)

**Write Access (Create/Update):**

- Requires authentication
- Must be authorized user
- Must have equipment management permission (`equipment_manager`, `commander`, or `admin`)
- Must pass field validation for required fields
- Must pass data type validation

**Delete Access:**

- Only allowed for test documents (`TEST-*` or `DEBUG-*` prefixes)
- Requires equipment management permission

#### ItemTypes Collection (`/itemTypes/{itemTypeId}`)

**Read Access:**

- Requires authentication
- Must be authorized user
- Must have equipment access permission

**Write Access (Create/Update):**

- Requires authentication
- Must be authorized user
- Must have itemTypes management permission (`equipment_manager`, `commander`, or `admin`)
- Must pass field validation for required fields
- Must pass data type validation

**Delete Access:**

- Only allowed for test documents (`TEST-*` or `DEBUG-*` prefixes)
- Requires itemTypes management permission

## 📋 Required Field Validation

### Equipment Documents

**Required Fields on Creation/Update:**

- `id` (string, non-empty)
- `itemTypeId` (string, non-empty) - References itemTypes collection
- `category` (string, non-empty)
- `assignmentType` ('team' or 'personal')
- `status` (string, non-empty)
- `assignedUserId` (string, non-empty)
- `equipmentDepot` (string, non-empty)

**Additional Validation:**

- `assignmentType` must be exactly 'team' or 'personal'
- All string fields must be non-empty
- Core template fields cannot be changed after creation

### ItemTypes Documents

**Required Fields on Creation/Update:**

- `id` (string, non-empty)
- `category` (string, non-empty)
- `model` (string, non-empty)
- `manufacturer` (string, non-empty)
- `assignmentType` ('team' or 'personal')
- `defaultDepot` (string, non-empty)
- `defaultStatus` (string, non-empty)

**Additional Validation:**

- `assignmentType` must be exactly 'team' or 'personal'
- All string fields must be non-empty
- Template ID cannot be changed after creation

## 🚀 Database Indexes

### Equipment Collection Indexes

#### Single Field Indexes

- `category` (ascending)
- `assignmentType` (ascending)
- `equipmentDepot` (ascending)
- `status` (ascending)
- `assignedUserId` (ascending)
- `registeredAt` (descending)
- `createdAt` (descending)
- `updatedAt` (descending)

#### Composite Indexes

- `category` + `assignmentType`
- `category` + `status`
- `assignmentType` + `status`
- `assignedUserId` + `status`
- `equipmentDepot` + `status`

### ItemTypes Collection Indexes

#### Single Field Indexes

- `category` (ascending)
- `assignmentType` (ascending)
- `defaultDepot` (ascending)
- `defaultStatus` (ascending)
- `manufacturer` (ascending)
- `createdAt` (descending)
- `updatedAt` (descending)

#### Composite Indexes

- `category` + `assignmentType`
- `category` + `manufacturer`

## 🔧 Security Rule Functions

### Helper Functions

#### `isAuthorizedUser(uid)`

```javascript
function isAuthorizedUser(uid) {
  return exists(/databases/$(database)/documents/users/$(uid));
}
```

Checks if user exists in the users collection.

#### `getUserRole(uid)`

```javascript
function getUserRole(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.role;
}
```

Retrieves user role from users collection.

#### `canAccessEquipment(uid)`

```javascript
function canAccessEquipment(uid) {
  let role = getUserRole(uid);
  return role in ['soldier', 'officer', 'equipment_manager', 'commander', 'admin'];
}
```

Determines if user can read equipment data.

#### `canManageEquipment(uid)`

```javascript
function canManageEquipment(uid) {
  let role = getUserRole(uid);
  return role in ['equipment_manager', 'commander', 'admin'];
}
```

Determines if user can create/update equipment.

#### `canManageItemTypes(uid)`

```javascript
function canManageItemTypes(uid) {
  let role = getUserRole(uid);
  return role in ['equipment_manager', 'commander', 'admin'];
}
```

Determines if user can create/update itemTypes.

### Validation Functions

#### `validateRequiredEquipmentFields(data)`

```javascript
function validateRequiredEquipmentFields(data) {
  return data.id is string && data.id.size() > 0
    && data.itemTypeId is string && data.itemTypeId.size() > 0
    && data.category is string && data.category.size() > 0
    && data.assignmentType in ['team', 'personal']
    && data.status is string && data.status.size() > 0
    && data.assignedUserId is string && data.assignedUserId.size() > 0
    && data.equipmentDepot is string && data.equipmentDepot.size() > 0;
}
```

#### `validateRequiredItemTypeFields(data)`

```javascript
function validateRequiredItemTypeFields(data) {
  return data.id is string && data.id.size() > 0
    && data.category is string && data.category.size() > 0
    && data.model is string && data.model.size() > 0
    && data.manufacturer is string && data.manufacturer.size() > 0
    && data.assignmentType in ['team', 'personal']
    && data.defaultDepot is string && data.defaultDepot.size() > 0
    && data.defaultStatus is string && data.defaultStatus.size() > 0;
}
```

## 🧪 Testing Security Rules

### Running Security Tests

```bash
npm test -- src/lib/__tests__/securityRules.test.ts
```

### Test Categories

1. **Field Validation Tests**
   - Required field presence
   - Data type validation
   - Field value constraints

2. **Role-Based Access Tests**
   - Permission verification by role
   - Access control simulation

3. **Authentication Tests**
   - User authorization checks
   - Unauthorized access prevention

4. **Test Document Tests**
   - Test document operation permissions
   - Production document protection

## 📈 Query Performance Optimization

### Indexed Query Examples

**Equipment Queries:**

```javascript
// Single field queries (indexed)
equipment.where('category', '==', 'radio')
equipment.where('assignmentType', '==', 'personal')
equipment.where('status', '==', 'active')
equipment.where('assignedUserId', '==', 'user-001')

// Composite queries (indexed)
equipment.where('category', '==', 'radio').where('assignmentType', '==', 'team')
equipment.where('assignmentType', '==', 'personal').where('status', '==', 'active')
equipment.where('assignedUserId', '==', 'user-001').where('status', '==', 'active')

// Ordering queries (indexed)
equipment.orderBy('registeredAt', 'desc')
equipment.orderBy('createdAt', 'desc')
```

**ItemTypes Queries:**

```javascript
// Single field queries (indexed)
itemTypes.where('category', '==', 'radio')
itemTypes.where('assignmentType', '==', 'personal')
itemTypes.where('manufacturer', '==', 'Harris')

// Composite queries (indexed)
itemTypes.where('category', '==', 'radio').where('assignmentType', '==', 'team')
itemTypes.where('category', '==', 'optics').where('manufacturer', '==', 'Trijicon')
```

## 🚀 Deployment Instructions

### 1. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### 2. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Verify Deployment

```bash
# Check index status
firebase firestore:indexes

# Test security rules
npm test -- src/lib/__tests__/securityRules.test.ts
```

## 🔍 Monitoring and Maintenance

### Security Rule Monitoring

- Monitor Firebase Console for security rule violations
- Track authentication failures
- Review access patterns for unusual activity

### Index Performance Monitoring

- Monitor query performance in Firebase Console
- Review composite index usage
- Optimize indexes based on query patterns

### Regular Maintenance Tasks

1. **Monthly**: Review security rule effectiveness
2. **Quarterly**: Analyze query performance and optimize indexes
3. **Annually**: Audit user roles and permissions

## 🚨 Security Best Practices

### Development Environment

- Use `TEST-` or `DEBUG-` prefixes for test documents
- Never store production data in development environment
- Regularly clean up test documents

### Production Environment

- Monitor for unauthorized access attempts
- Implement alerts for security rule violations
- Regular security audits of user roles and permissions

### Data Protection

- All sensitive operations require authentication
- Role-based access ensures data segregation
- Field validation prevents data corruption
- Audit trails through Firestore activity logs

## 📚 Related Documentation

- [Equipment Collection Documentation](./equipment-collection.md)
- [ItemTypes Collection Documentation](./item-types-collection.md)
- [Database Schema Overview](./database-schema.md)
- [Authentication Flow Technical](./authentication-flow-technical.md)

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial security rules and indexes implementation |
| 1.1 | 2024-01 | Enhanced field validation and role-based access |
| 1.2 | 2024-01 | Added comprehensive testing and documentation |
