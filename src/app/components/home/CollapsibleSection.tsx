'use client';

import { ReactNode, useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TEXT_CONSTANTS } from '@/constants/text';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

function storageKey(id: string): string {
  return `widget_collapsed_${id}`;
}

export default function CollapsibleSection({
  id,
  title,
  icon,
  headerAction,
  defaultCollapsed = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const bodyId = useId();

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(id)) : null;
      if (stored === 'true') setCollapsed(true);
      else if (stored === 'false') setCollapsed(false);
    } catch {
      // ignore storage errors
    }
  }, [id]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey(id), String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section
      aria-labelledby={`${bodyId}-heading`}
      className={cn('card-base p-5', className)}
    >
      <header className="flex items-center gap-2 mb-4 last:mb-0">
        {icon && <span className="text-primary-600 shrink-0">{icon}</span>}
        <h2 id={`${bodyId}-heading`} className="text-base font-semibold text-neutral-900 min-w-0 truncate">
          {title}
        </h2>
        {headerAction && <div className="ms-auto flex items-center gap-2">{headerAction}</div>}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? TEXT_CONSTANTS.SHELL.EXPAND_SECTION : TEXT_CONSTANTS.SHELL.COLLAPSE_SECTION}
          className={cn(
            'p-1.5 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
            !headerAction && 'ms-auto'
          )}
        >
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', collapsed && '-rotate-90')}
            aria-hidden="true"
          />
        </button>
      </header>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            id={bodyId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
