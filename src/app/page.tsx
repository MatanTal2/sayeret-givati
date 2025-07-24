'use client';

import Image from 'next/image';
// import Link from 'next/link';
import FeatureCard from './components/FeatureCard';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout, showAuthModal, setShowAuthModal } = useAuth();

  const features = [
    {
      title: TEXT_CONSTANTS.FEATURES.SOLDIER_MANAGEMENT.TITLE,
      description: TEXT_CONSTANTS.FEATURES.SOLDIER_MANAGEMENT.DESCRIPTION,
      icon: "✓",
      href: "/status",
      available: true,
      color: "bg-purple-600"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.TITLE,
      description: TEXT_CONSTANTS.FEATURES.SOLDIER_TRACKING.DESCRIPTION,
      icon: "📊",
      href: "/tracking",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.LOGISTICS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.LOGISTICS.DESCRIPTION,
      icon: "📦",
      href: "/logistics",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TITLE,
      description: TEXT_CONSTANTS.FEATURES.EQUIPMENT.DESCRIPTION,
      icon: "🔢",
      href: "/equipment", 
      available: false,
      color: "bg-gray-400"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.CONVOYS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.CONVOYS.DESCRIPTION,
      icon: "🚗",
      href: "/convoys",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.TITLE,
      description: TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.DESCRIPTION,
      icon: "⏰",
      href: "/guard-scheduler",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.TITLE,
      description: TEXT_CONSTANTS.FEATURES.ADDITIONAL_TOOLS.DESCRIPTION,
      icon: "🔧",
      href: "/tools",
      available: false,
      color: "bg-gray-400"
    }
  ];

  // Show all features together without separation

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
        className="absolute top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white 
                   px-3 md:px-6 py-3 rounded-full shadow-lg transition-all duration-200
                   flex items-center md:gap-2 font-medium text-sm
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                   hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="hidden md:inline">{TEXT_CONSTANTS.BUTTONS.LOADING}</span>
          </>
        ) : isAuthenticated ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden md:inline">{TEXT_CONSTANTS.BUTTONS.LOGOUT}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 01 3 3v1" />
            </svg>
            <span className="hidden md:inline">{TEXT_CONSTANTS.BUTTONS.LOGIN}</span>
          </>
        )}
      </button>

      {/* User Welcome Message */}
      {isAuthenticated && user && (
        <div className="absolute top-4 left-4 z-50 bg-green-100 text-green-800 
                        px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          {TEXT_CONSTANTS.AUTH.WELCOME_MESSAGE}, {user.displayName || user.email}
        </div>
      )}

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Image 
          src="/sayeret-givati-logo.png" 
          alt="לוגו סיירת גבעתי" 
          width={400} 
          height={400}
          priority
          className="object-contain"
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex flex-col items-center justify-center mb-6">
              <Image 
                src="/sayeret-givati-logo.png" 
                alt="לוגו סיירת גבעתי" 
                width={120} 
                height={120}
                priority
                className="object-contain mb-6"
              />
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  מערכת ניהול - מסייעת סיירת גבעתי
                </h1>
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {TEXT_CONSTANTS.APP_SUBTITLE}
            </p>
          </div>

          {/* All Features */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              {TEXT_CONSTANTS.FEATURES.SECTION_TITLE}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className={`fade-in stagger-${index + 1}`}>
                  <FeatureCard
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    href={feature.href}
                    available={feature.available}
                    color={feature.color}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto mt-16 pt-8 border-t border-gray-200 text-center text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">{TEXT_CONSTANTS.FOOTER.QUICK_LINKS}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/status" className="hover:text-purple-600 transition-colors">{TEXT_CONSTANTS.FEATURES.SOLDIER_MANAGEMENT.TITLE}</a></li>
                <li><a href="/admin" className="hover:text-purple-600 transition-colors">{TEXT_CONSTANTS.FOOTER.ADMIN_INTERFACE}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{TEXT_CONSTANTS.FOOTER.SUPPORT}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="hover:text-purple-600 transition-colors">{TEXT_CONSTANTS.FOOTER.USER_GUIDE}</a></li>
                <li><a href="/contact" className="hover:text-purple-600 transition-colors">{TEXT_CONSTANTS.FOOTER.CONTACT}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{TEXT_CONSTANTS.FOOTER.INFO}</h4>
              <ul className="space-y-2 text-sm">
                <li><span>{TEXT_CONSTANTS.VERSION}</span></li>
                <li><span>{TEXT_CONSTANTS.LAST_UPDATED}</span></li>
              </ul>
            </div>
          </div>
          
          {/* Version & Copyright */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm">
              {TEXT_CONSTANTS.COMPANY_NAME} • {TEXT_CONSTANTS.VERSION}
            </p>
            <p className="text-xs mt-2">
              © Matan Tal
            </p>
          </div>
        </footer>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}
