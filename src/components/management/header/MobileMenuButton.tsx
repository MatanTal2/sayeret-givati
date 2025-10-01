/**
 * Mobile menu button for toggling sidebar
 */
import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <button
      className={cn(
        'lg:hidden p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 hover:text-purple-600',
        isOpen ? 'bg-purple-50 text-purple-600' : 'text-gray-600'
      )}
      onClick={onClick}
      aria-label="פתח תפריט ניהול"
      aria-expanded={isOpen}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

