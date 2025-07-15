import { useState, useEffect, useMemo, useCallback } from "react";
import { Soldier, FormErrors, NewSoldierForm, FilterState } from '../types';
import { getCachedData, setCachedData } from '../lib/cache';
import { formatReportDate, formatReportTime, formatLastUpdated, formatCacheErrorDate } from '../lib/dateUtils';
import { mapRawStatusToStructured, mapStructuredStatusToRaw, getAvailableStatuses } from '../lib/statusUtils';

export function useSoldiers() {
  // State management
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [originalSoldiers, setOriginalSoldiers] = useState<Soldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingChanges, setIsUpdatingChanges] = useState(false);
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);

  // Form state
  const [newSoldier, setNewSoldier] = useState<NewSoldierForm>({
    id: '',
    name: '',
    platoon: '',
    status: 'בית',
    customStatus: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    id: '',
    platoon: ''
  });

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    nameFilter: '',
    selectedTeams: [],
    selectedStatuses: [],
    showTeamFilter: false,
    showStatusFilter: false
  });

  // Debounced name filter
  const [debouncedNameFilter, setDebouncedNameFilter] = useState(filterState.nameFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(filterState.nameFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterState.nameFilter]);

  useEffect(() => {
    fetchSoldiers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered soldiers calculation
  const filteredSoldiers = useMemo(() => {
    return soldiers.filter(soldier => {
      // Name filter
      if (debouncedNameFilter && !soldier.name.toLowerCase().includes(debouncedNameFilter.toLowerCase())) {
        return false;
      }
      
      // Team filter
      if (filterState.selectedTeams.length > 0 && !filterState.selectedTeams.includes(soldier.platoon)) {
        return false;
      }
      
      // Status filter
      if (filterState.selectedStatuses.length > 0 && !filterState.selectedStatuses.includes(soldier.status)) {
        return false;
      }
      
      return true;
    });
  }, [soldiers, debouncedNameFilter, filterState.selectedTeams, filterState.selectedStatuses]);

  // Calculations
  const calculations = useMemo(() => {
    const selectedCount = soldiers.filter(s => s.isSelected).length;
    const totalCount = soldiers.length;
    const filteredSelectedCount = filteredSoldiers.filter(s => s.isSelected).length;
    const filteredTotalCount = filteredSoldiers.length;
    const uniquePlatoons = [...new Set(soldiers.map(s => s.platoon))].sort();
    const hasOtherStatus = filteredSoldiers.some(s => s.status === 'אחר');
    const manuallyAddedCount = soldiers.filter(s => s.isManuallyAdded).length;

    // Detect changed soldiers (excluding manually added ones)
    const changedSoldiers = soldiers.filter(soldier => {
      if (soldier.isManuallyAdded) return false;
      
      const original = originalSoldiers.find(orig => orig.id === soldier.id && orig.name === soldier.name);
      if (!original) return false;
      
      return (
        soldier.status !== original.status ||
        soldier.customStatus !== original.customStatus ||
        soldier.notes !== original.notes
      );
    });
    
    return {
      selectedCount,
      totalCount,
      filteredSelectedCount,
      filteredTotalCount,
      uniquePlatoons,
      hasOtherStatus,
      manuallyAddedCount,
      changedSoldiers
    };
  }, [soldiers, filteredSoldiers, originalSoldiers]);

  // Data fetching
  const fetchSoldiers = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      if (forceRefresh) setIsRefreshing(true);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData();
        if (cached) {
          setSoldiers(cached.data);
          setOriginalSoldiers(JSON.parse(JSON.stringify(cached.data)));
          setLastUpdated(new Date(cached.timestamp));
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch('/api/sheets');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `שגיאת שרת: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('המידע שהתקבל אינו תקין');
      }
      
      const rows = result.data;
      if (rows.length < 2) {
        throw new Error('אין מספיק נתונים בגיליון');
      }
      
      // Map the data to soldiers array
      const [, ...body] = rows; // Skip header row
      const soldiersData = body
        .filter((row: string[]) => (row[1] && row[1].trim()) || (row[2] && row[2].trim()))
        .map((row: string[]) => {
          const id = row[0] || '';
          const firstName = row[1] || '';
          const lastName = row[2] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const rawStatus = row[4] || 'בית';
          
          const { status, customStatus } = mapRawStatusToStructured(rawStatus);
          
          return {
            id,
            firstName,
            lastName,
            name: fullName,
            platoon: row[3] || 'מסייעת',
            status,
            customStatus,
            isSelected: false
          };
        });
      
      // Cache the new data
      const now = Date.now();
      setCachedData(soldiersData, now);
      setLastUpdated(new Date(now));
      
      setSoldiers(soldiersData);
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiersData)));
    } catch (error) {
      console.error('Error fetching soldiers:', error);
      
      // Try to show cached data on error
      const cached = getCachedData();
      if (cached && soldiers.length === 0) {
        setSoldiers(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setError(
          `שגיאה בטעינת נתונים חדשים. מציג נתונים שמורים מ-${formatCacheErrorDate(cached.timestamp)}`
        );
      } else {
        setError(
          error instanceof Error 
            ? error.message 
            : 'שגיאה לא צפויה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.'
        );
      }
    } finally {
      setLoading(false);
      if (forceRefresh) setIsRefreshing(false);
    }
  };

  // Data operations
  const updateStatus = useCallback((index: number, newStatus: string, customStatus?: string) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      status: newStatus,
      customStatus: newStatus === 'אחר' ? customStatus : undefined
    };
    setSoldiers(updatedSoldiers);
  }, [soldiers, filteredSoldiers]);

  const toggleSelection = useCallback((index: number) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      isSelected: !updatedSoldiers[originalIndex].isSelected
    };
    setSoldiers(updatedSoldiers);
  }, [soldiers, filteredSoldiers]);

  const updateNotes = useCallback((index: number, notes: string) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      notes
    };
    setSoldiers(updatedSoldiers);
  }, [soldiers, filteredSoldiers]);

  const toggleAllVisible = useCallback(() => {
    const allVisibleSelected = filteredSoldiers.every(soldier => soldier.isSelected);
    const updatedSoldiers = [...soldiers];
    
    filteredSoldiers.forEach(filteredSoldier => {
      const originalIndex = soldiers.findIndex(s => s.name === filteredSoldier.name);
      if (originalIndex !== -1) {
        updatedSoldiers[originalIndex] = {
          ...updatedSoldiers[originalIndex],
          isSelected: !allVisibleSelected
        };
      }
    });
    
    setSoldiers(updatedSoldiers);
  }, [soldiers, filteredSoldiers]);

  // Server operations
  const updateServerData = async (password: string) => {
    const HARDCODED_PASSWORD = "admin123";
    
    if (password !== HARDCODED_PASSWORD) {
      throw new Error('סיסמה שגויה');
    }

    try {
      setIsUpdatingServer(true);
      
      const manuallyAddedSoldiers = soldiers.filter(soldier => soldier.isManuallyAdded);
      
      if (manuallyAddedSoldiers.length === 0) {
        throw new Error('אין חיילים חדשים לעדכון בשרת');
      }
      
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soldiers: manuallyAddedSoldiers
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'שגיאה בעדכון השרת');
      }
      
      // Refresh data to get the updated sheet
      await fetchSoldiers(true);
      
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const updateChangedData = async () => {
    if (calculations.changedSoldiers.length === 0) {
      throw new Error('אין שינויים לעדכון');
    }

    try {
      setIsUpdatingChanges(true);
      
      const response = await fetch('/api/sheets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soldiers: calculations.changedSoldiers
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'שגיאה בעדכון הנתונים');
      }
      
      // Update original soldiers to reflect the new state
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiers)));
      
    } finally {
      setIsUpdatingChanges(false);
    }
  };

  // Form operations
  const updateNewSoldierField = useCallback((field: keyof NewSoldierForm, value: string) => {
    setNewSoldier(prev => ({ ...prev, [field]: value }));
    if (field === 'status' && value !== 'אחר') {
      setNewSoldier(prev => ({ ...prev, customStatus: '' }));
    }
  }, []);

  const clearFormErrors = useCallback(() => {
    setFormErrors({ name: '', id: '', platoon: '' });
  }, []);

  const addNewSoldier = () => {
    // Validation logic (same as original)
    const errors = { name: '', id: '', platoon: '' };

    if (!newSoldier.name.trim()) {
      errors.name = 'שם החייל חובה';
    } else {
      const namePattern = /^[\u05D0-\u05EA\s]+$/;
      if (!namePattern.test(newSoldier.name.trim())) {
        errors.name = 'השם חייב להכיל רק אותיות עבריות';
      }
    }

    if (!newSoldier.id.trim()) {
      errors.id = 'מספר אישי חובה';
    } else {
      const idPattern = /^\d{5,7}$/;
      if (!idPattern.test(newSoldier.id.trim())) {
        errors.id = 'מספר אישי חייב להכיל בין 5-7 ספרות ורק ספרות';
      } else {
        if (soldiers.some(s => s.id && s.id.trim() === newSoldier.id.trim())) {
          errors.id = 'מספר אישי זה כבר קיים במערכת';
        }
      }
    }

    if (!newSoldier.platoon) {
      errors.platoon = 'בחירת צוות חובה';
    }

    setFormErrors(errors);
    if (errors.name || errors.id || errors.platoon) {
      return false;
    }

    // Add soldier
    const nameParts = newSoldier.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const soldier: Soldier = {
      id: newSoldier.id.trim(),
      firstName,
      lastName,
      name: newSoldier.name.trim(),
      platoon: newSoldier.platoon,
      status: newSoldier.status,
      customStatus: newSoldier.status === 'אחר' ? newSoldier.customStatus : undefined,
      notes: newSoldier.notes.trim() || undefined,
      isSelected: true,
      isManuallyAdded: true
    };

    setSoldiers([...soldiers, soldier]);
    setNewSoldier({
      id: '',
      name: '',
      platoon: '',
      status: 'בית',
      customStatus: '',
      notes: ''
    });
    setFormErrors({ name: '', id: '', platoon: '' });
    return true;
  };

  // Filter operations
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // State
    soldiers,
    filteredSoldiers,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    isUpdatingChanges,
    isUpdatingServer,
    newSoldier,
    formErrors,
    filterState,
    calculations,

    // Operations
    fetchSoldiers,
    updateStatus,
    toggleSelection,
    updateNotes,
    toggleAllVisible,
    updateServerData,
    updateChangedData,
    updateNewSoldierField,
    clearFormErrors,
    addNewSoldier,
    updateFilter,

    // Utils
    formatLastUpdated,
    mapStructuredStatusToRaw,
    getAvailableStatuses
  };
} 