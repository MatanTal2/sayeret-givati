'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Images, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';
import { UnitMedia } from '@/types/unitMedia';
import { getRecentUnitMedia } from '@/lib/unitMediaService';
import CollapsibleSection from './CollapsibleSection';

export default function MediaWidget() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<UnitMedia[] | null>(null);
  const [lightbox, setLightbox] = useState<UnitMedia | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getRecentUnitMedia(4)
      .then(setItems)
      .catch((err) => {
        console.error('Failed to load unit media', err);
        setItems([]);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (items === null) return null;

  return (
    <CollapsibleSection
      id="media"
      title={TEXT_CONSTANTS.HOME.MEDIA.SECTION_TITLE}
      icon={<Images className="w-4 h-4" aria-hidden="true" />}
    >
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{TEXT_CONSTANTS.HOME.MEDIA.EMPTY}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2">
          {items.map((item) => {
            const preview = item.thumbnailUrl || (item.type === 'image' ? item.url : undefined);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setLightbox(item)}
                  className="relative block w-full aspect-video rounded-lg overflow-hidden bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
                >
                  {preview ? (
                    <Image
                      src={preview}
                      alt={item.caption ?? ''}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 text-neutral-500 text-xs">
                      {item.type}
                    </div>
                  )}
                  {item.type === 'video' && (
                    <span
                      className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        'bg-black/30 text-white'
                      )}
                      aria-hidden="true"
                    >
                      <Play className="w-8 h-8 drop-shadow" fill="currentColor" />
                    </span>
                  )}
                  {item.caption && (
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-1.5 truncate">
                      {item.caption}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {lightbox && (
        <div
          className="modal-overlay flex items-center justify-center p-4 z-[9999]"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {lightbox.type === 'video' ? (
              <video src={lightbox.url} controls autoPlay className="w-full rounded-2xl shadow-strong" />
            ) : (
              <Image
                src={lightbox.url}
                alt={lightbox.caption ?? ''}
                width={1600}
                height={900}
                className="w-full h-auto rounded-2xl shadow-strong object-contain bg-black"
                unoptimized
              />
            )}
            {lightbox.caption && (
              <p className="mt-3 text-center text-sm text-white drop-shadow">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
