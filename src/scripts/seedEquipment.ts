/**
 * Script to seed the equipment collection with sample data
 * Run this script to populate the Firestore collection with equipment based on itemTypes templates
 * 
 * Usage:
 * - For development: Can be run directly or imported into components
 * - For production: Should be run by authorized admin users only
 */

import { EquipmentService, SAMPLE_EQUIPMENT_DATA } from '@/lib/equipmentService';
import { ItemTypesService } from '@/lib/itemTypesService';

/**
 * Main function to seed the equipment collection
 */
export async function seedEquipmentCollection(): Promise<void> {
  console.log('🚀 Starting equipment collection seeding...');
  console.log(`📦 Preparing to seed ${SAMPLE_EQUIPMENT_DATA.length} equipment items`);

  try {
    // First ensure itemTypes collection is populated
    console.log('🔍 Checking itemTypes collection...');
    const itemTypesEmpty = await ItemTypesService.isCollectionEmpty();
    
    if (itemTypesEmpty) {
      console.log('⚠️ ItemTypes collection is empty. Seeding itemTypes first...');
      await ItemTypesService.seedItemTypes();
      console.log('✅ ItemTypes collection seeded');
    } else {
      console.log('✅ ItemTypes collection is already populated');
    }

    // Check if equipment collection is already populated
    const equipmentEmpty = await EquipmentService.isCollectionEmpty();
    
    if (!equipmentEmpty) {
      console.log('⚠️ Equipment collection already contains data');
      console.log('🔍 Fetching existing equipment...');
      
      const existingEquipment = await EquipmentService.getAllEquipment();
      console.log(`📋 Found ${existingEquipment.length} existing equipment items:`);
      
      existingEquipment.forEach(item => {
        console.log(`  - ${item.id}: ${item.manufacturer} ${item.model} → ${item.assignedUserName || item.assignedUserId}`);
      });
      
      return;
    }

    // Seed the collection
    console.log('📝 Seeding collection with sample equipment...');
    const result = await EquipmentService.seedEquipment(SAMPLE_EQUIPMENT_DATA);

    // Report results
    console.log('\n📊 Seeding Results:');
    console.log(`✅ Successful: ${result.successful.length}`);
    console.log(`❌ Failed: ${result.failed.length}`);

    if (result.successful.length > 0) {
      console.log('\n✅ Successfully created equipment:');
      result.successful.forEach(({ equipment }) => {
        console.log(`  - ${equipment.id}: ${equipment.manufacturer} ${equipment.model}`);
        console.log(`    Category: ${equipment.category} | Type: ${equipment.assignmentType}`);
        console.log(`    Assigned to: ${equipment.assignedUserName || equipment.assignedUserId}`);
        console.log(`    Depot: ${equipment.equipmentDepot} | Status: ${equipment.status}`);
        if (equipment.imageUrl) {
          console.log(`    Image: ${equipment.imageUrl}`);
        }
      });
    }

    if (result.failed.length > 0) {
      console.log('\n❌ Failed to create equipment:');
      result.failed.forEach(({ equipment, error }) => {
        console.log(`  - ${equipment.id}: ${error}`);
      });
    }

    console.log('\n🎯 Equipment collection seeding completed!');

  } catch (error) {
    console.error('💥 Error during seeding process:', error);
    throw error;
  }
}

/**
 * Direct execution when run as a script
 */
if (require.main === module) {
  console.log('🎖️ Sayeret Givati - Equipment Collection Seeder');
  console.log('================================================');
  
  seedEquipmentCollection()
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
 * Verify seeding results by fetching and displaying all equipment
 */
export async function verifyEquipmentSeeding(): Promise<void> {
  console.log('🔍 Verifying equipment collection...');
  
  try {
    const equipment = await EquipmentService.getAllEquipment();
    
    if (equipment.length === 0) {
      console.log('⚠️ No equipment found in collection');
      return;
    }

    console.log(`✅ Found ${equipment.length} equipment items in collection:`);
    console.log('\n📋 Equipment Inventory:');
    
    // Group by category for better readability
    const categorizedEquipment = equipment.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof equipment>);

    Object.entries(categorizedEquipment).forEach(([category, items]) => {
      console.log(`\n🏷️ ${category.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  └─ ${item.manufacturer} ${item.model} (${item.id})`);
        console.log(`     Assigned: ${item.assignedUserName || item.assignedUserId}`);
        console.log(`     Type: ${item.assignmentType} | Status: ${item.status}`);
        console.log(`     Depot: ${item.equipmentDepot}`);
        console.log(`     Registered: ${new Date(item.registeredAt).toLocaleDateString()}`);
      });
    });

    // Summary by assignment type
    const personalItems = equipment.filter(item => item.assignmentType === 'personal');
    const teamItems = equipment.filter(item => item.assignmentType === 'team');
    
    console.log('\n📊 Assignment Summary:');
    console.log(`👤 Personal Items: ${personalItems.length}`);
    console.log(`👥 Team Items: ${teamItems.length}`);

    // Summary by status
    const statusSummary = equipment.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Status Summary:');
    Object.entries(statusSummary).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} items`);
    });

  } catch (error) {
    console.error('❌ Error verifying collection:', error);
  }
}

/**
 * Demo function to show individual equipment creation
 */
export async function createSampleEquipment(): Promise<void> {
  console.log('🔧 Creating individual sample equipment...');
  
  try {
    const sampleData = {
      id: "EQ-DEMO-001",
      itemTypeId: "TEMPLATE_RADIO_PRC-152",
      assignedUserId: "demo-user",
      assignedUserName: "Demo User",
      status: "active",
      imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/demo-radio.jpg"
    };

    const result = await EquipmentService.createEquipment(sampleData);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`Equipment ID: ${result.equipmentId}`);
    } else {
      console.log(`❌ ${result.message}`);
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating sample equipment:', error);
  }
}

/**
 * Export sample data for use in other scripts or components
 */
export { SAMPLE_EQUIPMENT_DATA } from '@/lib/equipmentService';