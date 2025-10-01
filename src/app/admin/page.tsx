'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  const handleLoginSuccess = () => {
    // The authentication state is managed by the hook
    // This callback is just for any additional actions needed
  };

  const handleLogout = () => {
    // Logout is now handled internally by AdminDashboard component
    // This callback is just for any additional cleanup needed
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
} 