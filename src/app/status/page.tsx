"use client";
import React, { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';

interface Soldier {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Combined full name for UI
  platoon: string;
  status: string;
  customStatus?: string;
  notes?: string;
  isSelected: boolean;
}

export default function StatusPage() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [filteredSoldiers, setFilteredSoldiers] = useState<Soldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platoonFilter, setPlatoonFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isMultiPlatoonReport, setIsMultiPlatoonReport] = useState(false);
  const [includeIdInReport, setIncludeIdInReport] = useState(true);
  
  // State for dropdown selections to show what was selected
  const [selectedPlatoonForSelection, setSelectedPlatoonForSelection] = useState('');
  const [selectedStatusForSelection, setSelectedStatusForSelection] = useState('');

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
  const [newSoldier, setNewSoldier] = useState({
    id: '',
    name: '',
    platoon: '',
    status: 'בית',
    customStatus: '',
    notes: ''
  });

  useEffect(() => {
    fetchSoldiers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache management functions
  const CACHE_KEY = 'sayeret-givati-soldiers-data';
  const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return { data, timestamp };
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  const setCachedData = (data: Soldier[], timestamp: number) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  };

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
          setFilteredSoldiers(cached.data);
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
        .filter((row: string[]) => (row[1] && row[1].trim()) || (row[2] && row[2].trim())) // Only rows with names
        .map((row: string[]) => {
          const id = row[0] || '';
          const firstName = row[1] || '';
          const lastName = row[2] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const rawStatus = row[4] || 'בית';
          
          // Handle status mapping
          let status: string;
          let customStatus: string | undefined;
          
          if (rawStatus === 'בית' || rawStatus === 'משמר') {
            status = rawStatus;
            customStatus = undefined;
          } else {
            status = 'אחר';
            customStatus = rawStatus;
          }
          
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
      setFilteredSoldiers(soldiersData);
    } catch (error) {
      console.error('Error fetching soldiers:', error);
      
      // Try to show cached data on error
      const cached = getCachedData();
      if (cached && soldiers.length === 0) {
        setSoldiers(cached.data);
        setFilteredSoldiers(cached.data);
        setLastUpdated(new Date(cached.timestamp));
        setError(
          `שגיאה בטעינת נתונים חדשים. מציג נתונים שמורים מ-${new Date(cached.timestamp).toLocaleString('he-IL')}`
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

  const filterSoldiers = () => {
    let filtered = soldiers;
    
    // Legacy single-select filters
    if (platoonFilter) {
      filtered = filtered.filter(soldier => soldier.platoon === platoonFilter);
    }
    
    if (nameFilter) {
      filtered = filtered.filter(soldier => 
        soldier.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(soldier => soldier.status === statusFilter);
    }

    // Advanced multi-select filters
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(soldier => selectedTeams.includes(soldier.platoon));
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(soldier => selectedStatuses.includes(soldier.status));
    }
    
    setFilteredSoldiers(filtered);
  };

  useEffect(() => {
    filterSoldiers();
  }, [soldiers, platoonFilter, nameFilter, statusFilter, selectedTeams, selectedStatuses]); // eslint-disable-line react-hooks/exhaustive-deps

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
      customStatus: newStatus === 'אחר' ? customStatus : undefined
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

  const selectAll = () => {
    const updatedSoldiers = soldiers.map(soldier => ({
      ...soldier,
      isSelected: true
    }));
    setSoldiers(updatedSoldiers);
  };

  const selectNone = () => {
    const updatedSoldiers = soldiers.map(soldier => ({
      ...soldier,
      isSelected: false
    }));
    setSoldiers(updatedSoldiers);
    // Also clear the dropdown selections for better UX
    setSelectedPlatoonForSelection('');
    setSelectedStatusForSelection('');
  };

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

  const selectByStatus = (status: string) => {
    const updatedSoldiers = soldiers.map(soldier => ({
      ...soldier,
      isSelected: soldier.status === status
    }));
    setSoldiers(updatedSoldiers);
  };

  const selectByPlatoon = (platoon: string) => {
    const updatedSoldiers = soldiers.map(soldier => ({
      ...soldier,
      isSelected: soldier.platoon === platoon
    }));
    setSoldiers(updatedSoldiers);
  };

  const addNewSoldier = () => {
    // Clear previous errors
    const errors = { name: '', id: '', platoon: '' };

    // Validate name
    if (!newSoldier.name.trim()) {
      errors.name = 'שם החייל חובה';
    } else {
      // Validate name format: only Hebrew letters and spaces
      const namePattern = /^[\u05D0-\u05EA\s]+$/;
      if (!namePattern.test(newSoldier.name.trim())) {
        errors.name = 'השם חייב להכיל רק אותיות עבריות';
      }
    }

    // Validate ID
    if (!newSoldier.id.trim()) {
      errors.id = 'מספר אישי חובה';
    } else {
      // Validate ID format: only numbers and between 5-7 digits
      const idPattern = /^\d{5,7}$/;
      if (!idPattern.test(newSoldier.id.trim())) {
        errors.id = 'מספר אישי חייב להכיל בין 5-7 ספרות ורק ספרות';
      } else {
        // Check for duplicate IDs across all teams
        if (soldiers.some(s => s.id && s.id.trim() === newSoldier.id.trim())) {
          errors.id = 'מספר אישי זה כבר קיים במערכת';
        }
      }
    }

    // Validate platoon
    if (!newSoldier.platoon) {
      errors.platoon = 'בחירת צוות חובה';
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
      customStatus: newSoldier.status === 'אחר' ? newSoldier.customStatus : undefined,
      notes: newSoldier.notes.trim() || undefined,
      isSelected: true
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
    setShowAddForm(false);
  };

  const generateReport = () => {
    try {
      // Choose soldiers based on multi-platoon setting
      const selectedSoldiers = isMultiPlatoonReport 
        ? soldiers.filter(s => s.isSelected)
        : filteredSoldiers.filter(s => s.isSelected);
      
      if (selectedSoldiers.length === 0) {
        alert('לא נבחרו חיילים לדוח');
        return;
      }

      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        timeZone: 'Asia/Jerusalem'
      };
      const hebrewDate = now.toLocaleDateString('he-IL', options);
      const time = now.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem'
      });

      // Group by platoon
      const groupedByPlatoon = selectedSoldiers.reduce((acc, soldier) => {
        const platoonKey = soldier.platoon || 'מסייעת'; // fallback to default
        if (!acc[platoonKey]) {
          acc[platoonKey] = [];
        }
        acc[platoonKey].push(soldier);
        return acc;
      }, {} as Record<string, Soldier[]>);

      console.log('Grouped by platoon:', groupedByPlatoon); // Debug log

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
          const status = soldier.status === 'אחר' && soldier.customStatus 
            ? soldier.customStatus 
            : soldier.status;
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
      alert('שגיאה ביצירת הדוח. אנא נסה שוב.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      alert('הדוח הועתק ללוח');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('שגיאה בהעתקה. אנא העתק ידנית.');
    }
  };

  const selectedCount = soldiers.filter(s => s.isSelected).length;
  const totalCount = soldiers.length;
  const filteredSelectedCount = filteredSoldiers.filter(s => s.isSelected).length;
  const filteredTotalCount = filteredSoldiers.length;
  const uniquePlatoons = [...new Set(soldiers.map(s => s.platoon))];

  // Get platoon counts based on current filters
  const getPlatoonCounts = (platoon: string) => {
    // Apply all current filters except platoon filter to get accurate counts
    let platoonSoldiers = soldiers.filter(s => s.platoon === platoon);
    
    if (nameFilter) {
      platoonSoldiers = platoonSoldiers.filter(soldier => 
        soldier.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    if (statusFilter) {
      platoonSoldiers = platoonSoldiers.filter(soldier => soldier.status === statusFilter);
    }
    
    return `${platoonSoldiers.length}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with Logo and Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/sayeret-givati-logo.png" 
                alt="לוגו סיירת גבעתי" 
                width={80} 
                height={80}
                className="h-16 w-auto"
              />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                מערכת שבצ״ק מסייעת
              </h1>
              <p className="text-lg text-gray-700 font-medium">סיירת גבעתי</p>
            </div>
            <div className="mr-auto">
              <Link 
                href="/"
                className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                <span className="md:hidden">🏠 ←</span>
                <span className="hidden md:inline">← חזרה לעמוד הבית</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-32">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="font-medium text-red-800">שגיאה בטעינת הנתונים</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button 
                  onClick={() => fetchSoldiers(true)}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  נסה שוב
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* Collapsible Filters */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full p-4 flex items-center justify-between text-lg font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <span>סינון</span>
                <span className={`transform transition-transform text-purple-600 ${showFilters ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showFilters && (
                <div className="px-6 py-6">
                  <div className="flex flex-wrap gap-6 items-center mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">צוות:</label>
                      <select 
                        value={platoonFilter}
                        onChange={(e) => setPlatoonFilter(e.target.value)}
                        className="border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">כל הצוותים</option>
                        {uniquePlatoons.map(platoon => (
                          <option key={platoon} value={platoon}>
                            {platoon} ({getPlatoonCounts(platoon)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-gray-400">|</div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">חיפוש לפי שם:</label>
                      <input 
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="הקלד שם..."
                        className="border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                      />
                    </div>
                    <div className="text-gray-400">|</div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">סטטוס:</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">כל הסטטוסים</option>
                        <option value="בית">בית</option>
                        <option value="משמר">משמר</option>
                        <option value="אחר">אחר</option>
                      </select>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-purple-700 mb-3">בחירה</h3>
                    <div className="flex flex-wrap gap-4 items-center justify-between border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={selectAll}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                        >
                          בחר הכל
                        </button>
                        <button 
                          onClick={selectNone}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                        >
                          בטל בחירה
                        </button>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">בחר לפי צוות:</label>
                          <select 
                            value={selectedPlatoonForSelection}
                            onChange={(e) => {
                              if (e.target.value) {
                                selectByPlatoon(e.target.value);
                                setSelectedPlatoonForSelection(e.target.value);
                              } else {
                                setSelectedPlatoonForSelection('');
                              }
                            }}
                            className="border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">בחר צוות</option>
                            {uniquePlatoons.map(platoon => (
                              <option key={platoon} value={platoon}>{platoon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">בחר לפי סטאטוס:</label>
                        <select 
                          value={selectedStatusForSelection}
                          onChange={(e) => {
                            if (e.target.value) {
                              selectByStatus(e.target.value);
                              setSelectedStatusForSelection(e.target.value);
                            } else {
                              setSelectedStatusForSelection('');
                            }
                          }}
                          className="border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">בחר סטאטוס</option>
                          <option value="בית">בית</option>
                          <option value="משמר">משמר</option>
                          <option value="אחר">אחר</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add New Soldier */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (!showAddForm) setFormErrors({ name: '', id: '', platoon: '' });
                }}
                className="w-full p-4 flex items-center justify-between text-lg font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <span>הוסף חדש</span>
                <span className={`transform transition-transform text-purple-600 ${showAddForm ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showAddForm && (
                <div className="p-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                        שם <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={newSoldier.name}
                        onChange={(e) => {
                          setNewSoldier({...newSoldier, name: e.target.value});
                          if (formErrors.name) setFormErrors({...formErrors, name: ''});
                        }}
                        className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 placeholder-gray-600 ${
                          formErrors.name 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                        placeholder="שם מלא"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                        מספר אישי <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={newSoldier.id}
                        onChange={(e) => {
                          setNewSoldier({...newSoldier, id: e.target.value});
                          if (formErrors.id) setFormErrors({...formErrors, id: ''});
                        }}
                        className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 placeholder-gray-600 ${
                          formErrors.id 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                        placeholder="מספר אישי"
                      />
                      {formErrors.id && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.id}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                        צוות <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={newSoldier.platoon}
                        onChange={(e) => {
                          setNewSoldier({...newSoldier, platoon: e.target.value});
                          if (formErrors.platoon) setFormErrors({...formErrors, platoon: ''});
                        }}
                        className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 ${
                          formErrors.platoon 
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                      >
                        <option value="">צוות</option>
                        {uniquePlatoons.map(platoon => (
                          <option key={platoon} value={platoon}>{platoon}</option>
                        ))}
                      </select>
                      {formErrors.platoon && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.platoon}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">סטטוס</label>
                      <select 
                        value={newSoldier.status}
                        onChange={(e) => setNewSoldier({...newSoldier, status: e.target.value, customStatus: ''})}
                        className="w-full h-10 border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="בית">בית</option>
                        <option value="משמר">משמר</option>
                        <option value="אחר">אחר</option>
                      </select>
                      {newSoldier.status === 'אחר' && (
                        <input 
                          type="text"
                          value={newSoldier.customStatus}
                          onChange={(e) => setNewSoldier({...newSoldier, customStatus: e.target.value})}
                          placeholder="הכנס סטטוס מותאם"
                          className="w-full h-10 mt-2 border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <input 
                      type="text"
                      value={newSoldier.notes}
                      onChange={(e) => setNewSoldier({...newSoldier, notes: e.target.value})}
                      className="flex-1 h-10 border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                      placeholder="הערות נוספות (אופציונלי)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={addNewSoldier}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      הוסף
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddForm(false);
                        setFormErrors({ name: '', id: '', platoon: '' });
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selection Counter */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-lg font-medium text-gray-800">
                  נבחרו: {filteredSelectedCount} מתוך {filteredTotalCount}
                  {(platoonFilter || nameFilter) && (
                    <span className="text-sm text-gray-600 mr-2">
                      (סה&quot;כ: {selectedCount} מתוך {totalCount})
                    </span>
                  )}
                </p>
                {lastUpdated && (
                  <p className="text-sm text-gray-500 mt-1">
                    עודכן לאחרונה: {(() => {
                      const now = new Date();
                      const updateDate = new Date(lastUpdated);
                      const isToday = now.toDateString() === updateDate.toDateString();
                      const timeString = updateDate.toLocaleTimeString('he-IL', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Jerusalem'
                      });
                      
                      if (isToday) {
                        return `היום ${timeString}`;
                      } else {
                        const dateString = updateDate.toLocaleDateString('he-IL', { 
                          day: 'numeric', 
                          month: 'numeric',
                          timeZone: 'Asia/Jerusalem'
                        });
                        return `${dateString} ${timeString}`;
                      }
                    })()}
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchSoldiers(true)}
                disabled={isRefreshing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors text-sm flex items-center gap-2 self-start sm:self-auto"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="sm:hidden">רענן...</span>
                    <span className="hidden sm:inline">רענן...</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">↻</span>
                    <span className="hidden sm:inline">↻ רענן נתונים</span>
                  </>
                )}
              </button>
            </div>

            {/* Soldiers Table - Desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm mb-6">
              <div className="max-h-96 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-3 text-center text-sm font-medium text-gray-700 w-16">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs">בחירה</span>
                          <input 
                            type="checkbox"
                            checked={filteredSoldiers.length > 0 && filteredSoldiers.every(soldier => soldier.isSelected)}
                            ref={(input) => {
                              if (input) {
                                const someSelected = filteredSoldiers.some(soldier => soldier.isSelected);
                                const allSelected = filteredSoldiers.every(soldier => soldier.isSelected);
                                input.indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onChange={toggleAllVisible}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </div>
                      </th>
                      <th className="px-1 py-3 text-gray-400">|</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">שם</th>
                      <th className="px-1 py-3 text-gray-400">|</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 relative">
                        <div className="flex items-center justify-end gap-2">
                          <span>צוות</span>
                          <button
                            onClick={() => setShowTeamFilter(!showTeamFilter)}
                            className="text-purple-600 hover:text-purple-800 text-xs"
                          >
                            ▼
                          </button>
                        </div>
                        {showTeamFilter && (
                          <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-48">
                            <div className="p-3 max-h-48 overflow-y-auto">
                              <div className="space-y-2">
                                {uniquePlatoons.map(platoon => (
                                  <label key={platoon} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedTeams.includes(platoon)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTeams([...selectedTeams, platoon]);
                                        } else {
                                          setSelectedTeams(selectedTeams.filter(t => t !== platoon));
                                        }
                                      }}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">{platoon}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
                                <button
                                  onClick={() => setSelectedTeams([])}
                                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  נקה
                                </button>
                                <button
                                  onClick={() => setShowTeamFilter(false)}
                                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  סגור
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="px-1 py-3 text-gray-400">|</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 relative">
                        <div className="flex items-center justify-end gap-2">
                          <span>סטטוס</span>
                          <button
                            onClick={() => setShowStatusFilter(!showStatusFilter)}
                            className="text-purple-600 hover:text-purple-800 text-xs"
                          >
                            ▼
                          </button>
                        </div>
                        {showStatusFilter && (
                          <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-36">
                            <div className="p-3 max-h-48 overflow-y-auto">
                              <div className="space-y-2">
                                {['בית', 'משמר', 'אחר'].map(status => (
                                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedStatuses.includes(status)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStatuses([...selectedStatuses, status]);
                                        } else {
                                          setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                        }
                                      }}
                                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">{status}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
                                <button
                                  onClick={() => setSelectedStatuses([])}
                                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  נקה
                                </button>
                                <button
                                  onClick={() => setShowStatusFilter(false)}
                                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  סגור
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="px-1 py-3 text-gray-400">|</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSoldiers.map((soldier, index) => (
                      <tr key={index} className={`border-t ${soldier.isSelected ? 'bg-purple-50' : 'bg-white'}`}>
                        <td className="px-2 py-3 text-center">
                          <input 
                            type="checkbox"
                            checked={soldier.isSelected}
                            onChange={() => toggleSelection(index)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-1 py-3 text-gray-400 text-center">|</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{soldier.name}</td>
                        <td className="px-1 py-3 text-gray-400 text-center">|</td>
                        <td className="px-4 py-3 text-gray-700">{soldier.platoon}</td>
                        <td className="px-1 py-3 text-gray-400 text-center">|</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => updateStatus(index, 'בית')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                soldier.status === 'בית' 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                              }`}
                            >
                              בית
                            </button>
                            <button 
                              onClick={() => updateStatus(index, 'משמר')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                soldier.status === 'משמר' 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                              }`}
                            >
                              משמר
                            </button>
                            <input 
                              type="text"
                              value={soldier.status === 'אחר' ? soldier.customStatus || '' : ''}
                              onChange={(e) => updateStatus(index, 'אחר', e.target.value)}
                              placeholder="אחר"
                              className="flex-1 min-w-20 border-2 border-gray-400 rounded-md px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                            />
                          </div>
                        </td>
                        <td className="px-1 py-3 text-gray-400 text-center">|</td>
                        <td className="px-4 py-3">
                          <input 
                            type="text"
                            value={soldier.notes || ''}
                            onChange={(e) => updateNotes(index, e.target.value)}
                            placeholder="הערות..."
                            className="w-full border-2 border-gray-400 rounded-md px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Soldiers List - Mobile */}
            <div className="md:hidden space-y-4 mb-6">
              <div className="max-h-96 overflow-auto space-y-4">
                {filteredSoldiers.map((soldier, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${soldier.isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                    {/* Row 1: Checkbox | Name | Platoon */}
                    <div className="flex items-center gap-3 mb-3">
                      <input 
                        type="checkbox"
                        checked={soldier.isSelected}
                        onChange={() => toggleSelection(index)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-400">|</span>
                      <span className="font-medium text-gray-800">שם:</span>
                      <span className="text-gray-700">{soldier.name}</span>
                      <span className="text-gray-400">|</span>
                      <span className="font-medium text-gray-800">צוות:</span>
                      <span className="text-gray-700">{soldier.platoon}</span>
                    </div>
                    
                    {/* Row 2: Status buttons */}
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateStatus(index, 'בית')}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            soldier.status === 'בית' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                          }`}
                        >
                          בית
                        </button>
                        <button 
                          onClick={() => updateStatus(index, 'משמר')}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            soldier.status === 'משמר' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                          }`}
                        >
                          משמר
                        </button>
                        <input 
                          type="text"
                          value={soldier.status === 'אחר' ? soldier.customStatus || '' : ''}
                          onChange={(e) => updateStatus(index, 'אחר', e.target.value)}
                          placeholder="אחר"
                          className="flex-1 border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                        />
                      </div>
                    </div>
                    
                    {/* Row 3: Notes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">הערות:</span>
                      </div>
                      <input 
                        type="text"
                        value={soldier.notes || ''}
                        onChange={(e) => updateNotes(index, e.target.value)}
                        placeholder="הערות..."
                        className="w-full border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Preview */}
            {showPreview && (
              <div id="report-preview" className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-700">תצוגה מקדימה של הדוח</h3>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <textarea 
                  value={reportText}
                  readOnly
                  className="w-full h-64 border border-gray-300 rounded-md p-3 font-mono text-sm bg-gray-50 text-black"
                />
                <button 
                  onClick={copyToClipboard}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  העתק ללוח
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      {!error && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <button 
                onClick={generateReport}
                className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
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
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="multiPlatoonReport" className="text-sm font-medium text-gray-700">
                    שבצ&quot;ק רב מחלקתי
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="includeIdInReport"
                    checked={includeIdInReport}
                    onChange={(e) => setIncludeIdInReport(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="includeIdInReport" className="text-sm font-medium text-gray-700">
                    כלול מספר אישי
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 