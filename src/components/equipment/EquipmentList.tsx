'use client';

import React, { useState } from 'react';
import { ChevronDown } from "lucide-react";
import { Equipment, EquipmentStatus, EquipmentCondition } from '@/types/equipment';
import { TEXT_CONSTANTS, TEXT_FMT } from '@/constants/text';
import EquipmentCard from './EquipmentCard';
import StatusComponent from './EquipmentStatus';
import ConditionComponent from './EquipmentCondition';

interface EquipmentListProps {
  equipment: Equipment[];
  loading?: boolean;
  error?: string | null;
  onTransfer?: (equipmentId: string) => void;
  onUpdateStatus?: (equipmentId: string) => void;
  onViewHistory?: (equipmentId: string) => void;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'table';
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<EquipmentCondition | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('lastReportUpdate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter and sort equipment
  const filteredAndSortedEquipment = equipment
    .filter(item => {
      // Search filter
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
      
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      
      // Condition filter
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) {
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
          aValue = new Date(a.lastReportUpdate).getTime();
          bValue = new Date(b.lastReportUpdate).getTime();
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
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return dateString;
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
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
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
      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {/* Search and View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEARCH_PLACEHOLDER}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         bg-gray-50 text-gray-900 placeholder-gray-500
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
                         transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl transition-colors font-medium ${
                viewMode === 'grid'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔲 {TEXT_CONSTANTS.FEATURES.EQUIPMENT.CARDS_VIEW}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl transition-colors font-medium ${
                viewMode === 'table'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_VIEW}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סטטוס
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         bg-gray-50 text-gray-900
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
                         transition-colors"
            >
              <option value="all">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_STATUSES}</option>
              <option value={EquipmentStatus.AVAILABLE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_AVAILABLE}</option>
              <option value={EquipmentStatus.IN_USE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_IN_USE}</option>
              <option value={EquipmentStatus.MAINTENANCE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_MAINTENANCE}</option>
              <option value={EquipmentStatus.REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_REPAIR}</option>
              <option value={EquipmentStatus.LOST}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_LOST}</option>
              <option value={EquipmentStatus.RETIRED}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_RETIRED}</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מצב
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as EquipmentCondition | 'all')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl
                         bg-gray-50 text-gray-900
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
                         transition-colors"
            >
              <option value="all">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_CONDITIONS}</option>
              <option value={EquipmentCondition.NEW}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEW}</option>
              <option value={EquipmentCondition.EXCELLENT}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_EXCELLENT}</option>
              <option value={EquipmentCondition.GOOD}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_GOOD}</option>
              <option value={EquipmentCondition.FAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_FAIR}</option>
              <option value={EquipmentCondition.POOR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_POOR}</option>
              <option value={EquipmentCondition.NEEDS_REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEEDS_REPAIR}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {TEXT_FMT.SHOWING_RESULTS(filteredAndSortedEquipment.length, equipment.length)}
      </div>

      {/* Equipment Display */}
      {filteredAndSortedEquipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.NO_EQUIPMENT}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || conditionFilter !== 'all' 
              ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.NO_ITEMS_FOUND
              : TEXT_CONSTANTS.FEATURES.EQUIPMENT.NO_EQUIPMENT_FILTERED
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedEquipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onTransfer={onTransfer}
              onUpdateStatus={onUpdateStatus}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 border-b border-purple-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider">
                    פרטים
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort('id')}
                  >
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_SERIAL} {getSortIcon('id')}
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort('productName')}
                  >
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_ITEM} {getSortIcon('productName')}
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort('currentHolder')}
                  >
                    {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABLE_HOLDER} {getSortIcon('currentHolder')}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                                                 <button
                           onClick={() => toggleRowExpansion(item.id)}
                           className="w-8 h-8 flex items-center justify-center text-purple-700 hover:bg-purple-100 transition-colors"
                         >
                           <ChevronDown className={`h-5 w-5 text-purple-700 transition-transform duration-200 ${expandedRows.has(item.id) ? 'rotate-180' : ''}`} />
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
                         <StatusComponent status={item.status} size="sm" variant="outlined" />
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
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
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
        </div>
      )}
    </div>
  );
}
