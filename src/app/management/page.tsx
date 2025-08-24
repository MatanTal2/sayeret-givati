/**
 * Refactored Management Page - uses extracted components and hooks
 * This replaces the original 2321-line management page
 */
'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { useManagementAccess } from '@/hooks/useManagementAccess';
import { useManagementTabs } from '@/hooks/useManagementTabs';
import { useSidebar } from '@/hooks/useSidebar';
import ManagementSidebar from '@/components/management/sidebar/ManagementSidebar';
import ManagementHeader from '@/components/management/header/ManagementHeader';
import TabContentRenderer from '@/components/management/tabs/TabContentRenderer';
import { Card } from '@/components/ui';
import { Shield } from 'lucide-react';
import { MANAGEMENT } from '@/constants/text';

/**
 * Main management content component
 */
function ManagementContent() {
  const { user, permissions, isLoading } = useManagementAccess();
  const { tabsByCategory, getTabById, defaultTabId } = useManagementTabs();
  const { isOpen, activeTab, setSidebarOpen, setActiveTab } = useSidebar(defaultTabId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Show access denied for users without management access
  if (!permissions.canAccessManagement) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header 
          title={MANAGEMENT.PAGE_TITLE}
          subtitle={MANAGEMENT.PAGE_SUBTITLE_LIMITED}
          showAuth={true}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {MANAGEMENT.ACCESS_DENIED.TITLE}
            </h2>
            <p className="text-gray-600 mb-6">
              {MANAGEMENT.ACCESS_DENIED.MESSAGE}
            </p>
            <p className="text-sm text-gray-500">
              {MANAGEMENT.ACCESS_DENIED.CONTACT_ADMIN}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const activeTabData = getTabById(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden animate-fade-in" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <ManagementSidebar
        isOpen={isOpen}
        activeTab={activeTab}
        tabsByCategory={tabsByCategory}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
        userName={user?.firstName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ManagementHeader
          activeTab={activeTabData}
          sidebarOpen={isOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <TabContentRenderer 
              activeTab={activeTab} 
              activeTabData={activeTabData}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Main page component with auth guard
 */
export default function ManagementPage() {
  return (
    <AuthGuard>
      <ManagementContent />
    </AuthGuard>
  );
}