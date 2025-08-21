'use client';

import { useState, useEffect, useCallback } from 'react';
import { Equipment, EquipmentStatus, EquipmentCondition } from '@/types/equipment';

// Mock data for development - will be replaced with real Firestore calls
const mockEquipment: Equipment[] = [
  {
    id: 'M4-001',
    productName: 'רובה M4A1',
    category: 'נשק אישי',
    dateSigned: '2024-01-15',
    signedBy: 'רס"ן כהן',
    currentHolder: 'רב"ט לוי',
    assignedUnit: 'פלוגה א\'',
    assignedTeam: 'כיתה 1',
    status: EquipmentStatus.IN_USE,
    location: 'בסיס גבעתי',
    condition: EquipmentCondition.GOOD,
    notes: 'נוקה לאחרונה ב-20/01',
    lastReportUpdate: '2024-01-20T10:30:00Z',
    trackingHistory: [],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'NVG-007',
    productName: 'משקפי ראיית לילה',
    category: 'אופטיקה',
    dateSigned: '2024-01-10',
    signedBy: 'סמ"ר אביב',
    currentHolder: 'רס"ם דוד',
    assignedUnit: 'פלוגה ב\'',
    status: EquipmentStatus.MAINTENANCE,
    location: 'מחסן ציוד',
    condition: EquipmentCondition.FAIR,
    notes: 'בדיקת תקינות שבועית',
    lastReportUpdate: '2024-01-18T14:15:00Z',
    trackingHistory: [],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T14:15:00Z'
  },
  {
    id: 'RAD-012',
    productName: 'קשר אלחוטי PRC-148',
    category: 'תקשורת',
    dateSigned: '2024-01-12',
    signedBy: 'סמ"ר בן-דוד',
    currentHolder: 'רב"ט שמואל',
    assignedUnit: 'פלוגה א\'',
    status: EquipmentStatus.AVAILABLE,
    location: 'חדר תקשורת',
    condition: EquipmentCondition.EXCELLENT,
    lastReportUpdate: '2024-01-19T16:45:00Z',
    trackingHistory: [],
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z'
  },
  {
    id: 'VEST-025',
    productName: 'אפוד מגן',
    category: 'הגנה אישית',
    dateSigned: '2024-01-08',
    signedBy: 'רס"ן מזרחי',
    currentHolder: 'רב"ט יוסף',
    assignedUnit: 'פלוגה ג\'',
    status: EquipmentStatus.IN_USE,
    location: 'בשטח',
    condition: EquipmentCondition.GOOD,
    notes: 'אישור חוזק פלטות',
    lastReportUpdate: '2024-01-21T08:20:00Z',
    trackingHistory: [],
    createdAt: '2024-01-08T07:30:00Z',
    updatedAt: '2024-01-21T08:20:00Z'
  },
  {
    id: 'SCOPE-003',
    productName: 'כוונת אלביט MARS',
    category: 'אופטיקה',
    dateSigned: '2024-01-05',
    signedBy: 'רס"ן כהן',
    currentHolder: 'רס"ם גולן',
    assignedUnit: 'פלוגה א\'',
    status: EquipmentStatus.REPAIR,
    location: 'מעבדת תיקונים',
    condition: EquipmentCondition.NEEDS_REPAIR,
    notes: 'תקלה בכיול - נשלח לתיקון',
    lastReportUpdate: '2024-01-17T13:10:00Z',
    trackingHistory: [],
    createdAt: '2024-01-05T10:15:00Z',
    updatedAt: '2024-01-17T13:10:00Z'
  },
  {
    id: 'PACK-018',
    productName: 'תיק מבצעי 70L',
    category: 'ציוד שטח',
    dateSigned: '2024-01-14',
    signedBy: 'סמ"ר זוהר',
    currentHolder: 'רב"ט אלי',
    assignedUnit: 'פלוגה ב\'',
    status: EquipmentStatus.AVAILABLE,
    location: 'מחסן ציוד',
    condition: EquipmentCondition.NEW,
    lastReportUpdate: '2024-01-22T09:05:00Z',
    trackingHistory: [],
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-22T09:05:00Z'
  }
];

interface UseEquipmentReturn {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  refreshEquipment: () => Promise<void>;
  transferEquipment: (equipmentId: string, newHolder: string, newUnit?: string) => Promise<void>;
  updateEquipmentStatus: (equipmentId: string, newStatus: EquipmentStatus) => Promise<void>;
  updateEquipmentCondition: (equipmentId: string, newCondition: EquipmentCondition) => Promise<void>;
  performDailyCheck: (equipmentId: string, notes?: string) => Promise<void>;
  getEquipmentById: (equipmentId: string) => Equipment | undefined;
  getEquipmentByStatus: (status: EquipmentStatus) => Equipment[];
  getEquipmentByCondition: (condition: EquipmentCondition) => Equipment[];
  getEquipmentByHolder: (holder: string) => Equipment[];
  getEquipmentByUnit: (unit: string) => Equipment[];
}

export function useEquipment(): UseEquipmentReturn {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API delay for realistic loading states
  const simulateDelay = (ms: number = 800) => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Fetch equipment data (mock implementation)
  const refreshEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await simulateDelay();
      
      // TODO: Replace with actual Firestore call
      // const fetchedEquipment = await EquipmentFirestoreService.getAllEquipment();
      
      setEquipment([...mockEquipment]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בטעינת הציוד: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Transfer equipment to new holder
  const transferEquipment = useCallback(async (equipmentId: string, newHolder: string, newUnit?: string) => {
    try {
      await simulateDelay(500);
      
      setEquipment(prev => prev.map(item => 
        item.id === equipmentId 
          ? {
              ...item,
              currentHolder: newHolder,
              assignedUnit: newUnit || item.assignedUnit,
              updatedAt: new Date().toISOString(),
              lastReportUpdate: new Date().toISOString(),
              // TODO: Add to tracking history
            }
          : item
      ));
      
      // TODO: Replace with actual Firestore call
      // await EquipmentFirestoreService.transferEquipment(equipmentId, newHolder, newUnit);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בהעברת הציוד: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Update equipment status
  const updateEquipmentStatus = useCallback(async (equipmentId: string, newStatus: EquipmentStatus) => {
    try {
      await simulateDelay(300);
      
      setEquipment(prev => prev.map(item => 
        item.id === equipmentId 
          ? {
              ...item,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              lastReportUpdate: new Date().toISOString(),
            }
          : item
      ));
      
      // TODO: Replace with actual Firestore call
      // await EquipmentFirestoreService.updateEquipmentStatus(equipmentId, newStatus);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בעדכון סטטוס הציוד: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Update equipment condition
  const updateEquipmentCondition = useCallback(async (equipmentId: string, newCondition: EquipmentCondition) => {
    try {
      await simulateDelay(300);
      
      setEquipment(prev => prev.map(item => 
        item.id === equipmentId 
          ? {
              ...item,
              condition: newCondition,
              updatedAt: new Date().toISOString(),
              lastReportUpdate: new Date().toISOString(),
            }
          : item
      ));
      
      // TODO: Replace with actual Firestore call
      // await EquipmentFirestoreService.updateEquipmentCondition(equipmentId, newCondition);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בעדכון מצב הציוד: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Perform daily check-in
  const performDailyCheck = useCallback(async (equipmentId: string, notes?: string) => {
    try {
      await simulateDelay(400);
      
      setEquipment(prev => prev.map(item => 
        item.id === equipmentId 
          ? {
              ...item,
              lastReportUpdate: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              notes: notes || item.notes,
            }
          : item
      ));
      
      // TODO: Replace with actual Firestore call
      // await EquipmentFirestoreService.performDailyCheck(equipmentId, notes);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(`שגיאה בבדיקה יומית: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Helper functions for filtering equipment
  const getEquipmentById = useCallback((equipmentId: string) => {
    return equipment.find(item => item.id === equipmentId);
  }, [equipment]);

  const getEquipmentByStatus = useCallback((status: EquipmentStatus) => {
    return equipment.filter(item => item.status === status);
  }, [equipment]);

  const getEquipmentByCondition = useCallback((condition: EquipmentCondition) => {
    return equipment.filter(item => item.condition === condition);
  }, [equipment]);

  const getEquipmentByHolder = useCallback((holder: string) => {
    return equipment.filter(item => 
      item.currentHolder.toLowerCase().includes(holder.toLowerCase())
    );
  }, [equipment]);

  const getEquipmentByUnit = useCallback((unit: string) => {
    return equipment.filter(item => 
      item.assignedUnit.toLowerCase().includes(unit.toLowerCase())
    );
  }, [equipment]);

  // Load equipment on mount
  useEffect(() => {
    refreshEquipment();
  }, [refreshEquipment]);

  return {
    equipment,
    loading,
    error,
    refreshEquipment,
    transferEquipment,
    updateEquipmentStatus,
    updateEquipmentCondition,
    performDailyCheck,
    getEquipmentById,
    getEquipmentByStatus,
    getEquipmentByCondition,
    getEquipmentByHolder,
    getEquipmentByUnit,
  };
}
