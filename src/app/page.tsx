'use client';

import Image from 'next/image';
// import Link from 'next/link';
import FeatureCard from './components/FeatureCard';
import Header from './components/Header';

import { getFeatureRoutes } from '@/utils/navigationUtils';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function HomePage() {

  // Use centralized feature routes configuration
  const features = getFeatureRoutes();

  return (
    <div className="min-h-screen bg-page relative" dir="rtl">
      {/* Header with Auth Button */}
      <Header 
        title="מערכת ניהול - מסייעת סיירת גבעתי"
        subtitle="פלטפורמה מרכזית לניהול פעילויות הסיירת"
        showAuth={true}
        enableWaveEffect={true}
      />

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Image 
          src="/sayeret-givati-logo.png" 
          alt="לוגו סיירת גבעתי" 
          width={520} 
          height={520}
          priority
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Features Introduction */}
          <div className="text-center mb-12">
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
                <div key={index}>
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

    </div>
  );
}
