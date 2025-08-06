'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { UserRole } from '@/types/equipment';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck, Mail, Package } from 'lucide-react';
import ItemTypesManagement from '@/components/management/ItemTypesManagement';
import { MANAGEMENT } from '@/constants/text';

// Management tabs configuration
const MANAGEMENT_TABS = [
  {
    id: 'users',
    label: MANAGEMENT.TABS.USERS.LABEL,
    icon: Users,
    description: MANAGEMENT.TABS.USERS.DESCRIPTION
  },
  {
    id: 'permissions',
    label: MANAGEMENT.TABS.PERMISSIONS.LABEL,
    icon: Shield,
    description: MANAGEMENT.TABS.PERMISSIONS.DESCRIPTION
  },
  {
    id: 'enforce-transfer',
    label: MANAGEMENT.TABS.ENFORCE_TRANSFER.LABEL,
    icon: ArrowRightLeft,
    description: MANAGEMENT.TABS.ENFORCE_TRANSFER.DESCRIPTION
  },
  {
    id: 'system-config',
    label: MANAGEMENT.TABS.SYSTEM_CONFIG.LABEL,
    icon: Settings,
    description: MANAGEMENT.TABS.SYSTEM_CONFIG.DESCRIPTION
  },
  {
    id: 'data-management',
    label: MANAGEMENT.TABS.DATA_MANAGEMENT.LABEL,
    icon: Database,
    description: MANAGEMENT.TABS.DATA_MANAGEMENT.DESCRIPTION
  },
  {
    id: 'audit-logs',
    label: MANAGEMENT.TABS.AUDIT_LOGS.LABEL,
    icon: UserCheck,
    description: MANAGEMENT.TABS.AUDIT_LOGS.DESCRIPTION
  },
  {
    id: 'item-types',
    label: MANAGEMENT.TABS.ITEM_TYPES.LABEL,
    icon: Package,
    description: MANAGEMENT.TABS.ITEM_TYPES.DESCRIPTION
  },
  {
    id: 'send-email',
    label: MANAGEMENT.TABS.SEND_EMAIL.LABEL,
    icon: Mail,
    description: MANAGEMENT.TABS.SEND_EMAIL.DESCRIPTION
  }
] as const;

// Email Tab Component
function EmailTabContent() {
  const [recipients, setRecipients] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);

  const roleOptions = [
    { value: 'soldier', label: MANAGEMENT.EMAIL.ROLES.SOLDIERS },
    { value: 'officer', label: MANAGEMENT.EMAIL.ROLES.OFFICERS },
    { value: 'commander', label: MANAGEMENT.EMAIL.ROLES.COMMANDERS },
    { value: 'equipment_manager', label: MANAGEMENT.EMAIL.ROLES.EQUIPMENT_MANAGERS },
    { value: 'admin', label: MANAGEMENT.EMAIL.ROLES.ADMINS }
  ];

  const handleSendEmail = () => {
    // This is UI only - no actual email sending
    console.log('Email would be sent:', {
      recipients,
      selectedRoles,
      subject,
      message,
      isUrgent
    });
    alert(MANAGEMENT.EMAIL.SUCCESS_MESSAGE);
  };

  return (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{MANAGEMENT.EMAIL.RECIPIENT_SELECTION}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <input
              type="radio"
              id="all-users"
              name="recipients"
              value="all"
              checked={recipients === 'all'}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <label htmlFor="all-users" className="text-sm font-medium text-gray-700">
              {MANAGEMENT.EMAIL.ALL_USERS}
            </label>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <input
              type="radio"
              id="by-role"
              name="recipients"
              value="by-role"
              checked={recipients === 'by-role'}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <label htmlFor="by-role" className="text-sm font-medium text-gray-700">
              {MANAGEMENT.EMAIL.BY_ROLE}
            </label>
          </div>

          {recipients === 'by-role' && (
            <div className="mr-7 space-y-2">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    id={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.value]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role.value));
                      }
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor={role.value} className="text-sm text-gray-600">
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3 space-x-reverse">
            <input
              type="radio"
              id="specific-users"
              name="recipients"
              value="specific"
              checked={recipients === 'specific'}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <label htmlFor="specific-users" className="text-sm font-medium text-gray-700">
              {MANAGEMENT.EMAIL.SPECIFIC_USERS}
            </label>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{MANAGEMENT.EMAIL.MESSAGE_CONTENT}</h3>
        
        <div className="space-y-4">
          {/* Priority */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="urgent" className="text-sm font-medium text-gray-700">
              {MANAGEMENT.EMAIL.URGENT_MESSAGE}
            </label>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              {MANAGEMENT.EMAIL.SUBJECT_LABEL}
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={MANAGEMENT.EMAIL.SUBJECT_PLACEHOLDER}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              {MANAGEMENT.EMAIL.MESSAGE_LABEL}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={MANAGEMENT.EMAIL.MESSAGE_PLACEHOLDER}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Preview & Send */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{MANAGEMENT.EMAIL.PREVIEW_AND_SEND}</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>{MANAGEMENT.EMAIL.RECIPIENTS_PREVIEW}</strong> {
              recipients === 'all' ? MANAGEMENT.EMAIL.ALL_USERS_TEXT :
              recipients === 'by-role' ? `${MANAGEMENT.EMAIL.SELECTED_ROLES_TEXT} ${selectedRoles.join(', ')}` :
              MANAGEMENT.EMAIL.SPECIFIC_USERS_TEXT
            }
          </div>
          <div className="text-sm text-gray-600 mb-2">
            <strong>{MANAGEMENT.EMAIL.SUBJECT_PREVIEW}</strong> {subject || MANAGEMENT.EMAIL.NO_SUBJECT}
            {isUrgent && <span className="text-red-600 font-semibold">{MANAGEMENT.EMAIL.URGENT_INDICATOR}</span>}
          </div>
          <div className="text-sm text-gray-600">
            <strong>{MANAGEMENT.EMAIL.MESSAGE_PREVIEW}</strong> {message || MANAGEMENT.EMAIL.NO_CONTENT}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {MANAGEMENT.EMAIL.DEMO_WARNING}
          </div>
          <button
            onClick={handleSendEmail}
            disabled={!subject.trim() || !message.trim()}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              subject.trim() && message.trim()
                ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Mail className="w-4 h-4 inline-block ml-2" />
            {MANAGEMENT.EMAIL.SEND_BUTTON}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagementContent() {
  const { enhancedUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(MANAGEMENT_TABS[0].id);

  // Check if user has management access
  const hasManagementAccess = () => {
    if (!enhancedUser) return false;
    // Check if user is admin (userType) or has officer/commander/admin role
    return enhancedUser.userType === 'admin' || 
           (enhancedUser.role && [UserRole.OFFICER, UserRole.COMMANDER, UserRole.ADMIN].includes(enhancedUser.role as UserRole));
  };

  // Access denied for users without proper roles
  if (!hasManagementAccess()) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header 
          title={MANAGEMENT.PAGE_TITLE}
          subtitle={MANAGEMENT.ACCESS_DENIED_SUBTITLE}
          showAuth={true}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{MANAGEMENT.ACCESS_DENIED_TITLE}</h2>
            <p className="text-gray-600 mb-6">
              {MANAGEMENT.ACCESS_DENIED_MESSAGE}
            </p>
            <p className="text-sm text-gray-500">
              {MANAGEMENT.CURRENT_ROLE_LABEL} {enhancedUser?.userType === 'admin' ? MANAGEMENT.ADMIN_ROLE_TEXT : enhancedUser?.role || MANAGEMENT.ROLE_NOT_IDENTIFIED}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const activeTabData = MANAGEMENT_TABS.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header 
        title={MANAGEMENT.PAGE_TITLE}
        subtitle={MANAGEMENT.PAGE_SUBTITLE}
        showAuth={true}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {MANAGEMENT.WELCOME_MESSAGE}, {enhancedUser?.firstName || MANAGEMENT.DEFAULT_ADMIN_NAME}
              </h1>
              <p className="text-gray-600 text-sm">
                {MANAGEMENT.ROLE_LABEL} {enhancedUser?.userType === 'admin' ? MANAGEMENT.ADMIN_ROLE_TEXT : enhancedUser?.role || MANAGEMENT.ROLE_NOT_IDENTIFIED}
              </p>
            </div>
          </div>
          <p className="text-gray-700">
            {MANAGEMENT.WELCOME_DESCRIPTION}
          </p>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {MANAGEMENT_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTabData && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <activeTabData.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{activeTabData.label}</h2>
                    <p className="text-gray-600">{activeTabData.description}</p>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'send-email' ? (
                  <EmailTabContent />
                ) : activeTab === 'item-types' ? (
                  <ItemTypesManagement />
                ) : (
                  /* Placeholder Content for other tabs */
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <activeTabData.icon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {activeTabData.label} - {MANAGEMENT.UNDER_DEVELOPMENT}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {MANAGEMENT.FEATURE_COMING_SOON}
                    </p>
                    <div className="text-sm text-gray-400">
                      {activeTabData.description}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {MANAGEMENT.FOOTER_TEXT}
        </div>
      </main>
    </div>
  );
}

export default function ManagementPage() {
  return (
    <AuthGuard>
      <ManagementContent />
    </AuthGuard>
  );
}