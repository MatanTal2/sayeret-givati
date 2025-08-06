'use client';

import { useEffect, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';

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
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch personnel on component mount
  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Filter and sort personnel
  const filteredPersonnel = personnel
    .filter(person => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                           person.phoneNumber.includes(searchTerm);
      const matchesRank = !selectedRank || person.rank === selectedRank;
      const matchesRegistration = registrationFilter === 'all' || 
                                 (registrationFilter === 'registered' && person.registered) ||
                                 (registrationFilter === 'pending' && !person.registered);
      return matchesSearch && matchesRank && matchesRegistration;
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

  // Get unique ranks for filter
  const uniqueRanks = [...new Set(personnel.map(person => person.rank))].sort();

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the authorized personnel list?`)) {
      await deletePersonnel(id);
    }
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
      return 'תאריך לא זמין';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Convert +972XXXXXXXXX to 0XX-XXXXXXX format for display
    if (phone.startsWith('+972')) {
      const number = phone.slice(4); // Remove +972
      return `0${number.slice(0, 2)}-${number.slice(2)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{personnel.length}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Authorized Personnel</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl mb-1">📱</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredPersonnel.length}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Filtered Results</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או טלפון"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Rank Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🎖️ Filter by Rank
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ranks</option>
              {uniqueRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>

          {/* Filter by Registration Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📋 Registration Status
            </label>
            <select
              value={registrationFilter}
              onChange={(e) => setRegistrationFilter(e.target.value as 'all' | 'registered' | 'pending')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="registered">✅ Registered</option>
              <option value="pending">⏳ Pending</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rank' | 'created')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created">Creation Date</option>
              <option value="name">Name</option>
              <option value="rank">Rank</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔄 Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || selectedRank || registrationFilter !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRank('');
                setRegistrationFilter('all');
                clearMessage();
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-sm ${
            message.type === 'success' 
              ? 'text-green-700 dark:text-green-400' 
              : 'text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Personnel List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading personnel...</p>
          </div>
        ) : filteredPersonnel.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-600 dark:text-gray-400">
              {personnel.length === 0 
                ? 'No authorized personnel found. Add some personnel first.'
                : 'No personnel match your search criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name & Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Added Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {person.rank}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      📱 {formatPhoneNumber(person.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {person.registered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            ✅ Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      📅 {formatDate(person.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(person.id!, `${person.firstName} ${person.lastName}`)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 
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
          onClick={fetchPersonnel}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white font-medium py-2 px-4 rounded-md
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
    </div>
  );
} 