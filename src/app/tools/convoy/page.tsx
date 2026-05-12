'use client';

import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';

function handleDownload() {
  const link = document.createElement('a');
  link.href = '/tools/hmmwvConvoy.html';
  link.download = 'מארגן-שיירות.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ConvoyToolContent() {
  return (
    <AppShell
      title="🚗 מארגן שיירות"
      hidePageHeader
      showFab={false}
      mainClassName="flex-1 flex flex-col min-h-0"
    >
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link
          href="/tools"
          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
        >
          ← חזרה לכלים
        </Link>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-sm border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          ⬇️ הורד
        </button>
      </div>
      <iframe
        src="/tools/hmmwvConvoy.html"
        className="w-full border-0 flex-1"
        title="מארגן שיירות"
      />
    </AppShell>
  );
}

export default function ConvoyToolPage() {
  return (
    <AuthGuard>
      <ConvoyToolContent />
    </AuthGuard>
  );
}
