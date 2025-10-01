'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Equipment, EquipmentStatus, EquipmentCondition } from '@/types/equipment';
import { TEXT_CONSTANTS, TEXT_FMT } from '@/constants/text';
import { Timestamp } from 'firebase/firestore';
import StatusComponent from './EquipmentStatus';
import ConditionComponent from './EquipmentCondition';
import DailyStatusBadge from './DailyStatusBadge';
import SelectAllCheckbox from '@/app/components/SelectAllCheckbox';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';

interface EquipmentListProps {
  equipment: Equipment[];
  loading?: boolean;
  error?: string | null;
  onTransfer?: (equipmentId: string) => void;
  onUpdateStatus?: (equipmentId: string) => void;
  onViewHistory?: (equipmentId: string) => void;
  onRefresh?: () => void;
}

type SortField = 'id' | 'productName' | 'currentHolder' | 'status' | 'lastReportUpdate';
type SortOrder = 'asc' | 'desc';

export default function EquipmentList({
  equipment,
  loading = false,
  error = null,
  onTransfer,
  onUpdateStatus,
  onViewHistory,
  onRefresh
}: EquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<EquipmentCondition | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('lastReportUpdate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showProductNameFilter, setShowProductNameFilter] = useState(false);
  const [showHolderFilter, setShowHolderFilter] = useState(false);
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [selectedHolders, setSelectedHolders] = useState<string[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  
  // Tab and user context
  const { enhancedUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-equipment' | 'additional-equipment'>('my-equipment');
  
  // Additional filters for "additional equipment" tab
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [idFilter, setIdFilter] = useState('');
  const [productNameFilter, setProductNameFilter] = useState('');
  const [holderFilter, setHolderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  
  // Refs for click outside detection
  const productNameFilterRef = useRef<HTMLTableHeaderCellElement>(null);
  const holderFilterRef = useRef<HTMLTableHeaderCellElement>(null);

  // Get unique values for filters
  const uniqueProductNames = [...new Set(equipment.map(item => item.productName))].sort();
  const uniqueHolders = [...new Set(equipment.map(item => item.currentHolder))].sort();

  // Filter equipment based on active tab and user role
  const getFilteredEquipment = () => {
    let baseFiltered = equipment;
    
    // Tab-based filtering
    if (activeTab === 'my-equipment') {
      // Show only equipment held by current user
      baseFiltered = equipment.filter(item => 
        enhancedUser && (
          item.currentHolder === enhancedUser.uid ||
          item.currentHolder === `${enhancedUser.firstName} ${enhancedUser.lastName}` ||
          item.currentHolder === enhancedUser.email
        )
      );
    } else {
      // "additional-equipment" tab - role-based filtering
      if (enhancedUser?.userType === UserType.USER || enhancedUser?.userType === UserType.TEAM_LEADER) {
        // Show team equipment only (assuming team info is available)
        baseFiltered = equipment.filter(item => 
          item.assignedUnit === enhancedUser?.role || // assuming role contains team info
          item.assignedTeam === enhancedUser?.role
        );
      } else {
        // Manager, system_manager, admin - show all equipment
        baseFiltered = equipment;
      }
    }
    
    return baseFiltered;
  };

  // Apply filters and sorting
  const filteredAndSortedEquipment = getFilteredEquipment()
    .filter(item => {
      // Search filter (always applied)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.id.toLowerCase().includes(searchLower) ||
          item.productName.toLowerCase().includes(searchLower) ||
          item.currentHolder.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Additional filters for "additional-equipment" tab only
      if (activeTab === 'additional-equipment') {
        if (idFilter && !item.id.toLowerCase().includes(idFilter.toLowerCase())) {
          return false;
        }
        if (productNameFilter && !item.productName.toLowerCase().includes(productNameFilter.toLowerCase())) {
          return false;
        }
        if (holderFilter && !item.currentHolder.toLowerCase().includes(holderFilter.toLowerCase())) {
          return false;
        }
        if (typeFilter && !item.equipmentType?.toLowerCase().includes(typeFilter.toLowerCase())) {
          return false;
        }
        if (categoryFilter && !item.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
        if (subCategoryFilter && item.subcategory && !item.subcategory.toLowerCase().includes(subCategoryFilter.toLowerCase())) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      // Condition filter
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) {
        return false;
      }
      
      // Product name filter (existing functionality)
      if (selectedProductNames.length > 0 && !selectedProductNames.includes(item.productName)) {
        return false;
      }
      
      // Holder filter (existing functionality)
      if (selectedHolders.length > 0 && !selectedHolders.includes(item.currentHolder)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'productName':
          aValue = a.productName;
          bValue = b.productName;
          break;
        case 'currentHolder':
          aValue = a.currentHolder;
          bValue = b.currentHolder;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastReportUpdate':
          aValue = a.lastReportUpdate instanceof Timestamp ? a.lastReportUpdate.toDate().getTime() : new Date(a.lastReportUpdate).getTime();
          bValue = b.lastReportUpdate instanceof Timestamp ? b.lastReportUpdate.toDate().getTime() : new Date(b.lastReportUpdate).getTime();
          break;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Format date for table
  const formatDate = (timestamp: Timestamp | string): string => {
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return 'תאריך לא ידוע';
    }
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="inline w-4 h-4 ml-1 text-purple-500" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="inline w-4 h-4 ml-1 text-purple-700" />
      : <ArrowDown className="inline w-4 h-4 ml-1 text-purple-700" />;
  };

  // Toggle row expansion
  const toggleRowExpansion = (equipmentId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(equipmentId)) {
      newExpandedRows.delete(equipmentId);
    } else {
      newExpandedRows.add(equipmentId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Filter handlers
  const handleProductNameFilterChange = (productName: string, checked: boolean) => {
    if (checked) {
      setSelectedProductNames([...selectedProductNames, productName]);
    } else {
      setSelectedProductNames(selectedProductNames.filter(p => p !== productName));
    }
  };

  const handleHolderFilterChange = (holder: string, checked: boolean) => {
    if (checked) {
      setSelectedHolders([...selectedHolders, holder]);
    } else {
      setSelectedHolders(selectedHolders.filter(h => h !== holder));
    }
  };

  const clearProductNameFilters = () => setSelectedProductNames([]);
  const clearHolderFilters = () => setSelectedHolders([]);

  // Selection handlers
  const toggleEquipmentSelection = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipmentIds);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipmentIds(newSelected);
  };

  const toggleAllVisible = () => {
    const visibleIds = new Set(filteredAndSortedEquipment.map(item => item.id));
    const allVisibleSelected = filteredAndSortedEquipment.every(item => selectedEquipmentIds.has(item.id));
    
    if (allVisibleSelected) {
      // Deselect all visible
      const newSelected = new Set(selectedEquipmentIds);
      visibleIds.forEach(id => newSelected.delete(id));
      setSelectedEquipmentIds(newSelected);
    } else {
      // Select all visible
      const newSelected = new Set(selectedEquipmentIds);
      visibleIds.forEach(id => newSelected.add(id));
      setSelectedEquipmentIds(newSelected);
    }
  };

  // Selection state for "select all" checkbox
  const allVisibleSelected = filteredAndSortedEquipment.length > 0 && filteredAndSortedEquipment.every(item => selectedEquipmentIds.has(item.id));
  const someVisibleSelected = filteredAndSortedEquipment.some(item => selectedEquipmentIds.has(item.id));

  // Update dropdown positions when they open
  const [dropdownPositions, setDropdownPositions] = useState({
    productName: { top: 0, left: 0, width: 200 },
    holder: { top: 0, left: 0, width: 200 }
  });

  useEffect(() => {
    if (showProductNameFilter && productNameFilterRef.current) {
      const rect = productNameFilterRef.current.getBoundingClientRect();
      setDropdownPositions(prev => ({
        ...prev,
        productName: { top: rect.bottom, left: rect.left, width: rect.width }
      }));
    }
  }, [showProductNameFilter]);

  useEffect(() => {
    if (showHolderFilter && holderFilterRef.current) {
      const rect = holderFilterRef.current.getBoundingClientRect();
      setDropdownPositions(prev => ({
        ...prev,
        holder: { top: rect.bottom, left: rect.left, width: rect.width }
      }));
    }
  }, [showHolderFilter]);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productNameFilterRef.current && !productNameFilterRef.current.contains(event.target as Node)) {
        setShowProductNameFilter(false);
      }
      if (holderFilterRef.current && !holderFilterRef.current.contains(event.target as Node)) {
        setShowHolderFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOADING_EQUIPMENT}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          ❌ {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING}
        </div>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRY_AGAIN}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Controls Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        {/* Basic Filters - Compact Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              placeholder="חיפוש לפי מספר סידורי..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         bg-gray-50 text-gray-900 placeholder-gray-500
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white
                         transition-colors"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         bg-gray-50 text-gray-900
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white
                         transition-colors"
            >
              <option value="all">כל הסטטוסים</option>
              <option value={EquipmentStatus.AVAILABLE}>זמין</option>
              <option value={EquipmentStatus.IN_USE}>בשימוש</option>
              <option value={EquipmentStatus.MAINTENANCE}>בתחזוקה</option>
              <option value={EquipmentStatus.REPAIR}>בתיקון</option>
              <option value={EquipmentStatus.LOST}>אבוד</option>
              <option value={EquipmentStatus.RETIRED}>הוחזר</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="חיפוש לפי שם מוצר..."
              value={productNameFilter}
              onChange={(e) => setProductNameFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         bg-gray-50 text-gray-900 placeholder-gray-500
                         focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white
                         transition-colors"
            />
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              {showAdvancedFilters ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.HIDE_ADVANCED_FILTERS : TEXT_CONSTANTS.FEATURES.EQUIPMENT.SHOW_ADVANCED_FILTERS}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 transition-all duration-300 ease-in-out">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="מחזיק נוכחי..."
                  value={holderFilter}
                  onChange={(e) => setHolderFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="סוג ציוד..."
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="קטגוריה..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="תת-קטגוריה..."
                  value={subCategoryFilter}
                  onChange={(e) => setSubCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="מספר סידורי מתקדם..."
                  value={idFilter}
                  onChange={(e) => setIdFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value as EquipmentCondition | 'all')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-colors"
                >
                  <option value="all">כל המצבים</option>
                  <option value={EquipmentCondition.NEW}>חדש</option>
                  <option value={EquipmentCondition.EXCELLENT}>מצוין</option>
                  <option value={EquipmentCondition.GOOD}>טוב</option>
                  <option value={EquipmentCondition.FAIR}>בסדר</option>
                  <option value={EquipmentCondition.POOR}>גרוע</option>
                  <option value={EquipmentCondition.NEEDS_REPAIR}>דורש תיקון</option>
                </select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setIdFilter('');
                  setProductNameFilter('');
                  setHolderFilter('');
                  setTypeFilter('');
                  setCategoryFilter('');
                  setSubCategoryFilter('');
                  setConditionFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                נקה הכל
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-gray-50 px-4 py-3 rounded-lg">
        <div className="text-gray-600">
          {(() => {
            // Calculate the baseline count for the current tab
            const baseEquipmentForTab = getFilteredEquipment();
            return TEXT_FMT.SHOWING_RESULTS(filteredAndSortedEquipment.length, baseEquipmentForTab.length);
          })()}
          {selectedEquipmentIds.size > 0 && (
            <span className="text-purple-600 font-medium mr-2">
              • נבחרו {selectedEquipmentIds.size} פריטים
            </span>
          )}
        </div>
        
        {/* Active Filter Info */}
        <div className="text-xs text-gray-500">
          {(searchTerm || idFilter || productNameFilter || holderFilter || typeFilter || categoryFilter || subCategoryFilter || statusFilter !== 'all' || conditionFilter !== 'all') && (
            <span className="text-purple-600">סינון פעיל • </span>
          )}
          {activeTab === 'my-equipment' 
            ? 'הציוד שלי'
            : enhancedUser?.userType === UserType.USER || enhancedUser?.userType === UserType.TEAM_LEADER
              ? 'ציוד הצוות'
              : 'כל הציוד'
          }
        </div>
      </div>

      {/* Equipment Display with Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px]">
        {/* Tabs - Always visible, sticky above table header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('my-equipment')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'my-equipment'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.MY_EQUIPMENT}
            </button>
            <button
              onClick={() => setActiveTab('additional-equipment')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'additional-equipment'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADDITIONAL_EQUIPMENT}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredAndSortedEquipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'my-equipment' ? 'אין לך ציוד כרגע' : 'לא נמצא ציוד'}
            </h3>
            <p className="text-gray-600 text-sm">
              {activeTab === 'my-equipment' 
                ? 'לא נמצא ציוד שאתה מחזיק כרגע'
                : searchTerm || idFilter || productNameFilter || holderFilter || typeFilter || categoryFilter || subCategoryFilter || statusFilter !== 'all' || conditionFilter !== 'all'
                  ? 'נסה לשנות את הסינונים או לעבור לטאב אחר'
                  : enhancedUser?.userType === UserType.USER || enhancedUser?.userType === UserType.TEAM_LEADER
                    ? 'אין ציוד זמין לצוות'
                    : 'אין ציוד במערכת'
              }
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-400">
                <p>Debug: Total equipment in system: {equipment.length}</p>
                <p>Equipment for current tab: {getFilteredEquipment().length}</p>
                <p>After filters applied: {filteredAndSortedEquipment.length}</p>
                <p>Active tab: {activeTab}</p>
                <p>User: {enhancedUser?.firstName} {enhancedUser?.lastName}</p>
                <p>User Type: {enhancedUser?.userType}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full table-fixed">
                             <colgroup>
                <col className="w-12" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-40" />
                <col className="w-40" />
                <col className="w-28" />
                <col className="w-32" />
              </colgroup>
              <thead className="bg-purple-50 border-b border-purple-200">
                <tr>
                  <th className="px-3 py-4 text-center text-xs font-medium text-purple-700 uppercase tracking-wider">
                    <SelectAllCheckbox
                      allSelected={allVisibleSelected}
                      someSelected={someVisibleSelected}
                      onToggle={toggleAllVisible}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider">
                    פרטים
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort('id')}
                  >
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_SERIAL} {getSortIcon('id')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider relative" ref={productNameFilterRef}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center cursor-pointer hover:bg-purple-100 px-2 py-1 rounded"
                        onClick={() => handleSort('productName')}
                      >
                        <span>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_ITEM}</span>
                        {getSortIcon('productName')}
                      </div>
                      <button
                        onClick={() => setShowProductNameFilter(!showProductNameFilter)}
                        className="mr-2 px-2 py-1 text-purple-700 hover:bg-purple-100 rounded transition-colors"
                      >
                        <ChevronDown className={`h-4 w-4 text-purple-700 transition-transform duration-200 ${showProductNameFilter ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {showProductNameFilter && (
                      <div className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50" 
                           style={{
                             top: dropdownPositions.productName.top,
                             left: dropdownPositions.productName.left,
                             minWidth: dropdownPositions.productName.width
                           }}>
                        <div className="p-3 max-h-48 overflow-y-auto">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">בחר פריטים:</span>
                            <button
                              onClick={clearProductNameFilters}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              נקה הכל
                            </button>
                          </div>
                          <div className="space-y-2">
                            {uniqueProductNames.map(productName => (
                              <label key={productName} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedProductNames.includes(productName)}
                                  onChange={(e) => handleProductNameFilterChange(productName, e.target.checked)}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">{productName}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider relative" ref={holderFilterRef}>
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center cursor-pointer hover:bg-purple-100 px-2 py-1 rounded"
                        onClick={() => handleSort('currentHolder')}
                      >
                        <span>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_HOLDER}</span>
                        {getSortIcon('currentHolder')}
                      </div>
                      <button
                        onClick={() => setShowHolderFilter(!showHolderFilter)}
                        className="mr-2 px-2 py-1 text-purple-700 hover:bg-purple-100 rounded transition-colors"
                      >
                        <ChevronDown className={`h-4 w-4 text-purple-700 transition-transform duration-200 ${showHolderFilter ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {showHolderFilter && (
                      <div className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50"
                           style={{
                             top: dropdownPositions.holder.top,
                             left: dropdownPositions.holder.left,
                             minWidth: dropdownPositions.holder.width
                           }}>
                        <div className="p-3 max-h-48 overflow-y-auto">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">בחר מחזיקים:</span>
                            <button
                              onClick={clearHolderFilters}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              נקה הכל
                            </button>
                          </div>
                          <div className="space-y-2">
                            {uniqueHolders.map(holder => (
                              <label key={holder} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedHolders.includes(holder)}
                                  onChange={(e) => handleHolderFilterChange(holder, e.target.checked)}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">{holder}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort('status')}
                  >
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_STATUS} {getSortIcon('status')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider">
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEquipment.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* Main Row - Minimal Info */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedEquipmentIds.has(item.id)}
                          onChange={() => toggleEquipmentSelection(item.id)}
                          className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRowExpansion(item.id)}
                          className="flex items-center gap-2 text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedRows.has(item.id) ? 'rotate-180' : ''}`} />
                          <span className="text-xs font-medium">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.SHOW_MORE_DETAILS}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.currentHolder}</div>
                        <div className="text-xs text-gray-500">{item.assignedUnit}</div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col gap-1">
                           <StatusComponent status={item.status} size="sm" variant="outlined" />
                           <DailyStatusBadge requiresDailyStatusCheck={item.requiresDailyStatusCheck || false} size="sm" variant="outlined" />
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {onTransfer && (
                            <button
                              onClick={() => onTransfer(item.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                            >
                              העבר
                            </button>
                          )}
                          {onUpdateStatus && (
                            <button
                              onClick={() => onUpdateStatus(item.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                            >
                              עדכן
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row - Additional Details */}
                    {expandedRows.has(item.id) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">פרטי מיקום ומצב</h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 min-w-[80px]">מיקום:</span>
                                  <span className="text-gray-900">📍 {item.location}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 min-w-[80px]">מצב:</span>
                                  <ConditionComponent condition={item.condition} size="sm" />
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 min-w-[80px]">בדיקה אחרונה:</span>
                                  <span className="text-gray-900">{formatDate(item.lastReportUpdate)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">פרטי קבלה</h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 min-w-[80px]">תאריך קבלה:</span>
                                  <span className="text-gray-900">{formatDate(item.dateSigned)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 min-w-[80px]">נמסר על ידי:</span>
                                  <span className="text-gray-900">{item.signedBy}</span>
                                </div>
                                {item.assignedTeam && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-500 min-w-[80px]">צוות:</span>
                                    <span className="text-gray-900">{item.assignedTeam}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">פעולות נוספות</h4>
                              <div className="space-y-2">
                                {onViewHistory && (
                                  <button
                                    onClick={() => onViewHistory(item.id)}
                                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                                  >
                                    📋 הצג היסטוריה
                                  </button>
                                )}
                                {item.notes && (
                                  <div className="mt-2">
                                    <span className="text-gray-500 text-xs">הערות:</span>
                                    <p className="text-gray-900 text-sm mt-1 p-2 bg-yellow-50 rounded border-r-4 border-yellow-200">
                                      {item.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
