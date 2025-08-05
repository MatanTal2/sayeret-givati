'use client';

import Link from 'next/link';
import { TEXT_CONSTANTS } from '@/constants/text';

interface ComingSoonProps {
  title: string;
  description?: string;
  expectedDate?: string;
  showBackButton?: boolean;
}

/**
 * ComingSoon component for features that are under development
 */
export default function ComingSoon({ 
  title, 
  description, 
  expectedDate,
  showBackButton = true 
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full">
        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Construction Icon */}
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
            🚧 {TEXT_CONSTANTS.STATUS.COMING_SOON}
          </div>

          {/* Description */}
          {description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {description}
            </p>
          )}

          {/* Development Status */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              סטטוס פיתוח
            </h3>
            <p className="text-gray-600 mb-4">
              תכונה זו נמצאת כרגע בפיתוח פעיל ותהיה זמינה בקרוב.
            </p>
            
            {expectedDate && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>זמינות צפויה: {expectedDate}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showBackButton && (
              <Link 
                href="/"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 inline-block"
              >
                חזרה לדף הבית
              </Link>
            )}
            
            <div className="text-sm text-gray-500">
              לעדכונים על התקדמות הפיתוח, צור קשר עם צוות הפיתוח
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}