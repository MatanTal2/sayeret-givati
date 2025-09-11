'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { TEXT_CONSTANTS } from '@/constants/text';
import { initializeEquipmentTypes, checkEquipmentTypesInitialized, getEquipmentTypeStats } from '@/lib/equipmentInitializer';
import { EquipmentService } from '@/lib/equipmentService';

/**
 * Equipment Database Test Page
 * Test implementation of equipment collections and services
 */
export default function EquipmentTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    checkInitStatus();
  }, []);

  const checkInitStatus = async () => {
    setIsLoading(true);
    try {
      const initialized = await checkEquipmentTypesInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        const statsData = await getEquipmentTypeStats();
        setStats(statsData);
        addLog(`Equipment types found: ${statsData.total} total, ${statsData.active} active`);
      } else {
        addLog('No equipment types found in database');
      }
    } catch (error) {
      addLog(`Error checking status: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      addLog('Starting equipment types initialization...');
      const result = await initializeEquipmentTypes();
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        await checkInitStatus(); // Refresh status
      } else {
        addLog(`❌ ${result.message}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEquipmentTypes = async () => {
    setIsLoading(true);
    try {
      addLog('Testing equipment types retrieval...');
      
      // Test getting all types
      const allTypes = await EquipmentService.Types.getEquipmentTypes();
      addLog(`Found ${allTypes.totalCount} equipment types`);
      
      // Test getting specific category
      const weaponsTypes = await EquipmentService.Types.getEquipmentTypes({ category: 'נשק אישי' });
      addLog(`Found ${weaponsTypes.totalCount} weapon types`);
      
      // Test getting specific type
      if (allTypes.equipmentTypes.length > 0) {
        const firstType = allTypes.equipmentTypes[0];
        const singleType = await EquipmentService.Types.getEquipmentType(firstType.id);
        addLog(`Retrieved single type: ${singleType.success ? firstType.name : 'Failed'}`);
      }
      
    } catch (error) {
      addLog(`❌ Test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEquipmentItems = async () => {
    setIsLoading(true);
    try {
      addLog('Testing equipment items operations...');
      
      // Test creating a sample equipment item
      const testEquipment = {
        id: 'TEST-M4-001',
        equipmentType: 'rifle_m4',
        productName: 'רובה M4A1',
        category: 'נשק אישי',
        acquisitionDate: new Date() as any,
        dateSigned: new Date() as any,
        lastSeen: new Date() as any,
        lastReportUpdate: new Date() as any,
        signedBy: 'TEST-USER',
        currentHolder: 'TEST-HOLDER',
        assignedUnit: 'TEST-UNIT',
        status: 'available' as any,
        location: 'TEST-LOCATION',
        condition: 'good' as any
      };

      const createResult = await EquipmentService.Items.createEquipment(
        testEquipment,
        'TEST-HOLDER',
        'TEST-SIGNER',
        'Test equipment creation'
      );
      
      if (createResult.success) {
        addLog('✅ Test equipment created successfully');
        
        // Test retrieving the equipment
        const getResult = await EquipmentService.Items.getEquipment('TEST-M4-001');
        addLog(`Equipment retrieval: ${getResult.success ? '✅ Success' : '❌ Failed'}`);
        
        // Test updating equipment
        const updateResult = await EquipmentService.Items.updateEquipment(
          'TEST-M4-001',
          { notes: 'Updated test equipment' },
          'TEST-UPDATER',
          'notes_update' as any,
          'Added test notes'
        );
        addLog(`Equipment update: ${updateResult.success ? '✅ Success' : '❌ Failed'}`);
        
      } else {
        addLog(`❌ Failed to create test equipment: ${createResult.message}`);
      }
      
    } catch (error) {
      addLog(`❌ Equipment items test error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">
          בדיקת מסד נתונים - ציוד
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">מצב מסד הנתונים</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>סוגי ציוד מאותחלים:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                isInitialized === null ? 'bg-gray-100 text-gray-600' :
                isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isInitialized === null ? 'בודק...' : 
                 isInitialized ? 'כן' : 'לא'}
              </span>
            </div>
            
            {stats && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>סך הכל סוגי ציוד:</span>
                  <span>{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>סוגי ציוד פעילים:</span>
                  <span>{stats.active}</span>
                </div>
                <div className="space-y-1">
                  <span>קטגוריות:</span>
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm text-gray-600 mr-4">
                      <span>{category}:</span>
                      <span>{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">פעולות בדיקה</h2>
          
          <div className="space-y-4">
            <Button
              onClick={handleInitialize}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'מאתחל...' : 'אתחל סוגי ציוד'}
            </Button>
            
            <Button
              onClick={handleTestEquipmentTypes}
              disabled={isLoading || !isInitialized}
              variant="secondary"
              className="w-full"
            >
              {isLoading ? 'בודק...' : 'בדוק סוגי ציוד'}
            </Button>
            
            <Button
              onClick={handleTestEquipmentItems}
              disabled={isLoading || !isInitialized}
              variant="secondary"
              className="w-full"
            >
              {isLoading ? 'בודק...' : 'בדוק פריטי ציוד'}
            </Button>
            
            <Button
              onClick={checkInitStatus}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'מרענן...' : 'רענן מצב'}
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">יומן פעילות</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center">אין פעילות עדיין</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


