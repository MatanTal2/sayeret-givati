'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, FormField } from '@/components/ui';
import { useUsers, UserForEmail } from '@/hooks/useUsers';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { TEXT_CONSTANTS } from '@/constants/text';

interface CustomUserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedUsers: UserForEmail[]) => void;
  preSelectedUsers?: UserForEmail[];
}

type SortDirection = 'asc' | 'desc';
type AlphabetFilter = 'all' | string; // 'all' or letter like 'א', 'ב', etc.

// Horizontal Chip Toolbar Component for user selection
interface UserChipProps {
  user: UserForEmail;
  isSelected: boolean;
  onToggle: () => void;
}

function UserChip({ user, isSelected, onToggle }: UserChipProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border
        ${isSelected
          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
          : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-300 hover:bg-primary-50'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <span>{user.fullName}</span>
        {isSelected && (
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <svg 
              className="w-3 h-3 text-primary-600" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

export default function CustomUserSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  preSelectedUsers = []
}: CustomUserSelectionModalProps) {
  const { users, loading, error } = useUsers();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(preSelectedUsers.map(user => user.uid))
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [alphabetFilter, setAlphabetFilter] = useState<AlphabetFilter>('all');

  // Hebrew alphabet for filter
  const hebrewAlphabet = [
    'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 
    'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'
  ];

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    // Apply alphabet filter
    if (alphabetFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.lastName.startsWith(alphabetFilter) || user.firstName.startsWith(alphabetFilter)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const nameA = a.fullName;
      const nameB = b.fullName;
      
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB, 'he');
      } else {
        return nameB.localeCompare(nameA, 'he');
      }
    });

    return filtered;
  }, [users, searchTerm, alphabetFilter, sortDirection]);

  // Selection handlers
  const handleSelectAll = () => {
    const allIds = new Set(filteredUsers.map(user => user.uid));
    setSelectedUserIds(allIds);
  };

  const handleUnselectAll = () => {
    setSelectedUserIds(new Set());
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleConfirm = () => {
    const selectedUsers = users.filter(user => selectedUserIds.has(user.uid));
    onConfirm(selectedUsers);
    onClose();
  };

  const handleClose = () => {
    setSelectedUserIds(new Set(preSelectedUsers.map(user => user.uid))); // Reset to original
    setSearchTerm('');
    setAlphabetFilter('all');
    onClose();
  };

  // Toggle sort direction
  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">בחירת משתמשים מותאמת</h2>
          <p className="text-sm text-neutral-600 mt-1">
            בחר משתמשים ספציפיים לשליחת ההודעה
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search */}
            <FormField label="חיפוש לפי שם או אימייל">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.TYPE_TO_SEARCH}
                className="w-full"
              />
            </FormField>

            {/* Alphabet Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">
                סינון לפי אות ראשונה:
              </label>
              <select
                value={alphabetFilter}
                onChange={(e) => setAlphabetFilter(e.target.value as AlphabetFilter)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-20 text-center"
              >
                <option value="all">הכל</option>
                {hebrewAlphabet.map(letter => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Controls */}
            <div className="flex gap-2 items-center">
              <Button variant="secondary" onClick={handleSelectAll} size="sm">
                בחר הכל ({filteredUsers.length})
              </Button>
              <Button variant="secondary" onClick={handleUnselectAll} size="sm">
                בטל בחירה
              </Button>
              <span className="text-sm text-neutral-600">
                נבחרו: {selectedUserIds.size} משתמשים
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 text-center">
              <p className="text-danger-800">{error}</p>
            </div>
          )}

                    {/* Horizontal Chip Toolbar */}
          {!loading && !error && (
            <Card>
              <div className="space-y-4">
                {/* Toolbar Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-4">
                    <h4 className="text-sm font-medium text-neutral-900">
                      רשימת משתמשים ({filteredUsers.length})
                    </h4>
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1 text-xs text-neutral-600 hover:text-primary-600 transition-colors"
                    >
                      מיון: {sortDirection === 'asc' ? 'א-ת' : 'ת-א'}
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="text-xs text-neutral-500">
                    גלול אופקית לעיון בכל המשתמשים
                  </div>
                </div>

                {/* Scrollable Chip Container */}
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    {searchTerm || alphabetFilter !== 'all' 
                      ? 'לא נמצאו משתמשים התואמים לחיפוש'
                      : 'אין משתמשים זמינים'
                    }
                  </div>
                ) : (
                  <div className="relative">
                    {/* Horizontal scrollable container */}
                    <div className="flex gap-3 overflow-x-auto pb-4 pl-4 pr-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
                      {filteredUsers.map((user) => (
                        <UserChip
                          key={user.uid}
                          user={user}
                          isSelected={selectedUserIds.has(user.uid)}
                          onToggle={() => toggleUserSelection(user.uid)}
                        />
                      ))}
                    </div>
                    
                    {/* Fade edges for visual scroll indication */}
                    <div className="absolute left-0 top-0 bottom-4 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-4 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Additional Info Row */}
                {filteredUsers.length > 0 && (
                  <div className="pt-3 border-t border-neutral-100">
                    <div className="grid grid-cols-3 gap-4 text-xs text-neutral-600">
                      <div>
                        <span className="font-medium">סה&quot;כ משתמשים:</span> {filteredUsers.length}
                      </div>
                      <div>
                        <span className="font-medium">נבחרו:</span> {selectedUserIds.size}
                      </div>
                      <div>
                        <span className="font-medium">זמינים:</span> {filteredUsers.filter(u => !selectedUserIds.has(u.uid)).length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-between">
          <div className="text-sm text-neutral-600">
            נבחרו {selectedUserIds.size} משתמשים מתוך {users.length}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedUserIds.size === 0}
            >
              אישור בחירה ({selectedUserIds.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
