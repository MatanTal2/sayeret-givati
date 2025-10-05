'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { formatPhoneForDisplay, normalizePhoneForSearch } from '@/utils/validationUtils';
import { UserType } from '@/types/user';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { TEXT_CONSTANTS } from '@/constants/text';


export default function ViewPersonnel() {
  const {
    personnel,
    isLoading,
    message,
    fetchPersonnel,
    deletePersonnel,
    clearMessage
  } = usePersonnelManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    personId: string | null;
    personName: string;
  }>({
    isOpen: false,
    personId: null,
    personName: ''
  });

  // Fetch personnel on component mount
  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Filter and sort personnel
  const filteredPersonnel = personnel
    .filter(person => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      
      // Smart search - detect if searching for name or phone number
      const isPhoneSearch = /[\d\-\+]/.test(searchTerm); // Contains digits, dashes, or plus
      
      // Name search (works with letters)
      const matchesName = fullName.includes(searchTerm.toLowerCase());
      
      // Phone search (multiple formats)
      let matchesPhone = false;
      if (isPhoneSearch) {
        const normalizedSearchTerm = normalizePhoneForSearch(searchTerm);
        const normalizedPhoneNumber = normalizePhoneForSearch(person.phoneNumber);
        const formattedPhone = formatPhoneForDisplay(person.phoneNumber);
        
        matchesPhone = person.phoneNumber.includes(searchTerm) ||
                      formattedPhone.includes(searchTerm) ||
                      (normalizedSearchTerm ? normalizedPhoneNumber.includes(normalizedSearchTerm) : false);
      }
      
      const matchesSearch = matchesName || matchesPhone;
      
      const matchesRank = !selectedRank || person.rank === selectedRank;
      
      // Fix userType filter to handle default 'user' value
      const personUserType = person.userType || UserType.USER;
      const matchesUserType = !selectedUserType || personUserType === selectedUserType;
      
      const matchesRegistration = registrationFilter === 'all' || 
                                 (registrationFilter === 'registered' && person.registered) ||
                                 (registrationFilter === 'pending' && !person.registered);
      return matchesSearch && matchesRank && matchesUserType && matchesRegistration;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          comparison = nameA.localeCompare(nameB, 'he');
          break;
        case 'rank':
          comparison = a.rank.localeCompare(b.rank, 'he');
          break;
        case 'created':
          const dateA = a.createdAt?.toDate?.() || new Date();
          const dateB = b.createdAt?.toDate?.() || new Date();
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get unique ranks and user types for filters
  const uniqueRanks = [...new Set(personnel.map(person => person.rank))].sort();
  const uniqueUserTypes = [...new Set(personnel.map(person => person.userType || UserType.USER))].sort();

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      personId: id,
      personName: name
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.personId) {
      await deletePersonnel(deleteModal.personId);
      setDeleteModal({
        isOpen: false,
        personId: null,
        personName: ''
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      personId: null,
      personName: ''
    });
  };

  const formatDate = (timestamp: unknown) => {
    try {
      const date = (timestamp as { toDate?: () => Date })?.toDate?.() || new Date();
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return TEXT_CONSTANTS.PROFILE_PAGE.DATE_NOT_AVAILABLE;
    }
  };



  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg border border-info-200 dark:border-info-800">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-info-600 dark:text-info-400">{personnel.length}</div>
          <div className="text-sm text-info-600 dark:text-info-400">Total Authorized Personnel</div>
        </div>
        <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
          <div className="text-2xl mb-1">📱</div>
          <div className="text-2xl font-bold text-success-600 dark:text-success-400">{filteredPersonnel.length}</div>
          <div className="text-sm text-success-600 dark:text-success-400">Filtered Results</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              🔍 Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.SEARCH_BY_NAME_PHONE}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            />
          </div>

          {/* Rank Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              🎖️ Filter by Rank
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            >
              <option value="">All Ranks</option>
              {uniqueRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>

          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              🔑 Filter by User Type
            </label>
            <select
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            >
              <option value="">All User Types</option>
              {uniqueUserTypes.map(userType => (
                <option key={userType} value={userType}>
                  {userType.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Registration Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              📋 Registration Status
            </label>
            <select
              value={registrationFilter}
              onChange={(e) => setRegistrationFilter(e.target.value as 'all' | 'registered' | 'pending')}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            >
              <option value="all">All Status</option>
              <option value="registered">✅ Registered</option>
              <option value="pending">⏳ Pending</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rank' | 'created')}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            >
              <option value="created">Creation Date</option>
              <option value="name">Name</option>
              <option value="rank">Rank</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              🔄 Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || selectedRank || selectedUserType || registrationFilter !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRank('');
                setSelectedUserType('');
                setRegistrationFilter('all');
                clearMessage();
              }}
              className="text-sm text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-300"
            >
              🗑️ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' 
            : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
        }`}>
          <p className={`text-sm ${
            message.type === 'success' 
              ? 'text-success-700 dark:text-success-400' 
              : 'text-danger-700 dark:text-danger-400'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Personnel List */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading personnel...</p>
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-neutral-600 dark:text-neutral-400">
              {personnel.length === 0 
                ? 'No authorized personnel found. Add some personnel first.'
                : 'No personnel match your search criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Name & Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Added Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                          <span className="text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                            {person.rank}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      📱 {formatPhoneForDisplay(person.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800 dark:bg-info-800 dark:text-info-100">
                        {(person.userType || UserType.USER).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {person.registered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100">
                            ✅ Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-800 dark:text-warning-100">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      📅 {formatDate(person.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(person.id!, `${person.firstName} ${person.lastName}`)}
                        disabled={isLoading}
                        className="text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300 
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={() => fetchPersonnel(true)}
          disabled={isLoading}
          className="bg-info-600 hover:bg-info-700 disabled:bg-neutral-400 
                     text-white font-medium py-2 px-4 rounded-md
                     focus:ring-2 focus:ring-info-500 focus:ring-offset-2
                     disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Refreshing...
            </div>
          ) : (
            '🔄 Refresh Personnel List'
          )}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title={TEXT_CONSTANTS.ADMIN_COMPONENTS.CONFIRM_DELETION_TITLE}
        message={`Are you sure you want to remove ${deleteModal.personName} from the authorized personnel list?`}
        confirmText="🗑️ Remove Personnel"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isLoading}
        variant="danger"
        additionalInfo="⚠️ Warning: This action cannot be undone. The person will need to be re-added if you want to authorize them again."
      />
    </div>
  );
} 