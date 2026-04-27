'use client';

import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import { downloadTool } from '@/utils/downloadUtils';

const tools = [
  {
    id: 'convoy',
    title: 'מארגן שיירות',
    description: 'ארגון שיירות האמרים וכלי רכב צבאיים — גרירה, תבניות, פיזור אנשים',
    icon: '🚗',
    href: '/tools/convoy',
    downloadFile: '/tools/hmmwvConvoy.html',
    color: 'from-emerald-600 to-emerald-800',
  },
  {
    id: 'logistics',
    title: 'דרישות מל״מ',
    description: 'טופס דרישות לוגיסטיות מובנה עם קטגוריות, עריכה חופשית ושיתוף',
    icon: '📦',
    href: '/tools/logistics',
    downloadFile: '/tools/logistics.html',
    color: 'from-purple-600 to-purple-800',
  },
];

export default function ToolsPage() {
  return (
    <AppShell title="🔧 כלים נוספים" subtitle="כלי עזר לשטח — עובדים גם אופליין">
      <div className="max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden hover:shadow-medium transition-all duration-300"
            >
              <div className={`bg-gradient-to-l ${tool.color} p-6 text-white`}>
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-xl font-bold">{tool.title}</h3>
                <p className="text-sm opacity-90 mt-1">{tool.description}</p>
              </div>

              <div className="p-4 flex gap-3">
                <Link
                  href={tool.href}
                  className="flex-1 text-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                  פתח כלי
                </Link>
                <button
                  onClick={() => downloadTool(tool.downloadFile, `${tool.title}.html`)}
                  className="flex-1 text-center px-4 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-xl transition-colors"
                >
                  ⬇️ הורד לנייד
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-xl text-center">
          <p className="text-sm text-info-700">
            💡 הקבצים שמורים כ-HTML בודד — פתח אותם בכל דפדפן, גם בלי חיבור לאינטרנט
          </p>
        </div>
      </div>
    </AppShell>
  );
}
