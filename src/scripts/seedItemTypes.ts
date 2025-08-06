/**
 * Script to seed the itemTypes collection with mock data
 * Run this script to populate the Firestore collection with standard equipment templates
 * 
 * Usage:
 * - For development: Can be run directly or imported into components
 * - For production: Should be run by authorized admin users only
 */

import { ItemTypesService, MOCK_ITEM_TYPES } from '@/lib/itemTypesService';

/**
 * Main function to seed the itemTypes collection
 */
export async function seedItemTypesCollection(): Promise<void> {
  console.log('🚀 Starting itemTypes collection seeding...');
  console.log(`📦 Preparing to seed ${MOCK_ITEM_TYPES.length} item types`);

  try {
    // Check if collection is already populated
    const isEmpty = await ItemTypesService.isCollectionEmpty();
    
    if (!isEmpty) {
      console.log('⚠️ ItemTypes collection already contains data');
      console.log('🔍 Fetching existing item types...');
      
      const existingItems = await ItemTypesService.getAllItemTypes();
      console.log(`📋 Found ${existingItems.length} existing item types:`);
      
      existingItems.forEach(item => {
        console.log(`  - ${item.id}: ${item.manufacturer} ${item.model} (${item.category})`);
      });
      
      return;
    }

    // Seed the collection
    console.log('📝 Seeding collection with mock data...');
    const result = await ItemTypesService.seedItemTypes(MOCK_ITEM_TYPES);

    // Report results
    console.log('\n📊 Seeding Results:');
    console.log(`✅ Successful: ${result.successful.length}`);
    console.log(`❌ Failed: ${result.failed.length}`);

    if (result.successful.length > 0) {
      console.log('\n✅ Successfully created item types:');
      result.successful.forEach(({ itemType }) => {
        console.log(`  - ${itemType.id}: ${itemType.manufacturer} ${itemType.model}`);
        console.log(`    Category: ${itemType.category} | Assignment: ${itemType.assignmentType}`);
        console.log(`    Depot: ${itemType.defaultDepot} | Status: ${itemType.defaultStatus}`);
      });
    }

    if (result.failed.length > 0) {
      console.log('\n❌ Failed to create item types:');
      result.failed.forEach(({ itemType, error }) => {
        console.log(`  - ${itemType.id}: ${error}`);
      });
    }

    console.log('\n🎯 ItemTypes collection seeding completed!');

  } catch (error) {
    console.error('💥 Error during seeding process:', error);
    throw error;
  }
}

/**
 * Direct execution when run as a script
 * This allows the script to be run directly with: npx ts-node src/scripts/seedItemTypes.ts
 */
if (require.main === module) {
  console.log('🎖️ Sayeret Givati - ItemTypes Collection Seeder');
  console.log('================================================');
  
  seedItemTypesCollection()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

/**
 * Verify seeding results by fetching and displaying all item types
 */
export async function verifyItemTypesSeeding(): Promise<void> {
  console.log('🔍 Verifying itemTypes collection...');
  
  try {
    const itemTypes = await ItemTypesService.getAllItemTypes();
    
    if (itemTypes.length === 0) {
      console.log('⚠️ No item types found in collection');
      return;
    }

    console.log(`✅ Found ${itemTypes.length} item types in collection:`);
    console.log('\n📋 Item Types Inventory:');
    
    // Group by category for better readability
    const categorizedItems = itemTypes.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof itemTypes>);

    Object.entries(categorizedItems).forEach(([category, items]) => {
      console.log(`\n🏷️ ${category.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  └─ ${item.manufacturer} ${item.model}`);
        console.log(`     ID: ${item.id}`);
        console.log(`     Assignment: ${item.assignmentType} | Depot: ${item.defaultDepot}`);
      });
    });

  } catch (error) {
    console.error('❌ Error verifying collection:', error);
  }
}

/**
 * Export for use in components or other scripts
 */
export { MOCK_ITEM_TYPES } from '@/lib/itemTypesService';