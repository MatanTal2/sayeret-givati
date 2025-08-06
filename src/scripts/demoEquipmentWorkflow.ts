/**
 * Demo script showing the complete equipment workflow
 * Demonstrates itemTypes -> equipment creation -> management
 */

import { ItemTypesService } from '@/lib/itemTypesService';
import { EquipmentService } from '@/lib/equipmentService';

/**
 * Complete demonstration of the equipment system workflow
 */
export async function demoEquipmentWorkflow(): Promise<void> {
  console.log('🎖️ Sayeret Givati Equipment System Demo');
  console.log('=====================================\n');

  try {
    // Step 1: Ensure itemTypes are available
    console.log('📋 Step 1: Checking itemTypes collection...');
    const itemTypes = await ItemTypesService.getAllItemTypes();
    
    if (itemTypes.length === 0) {
      console.log('⚠️ No itemTypes found. Seeding itemTypes collection...');
      await ItemTypesService.seedItemTypes();
      console.log('✅ ItemTypes collection seeded');
    } else {
      console.log(`✅ Found ${itemTypes.length} itemTypes:`);
      itemTypes.forEach(type => {
        console.log(`  - ${type.id}: ${type.manufacturer} ${type.model} (${type.category})`);
      });
    }

    // Step 2: Check equipment collection
    console.log('\n🔧 Step 2: Checking equipment collection...');
    const existingEquipment = await EquipmentService.getAllEquipment();
    console.log(`📊 Current equipment count: ${existingEquipment.length}`);

    // Step 3: Create sample equipment if needed
    if (existingEquipment.length === 0) {
      console.log('\n📦 Step 3: Creating sample equipment...');
      const result = await EquipmentService.seedEquipment();
      console.log(`✅ Created ${result.successful.length} equipment items`);
      if (result.failed.length > 0) {
        console.log(`❌ Failed to create ${result.failed.length} items`);
      }
    } else {
      console.log('\n📦 Step 3: Equipment collection already populated');
    }

    // Step 4: Demonstrate equipment queries
    console.log('\n🔍 Step 4: Demonstrating equipment queries...');
    
    // Get all equipment
    const allEquipment = await EquipmentService.getAllEquipment();
    console.log(`\n📋 All Equipment (${allEquipment.length} items):`);
    allEquipment.forEach(item => {
      console.log(`  - ${item.id}: ${item.manufacturer} ${item.model}`);
      console.log(`    Assigned to: ${item.assignedUserName || item.assignedUserId}`);
      console.log(`    Status: ${item.status} | Type: ${item.assignmentType}`);
    });

    // Get by category
    const radios = await EquipmentService.getEquipmentByCategory('radio');
    console.log(`\n📻 Radio Equipment (${radios.length} items):`);
    radios.forEach(item => {
      console.log(`  - ${item.id}: ${item.model} → ${item.assignedUserName || item.assignedUserId}`);
    });

    // Get by assignment type
    const personalItems = await EquipmentService.getEquipmentByAssignmentType('personal');
    console.log(`\n👤 Personal Equipment (${personalItems.length} items):`);
    personalItems.forEach(item => {
      console.log(`  - ${item.id}: ${item.model} → ${item.assignedUserName || item.assignedUserId}`);
    });

    // Step 5: Demonstrate equipment management
    console.log('\n⚙️ Step 5: Demonstrating equipment management...');
    
    if (allEquipment.length > 0) {
      const testItem = allEquipment[0];
      console.log(`\n🔄 Testing operations on: ${testItem.id}`);

      // Update status
      console.log('📝 Updating status to "maintenance"...');
      const statusResult = await EquipmentService.updateEquipmentStatus(testItem.id, 'maintenance');
      if (statusResult.success) {
        console.log(`✅ ${statusResult.message}`);
      } else {
        console.log(`❌ ${statusResult.message}`);
      }

      // Transfer equipment
      console.log('🔄 Transferring to new user...');
      const transferResult = await EquipmentService.transferEquipment(
        testItem.id, 
        'demo-user-new', 
        'משתמש חדש'
      );
      if (transferResult.success) {
        console.log(`✅ ${transferResult.message}`);
      } else {
        console.log(`❌ ${transferResult.message}`);
      }

      // Restore original state
      console.log('🔄 Restoring original state...');
      await EquipmentService.updateEquipmentStatus(testItem.id, testItem.status);
      await EquipmentService.transferEquipment(
        testItem.id, 
        testItem.assignedUserId, 
        testItem.assignedUserName
      );
      console.log('✅ Original state restored');
    }

    // Step 6: Create a new equipment item
    console.log('\n➕ Step 6: Creating new equipment item...');
    const newEquipmentData = {
      id: `EQ-DEMO-${Date.now()}`,
      itemTypeId: 'TEMPLATE_RADIO_PRC-152',
      assignedUserId: 'demo-user',
      assignedUserName: 'משתמש הדגמה',
      status: 'active',
      imageUrl: 'https://storage.googleapis.com/sayeret-givati/equipment/demo-radio.jpg'
    };

    const createResult = await EquipmentService.createEquipment(newEquipmentData);
    if (createResult.success) {
      console.log(`✅ ${createResult.message}`);
      console.log(`📦 New equipment ID: ${createResult.equipmentId}`);
    } else {
      console.log(`❌ ${createResult.message}`);
    }

    // Step 7: Summary statistics
    console.log('\n📊 Step 7: System Summary...');
    const finalEquipment = await EquipmentService.getAllEquipment();
    const finalItemTypes = await ItemTypesService.getAllItemTypes();

    console.log(`\n📈 Final Statistics:`);
    console.log(`  🏷️ ItemTypes: ${finalItemTypes.length}`);
    console.log(`  🔧 Equipment Items: ${finalEquipment.length}`);

    // Group by category
    const categoryStats = finalEquipment.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n📋 Equipment by Category:`);
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });

    // Assignment type stats
    const personalCount = finalEquipment.filter(item => item.assignmentType === 'personal').length;
    const teamCount = finalEquipment.filter(item => item.assignmentType === 'team').length;
    
    console.log(`\n👥 Assignment Types:`);
    console.log(`  Personal: ${personalCount} items`);
    console.log(`  Team: ${teamCount} items`);

    console.log('\n🎯 Demo completed successfully!');
    console.log('The equipment system is ready for use.');

  } catch (error) {
    console.error('💥 Demo failed:', error);
    throw error;
  }
}

/**
 * Direct execution when run as a script
 */
if (require.main === module) {
  demoEquipmentWorkflow()
    .then(() => {
      console.log('\n✅ Demo script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo script failed:', error);
      process.exit(1);
    });
}

export default demoEquipmentWorkflow;