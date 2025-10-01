'use client';

import { useState, useEffect } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { RANK_OPTIONS, USER_TYPE_OPTIONS, FORM_CONSTRAINTS } from '@/constants/admin';
import { formatPhoneForDisplay, normalizePhoneForSearch } from '@/utils/validationUtils';
import { AuthorizedPersonnel } from '@/types/admin';
import { UserType } from '@/types/user';



export default function UpdatePersonnel() {
  const {
    personnel,
    isLoading: personnelLoading,
    fetchPersonnel,
    updatePersonnel,
    clearMessage
  } = usePersonnelManagement();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<AuthorizedPersonnel | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    rank: '',
    phoneNumber: '',
    userType: UserType.USER
  });

  // Loading and message state for updates
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch personnel on component mount
  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Reset form when person is selected
  useEffect(() => {
    if (selectedPerson) {
      setEditForm({
        firstName: selectedPerson.firstName,
        lastName: selectedPerson.lastName,
        rank: selectedPerson.rank,
        phoneNumber: selectedPerson.phoneNumber,
        userType: selectedPerson.userType || UserType.USER
      });
    }
  }, [selectedPerson]);

  // Filter personnel based on search term
  const filteredPersonnel = personnel.filter(person => {
    if (!searchTerm) return false; // Only show results when user types something
    
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
    const isPhoneSearch = /[\d\-\+]/.test(searchTerm);
    
    // Name search
    const matchesName = fullName.includes(searchTerm.toLowerCase());
    
    // Phone search
    let matchesPhone = false;
    if (isPhoneSearch) {
      const normalizedSearchTerm = normalizePhoneForSearch(searchTerm);
      const normalizedPhoneNumber = normalizePhoneForSearch(person.phoneNumber);
      const formattedPhone = formatPhoneForDisplay(person.phoneNumber);
      
      matchesPhone = person.phoneNumber.includes(searchTerm) ||
                    formattedPhone.includes(searchTerm) ||
                    (normalizedSearchTerm ? normalizedPhoneNumber.includes(normalizedSearchTerm) : false);
    }
    
    return matchesName || matchesPhone;
  });

  const handlePersonSelect = (person: AuthorizedPersonnel) => {
    setSelectedPerson(person);
    setIsEditing(false);
    setUpdateMessage(null);
    clearMessage();
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setUpdateMessage(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (selectedPerson) {
      setEditForm({
        firstName: selectedPerson.firstName,
        lastName: selectedPerson.lastName,
        rank: selectedPerson.rank,
        phoneNumber: selectedPerson.phoneNumber,
        userType: selectedPerson.userType || UserType.USER
      });
    }
    setUpdateMessage(null);
  };

  const handleFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (updateMessage) {
      setUpdateMessage(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedPerson) return;

    setIsUpdating(true);
    setUpdateMessage(null);
    
    // Clear hook message to prevent duplicates
    clearMessage();

    try {
      // Create update data with only changed fields
      const updateData: Record<string, string> = {};
      
      if (editForm.firstName !== selectedPerson.firstName) {
        updateData.firstName = editForm.firstName;
      }
      if (editForm.lastName !== selectedPerson.lastName) {
        updateData.lastName = editForm.lastName;
      }
      if (editForm.rank !== selectedPerson.rank) {
        updateData.rank = editForm.rank;
      }
      if (editForm.phoneNumber !== selectedPerson.phoneNumber) {
        updateData.phoneNumber = editForm.phoneNumber;
      }
      if (editForm.userType !== (selectedPerson.userType || UserType.USER)) {
        updateData.userType = editForm.userType;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        setUpdateMessage({
          text: '⚠️ No changes detected',
          type: 'error'
        });
        setIsUpdating(false);
        return;
      }

      // Call the actual update function
      const result = await updatePersonnel(selectedPerson.id!, updateData);
      
      // Clear hook message immediately after call to prevent duplicates
      clearMessage();
      
      if (result.success) {
        setUpdateMessage({
          text: result.message,
          type: 'success'
        });
        setIsEditing(false);
        
        // Update the selected person with new data
        if (result.personnel) {
          setSelectedPerson(result.personnel);
        }
      } else {
        setUpdateMessage({
          text: result.message,
          type: 'error'
        });
      }
      
    } catch (error) {
      console.error('Error updating personnel:', error);
      setUpdateMessage({
        text: '❌ Failed to update personnel. Please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedPerson(null);
    setIsEditing(false);
    setUpdateMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔍 Search Personnel
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או טלפון"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {personnelLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Searching...</p>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-gray-600 dark:text-gray-400">
                  No personnel found matching &quot;{searchTerm}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPersonnel.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => handlePersonSelect(person)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPerson?.id === person.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                          <span>🎖️ {person.rank}</span>
                          <span>📱 {formatPhoneForDisplay(person.phoneNumber)}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            {(person.userType || UserType.USER).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-lg">
                        {selectedPerson?.id === person.id ? '✅' : '👤'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Person Details & Edit Form */}
      {selectedPerson && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              👤 Personnel Details
            </h3>
            {!isEditing && (
              <button
                onClick={handleEditStart}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           transition-colors"
              >
                ✏️ Edit Information
              </button>
            )}
          </div>

          {/* Update Message */}
          {updateMessage && (
            <div className={`rounded-md p-4 mb-6 ${
              updateMessage.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                updateMessage.type === 'success' 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {updateMessage.text}
              </p>
            </div>
          )}



          {isEditing ? (
            /* Edit Form */
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name (שם פרטי) *
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-50"
                    placeholder="שם פרטי"
                    maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
                    disabled={isUpdating}
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name (שם משפחה) *
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-50"
                    placeholder="שם משפחה"
                    maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
                    disabled={isUpdating}
                    required
                  />
                </div>

                {/* Military Rank */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Military Rank (דרגה) *
                  </label>
                  <select
                    value={editForm.rank}
                    onChange={(e) => handleFormChange('rank', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-50"
                    disabled={isUpdating}
                    required
                  >
                    <option value="">Select Rank</option>
                    {RANK_OPTIONS.map(rank => (
                      <option key={rank.value} value={rank.value}>
                        {rank.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Type (סוג משתמש) *
                  </label>
                  <select
                    value={editForm.userType}
                    onChange={(e) => handleFormChange('userType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-50"
                    disabled={isUpdating}
                    required
                  >
                    {USER_TYPE_OPTIONS.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number (מספר טלפון) *
                  </label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-50"
                    placeholder="מספר טלפון"
                    maxLength={FORM_CONSTRAINTS.PHONE_MAX_LENGTH}
                    disabled={isUpdating}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                             text-white font-medium py-2 px-6 rounded-md
                             focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                             disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 
                             text-white font-medium py-2 px-6 rounded-md
                             focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                             disabled:cursor-not-allowed transition-colors"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Full Name
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Military Rank
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    🎖️ {selectedPerson.rank}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone Number
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    📱 {formatPhoneForDisplay(selectedPerson.phoneNumber)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    User Type
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {(selectedPerson.userType || UserType.USER).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
              </div>

              {/* Read-only info */}
              <div className="md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Registration Status:</span>{' '}
                    {selectedPerson.registered ? (
                      <span className="text-green-600 dark:text-green-400">✅ Registered</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">⏳ Pending</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Military ID:</span>{' '}
                    <span className="font-mono">******* (Protected)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!selectedPerson && !searchTerm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <div className="text-2xl mr-3">💡</div>
            <div>
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                How to Update Personnel Information
              </h3>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Use the search box to find personnel by name or phone number</li>
                <li>• Click on a person from the search results to select them</li>
                <li>• Click &quot;Edit Information&quot; to modify their details</li>
                <li>• You can update: Name, Rank, Phone Number, and User Type</li>
                <li>• Military ID cannot be changed for security reasons</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
