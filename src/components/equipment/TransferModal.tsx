'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, User, FileText, MessageSquare } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { createTransferRequest } from '@/lib/transferRequestService';
import { createActionLog, ActionLogHelpers } from '@/lib/actionsLogService';
import { searchUsers, UserSearchResult } from '@/lib/userService';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onTransferSuccess?: () => void;
}

interface TransferFormData {
  toUserId: string;
  toUserName: string;
  reason: string;
  note: string;
}

// UserSearchResult is now imported from userService

const initialFormData: TransferFormData = {
  toUserId: '',
  toUserName: '',
  reason: '',
  note: ''
};

export default function TransferModal({
  isOpen,
  onClose,
  equipment,
  onTransferSuccess
}: TransferModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TransferFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<TransferFormData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setSearchQuery('');
      setSearchResults([]);
      setShowUserDropdown(false);
    }
  }, [isOpen]);

  // Debounced user search
  useEffect(() => {
    const performUserSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowUserDropdown(false);
        return;
      }

       console.log('TransferModal: Starting user search for:', searchQuery);
       setIsSearching(true);
       try {
         const results = await searchUsers(searchQuery, 10);
         console.log('TransferModal: Search results:', results);
         setSearchResults(results);
         // Only show dropdown if we have results and no user is currently selected
         setShowUserDropdown(results.length > 0 && !formData.toUserId);
       } catch (error) {
         console.error('TransferModal: Error searching users:', error);
         setSearchResults([]);
         setShowUserDropdown(false);
       } finally {
         setIsSearching(false);
       }
    };

    const timeoutId = setTimeout(performUserSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  const handleUserSelect = (user: UserSearchResult) => {
    setFormData(prev => ({
      ...prev,
      toUserId: user.uid,
      toUserName: user.displayName
    }));
    setSearchQuery(user.displayName);
    setShowUserDropdown(false);
    setErrors(prev => ({ ...prev, toUserId: undefined }));
  };

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TransferFormData> = {};

    if (!formData.toUserId) {
      newErrors.toUserId = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.TO_USER_REQUIRED;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REASON_REQUIRED;
    }

    if (formData.toUserId === user?.uid) {
      newErrors.toUserId = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANNOT_TRANSFER_TO_SELF;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !equipment || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransferRequest(
        equipment.id, // equipmentDocId
        formData.toUserId,
        formData.toUserName,
        formData.reason,
        user.uid,
        user.displayName || user.email || 'Unknown User',
        formData.note || undefined
      );

      // Create action log for transfer request
      await createActionLog(ActionLogHelpers.transferRequested(
        equipment.id,
        equipment.id,
        equipment.productName,
        user.uid,
        user.displayName || user.email || 'Unknown User',
        formData.toUserId,
        formData.toUserName,
        formData.reason
      ));

      onTransferSuccess?.();
      onClose();
      
      // Show success message (you might want to use a toast notification)
      alert(TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REQUEST_CREATED);
    } catch (error) {
      console.error('Error creating transfer request:', error);
      alert('שגיאה ביצירת בקשת ההעברה. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REQUEST_TITLE}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Equipment Info */}
        {equipment && (
          <div className="p-6 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">{equipment.productName}</h3>
                <p className="text-sm text-neutral-600">מס&apos; סידורי: {equipment.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* To User Field */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.TO_USER}
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                 onChange={(e) => {
                   setSearchQuery(e.target.value);
                   // Clear selection when user starts typing again
                   if (formData.toUserId && e.target.value !== formData.toUserName) {
                     setFormData(prev => ({ ...prev, toUserId: '', toUserName: '' }));
                   }
                 }}
                 onFocus={() => {
                   // Only show dropdown if we have results and no user is selected
                   if (searchResults.length > 0 && !formData.toUserId) {
                     setShowUserDropdown(true);
                   }
                 }}
                placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.TO_USER_PLACEHOLDER}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.toUserId ? 'border-red-300' : 'border-neutral-300'
                }`}
                disabled={isSubmitting}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            {(showUserDropdown || isSearching) && searchQuery.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-center text-neutral-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      מחפש משתמשים...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.uid}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-3 text-right hover:bg-neutral-50 flex items-center gap-3 border-b border-neutral-100 last:border-b-0"
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-neutral-900">{user.displayName}</div>
                        <div className="text-sm text-neutral-600">{user.email}</div>
                        {user.rank && (
                          <div className="text-xs text-neutral-500">{user.rank}</div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-neutral-600">
                    לא נמצאו משתמשים
                  </div>
                )}
              </div>
            )}

            {errors.toUserId && (
              <p className="mt-1 text-sm text-red-600">{errors.toUserId}</p>
            )}
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REASON}
              <span className="text-red-500 mr-1">*</span>
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.REASON_PLACEHOLDER}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                errors.reason ? 'border-red-300' : 'border-neutral-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.NOTE}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
              </div>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.NOTE_PLACEHOLDER}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.CANCEL}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'שולח...' : TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER.SUBMIT_REQUEST}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
