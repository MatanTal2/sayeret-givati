module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      // Custom dark mode colors that maintain accessibility
      colors: {
        // Dark theme backgrounds
        'dark-bg': {
          primary: '#0f172a',   // Main background (slate-900)
          secondary: '#1e293b', // Card/panel background (slate-800)
          tertiary: '#334155',  // Input/border background (slate-600)
        },
        // Dark theme text colors
        'dark-text': {
          primary: '#f1f5f9',   // Main text (slate-100)
          secondary: '#cbd5e1', // Secondary text (slate-300)
          tertiary: '#94a3b8',  // Muted text (slate-400)
        },
        // Dark theme borders
        'dark-border': {
          primary: '#475569',   // Main borders (slate-600)
          secondary: '#64748b', // Secondary borders (slate-500)
        }
      }
    },
  },
  plugins: [],
}
