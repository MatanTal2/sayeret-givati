'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { getRecentRoutes, RecentRouteEntry } from '@/utils/recentRoutesStorage';
import CollapsibleSection from './CollapsibleSection';

const MAX_ITEMS = 2;

function timeAgo(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return TEXT_CONSTANTS.NOTIFICATIONS.NOW;
  if (diffMin < 60) return TEXT_CONSTANTS.NOTIFICATIONS.MINUTES_AGO(diffMin);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return TEXT_CONSTANTS.NOTIFICATIONS.HOURS_AGO(diffHr);
  const diffDay = Math.floor(diffHr / 24);
  return TEXT_CONSTANTS.NOTIFICATIONS.DAYS_AGO(diffDay);
}

export default function RecentRoutesWidget() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<RecentRouteEntry[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setItems(getRecentRoutes().slice(0, MAX_ITEMS));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (items === null) return null;

  return (
    <CollapsibleSection
      id="recent"
      title={TEXT_CONSTANTS.HOME.RECENT_ROUTES.SECTION_TITLE}
      icon={<Clock className="w-4 h-4" aria-hidden="true" />}
    >
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{TEXT_CONSTANTS.HOME.RECENT_ROUTES.EMPTY}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 list-disc list-inside marker:text-primary-500">
          {items.map((item) => (
            <li key={item.href} className="text-sm">
              <Link
                href={item.href}
                className="text-neutral-800 hover:text-primary-700 transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-neutral-500 text-xs"> · {timeAgo(item.visitedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
