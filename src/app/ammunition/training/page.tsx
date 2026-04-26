'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { Card } from '@/components/ui';
import { FEATURES } from '@/constants/text';

const T = FEATURES.AMMUNITION;

export default function AmmunitionTrainingPage() {
  return (
    <AuthGuard>
      <AppShell title={`🎯 ${T.TITLE} · אימונים`} subtitle="תכנון אימוני ירי וניהול תקציב תחמושת">
        <div className="max-w-3xl mx-auto w-full">
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">בקרוב</h2>
            <p className="text-sm text-neutral-600 mb-6 max-w-lg mx-auto">
              המודול הזה יאפשר לתכנן אימוני ירי, להגדיר תקציב תחמושת לכל אימון,
              להקצות פריטים לחיילים ולעקוב אחרי שימוש בפועל אל מול התכנון.
              הפיתוח יחל לאחר ייצוב המודול הנוכחי.
            </p>
            <Link
              href="/ammunition"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              חזרה לתחמושת
            </Link>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
