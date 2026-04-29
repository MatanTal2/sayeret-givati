import type { Metadata } from 'next';
import { TEXT_CONSTANTS } from '@/constants/text';

export const metadata: Metadata = {
  title: 'תנאי שימוש — מסייעת סיירת גבעתי',
  description: 'תנאי השימוש של מערכת מסייעת סיירת גבעתי',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <article className="max-w-3xl mx-auto card-base p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4 text-center">
          תנאי שימוש
        </h1>
        <pre className="whitespace-pre-wrap text-sm text-neutral-800 leading-relaxed font-sans">
          {TEXT_CONSTANTS.AUTH.SYSTEM_POLICY_CONTENT}
        </pre>
      </article>
    </main>
  );
}
