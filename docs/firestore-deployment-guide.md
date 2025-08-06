# 🚀 Firestore Security & Indexes Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Firestore security rules and indexes for the Sayeret Givati equipment management system.

## Prerequisites

- Firebase CLI installed and authenticated
- Project configured with Firebase
- Firestore database enabled

## 📁 Configuration Files

The following files are configured for deployment:

- `firestore.rules` - Security rules for collections
- `firestore.indexes.json` - Database indexes configuration

## 🚀 Deployment Steps

### 1. Verify Configuration Files

Before deployment, ensure the configuration files are properly formatted:

```bash
# Check if files exist
ls firestore.rules firestore.indexes.json

# Validate JSON syntax
cat firestore.indexes.json | jq .
```

### 2. Deploy Security Rules

Deploy the security rules to Firestore:

```bash
firebase deploy --only firestore:rules
```

Expected output:

```ascii
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

### 3. Deploy Indexes

Deploy the database indexes:

```bash
firebase deploy --only firestore:indexes
```

Expected output:

```ascii
✔ Deploy complete!

Indexes will be created in the background. You can check their status at:
https://console.firebase.google.com/project/your-project/firestore/indexes
```

### 4. Deploy Both Together

To deploy both rules and indexes simultaneously:

```bash
firebase deploy --only firestore
```

## ✅ Verification Steps

### 1. Check Security Rules

Verify rules are deployed in Firebase Console:

1. Go to Firebase Console → Firestore Database
2. Click on "Rules" tab
3. Verify the rules match your local `firestore.rules` file

### 2. Check Indexes Status

Monitor index creation progress:

1. Go to Firebase Console → Firestore Database
2. Click on "Indexes" tab
3. Verify all indexes are listed and status shows "Enabled"

### 3. Run Security Tests

Execute the security tests to verify rules work correctly:

```bash
npm test -- src/lib/__tests__/securityRules.test.ts
```

All tests should pass (15/15).

## 🔍 Index Creation Monitoring

Indexes are created asynchronously. Monitor their status:

### Check Index Status via CLI

```bash
firebase firestore:indexes
```

### Expected Index List

The following indexes should be created:

**Equipment Collection:**

- Single field indexes: category, assignmentType, equipmentDepot, status, assignedUserId
- Composite indexes: category+assignmentType, category+status, etc.

**ItemTypes Collection:**

- Single field indexes: category, assignmentType, defaultDepot, defaultStatus, manufacturer
- Composite indexes: category+assignmentType, category+manufacturer

## 🚨 Troubleshooting

### Security Rules Issues

**Problem:** Rules deployment fails

```bash
Error: HTTP Error: 400, Invalid security rules
```

**Solution:**

1. Check syntax in `firestore.rules`
2. Validate function names and logic
3. Ensure proper indentation

### Index Creation Issues

**Problem:** Index creation fails or takes too long

```bash
Error: Index creation failed
```

**Solutions:**

1. Check for conflicting indexes
2. Verify field names match exactly
3. Wait for existing operations to complete

### Permission Issues

**Problem:** Cannot deploy due to permissions

```bash
Error: HTTP Error: 403, Insufficient permission
```

**Solutions:**

1. Verify Firebase authentication: `firebase login`
2. Check project access: `firebase projects:list`
3. Ensure proper IAM roles in Google Cloud Console

## 📊 Performance Monitoring

After deployment, monitor query performance:

### 1. Firebase Console Monitoring

- Monitor query performance in Firestore usage tab
- Check for missing index warnings
- Review composite index usage

### 2. Application Monitoring

Monitor application queries:

```javascript
// Example: Monitor query performance
console.time('equipment-query');
await EquipmentService.getEquipmentByCategory('radio');
console.timeEnd('equipment-query');
```

## 🔄 Updates and Maintenance

### Updating Security Rules

1. Modify `firestore.rules` locally
2. Test changes with security test suite
3. Deploy: `firebase deploy --only firestore:rules`

### Adding New Indexes

1. Add indexes to `firestore.indexes.json`
2. Deploy: `firebase deploy --only firestore:indexes`
3. Monitor creation in Firebase Console

### Removing Indexes

1. Remove from `firestore.indexes.json`
2. Deploy to remove from Firebase
3. Manually delete from Console if needed

## 🛡️ Security Best Practices

### Before Deployment

- Review all rule changes
- Test with comprehensive test suite
- Verify user roles are properly configured

### After Deployment

- Monitor for security rule violations
- Review access patterns regularly
- Keep test documents separate with TEST- prefix

## 📋 Deployment Checklist

- [ ] Configuration files validated
- [ ] Security tests passing
- [ ] Firebase CLI authenticated
- [ ] Correct project selected
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Rules verified in Console
- [ ] Indexes status checked
- [ ] Application tested with new rules
- [ ] Performance monitoring enabled

## 🔗 Related Commands

```bash
# Check current project
firebase use

# Switch project
firebase use <project-id>

# List all projects
firebase projects:list

# Check deployment status
firebase deploy --only firestore --dry-run

# View current rules
firebase firestore:rules get

# View current indexes
firebase firestore:indexes
```

## 📞 Support

If you encounter issues during deployment:

1. Check Firebase Status: <https://status.firebase.google.com/>
2. Review Firebase Documentation: <https://firebase.google.com/docs/firestore>
3. Check project logs in Google Cloud Console
4. Verify IAM permissions for the service account

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Security rules deployed without errors
- ✅ All indexes show "Enabled" status
- ✅ Security tests pass completely
- ✅ Application functions with new rules
- ✅ Query performance is optimal
- ✅ No security violations in logs
