'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { formatPhoneForDisplay, normalizePhoneForSearch } from '@/utils/validationUtils';
import { UserType } from '@/types/user';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Select } from '@/components/ui';


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
        <div className="bg-info-50 p-4 rounded-lg border border-info-200">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-info-600">{personnel.length}</div>
          <div className="text-sm text-info-600">{TEXT_CONSTANTS.ADMIN.VIEW_TOTAL_PERSONNEL}</div>
        </div>
        <div className="bg-success-50 p-4 rounded-lg border border-success-200">
          <div className="text-2xl mb-1">📱</div>
          <div className="text-2xl font-bold text-success-600">{filteredPersonnel.length}</div>
          <div className="text-sm text-success-600">{TEXT_CONSTANTS.ADMIN.VIEW_FILTERED_RESULTS}</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.ADMIN.VIEW_SEARCH}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.SEARCH_BY_NAME_PHONE}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md 
                         bg-white text-neutral-900
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            />
          </div>

          {/* Rank Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.ADMIN.VIEW_FILTER_RANK}
            </label>
            <Select
              value={selectedRank || null}
              onChange={(v) => setSelectedRank(v ?? '')}
              options={uniqueRanks.map((r) => ({ value: r, label: r }))}
              placeholder={TEXT_CONSTANTS.ADMIN.VIEW_ALL_RANKS}
              clearable
              ariaLabel={TEXT_CONSTANTS.ADMIN.VIEW_FILTER_RANK}
            />
          </div>

          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.ADMIN.VIEW_FILTER_USER_TYPE}
            </label>
            <Select
              value={selectedUserType || null}
              onChange={(v) => setSelectedUserType(v ?? '')}
              options={uniqueUserTypes.map((u) => ({
                value: u,
                label: u.replace('_', ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              }))}
              placeholder={TEXT_CONSTANTS.ADMIN.VIEW_ALL_TYPES}
              clearable
              ariaLabel={TEXT_CONSTANTS.ADMIN.VIEW_FILTER_USER_TYPE}
            />
          </div>

          {/* Filter by Registration Status */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.ADMIN.VIEW_FILTER_REGISTRATION}
            </label>
            <Select
              value={registrationFilter}
              onChange={(v) => v && setRegistrationFilter(v as 'all' | 'registered' | 'pending')}
              options={[
                { value: 'all', label: TEXT_CONSTANTS.ADMIN.VIEW_REG_ALL },
                { value: 'registered', label: `✅ ${TEXT_CONSTANTS.ADMIN.VIEW_REG_REGISTERED}` },
                { value: 'pending', label: `⏳ ${TEXT_CONSTANTS.ADMIN.VIEW_REG_PENDING}` },
              ]}
              ariaLabel={TEXT_CONSTANTS.ADMIN.VIEW_FILTER_REGISTRATION}
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              📊 {TEXT_CONSTANTS.ADMIN.VIEW_SORT_BY}
            </label>
            <Select
              value={sortBy}
              onChange={(v) => v && setSortBy(v as 'name' | 'rank' | 'created')}
              options={[
                { value: 'created', label: TEXT_CONSTANTS.ADMIN.VIEW_SORT_CREATED },
                { value: 'name', label: TEXT_CONSTANTS.ADMIN.VIEW_SORT_NAME },
                { value: 'rank', label: TEXT_CONSTANTS.ADMIN.VIEW_SORT_RANK },
              ]}
              ariaLabel={TEXT_CONSTANTS.ADMIN.VIEW_SORT_BY}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              🔄 סדר
            </label>
            <Select
              value={sortOrder}
              onChange={(v) => v && setSortOrder(v as 'asc' | 'desc')}
              options={[
                { value: 'desc', label: 'חדש קודם' },
                { value: 'asc', label: 'ישן קודם' },
              ]}
              ariaLabel="סדר מיון"
            />
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
              className="text-sm text-info-600 hover:text-info-800"
            >
              🗑️ נקה מסננים
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-success-50 border border-success-200' 
            : 'bg-danger-50 border border-danger-200'
        }`}>
          <p className={`text-sm ${
            message.type === 'success' 
              ? 'text-success-700' 
              : 'text-danger-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Personnel List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">טוען כוח אדם...</p>
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-neutral-600">
              {personnel.length === 0
                ? 'לא נמצא כוח אדם מורשה. הוסף כוח אדם תחילה.'
                : 'לא נמצאו תוצאות התואמות את החיפוש.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    שם ודרגה
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    מספר טלפון
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    סוג משתמש
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    סטטוס רישום
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    תאריך הוספה
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                          <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                            {person.rank}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      📱 {formatPhoneForDisplay(person.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800">
                        {(person.userType || UserType.USER).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {person.registered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                            ✅ {TEXT_CONSTANTS.ADMIN.VIEW_REGISTERED_BADGE}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                            ⏳ {TEXT_CONSTANTS.ADMIN.VIEW_PENDING_BADGE}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      📅 {formatDate(person.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(person.id!, `${person.firstName} ${person.lastName}`)}
                        disabled={isLoading}
                        className="text-danger-600 hover:text-danger-900 
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        🗑️ הסר
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
              מרענן...
            </div>
          ) : (
            '🔄 רענן רשימת כוח אדם'
          )}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title={TEXT_CONSTANTS.ADMIN_COMPONENTS.CONFIRM_DELETION_TITLE}
        message={`האם להסיר את ${deleteModal.personName} מרשימת הכוח אדם המורשה?`}
        confirmText="🗑️ הסר כוח אדם"
        cancelText="ביטול"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isLoading}
        variant="danger"
        additionalInfo="⚠️ אזהרה: פעולה זו אינה ניתנת לשחזור. יש להוסיף את האדם מחדש כדי לאשר אותו שוב."
      />
    </div>
  );
} 