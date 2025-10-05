"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { Soldier } from '../types';
import { NewSoldierForm } from '@/types';
import { getCachedData, setCachedData } from '@/lib/cache';
import { formatReportDate, formatReportTime, formatLastUpdated, formatCacheErrorDate } from '@/lib/dateUtils';
import { mapRawStatusToStructured, mapStructuredStatusToRaw } from '@/lib/statusUtils';
import { TEXT_CONSTANTS } from '@/constants/text';
import { GiTank } from "react-icons/gi";
import { BsFillHouseFill, BsPersonAdd } from "react-icons/bs";
import { MdNotListedLocation } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { Download } from "lucide-react";
import SoldiersTableDesktop from '../components/SoldiersTableDesktop';
import SoldiersTableMobile from '../components/SoldiersTableMobile';
import AuthGuard from '@/components/auth/AuthGuard';
// import { 
//   createToggleAllVisibleHandler,
//   createSelectAllHandler,
//   createSelectNoneHandler,
//   createSelectByStatusHandler,
//   createSelectByPlatoonHandler
// } from '../../lib/selectionUtils';

export default function StatusPage() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [originalSoldiers, setOriginalSoldiers] = useState<Soldier[]>([]); // Track original data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingChanges, setIsUpdatingChanges] = useState(false); // For status updates
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isMultiPlatoonReport, setIsMultiPlatoonReport] = useState(false);
  const [includeIdInReport, setIncludeIdInReport] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // State for dropdown selections to show what was selected
  // const [selectedPlatoonForSelection, setSelectedPlatoonForSelection] = useState('');
  // const [selectedStatusForSelection, setSelectedStatusForSelection] = useState('');

  // Advanced filtering state
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    id: '',
    platoon: ''
  });

  // Add new soldier form state
  const [newSoldier, setNewSoldier] = useState<NewSoldierForm>({
    id: '',
    name: '',
    platoon: '',
    status: TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME,
    customStatus: '',
    notes: ''
  });

  // Debounced name filter for better performance
  const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [nameFilter]);

  useEffect(() => {
    fetchSoldiers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



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
          setOriginalSoldiers(JSON.parse(JSON.stringify(cached.data))); // Deep copy for comparison
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
        throw new Error(TEXT_CONSTANTS.FORM_VALIDATION.INVALID_DATA_RECEIVED);
      }
      
      const rows = result.data;
      if (rows.length < 2) {
        throw new Error(TEXT_CONSTANTS.FORM_VALIDATION.INSUFFICIENT_DATA);
      }
      
      // Map the data to soldiers array
      const [, ...body] = rows; // Skip header row
      const soldiersData = body
        .filter((row: string[]) => (row[1] && row[1].trim()) || (row[2] && row[2].trim())) // Only rows with names
        .map((row: string[]) => {
          const id = row[0] || '';
          const firstName = row[1] || '';
          const lastName = row[2] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const rawStatus = row[4] || 'בית';
          
          // Handle status mapping
          const { status, customStatus } = mapRawStatusToStructured(rawStatus);
          
          return {
            id,
            firstName,
            lastName,
            name: fullName,
            platoon: row[3] || TEXT_CONSTANTS.DEFAULTS.DEFAULT_TEAM,
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
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiersData))); // Deep copy for comparison
      // setFilteredSoldiers(soldiersData); // This line is removed
    } catch (error) {
      console.error('Error fetching soldiers:', error);
      
      // Try to show cached data on error
      const cached = getCachedData();
      if (cached && soldiers.length === 0) {
        setSoldiers(cached.data);
        // setFilteredSoldiers(cached.data); // This line is removed
        setLastUpdated(new Date(cached.timestamp));
        setError(
          `שגיאה בטעינת נתונים חדשים. מציג נתונים שמורים מ-${formatCacheErrorDate(cached.timestamp)}`
        );
      } else {
        setError(
          error instanceof Error 
            ? error.message 
            : TEXT_CONSTANTS.FORM_VALIDATION.UNEXPECTED_LOADING_ERROR
        );
      }
    } finally {
      setLoading(false);
      if (forceRefresh) setIsRefreshing(false);
    }
  };

  // Optimized filtering with useMemo and debouncing
  const filteredSoldiers = useMemo(() => {
    return soldiers.filter(soldier => {
      // Name filter
      if (debouncedNameFilter && !soldier.name.toLowerCase().includes(debouncedNameFilter.toLowerCase())) {
        return false;
      }
      
      // Team filter
      if (selectedTeams.length > 0 && !selectedTeams.includes(soldier.platoon)) {
        return false;
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(soldier.status)) {
        return false;
      }
      
      return true;
    });
  }, [soldiers, debouncedNameFilter, selectedTeams, selectedStatuses]);

  // Check if any filtered soldier has "other" status for dynamic column sizing
  const hasOtherStatus = useMemo(() => {
    return filteredSoldiers.some(s => s.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER);
  }, [filteredSoldiers]);

  // Check if there are any manually added soldiers that need to be updated to server
  const manuallyAddedCount = useMemo(() => {
    return soldiers.filter(s => s.isManuallyAdded).length;
  }, [soldiers]);

  // Memoized expensive calculations
  const { selectedCount, totalCount, filteredSelectedCount, filteredTotalCount, uniquePlatoons, changedSoldiers } = useMemo(() => {
    const selectedCount = soldiers.filter(s => s.isSelected).length;
    const totalCount = soldiers.length;
    const filteredSelectedCount = filteredSoldiers.filter(s => s.isSelected).length;
    const filteredTotalCount = filteredSoldiers.length;
    const uniquePlatoons = [...new Set(soldiers.map(s => s.platoon))].sort();

    // Detect changed soldiers (excluding manually added ones)
    const changedSoldiers = soldiers.filter(soldier => {
      if (soldier.isManuallyAdded) return false; // Skip manually added soldiers
      
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
      changedSoldiers
    };
  }, [soldiers, filteredSoldiers, originalSoldiers]);

  // Optimized onChange handlers to prevent latency
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSoldier(prev => ({ ...prev, name: value }));
    // Only clear error if there was one
    if (formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: '' }));
    }
  }, [formErrors.name]);

  const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSoldier(prev => ({ ...prev, id: value }));
    // Only clear error if there was one
    if (formErrors.id) {
      setFormErrors(prev => ({ ...prev, id: '' }));
    }
  }, [formErrors.id]);

  const handlePlatoonChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNewSoldier(prev => ({ ...prev, platoon: value }));
    // Only clear error if there was one
    if (formErrors.platoon) {
      setFormErrors(prev => ({ ...prev, platoon: '' }));
    }
  }, [formErrors.platoon]);

  const handleCustomStatusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSoldier(prev => ({ ...prev, customStatus: value }));
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSoldier(prev => ({ ...prev, notes: value }));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setShowTeamFilter(false);
        setShowStatusFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateStatus = (index: number, newStatus: string, customStatus?: string) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      status: newStatus,
      customStatus: newStatus === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER ? customStatus : undefined
    };
    setSoldiers(updatedSoldiers);
  };

  const toggleSelection = (index: number) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      isSelected: !updatedSoldiers[originalIndex].isSelected
    };
    setSoldiers(updatedSoldiers);
  };

  const updateNotes = (index: number, notes: string) => {
    const updatedSoldiers = [...soldiers];
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldiers[index].name);
    updatedSoldiers[originalIndex] = {
      ...updatedSoldiers[originalIndex],
      notes
    };
    setSoldiers(updatedSoldiers);
  };

  // Keep the toggleAllVisible method since it's used in the table header
  const toggleAllVisible = () => {
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
  };

  const updateServerData = async () => {
    const HARDCODED_PASSWORD = "admin123"; // TODO: Replace with proper authentication
    
    if (password !== HARDCODED_PASSWORD) {
      setPasswordError(TEXT_CONSTANTS.STATUS_PAGE.WRONG_PASSWORD);
      return;
    }

    try {
      setIsUpdatingServer(true);
      setPasswordError('');
      
      // Get all soldiers that were manually added
      const manuallyAddedSoldiers = soldiers.filter(soldier => 
        soldier.isManuallyAdded
      );
      
      console.log('🔍 DEBUG: Count of manually added soldiers:', manuallyAddedSoldiers.length);
      
      if (manuallyAddedSoldiers.length === 0) {
        console.log('❌ DEBUG: No manually added soldiers found');
        alert(TEXT_CONSTANTS.STATUS_PAGE.NO_NEW_SOLDIERS_SERVER);
        setShowPasswordModal(false);
        setPassword('');
        return;
      }
      
      console.log('✅ DEBUG: Found manually added soldiers, proceeding with API call');
      
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
        console.log('❌ DEBUG: API response error:', errorData);
        throw new Error(errorData.error || TEXT_CONSTANTS.FORM_VALIDATION.SERVER_UPDATE_ERROR);
      }
      
      const result = await response.json();
      console.log('✅ DEBUG: API success response:', result);
      
      alert(TEXT_CONSTANTS.STATUS_PAGE.DATA_UPDATED_SUCCESS);
      setShowPasswordModal(false);
      setPassword('');
      
      // Refresh data to get the updated sheet
      await fetchSoldiers(true);
      
    } catch (error) {
      console.error('❌ DEBUG: Error updating server:', error);
      alert(
        error instanceof Error 
          ? error.message 
          : TEXT_CONSTANTS.FORM_VALIDATION.SERVER_UPDATE_ERROR
      );
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const updateChangedData = async () => {
    if (changedSoldiers.length === 0) {
      alert(TEXT_CONSTANTS.STATUS_PAGE.NO_CHANGES_TO_UPDATE);
      return;
    }

    try {
      setIsUpdatingChanges(true);
      
      console.log('🔄 DEBUG: Updating changed soldiers:', changedSoldiers.length);
      
      const response = await fetch('/api/sheets', {
        method: 'PUT', // Use PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soldiers: changedSoldiers
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ DEBUG: API response error:', errorData);
        throw new Error(errorData.error || TEXT_CONSTANTS.FORM_VALIDATION.DATA_UPDATE_ERROR);
      }
      
      const result = await response.json();
      console.log('✅ DEBUG: Update success response:', result);
      
      alert(`עודכנו ${changedSoldiers.length} רשומות בהצלחה!`);
      
      // Update original soldiers to reflect the new state
      setOriginalSoldiers(JSON.parse(JSON.stringify(soldiers)));
      
    } catch (error) {
      console.error('❌ DEBUG: Error updating changes:', error);
      alert(
        error instanceof Error 
          ? error.message 
          : TEXT_CONSTANTS.FORM_VALIDATION.DATA_UPDATE_ERROR
      );
    } finally {
      setIsUpdatingChanges(false);
    }
  };

  const addNewSoldier = () => {
    // Clear previous errors
    const errors = { name: '', id: '', platoon: '' };

    // Validate name
    if (!newSoldier.name.trim()) {
      errors.name = TEXT_CONSTANTS.FORM_VALIDATION.SOLDIER_NAME_REQUIRED;
    } else {
      // Validate name format: only Hebrew letters and spaces
      const namePattern = /^[\u05D0-\u05EA\s]+$/;
      if (!namePattern.test(newSoldier.name.trim())) {
        errors.name = TEXT_CONSTANTS.FORM_VALIDATION.NAME_HEBREW_ONLY;
      }
    }

    // Validate ID
    if (!newSoldier.id.trim()) {
      errors.id = TEXT_CONSTANTS.FORM_VALIDATION.PERSONAL_ID_REQUIRED;
    } else {
      // Validate ID format: only numbers and between 5-7 digits
      const idPattern = /^\d{5,7}$/;
      if (!idPattern.test(newSoldier.id.trim())) {
        errors.id = TEXT_CONSTANTS.FORM_VALIDATION.PERSONAL_ID_FORMAT;
      } else {
        // Check for duplicate IDs across all teams
        if (soldiers.some(s => s.id && s.id.trim() === newSoldier.id.trim())) {
          errors.id = TEXT_CONSTANTS.FORM_VALIDATION.PERSONAL_ID_EXISTS;
        }
      }
    }

    // Validate platoon
    if (!newSoldier.platoon) {
      errors.platoon = TEXT_CONSTANTS.FORM_VALIDATION.TEAM_SELECTION_REQUIRED;
    }

    // Set errors and return if any validation failed
    setFormErrors(errors);
    if (errors.name || errors.id || errors.platoon) {
      return;
    }

    // Split the name into first and last name for manually added soldiers
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
      customStatus: newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER ? newSoldier.customStatus : undefined,
      notes: newSoldier.notes.trim() || undefined,
      isSelected: true,
      isManuallyAdded: true
    };

    console.log('✅ DEBUG: Adding new soldier:', soldier);
    console.log('✅ DEBUG: isManuallyAdded flag:', soldier.isManuallyAdded);

    setSoldiers([...soldiers, soldier]);
    setNewSoldier({
      id: '',
      name: '',
      platoon: '',
      status: TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME,
      customStatus: '',
      notes: ''
    });
    setFormErrors({ name: '', id: '', platoon: '' });
    setShowAddForm(false);
  };

  const generateReport = () => {
    try {
      // Choose soldiers based on multi-platoon setting
      const selectedSoldiers = isMultiPlatoonReport 
        ? soldiers.filter(s => s.isSelected)
        : filteredSoldiers.filter(s => s.isSelected);
      
      if (selectedSoldiers.length === 0) {
        alert(TEXT_CONSTANTS.STATUS_PAGE.NO_SOLDIERS_SELECTED);
        return;
      }

      const now = new Date();
      const hebrewDate = formatReportDate(now);
      const time = formatReportTime(now);

      // Group by platoon
      const groupedByPlatoon = selectedSoldiers.reduce((acc, soldier) => {
        const platoonKey = soldier.platoon || TEXT_CONSTANTS.DEFAULTS.DEFAULT_TEAM; // fallback to default
        if (!acc[platoonKey]) {
          acc[platoonKey] = [];
        }
        acc[platoonKey].push(soldier);
        return acc;
      }, {} as Record<string, Soldier[]>);



      let report = `דוח שבצ״ק מסייעת - סיירת גבעתי\n`;
      report += `${hebrewDate}\n`;
      report += `שעה: ${time}\n`;
      const totalSoldiers = isMultiPlatoonReport ? soldiers.length : filteredSoldiers.length;
      report += `נבחרו: ${selectedSoldiers.length} מתוך ${totalSoldiers}\n\n`;

      // Sort platoons for consistent order
      const sortedPlatoons = Object.keys(groupedByPlatoon).sort();
      
      sortedPlatoons.forEach(platoon => {
        const platoonSoldiers = groupedByPlatoon[platoon];
        report += `צוות ${platoon}:\n`;
        platoonSoldiers.forEach((soldier, index) => {
          const status = mapStructuredStatusToRaw(soldier.status, soldier.customStatus);
          const notes = soldier.notes ? ` - ${soldier.notes}` : '';
          const idText = includeIdInReport && soldier.id ? ` (${soldier.id})` : '';
          report += `${index + 1}. ${soldier.name}${idText} - ${status}${notes}\n`;
        });
        report += '\n';
      });

      // Add total count
      report += `סה"כ: ${selectedSoldiers.length} חיילים\n`;

      setReportText(report);
      setShowPreview(true);
      
      // Scroll to preview
      setTimeout(() => {
        document.getElementById('report-preview')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(TEXT_CONSTANTS.STATUS_PAGE.REPORT_CREATION_ERROR);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      alert(TEXT_CONSTANTS.STATUS_PAGE.REPORT_COPIED);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert(TEXT_CONSTANTS.STATUS_PAGE.COPY_ERROR);
    }
  };

  const showWhatsAppNotSupported = () => {
    alert(TEXT_CONSTANTS.STATUS_PAGE.WHATSAPP_NOT_SUPPORTED);
  };

  const downloadReport = () => {
    setIsDownloading(true);
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוח_שבצ״ק_מסייעת_${formatReportDate(new Date())}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Reset downloading state after 2 seconds
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">{TEXT_CONSTANTS.STATUS_PAGE.LOADING_DATA}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50 relative" dir="rtl">
      {/* Header with Logo and Navigation */}
      <header className="bg-white shadow-sm border-b border-neutral-200 mb-6">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/sayeret-givati-logo.png" 
                alt={TEXT_CONSTANTS.ARIA_LABELS.LOGO} 
                width={80} 
                height={80}
                priority
                className="h-16 w-auto"
              />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                מערכת שבצ״ק מסייעת
              </h1>
              <p className="text-lg text-neutral-700 font-medium">{TEXT_CONSTANTS.STATUS_PAGE.UNIT_NAME}</p>
            </div>
            <div className="mr-auto">
              <Link 
                href="/"
                className="px-4 py-2 text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                <span className="md:hidden">🏠 ←</span>
                <span className="hidden md:inline">{TEXT_CONSTANTS.STATUS_PAGE.BACK_TO_HOME_SHORT}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-32">
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-medium text-danger-800">{TEXT_CONSTANTS.STATUS_PAGE.ERROR_LOADING_DATA}</h3>
                <p className="text-danger-700 mt-1">{error}</p>
                <button 
                  onClick={() => fetchSoldiers(true)}
                  className="mt-2 px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors text-sm"
                >
                  נסה שוב
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* Search Bar */}
            <div className="mb-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder={TEXT_CONSTANTS.STATUS_PAGE.SEARCH_BY_NAME}
                  className="w-full border-2 border-neutral-400 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600 pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Selection Counter */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-lg font-medium text-neutral-800">
                  נבחרו: {filteredSelectedCount} מתוך {filteredTotalCount}
                  {(nameFilter || selectedTeams.length > 0 || selectedStatuses.length > 0) && (
                    <span className="text-sm text-neutral-600 mr-2">
                      (סה&quot;כ: {selectedCount} מתוך {totalCount})
                    </span>
                  )}
                </p>
                {lastUpdated && (
                  <p className="text-sm text-neutral-500 mt-1">
                    עודכן לאחרונה: {formatLastUpdated(lastUpdated)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={() => fetchSoldiers(true)}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400 transition-colors text-sm flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="sm:hidden">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_SHORT}</span>
                      <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_SHORT}</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">↻</span>
                      <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_DATA}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={updateChangedData}
                  disabled={isUpdatingChanges || changedSoldiers.length === 0}
                  className={`px-4 py-2 text-white rounded-md transition-colors text-sm flex items-center gap-2 ${
                    changedSoldiers.length === 0 
                      ? 'bg-neutral-400 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                  }`}
                  title={changedSoldiers.length === 0 ? 'אין שינויים לעדכון' : `עדכן ${changedSoldiers.length} שינויים`}
                >
                  {isUpdatingChanges ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="sm:hidden">עדכן...</span>
                      <span className="hidden sm:inline">עדכן...</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">📤</span>
                      <span className="hidden sm:inline">📤 עדכן נתונים {changedSoldiers.length > 0 ? `(${changedSoldiers.length})` : ''}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    if (!showAddForm) setFormErrors({ name: '', id: '', platoon: '' });
                  }}
                  className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors text-sm flex items-center gap-2"
                >
                  <BsPersonAdd className="text-lg" />
                  <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.ADD_NEW}</span>
                </button>
              </div>
            </div>

            {/* Add New Soldier Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">{TEXT_CONSTANTS.STATUS_PAGE.ADD_NEW_SOLDIER}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                      שם <span className="text-danger-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={newSoldier.name}
                      onChange={handleNameChange}
                      className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 placeholder-neutral-600 ${
                        formErrors.name 
                          ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                          : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder={TEXT_CONSTANTS.STATUS_PAGE.FULL_NAME}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                      מספר אישי <span className="text-danger-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={newSoldier.id}
                      onChange={handleIdChange}
                      className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 placeholder-neutral-600 ${
                        formErrors.id 
                          ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                          : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder={TEXT_CONSTANTS.STATUS_PAGE.PERSONAL_NUMBER}
                    />
                    {formErrors.id && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.id}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                      צוות <span className="text-danger-500">*</span>
                    </label>
                    <select 
                      value={newSoldier.platoon}
                      onChange={handlePlatoonChange}
                      className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 ${
                        formErrors.platoon 
                          ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                          : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                    >
                      <option value="">{TEXT_CONSTANTS.STATUS_PAGE.SELECT_TEAM}</option>
                      {uniquePlatoons.map(platoon => (
                        <option key={platoon} value={platoon}>{platoon}</option>
                      ))}
                    </select>
                    {formErrors.platoon && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.platoon}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">{TEXT_CONSTANTS.STATUS_PAGE.STATUS_LABEL}</label>
                    <div className="flex items-center gap-2">
                      {/* Status Toggle Icons */}
                      <div className="flex bg-neutral-100 rounded-lg p-1">
                        <button 
                          type="button"
                          onClick={() => setNewSoldier(prev => ({ ...prev, status: TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME, customStatus: '' }))}
                          className={`px-3 py-2 rounded-md text-lg transition-colors ${
                            newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME 
                              ? 'bg-primary-600 text-white shadow-sm' 
                              : 'text-neutral-600 hover:bg-neutral-200'
                          }`}
                          title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME}
                        >
                          <BsFillHouseFill />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewSoldier(prev => ({ ...prev, status: TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD, customStatus: '' }))}
                          className={`px-3 py-2 rounded-md text-lg transition-colors ${
                            newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD 
                              ? 'bg-primary-600 text-white shadow-sm' 
                              : 'text-neutral-600 hover:bg-neutral-200'
                          }`}
                          title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD}
                        >
                          <GiTank />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewSoldier(prev => ({ ...prev, status: TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER }))}
                          className={`px-3 py-2 rounded-md text-lg transition-colors ${
                            newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER 
                              ? 'bg-primary-600 text-white shadow-sm' 
                              : 'text-neutral-600 hover:bg-neutral-200'
                          }`}
                          title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER}
                        >
                          <MdNotListedLocation />
                        </button>
                      </div>
                      
                      {/* Custom Status Input (when אחר is selected) */}
                      {newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER && (
                        <input 
                          type="text"
                          value={newSoldier.customStatus}
                          onChange={handleCustomStatusChange}
                          placeholder={TEXT_CONSTANTS.STATUS_PAGE.CUSTOM_STATUS_PLACEHOLDER}
                          className="flex-1 h-10 border-2 border-neutral-400 rounded-md px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <input 
                    type="text"
                    value={newSoldier.notes}
                    onChange={handleNotesChange}
                    className="flex-1 h-10 border-2 border-neutral-400 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
                    placeholder={TEXT_CONSTANTS.STATUS_PAGE.ADDITIONAL_NOTES}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addNewSoldier}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    הוסף
                  </button>
                  <button 
                    onClick={() => manuallyAddedCount > 0 ? setShowPasswordModal(true) : undefined}
                    disabled={manuallyAddedCount === 0}
                    className={manuallyAddedCount > 0 
                      ? 'px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors' 
                      : 'px-4 py-2 bg-neutral-400 text-neutral-200 rounded-md cursor-not-allowed transition-colors'
                    }
                    title={TEXT_CONSTANTS.STATUS_PAGE.UPDATE_NEW_SOLDIERS_TOOLTIP(manuallyAddedCount)}
                  >
                    {TEXT_CONSTANTS.STATUS_PAGE.UPDATE_SERVER_BUTTON(manuallyAddedCount)}
                  </button>
                  <button 
                    onClick={() => {
                      setShowAddForm(false);
                      setFormErrors({ name: '', id: '', platoon: '' });
                    }}
                    className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Soldiers Table - Desktop */}
            <SoldiersTableDesktop
              soldiers={filteredSoldiers}
              hasOtherStatus={hasOtherStatus}
              uniquePlatoons={uniquePlatoons}
              selectedTeams={selectedTeams}
              selectedStatuses={selectedStatuses}
              showTeamFilter={showTeamFilter}
              showStatusFilter={showStatusFilter}
              onToggleSelection={toggleSelection}
              onToggleAllVisible={toggleAllVisible}
              onStatusChange={updateStatus}
              onNotesChange={updateNotes}
              onTeamFilterToggle={() => setShowTeamFilter(!showTeamFilter)}
              onStatusFilterToggle={() => setShowStatusFilter(!showStatusFilter)}
              onTeamFilterChange={setSelectedTeams}
              onStatusFilterChange={setSelectedStatuses}
              allVisibleSelected={filteredSoldiers.length > 0 && filteredSoldiers.every(soldier => soldier.isSelected)}
              someVisibleSelected={filteredSoldiers.some(soldier => soldier.isSelected)}
            />

            {/* Soldiers Table - Mobile */}
            <SoldiersTableMobile
              soldiers={filteredSoldiers}
              uniquePlatoons={uniquePlatoons}
              selectedTeams={selectedTeams}
              selectedStatuses={selectedStatuses}
              showTeamFilter={showTeamFilter}
              showStatusFilter={showStatusFilter}
              onToggleSelection={toggleSelection}
              onToggleAllVisible={toggleAllVisible}
              onStatusChange={updateStatus}
              onNotesChange={updateNotes}
              onTeamFilterToggle={() => setShowTeamFilter(!showTeamFilter)}
              onStatusFilterToggle={() => setShowStatusFilter(!showStatusFilter)}
              onTeamFilterChange={setSelectedTeams}
              onStatusFilterChange={setSelectedStatuses}
              allVisibleSelected={filteredSoldiers.length > 0 && filteredSoldiers.every(soldier => soldier.isSelected)}
              someVisibleSelected={filteredSoldiers.some(soldier => soldier.isSelected)}
            />

            {/* Report Preview */}
            {showPreview && (
              <div id="report-preview" className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary-700">{TEXT_CONSTANTS.STATUS_PAGE.REPORT_PREVIEW_TITLE}</h3>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="text-neutral-500 hover:text-neutral-700 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <textarea 
                  value={reportText}
                  readOnly
                  className="w-full h-64 border border-neutral-300 rounded-md p-3 font-mono text-sm bg-neutral-50 text-black"
                />
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    העתק ללוח
                  </button>
                  <button 
                    onClick={showWhatsAppNotSupported}
                    className="p-3 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors flex items-center justify-center"
                    title={TEXT_CONSTANTS.STATUS_PAGE.SEND_TO_WHATSAPP}
                  >
                    <FaWhatsapp className="text-lg" />
                  </button>
                  <button 
                    onClick={downloadReport}
                    className="p-3 bg-info-600 text-white rounded-md hover:bg-info-700 transition-colors flex items-center justify-center"
                    title={TEXT_CONSTANTS.STATUS_PAGE.DOWNLOAD_REPORT}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Download className="animate-spin text-lg" />
                    ) : (
                      <MdDownload className="text-lg" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      {!error && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <button 
                onClick={generateReport}
                className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                הפק טקסט
              </button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="multiPlatoonReport"
                    checked={isMultiPlatoonReport}
                    onChange={(e) => setIsMultiPlatoonReport(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="multiPlatoonReport" className="text-sm font-medium text-neutral-700">
                    שבצ&quot;ק רב מחלקתי
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="includeIdInReport"
                    checked={includeIdInReport}
                    onChange={(e) => setIncludeIdInReport(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="includeIdInReport" className="text-sm font-medium text-neutral-700">
                    כלול מספר אישי
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              הזן סיסמת מנהל
            </h3>
            <div className="mb-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder={TEXT_CONSTANTS.STATUS_PAGE.PASSWORD_PLACEHOLDER}
                  className={`w-full border-2 rounded-md px-3 py-2 pr-10 text-neutral-800 focus:outline-none focus:ring-2 ${
                    passwordError 
                      ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                      : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      updateServerData();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                >
                  {showPassword ? (
                    <span className="text-lg">🙈</span>
                  ) : (
                    <span className="text-lg">😑</span>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-danger-600">{passwordError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={updateServerData}
                disabled={isUpdatingServer}
                className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 disabled:bg-success-400 transition-colors flex items-center gap-2"
              >
                {isUpdatingServer ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    מעדכן...
                  </>
                ) : (
                  TEXT_CONSTANTS.STATUS_PAGE.UPDATE_SHORT
                )}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                disabled={isUpdatingServer}
                className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 disabled:bg-neutral-400 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
} 