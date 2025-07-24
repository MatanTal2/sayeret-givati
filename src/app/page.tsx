'use client';

import Image from 'next/image';
// import Link from 'next/link';
import FeatureCard from './components/FeatureCard';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout, showAuthModal, setShowAuthModal } = useAuth();

  const features = [
    {
      title: "ניהול שבצ\"ק",
      description: "מעקב וניהול סטטוס חיילים",
      icon: "✓",
      href: "/status",
      available: true,
      color: "bg-purple-600"
    },
    {
      title: "לוגיסטיקה",
      description: "ניהול ציוד ואספקה",
      icon: "📦",
      href: "/logistics",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "צלם",
      description: "ניהול ציוד צבאי עם מספר סידורי",
      icon: "🔢",
      href: "/equipment", 
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "שיירות",
      description: "תכנון וניהול שיירות",
      icon: "🚗",
      href: "/convoys",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "מחולל שמירות",
      description: "יצירת לוחות שמירה אוטומטיים עם אילוצים",
      icon: "⏰",
      href: "/guard-scheduler",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "מעקב לוחם",
      description: "מעקב כישורים והרשאות חיילים",
      icon: "📊",
      href: "/tracking",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "הגדרות",
      description: "הגדרות מערכת וצוותים",
      icon: "⚙️",
      href: "/admin",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "עזרה",
      description: "מדריך למשתמש ותמיכה",
      icon: "❓",
      href: "/help",
      available: false,
      color: "bg-gray-400"
    }
  ];

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      // If logged in, logout
      await logout();
    } else {
      // If not logged in, open auth modal
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative" dir="rtl">
      {/* Auth Button - Top Right */}
      <button
        onClick={handleAuthClick}
        disabled={isLoading}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white 
                   px-3 md:px-6 py-3 rounded-full shadow-lg transition-all duration-200
                   flex items-center md:gap-2 font-medium text-sm
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                   hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                   transform-gpu will-change-transform"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="hidden md:inline">טוען...</span>
          </>
        ) : isAuthenticated ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:inline">יציאה</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:inline">התחברות</span>
          </>
        )}
      </button>

      {/* User Welcome Message */}
      {isAuthenticated && user && (
        <div className="fixed top-4 left-4 z-50 bg-green-100 text-green-800 
                        px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          שלום, {user.displayName || user.email}
        </div>
      )}

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Image 
          src="/sayeret-givati-logo.png" 
          alt="לוגו סיירת גבעתי" 
          width={400} 
          height={400}
          className="max-w-lg"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-12">
          <div className="flex justify-center mb-6">
            <Image 
              src="/sayeret-givati-logo.png" 
              alt="לוגו סיירת גבעתי" 
              width={120} 
              height={120}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            מסייעת סיירת גבעתי
          </h1>
          <h2 className="text-2xl md:text-3xl font-medium text-purple-600">
            פלגה ד
          </h2>
        </header>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          {/* Contact & Support Section */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-3">צור קשר ותמיכה</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">📧</span>
                <span>אימייל: support@sayeret-givati.com</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">📞</span>
                <span>טלפון: 050-123-4567</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">💬</span>
                <span>WhatsApp: 050-123-4567</span>
              </p>
              <p className="text-xs text-gray-500 mt-3">
                זמינים 24/7 לתמיכה טכנית ועזרה במערכת
              </p>
            </div>
          </div>
          
          {/* Version & Copyright */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm">
              מערכת ניהול מסייעת • גרסה 0.2.0-alpha
            </p>
            <p className="text-xs mt-2">
              © Matan Tal
            </p>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    </div>
  );
}
