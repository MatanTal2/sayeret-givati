'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { Button, Card } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useTrainingPlans } from '@/hooks/useTrainingPlans';
import PlanTrainingModal from '@/components/ammunition/PlanTrainingModal';
import PlannedTrainingsTable from '@/components/ammunition/PlannedTrainingsTable';
import AmmunitionBellyView from '@/components/ammunition/AmmunitionBellyView';

const TT = FEATURES.AMMUNITION.TRAINING;

function isTeamLeaderOrAbove(userType: UserType | null | undefined): boolean {
  if (!userType) return false;
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER ||
    userType === UserType.TEAM_LEADER
  );
}

export default function AmmunitionTrainingPage() {
  const { enhancedUser } = useAuth();
  const {
    plans,
    isLoading,
    error,
    create,
    approve,
    reject,
    cancel,
    complete,
    requestRestock,
  } = useTrainingPlans();
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const canPlan = isTeamLeaderOrAbove(enhancedUser?.userType ?? undefined);

  return (
    <AuthGuard>
      <AppShell title={TT.PAGE_TITLE} subtitle={TT.PAGE_SUBTITLE}>
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          {canPlan && (
            <div className="flex items-center justify-end">
              <Button onClick={() => setPlanModalOpen(true)}>
                <Plus className="w-4 h-4 ms-1" />
                {TT.PLAN_BUTTON}
              </Button>
            </div>
          )}

          <Card padding="lg">
            <AmmunitionBellyView plans={plans} onSubmitRestock={requestRestock} />
          </Card>

          <Card padding="lg">
            <PlannedTrainingsTable
              plans={plans}
              isLoading={isLoading}
              onApprove={approve}
              onReject={reject}
              onCancel={cancel}
              onComplete={complete}
            />
          </Card>
        </div>

        {planModalOpen && (
          <PlanTrainingModal onClose={() => setPlanModalOpen(false)} onSubmit={create} />
        )}
      </AppShell>
    </AuthGuard>
  );
}
