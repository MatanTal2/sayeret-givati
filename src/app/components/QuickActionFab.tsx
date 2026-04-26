'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Wrench, Target, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useToast } from '@/components/ui/Toast';

interface QuickAction {
  key: 'damage' | 'ammo' | 'general';
  label: string;
  Icon: typeof Wrench;
}

const actions: QuickAction[] = [
  { key: 'damage', label: TEXT_CONSTANTS.QUICK_ACTIONS.REPORT_DAMAGE, Icon: Wrench },
  { key: 'ammo', label: TEXT_CONSTANTS.QUICK_ACTIONS.REPORT_AMMO, Icon: Target },
  { key: 'general', label: TEXT_CONSTANTS.QUICK_ACTIONS.REPORT_GENERAL, Icon: FileText },
];

export default function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('mousedown', onClickOutside), 50);
    document.addEventListener('keydown', onEscape);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const handleAction = (label: string) => {
    setOpen(false);
    showToast(`${label} — ${TEXT_CONSTANTS.QUICK_ACTIONS.COMING_SOON}`, 'info');
  };

  return (
    <div ref={containerRef} className="lg:hidden fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-end gap-2"
          >
            {actions.map(({ key, label, Icon }) => (
              <li key={key} className="flex items-center gap-2">
                <span className="bg-white text-neutral-900 text-sm font-medium rounded-lg px-3 py-1.5 shadow-medium">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => handleAction(label)}
                  className="w-11 h-11 rounded-full bg-primary-600 text-white shadow-primary-lg hover:bg-primary-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-14 h-14 rounded-full bg-primary-600 text-white shadow-primary-lg hover:bg-primary-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform',
          open && 'rotate-45'
        )}
        aria-label={open ? TEXT_CONSTANTS.QUICK_ACTIONS.CLOSE : TEXT_CONSTANTS.QUICK_ACTIONS.OPEN}
        aria-expanded={open}
      >
        <Plus className="w-7 h-7" aria-hidden="true" />
      </button>
    </div>
  );
}
