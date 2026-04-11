/**
 * Design tokens — TypeScript mirror of tailwind.config.js extended values.
 *
 * Use this file whenever you need a token value in a JS/TS context:
 * Framer Motion values, dynamic style calculations, canvas, tests.
 *
 * For className-based styling always use Tailwind token keys (e.g. `bg-primary-500`).
 * Never duplicate raw hex values outside this file.
 */

export const COLORS = {
  primary: {
    50: '#f3f0ff',
    100: '#e9e5ff',
    200: '#d6cfff',
    300: '#b8a8ff',
    400: '#9575ff',
    500: '#7c3aed',
    600: '#6d28d9',
    700: '#5b21b6',
    800: '#4c1d95',
    900: '#3c1a78',
    950: '#2a1065',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const;

export const SHADOWS = {
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  strong: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  primary: '0 4px 14px 0 rgba(124, 58, 237, 0.15)',
  primaryLg: '0 10px 25px -3px rgba(124, 58, 237, 0.1), 0 4px 6px -2px rgba(124, 58, 237, 0.05)',
} as const;

export const BORDER_RADIUS = {
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
} as const;

export const SPACING = {
  18: '4.5rem',
  88: '22rem',
  128: '32rem',
} as const;

export const ANIMATIONS = {
  fadeIn: { duration: '0.3s', easing: 'ease-out' },
  modalEnter: { duration: '0.2s', easing: 'ease-out' },
  backdropEnter: { duration: '0.2s', easing: 'ease-out' },
  shimmer: { duration: '2s', easing: 'linear' },
  pulseSlow: { duration: '3s', easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
} as const;
