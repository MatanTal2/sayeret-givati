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

export default function TeamAmmunitionSection({ user }: { user: EnhancedAuthUser }) {
  const { templates } = useAmmunitionTemplates();
  const { stock, items } = useAmmunitionInventory();

  if (!user.teamId) return null;

  return (
    <TeamAmmoBody user={user} templates={templates} stock={stock} items={items} />
  );
}

function TeamAmmoBody({
  user,
  templates,
  stock,
  items,
}: {
  user: EnhancedAuthUser;
  templates: ReturnType<typeof useAmmunitionTemplates>['templates'];
  stock: ReturnType<typeof useAmmunitionInventory>['stock'];
  items: ReturnType<typeof useAmmunitionInventory>['items'];
}) {
  const teamId = user.teamId!;

  const teamStock = useMemo(
    () => stock.filter((s) => s.holderType === 'TEAM' && s.holderId === teamId),
    [stock, teamId]
  );

  const teamItems = useMemo(
    () => items.filter((i) => i.currentHolderType === 'TEAM' && i.currentHolderId === teamId),
    [items, teamId]
  );

  if (teamStock.length === 0 && teamItems.length === 0) {
    return (
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-neutral-900">{T.AMMO_TEAM_HEADER}</h3>
          <Link
            href="/ammunition"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            {T.TITLE}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-sm text-neutral-500 text-center py-6 border border-dashed border-neutral-200 rounded-lg">
          {T.AMMO_TEAM_EMPTY}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-neutral-900">{T.AMMO_TEAM_HEADER}</h3>
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
        stock={teamStock}
        items={teamItems}
      />
    </section>
  );
}
