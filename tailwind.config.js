module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Brand Colors
      colors: {
        // Primary brand color (Purple)
        primary: {
          50: '#f3f0ff',
          100: '#e9e5ff',
          200: '#d6cfff',
          300: '#b8a8ff',
          400: '#9575ff',
          500: '#7c3aed', // Main brand color
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1a78',
          950: '#2a1065',
        },
        // Secondary colors
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
        // Success states
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
        // Warning states
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
        // Error/Danger states
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
        // Info states
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
        // Neutral grays (enhanced)
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
      },
      // Typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
        '8xl': ['6rem', { lineHeight: '1' }],           // 96px
        '9xl': ['8rem', { lineHeight: '1' }],           // 128px
      },
      // Custom spacing (if needed beyond defaults)
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      // Box shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'primary': '0 4px 14px 0 rgba(124, 58, 237, 0.15)',
        'primary-lg': '0 10px 25px -3px rgba(124, 58, 237, 0.1), 0 4px 6px -2px rgba(124, 58, 237, 0.05)',
      },
      // Border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      // Animation durations
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'modal-enter': 'modalEnter 0.2s ease-out forwards',
        'backdrop-enter': 'backdropEnter 0.2s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-slide': 'waveSlide 2s ease-in-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      // Custom keyframes
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        modalEnter: {
          'from': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(-10px)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)' 
          },
        },
        backdropEnter: {
          'from': { 
            opacity: '0', 
            backdropFilter: 'blur(0px)' 
          },
          'to': { 
            opacity: '1', 
            backdropFilter: 'blur(4px)' 
          },
        },
        waveSlide: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
  plugins: [],
}
