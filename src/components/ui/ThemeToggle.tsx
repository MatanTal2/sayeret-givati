'use client';

import React from 'react';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'select' | 'buttons' | 'switch';
  showLabel?: boolean;
  className?: string;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'light', label: 'בהיר', icon: Sun },
  { value: 'dark', label: 'כהה', icon: Moon },
  { value: 'system', label: 'מערכת', icon: Monitor },
];

export default function ThemeToggle({ 
  variant = 'select', 
  showLabel = true,
  className = '' 
}: ThemeToggleProps): JSX.Element {
  const { theme, setTheme } = useTheme();

  if (variant === 'select') {
    return (
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className={`px-3 py-2 border border-secondary rounded-lg text-sm bg-card text-primary transition-colors focus-ring ${className}`}
        aria-label="בחר ערכת נושא"
      >
        {THEME_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
              theme === value
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                : 'bg-card text-secondary hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
            }`}
            aria-label={`${label} נושא`}
          >
            <Icon className="w-4 h-4" />
            {showLabel && label}
          </button>
        ))}
      </div>
    );
  }

  // Switch variant - toggle between light/dark only
  if (variant === 'switch') {
    const isDark = theme === 'dark';
    
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring ${
          isDark ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
        } ${className}`}
        aria-label={`החלף לנושא ${isDark ? 'בהיר' : 'כהה'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isDark ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">
          {isDark ? 'נושא כהה פעיל' : 'נושא בהיר פעיל'}
        </span>
      </button>
    );
  }

  return null;
}