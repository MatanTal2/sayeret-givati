'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { UserRole } from '@/types/equipment';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck } from 'lucide-react';

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
  }
] as const;

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
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header 
          title="ניהול מערכת"
          subtitle="גישה מוגבלת"
          showAuth={true}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">אין הרשאה לגישה</h2>
            <p className="text-gray-600 mb-6">
              דף זה מיועד למשתמשים עם הרשאות ניהול בלבד (קצין, מפקד או מנהל מערכת).
            </p>
            <p className="text-sm text-gray-500">
              התפקיד הנוכחי שלך: {enhancedUser?.role || 'לא זוהה'}
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
        title="ניהול מערכת"
        subtitle="כלי ניהול מתקדמים לסיירת גבעתי"
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

                {/* Placeholder Content */}
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