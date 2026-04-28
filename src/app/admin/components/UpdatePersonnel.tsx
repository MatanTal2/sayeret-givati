'use client';

import { useState, useEffect } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { RANK_OPTIONS, USER_TYPE_OPTIONS, FORM_CONSTRAINTS } from '@/constants/admin';
import { formatPhoneForDisplay, normalizePhoneForSearch } from '@/utils/validationUtils';
import { AuthorizedPersonnel } from '@/types/admin';
import { UserType } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Select } from '@/components/ui';



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
          text: TEXT_CONSTANTS.ADMIN.UPDATE_NO_CHANGES,
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
        text: TEXT_CONSTANTS.ADMIN.UPDATE_FAILED,
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {TEXT_CONSTANTS.ADMIN.UPDATE_SEARCH_LABEL}
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.SEARCH_BY_NAME_PHONE}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-md 
                         bg-white text-neutral-900
                         focus:ring-2 focus:ring-info-500 focus:border-info-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
              >
                {TEXT_CONSTANTS.ADMIN.UPDATE_CLEAR}
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="border-t border-neutral-200 pt-4">
            {personnelLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info-600 mx-auto mb-2"></div>
                <p className="text-neutral-600">{TEXT_CONSTANTS.ADMIN.UPDATE_SEARCHING}</p>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-neutral-600">
                  לא נמצאו תוצאות עבור &quot;{searchTerm}&quot;
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
                        ? 'border-info-500 bg-info-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-neutral-900">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center gap-4">
                          <span>🎖️ {person.rank}</span>
                          <span>📱 {formatPhoneForDisplay(person.phoneNumber)}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-info-100 text-info-800">
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">
              👤 {TEXT_CONSTANTS.ADMIN.UPDATE_PERSONAL_DETAILS}
            </h3>
            {!isEditing && (
              <button
                onClick={handleEditStart}
                className="bg-info-600 hover:bg-info-700 text-white px-4 py-2 rounded-md
                           focus:ring-2 focus:ring-info-500 focus:ring-offset-2
                           transition-colors"
              >
                {TEXT_CONSTANTS.ADMIN.UPDATE_EDIT}
              </button>
            )}
          </div>

          {/* Update Message */}
          {updateMessage && (
            <div className={`rounded-md p-4 mb-6 ${
              updateMessage.type === 'success' 
                ? 'bg-success-50 border border-success-200' 
                : 'bg-danger-50 border border-danger-200'
            }`}>
              <p className={`text-sm ${
                updateMessage.type === 'success' 
                  ? 'text-success-700' 
                  : 'text-danger-700'
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_FIRST_NAME} *
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md 
                               bg-white text-neutral-900
                               focus:ring-2 focus:ring-info-500 focus:border-info-500
                               disabled:opacity-50"
                    placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.FIRST_NAME_PLACEHOLDER}
                    maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
                    disabled={isUpdating}
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_LAST_NAME} *
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md 
                               bg-white text-neutral-900
                               focus:ring-2 focus:ring-info-500 focus:border-info-500
                               disabled:opacity-50"
                    placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.LAST_NAME_PLACEHOLDER}
                    maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
                    disabled={isUpdating}
                    required
                  />
                </div>

                {/* Military Rank */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_RANK} *
                  </label>
                  <Select
                    value={editForm.rank || null}
                    onChange={(v) => handleFormChange('rank', v ?? '')}
                    options={RANK_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
                    placeholder="בחר דרגה"
                    clearable
                    disabled={isUpdating}
                    ariaLabel={TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_RANK}
                  />
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_USER_TYPE} *
                  </label>
                  <Select
                    value={editForm.userType}
                    onChange={(v) => v && handleFormChange('userType', v)}
                    options={USER_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                    disabled={isUpdating}
                    ariaLabel={TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_USER_TYPE}
                  />
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {TEXT_CONSTANTS.ADMIN.UPDATE_FIELD_PHONE} *
                  </label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md 
                               bg-white text-neutral-900
                               focus:ring-2 focus:ring-info-500 focus:border-info-500
                               disabled:opacity-50"
                    placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.PHONE_NUMBER_PLACEHOLDER}
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
                  className="bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 
                             text-white font-medium py-2 px-6 rounded-md
                             focus:ring-2 focus:ring-success-500 focus:ring-offset-2
                             disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
                      {TEXT_CONSTANTS.ADMIN.UPDATE_SAVING}
                    </div>
                  ) : (
                    TEXT_CONSTANTS.ADMIN.UPDATE_SAVE
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 
                             text-white font-medium py-2 px-6 rounded-md
                             focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2
                             disabled:cursor-not-allowed transition-colors"
                >
                  ❌ {TEXT_CONSTANTS.ADMIN.UPDATE_CANCEL}
                </button>
              </div>
            </form>
          ) : (
            /* Display Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500">
                    שם מלא
                  </label>
                  <p className="text-lg text-neutral-900">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-500">
                    דרגה
                  </label>
                  <p className="text-lg text-neutral-900">
                    🎖️ {selectedPerson.rank}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500">
                    מספר טלפון
                  </label>
                  <p className="text-lg text-neutral-900">
                    📱 {formatPhoneForDisplay(selectedPerson.phoneNumber)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-500">
                    סוג משתמש
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-info-100 text-info-800">
                    {(selectedPerson.userType || UserType.USER).replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
              </div>

              {/* Read-only info */}
              <div className="md:col-span-2 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-500">
                  <div>
                    <span className="font-medium">סטטוס רישום:</span>{' '}
                    {selectedPerson.registered ? (
                      <span className="text-success-600">✅ רשום</span>
                    ) : (
                      <span className="text-warning-600">⏳ ממתין</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">מספר אישי:</span>{' '}
                    <span className="font-mono">******* (מוגן)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!selectedPerson && !searchTerm && (
        <div className="bg-info-50 rounded-lg p-6 border border-info-200">
          <div className="flex items-start">
            <div className="text-2xl me-3">💡</div>
            <div>
              <h3 className="text-lg font-medium text-info-800 mb-2">
                איך לעדכן פרטי כוח אדם
              </h3>
              <ul className="text-info-700 space-y-1">
                <li>• השתמש בחיפוש למציאת כוח אדם לפי שם או מספר טלפון</li>
                <li>• לחץ על אדם מתוצאות החיפוש לבחירה</li>
                <li>• לחץ &quot;ערוך&quot; לעדכון פרטים</li>
                <li>• ניתן לעדכן: שם, דרגה, מספר טלפון וסוג משתמש</li>
                <li>• המספר האישי אינו ניתן לשינוי מטעמי אבטחה</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
