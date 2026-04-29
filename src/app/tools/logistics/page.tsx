'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { trackRouteVisit } from '@/utils/recentRoutesStorage';

function handleDownload() {
  const link = document.createElement('a');
  link.href = '/tools/logistics.html';
  link.download = 'דרישות-מלמ.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function LogisticsToolContent() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    trackRouteVisit({ href: '/tools/logistics', title: 'דרישות מל״מ', icon: '📦' });
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-neutral-100" dir="rtl">
      {/* Top Bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
          >
            ← חזרה לכלים
          </Link>
          <span className="text-neutral-300">|</span>
          <h1 className="text-lg font-bold text-neutral-900">📦 דרישות מל״מ</h1>
        </div>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-sm border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          ⬇️ הורד
        </button>
      </div>

      {/* Embedded Tool */}
      <iframe
        src="/tools/logistics.html"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 56px)' }}
        title="דרישות מל״מ"
      />
    </div>
  );
}

export default function LogisticsToolPage() {
  return (
    <AuthGuard>
      <LogisticsToolContent />
    </AuthGuard>
  );
}
