'use client';

import React, { useState } from 'react';
import { Layers, Boxes, Warehouse, FileBarChart, BellRing } from 'lucide-react';
import AmmunitionTemplatesSection from './ammunition/AmmunitionTemplatesSection';
import AmmunitionInventorySection from './ammunition/AmmunitionInventorySection';
import CentralStockSection from './ammunition/CentralStockSection';
import AmmunitionReportsSection from './ammunition/AmmunitionReportsSection';
import AmmunitionRequestsSection from './ammunition/AmmunitionRequestsSection';

type SectionId = 'templates' | 'central' | 'inventory' | 'reports' | 'requests';

const SECTIONS: { id: SectionId; label: string; icon: typeof Layers }[] = [
  { id: 'templates', label: 'תבניות', icon: Layers },
  { id: 'central', label: 'מלאי מרכזי', icon: Warehouse },
  { id: 'inventory', label: 'מלאי', icon: Boxes },
  { id: 'reports', label: 'דיווחים', icon: FileBarChart },
  { id: 'requests', label: 'בקשות', icon: BellRing },
];

export default function AmmunitionTab() {
  const [active, setActive] = useState<SectionId>('templates');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white shadow-sm text-primary-700'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      <div>
        {active === 'templates' && <AmmunitionTemplatesSection />}
        {active === 'central' && <CentralStockSection />}
        {active === 'inventory' && <AmmunitionInventorySection />}
        {active === 'reports' && <AmmunitionReportsSection />}
        {active === 'requests' && <AmmunitionRequestsSection />}
      </div>
    </div>
  );
}
