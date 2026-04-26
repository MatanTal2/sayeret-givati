'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { BellRing } from 'lucide-react';

export default function AmmunitionRequestsSection() {
  return (
    <Card padding="lg" className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
        <BellRing className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-700 mb-2">בקשות דיווח — בקרוב</h3>
      <p className="text-neutral-500 text-sm">
        ייוותר זמין בשלב הבא — יצירה ומעקב אחר בקשות דיווח תחמושת ממוקדות.
      </p>
    </Card>
  );
}
