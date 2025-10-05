/**
 * Users management tab component - extracted from management page
 */
import React, { useState, useMemo } from 'react';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { MANAGEMENT } from '@/constants/text';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch users from Firestore
  const { users, loading, error, fetchUsers } = useUsers();

  // Helper function to check if user role matches selected filter
  const doesRoleMatch = (userRole: string, selectedFilter: string): boolean => {
    if (selectedFilter === 'all') return true;
    
    // Map filter values to Hebrew role names for comparison
    const roleMapping: { [key: string]: string[] } = {
      'admin': ['מנהל מערכת', 'מנהל'],
      'manager': ['מנהל', 'מפקד', 'קצין'],
      'user': ['חייל', 'משתמש'],
      'team_leader': ['מפקד צוות'],
      'officer': ['קצין'],
      'commander': ['מפקד'],
      'equipment_manager': ['מנהל ציוד']
    };
    
    const matchingRoles = roleMapping[selectedFilter] || [];
    return matchingRoles.some(role => userRole.includes(role));
  };

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = doesRoleMatch(user.role, selectedRole);
      
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const pending = users.filter(u => u.status === 'transferred').length;
    
    return { total, active, inactive, pending };
  }, [users]);

  // Role display mapping
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_ADMIN,
      'manager': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_MANAGER,
      'user': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_USER,
      'team_leader': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_TEAM_LEADER,
      'squad_leader': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_SQUAD_LEADER,
      'sergeant': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_SERGEANT,
      'officer': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_OFFICER,
      'commander': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_COMMANDER,
      'equipment_manager': TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_EQUIPMENT_MANAGER
    };
    return roleMap[role.toLowerCase()] || role;
  };

  // Status display mapping
  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_ACTIVE,
      'inactive': TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_INACTIVE,
      'transferred': TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_TRANSFERRED,
      'discharged': TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_DISCHARGED
    };
    return statusMap[status] || status;
  };

  // Get user initials for avatar
  const getUserInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0] || '?';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin ml-3" />
          <span className="text-lg text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.LOADING_USERS}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-danger-600 ml-3" />
            <div>
              <h3 className="text-lg font-medium text-danger-800">{TEXT_CONSTANTS.MANAGEMENT.USERS.ERROR_LOADING_TITLE}</h3>
              <p className="text-sm text-danger-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchUsers(true)}
            className="mt-4 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg transition-colors"
          >
            {TEXT_CONSTANTS.MANAGEMENT.USERS.TRY_AGAIN_BUTTON}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{MANAGEMENT.TABS.USERS}</h3>
          <p className="text-sm text-neutral-600">{MANAGEMENT.TAB_DESCRIPTIONS.USERS}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers(true)}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            {TEXT_CONSTANTS.MANAGEMENT.USERS.REFRESH_BUTTON}
          </button>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            {TEXT_CONSTANTS.MANAGEMENT.USERS.ADD_USER_BUTTON}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">חיפוש</label>
            <input
              type="text"
              placeholder={TEXT_CONSTANTS.MANAGEMENT.USERS.SEARCH_PLACEHOLDER}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">תפקיד</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">{TEXT_CONSTANTS.MANAGEMENT.USERS.ALL_ROLES}</option>
              <option value="admin">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_ADMIN}</option>
              <option value="manager">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_MANAGER}</option>
              <option value="user">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_USER}</option>
              <option value="team_leader">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_TEAM_LEADER}</option>
              <option value="officer">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_OFFICER}</option>
              <option value="commander">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_COMMANDER}</option>
              <option value="equipment_manager">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_EQUIPMENT_MANAGER}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">סטטוס</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">{TEXT_CONSTANTS.MANAGEMENT.USERS.ALL_STATUSES}</option>
              <option value="active">{TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_ACTIVE}</option>
              <option value="inactive">{TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_INACTIVE}</option>
              <option value="transferred">{TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_TRANSFERRED}</option>
              <option value="discharged">{TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_DISCHARGED}</option>
            </select>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 text-sm text-neutral-600">
          {TEXT_CONSTANTS.MANAGEMENT.USERS.SHOWING_RESULTS(filteredUsers.length, users.length)}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.USER_COLUMN}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_COLUMN}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.RANK_COLUMN}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.TEAM_COLUMN}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_COLUMN}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{TEXT_CONSTANTS.MANAGEMENT.USERS.ACTIONS_COLUMN}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    {users.length === 0 ? TEXT_CONSTANTS.MANAGEMENT.USERS.NO_USERS_SYSTEM : TEXT_CONSTANTS.MANAGEMENT.USERS.NO_USERS_FOUND}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                          <span className="text-sm font-bold text-primary-600">
                            {getUserInitials(user.fullName)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{user.fullName}</div>
                          <div className="text-sm text-neutral-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role.includes('admin') || user.role.includes('מנהל מערכת') ? 'bg-danger-100 text-danger-800' :
                        user.role.includes('manager') || user.role.includes('מנהל') || user.role.includes('קצין') || user.role.includes('מפקד') ? 'bg-info-100 text-info-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{user.team}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-success-100 text-success-800' :
                        user.status === 'inactive' ? 'bg-danger-100 text-danger-800' :
                        user.status === 'transferred' ? 'bg-warning-100 text-warning-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {getStatusDisplayName(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button className="text-info-600 hover:text-info-900 ml-2">{TEXT_CONSTANTS.MANAGEMENT.USERS.EDIT_ACTION}</button>
                      <button className="text-danger-600 hover:text-danger-900">{TEXT_CONSTANTS.MANAGEMENT.USERS.DELETE_ACTION}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-info-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
              <div className="text-sm text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.TOTAL_USERS}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
              <span className="text-success-600 font-bold">✓</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-success-600">{stats.active}</div>
              <div className="text-sm text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.ACTIVE_USERS}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
              <span className="text-danger-600 font-bold">×</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-danger-600">{stats.inactive}</div>
              <div className="text-sm text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.INACTIVE_USERS}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
              <span className="text-warning-600 font-bold">⏳</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-warning-600">{stats.pending}</div>
              <div className="text-sm text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.TRANSFERRED_USERS}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}