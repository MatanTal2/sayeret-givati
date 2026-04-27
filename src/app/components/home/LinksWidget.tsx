'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { UsefulLink } from '@/types/usefulLink';
import { getUsefulLinks } from '@/lib/usefulLinksService';
import CollapsibleSection from './CollapsibleSection';

export default function LinksWidget() {
  const { isAuthenticated } = useAuth();
  const [links, setLinks] = useState<UsefulLink[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUsefulLinks()
      .then(setLinks)
      .catch((err) => {
        console.error('Failed to load useful links', err);
        setLinks([]);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (links === null) return null;

  return (
    <CollapsibleSection
      id="links"
      title={TEXT_CONSTANTS.HOME.LINKS.SECTION_TITLE}
      icon={<Link2 className="w-4 h-4" aria-hidden="true" />}
    >
      {links.length === 0 ? (
        <p className="text-sm text-neutral-500">{TEXT_CONSTANTS.HOME.LINKS.EMPTY}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {links.map((link) => {
            const isExternal = link.isExternal ?? !link.url.startsWith('/');
            const content = (
              <>
                {link.icon && <span aria-hidden="true">{link.icon}</span>}
                <span>{link.label}</span>
                {isExternal && <ExternalLink className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />}
              </>
            );
            const className =
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 transition-colors';
            return (
              <li key={link.id}>
                {isExternal ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
                    {content}
                  </a>
                ) : (
                  <Link href={link.url} className={className}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </CollapsibleSection>
  );
}
