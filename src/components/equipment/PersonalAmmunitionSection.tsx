'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FEATURES } from '@/constants/text';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import AmmunitionInventoryView from '@/components/ammunition/AmmunitionInventoryView';
import type { EnhancedAuthUser } from '@/types/user';

const T = FEATURES.AMMUNITION;

export default function PersonalAmmunitionSection({ user }: { user: EnhancedAuthUser }) {
  const { templates } = useAmmunitionTemplates();
  const { stock, items } = useAmmunitionInventory();

  const userAllocatedTemplateIds = useMemo(
    () =>
      new Set(
        templates
          .filter((t) => t.allocation === 'USER' || t.allocation === 'BOTH')
          .map((t) => t.id)
      ),
    [templates]
  );

  const personalStock = useMemo(
    () =>
      stock.filter(
        (s) =>
          s.holderType === 'USER' &&
          s.holderId === user.uid &&
          userAllocatedTemplateIds.has(s.templateId)
      ),
    [stock, user.uid, userAllocatedTemplateIds]
  );

  const personalItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.currentHolderType === 'USER' &&
          i.currentHolderId === user.uid &&
          userAllocatedTemplateIds.has(i.templateId)
      ),
    [items, user.uid, userAllocatedTemplateIds]
  );

  if (personalStock.length === 0 && personalItems.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-neutral-900">{T.SECTION_PERSONAL}</h3>
        <Link
          href="/ammunition"
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          {T.TITLE}
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
      <AmmunitionInventoryView
        templates={templates}
        stock={personalStock}
        items={personalItems}
      />
    </section>
  );
}
