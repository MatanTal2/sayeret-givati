'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { UserRole } from '@/types/equipment';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck, Mail } from 'lucide-react';

// Management tabs configuration
const MANAGEMENT_TABS = [
  {
    id: 'users',
    label: 'ניהול משתמשים',
    icon: Users,
    description: 'ניהול משתמשים, הרשאות ותפקידים'
  },
  {
    id: 'permissions',
    label: 'הרשאות',
    icon: Shield,
    description: 'ניהול הרשאות מערכת ובקרת גישה'
  },
  {
    id: 'enforce-transfer',
    label: 'העברת ציוד כפויה',
    icon: ArrowRightLeft,
    description: 'ביצוע העברות ציוד בחירום וכפייה'
  },
  {
    id: 'system-config',
    label: 'הגדרות מערכת',
    icon: Settings,
    description: 'הגדרות כלליות ותצורת מערכת'
  },
  {
    id: 'data-management',
    label: 'ניהול נתונים',
    icon: Database,
    description: 'גיבוי, שחזור ואחזקת נתונים'
  },
  {
    id: 'audit-logs',
    label: 'יומני ביקורת',
    icon: UserCheck,
    description: 'מעקב פעילות ויומני מערכת'
  },
  {
    id: 'send-email',
    label: 'שליחת אימייל למשתמשים',
    icon: Mail,
    description: 'שליחת הודעות אימייל לקבוצות משתמשים או משתמשים ספציפיים'
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
    { value: 'soldier', label: 'חיילים' },
    { value: 'officer', label: 'קצינים' },
    { value: 'commander', label: 'מפקדים' },
    { value: 'equipment_manager', label: 'מנהלי ציוד' },
    { value: 'admin', label: 'מנהלי מערכת' }
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
    alert('הודעת האימייל נשלחה בהצלחה! (זהו הדמייה בלבד)');
  };

  return (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">בחירת נמענים</h3>
        
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
              כל המשתמשים במערכת
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
              לפי תפקיד
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
              משתמשים ספציפיים (בפיתוח)
            </label>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">תוכן ההודעה</h3>
        
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
              הודעה דחופה (עדיפות גבוהה)
            </label>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              נושא ההודעה
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="הכנס נושא להודעה..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              תוכן ההודעה
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב את תוכן ההודעה כאן..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Preview & Send */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">תצוגה מקדימה ושליחה</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>נמענים:</strong> {
              recipients === 'all' ? 'כל המשתמשים' :
              recipients === 'by-role' ? `תפקידים נבחרים: ${selectedRoles.join(', ')}` :
              'משתמשים ספציפיים'
            }
          </div>
          <div className="text-sm text-gray-600 mb-2">
            <strong>נושא:</strong> {subject || '(ללא נושא)'}
            {isUrgent && <span className="text-red-600 font-semibold"> - דחוף!</span>}
          </div>
          <div className="text-sm text-gray-600">
            <strong>הודעה:</strong> {message || '(ללא תוכן)'}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            ⚠️ זהו ממשק הדמייה בלבד. לא יישלחו אימיילים אמיתיים.
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
            שלח הודעה
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagementContent() {
  const { enhancedUser } = useAuth();
  const [activeTab, setActiveTab] = useState(MANAGEMENT_TABS[0].id);

  // Check if user has management access
  const hasManagementAccess = () => {
    if (!enhancedUser?.role) return false;
    return [UserRole.OFFICER, UserRole.COMMANDER, 'admin'].includes(enhancedUser.role as UserRole | 'admin');
  };

  // Access denied for users without proper roles
  if (!hasManagementAccess()) {
    return (
      <div className="min-h-screen bg-page" dir="rtl">
        <Header 
          title="ניהול מערכת"
          subtitle="גישה מוגבלת"
          showAuth={true}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-card rounded-lg shadow-md border border-primary p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">אין הרשאה לגישה</h2>
            <p className="text-secondary mb-6">
              דף זה מיועד למשתמשים עם הרשאות ניהול בלבד (קצין, מפקד או מנהל מערכת).
            </p>
            <p className="text-sm text-tertiary">
              התפקיד הנוכחי שלך: {enhancedUser?.role || 'לא זוהה'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const activeTabData = MANAGEMENT_TABS.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-page" dir="rtl">
      <Header 
        title="ניהול מערכת"
        subtitle="כלי ניהול מתקדמים לסיירת גבעתי"
        showAuth={true}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome message */}
        <div className="bg-card rounded-lg shadow-sm border border-primary p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                שלום, {enhancedUser?.firstName || 'מנהל'}
              </h1>
              <p className="text-gray-600 text-sm">
                תפקיד: {enhancedUser?.role === 'admin' ? 'מנהל מערכת' : enhancedUser?.role || 'לא זוהה'}
              </p>
            </div>
          </div>
          <p className="text-gray-700">
            ברוך הבא למרכז הניהול של מערכת סיירת גבעתי. כאן תוכל לנהל משתמשים, הרשאות וביצועים מתקדמים.
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
                ) : (
                  /* Placeholder Content for other tabs */
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <activeTabData.icon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {activeTabData.label} - בפיתוח
                    </h3>
                    <p className="text-gray-500 mb-4">
                      תכונה זו נמצאת כרגע בפיתוח ותהיה זמינה בקרוב.
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
          מערכת ניהול סיירת גבעתי • גרסה 1.0 • פותח עבור צה״ל
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