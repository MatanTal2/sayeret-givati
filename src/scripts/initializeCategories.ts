/**
 * Script to initialize default categories and subcategories
 * Run this to populate the database with initial data
 */

import { CategoriesService } from '@/lib/categories';

// Default categories and subcategories based on military equipment
const DEFAULT_CATEGORIES = [
  {
    name: 'נשק אישי',
    subcategories: [
      { name: 'רובי סער' },
      { name: 'מקלעים' },
      { name: 'אקדחים' }
    ]
  },
  {
    name: 'אופטיקה',
    subcategories: [
      { name: 'כוונות' },
      { name: 'משקפי ראיית לילה' },
      { name: 'משקפות' }
    ]
  },
  {
    name: 'ציוד קשר',
    subcategories: [
      { name: 'קשרים אישיים' },
      { name: 'קשרי רכב' },
      { name: 'אנטנות' }
    ]
  },
  {
    name: 'הגנה אישית',
    subcategories: [
      { name: 'אפודי מגן' },
      { name: 'קסדות' },
      { name: 'מגנים' }
    ]
  }
];

export async function initializeCategories(createdBy: string = 'system') {
  console.log('🔄 Initializing default categories...');
  
  try {
    for (const categoryData of DEFAULT_CATEGORIES) {
      // Create category
      const categoryResult = await CategoriesService.createCategory({
        name: categoryData.name
      }, createdBy);
      
      if (categoryResult.success && categoryResult.data) {
        console.log(`✅ Created category: ${categoryData.name}`);
        
        // Create subcategories
        for (const subcategoryData of categoryData.subcategories) {
          const subcategoryResult = await CategoriesService.createSubcategory(
            categoryResult.data.id,
            subcategoryData,
            createdBy
          );
          
          if (subcategoryResult.success) {
            console.log(`  ✅ Created subcategory: ${subcategoryData.name}`);
          } else {
            console.log(`  ❌ Failed to create subcategory: ${subcategoryData.name} - ${subcategoryResult.error}`);
          }
        }
      } else {
        console.log(`❌ Failed to create category: ${categoryData.name} - ${categoryResult.error}`);
      }
    }
    
    console.log('🎉 Categories initialization completed!');
    return { success: true, message: 'Categories initialized successfully' };
    
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export for use in other modules
export { DEFAULT_CATEGORIES };
