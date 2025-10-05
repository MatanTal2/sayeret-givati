/**
 * Shared HamburgerMenu component
 * Reusable hamburger menu with slide-in sidebar
 */
'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
}

export interface HamburgerMenuProps {
  menuItems: MenuItem[];
  onNavigate?: (href: string) => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export default function HamburgerMenu({
  menuItems,
  onNavigate,
  className,
  buttonClassName,
  menuClassName
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    console.log('Hamburger clicked, current state:', isOpen);
    const newState = !isOpen;
    console.log('Setting new state:', newState);
    setIsOpen(newState);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    console.log('Menu closing');
    setIsOpen(false);
  }, []);

  const handleMenuItemClick = useCallback((href: string) => {
    console.log('Menu item clicked:', href);
    handleClose();
    onNavigate?.(href);
  }, [handleClose, onNavigate]);

  const handleBackdropClick = useCallback(() => {
    console.log('Backdrop clicked');
    handleClose();
  }, [handleClose]);

  return (
    <div className={cn('relative z-50', className)}>
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative z-50 p-2 rounded-lg transition-all duration-200 hover:bg-primary-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isOpen ? 'bg-primary-50 text-primary-600' : 'text-neutral-600',
          buttonClassName
        )}
        aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
        aria-expanded={isOpen}
        style={{ pointerEvents: 'auto' }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Side Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-[9998]"
            />
            
            {/* Side Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={cn(
                'fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-[9999]',
                menuClassName
              )}
            >
              {/* Menu Header */}
              <div className="flex justify-between items-center p-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">תפריט</h2>
                <button
                  onClick={handleClose}
                  className="p-2 text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
                  aria-label="סגור תפריט"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Menu Items */}
              <div className="p-4">
                <nav className="space-y-2">
                  {menuItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => handleMenuItemClick(item.href)}
                      className="flex items-center gap-3 px-4 py-3 text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      {item.icon && (
                        <span className="text-lg">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
