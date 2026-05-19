'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Equipment,
  EquipmentType,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentAction,
  ApprovalType
} from '@/types/equipment';
import { EquipmentService } from '@/lib/equipmentService';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { canView } from '@/lib/equipmentPolicy';

export type EquipmentScope = 'self' | 'team' | 'all';

interface UseEquipmentOptions {
  scope?: EquipmentScope;
}

interface UseEquipmentReturn {
  /** Active equipment — excludes RETIRED items (those live on `archivedEquipment`). */
  equipment: Equipment[];
  /**
   * Archived equipment — RETIRED items only. Surfaced via a separate view in
   * the equipment page so users don't see retired rows in their working list
   * but can still walk their history. Bug #25.
   */
  archivedEquipment: Equipment[];
  loading: boolean;
  error: string | null;

  equipmentTypes: EquipmentType[];
  typesLoading: boolean;
  typesError: string | null;

  scope: EquipmentScope;
  setScope: (scope: EquipmentScope) => void;

  refreshEquipment: () => Promise<void>;
  addEquipment: (equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>, signedBy: string) => Promise<boolean>;
  transferEquipment: (equipmentId: string, newHolder: string, newHolderId: string, updatedBy: string, updatedByName: string, newUnit?: string, newLocation?: string, notes?: string) => Promise<boolean>;
  updateEquipmentStatus: (equipmentId: string, newStatus: EquipmentStatus, updatedBy: string, updatedByName: string, notes?: string) => Promise<boolean>;
  updateEquipmentCondition: (equipmentId: string, newCondition: EquipmentCondition, updatedBy: string, updatedByName: string, notes?: string) => Promise<boolean>;
  performDailyCheck: (equipmentId: string, checkedBy: string, checkedByName: string, notes?: string) => Promise<boolean>;

  // Phase 6 lifecycle methods
  reportEquipment: (equipmentId: string, photoUrl: string | null, condition: EquipmentCondition, note?: string) => Promise<boolean>;
  retireEquipment: (equipmentId: string, reason: string) => Promise<{ success: boolean; kind?: 'immediate' | 'request'; error?: string }>;
  createEquipmentBatch: (
    items: Array<Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>>,
    notes?: string
  ) => Promise<boolean>;

  refreshEquipmentTypes: () => Promise<void>;
  addEquipmentType: (equipmentTypeData: Omit<EquipmentType, 'createdAt' | 'updatedAt'>) => Promise<boolean>;

  getEquipmentById: (equipmentId: string) => Equipment | undefined;
  getEquipmentByStatus: (status: EquipmentStatus) => Equipment[];
  getEquipmentByCondition: (condition: EquipmentCondition) => Equipment[];
  getEquipmentByHolder: (holder: string) => Equipment[];
  getEquipmentByTeam: (teamId: string) => Equipment[];
  getEquipmentTypeById: (typeId: string) => EquipmentType | undefined;
}

export function useEquipment(options: UseEquipmentOptions = {}): UseEquipmentReturn {
  const { enhancedUser } = useAuth();
  const [scope, setScope] = useState<EquipmentScope>(options.scope ?? 'self');

  const [rawEquipment, setRawEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  const buildActorIdentity = useCallback((): { uid: string; displayName: string } | null => {
    if (!enhancedUser?.uid || !enhancedUser.userType) return null;
    return {
      uid: enhancedUser.uid,
      displayName:
        enhancedUser.displayName ||
        [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
        enhancedUser.uid,
    };
  }, [enhancedUser]);

  // Force-resync escape hatch. The listener keeps state current; this exists for
  // edge cases (e.g. after a forced auth refresh) where callers want to re-prime.
  const refreshEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await EquipmentService.Items.getEquipmentList();
      if (result.success) {
        setRawEquipment(result.equipments);
      } else {
        setError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
      }
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEquipmentTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const result = await EquipmentService.Types.getEquipmentTypes();
      if (result.success) {
        setEquipmentTypes(result.equipmentTypes);
      } else {
        setTypesError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
      }
    } catch (err) {
      console.error('Error loading equipment types:', err);
      setTypesError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR);
    } finally {
      setTypesLoading(false);
    }
  }, []);

  // Apply visibility + scope first, then partition by lifecycle status.
  // RETIRED items are visible (history matters) but move to a separate
  // archived bucket so they don't clutter the active working list (bug #25).
  const scoped = useMemo(() => {
    if (!enhancedUser) return [];
    const visible = rawEquipment.filter((e) => canView({ user: enhancedUser, equipment: e }));
    if (scope === 'all') return visible;
    if (scope === 'team') {
      return visible.filter((e) => {
        const inTeam =
          !!enhancedUser.teamId &&
          (e.holderTeamId === enhancedUser.teamId || e.signerTeamId === enhancedUser.teamId);
        return inTeam || e.signedById === enhancedUser.uid || e.currentHolderId === enhancedUser.uid;
      });
    }
    return visible.filter(
      (e) => e.signedById === enhancedUser.uid || e.currentHolderId === enhancedUser.uid,
    );
  }, [rawEquipment, enhancedUser, scope]);

  const equipment = useMemo(
    () => scoped.filter((e) => e.status !== EquipmentStatus.RETIRED),
    [scoped],
  );

  const archivedEquipment = useMemo(
    () => scoped.filter((e) => e.status === EquipmentStatus.RETIRED),
    [scoped],
  );

  const addEquipment = useCallback(async (
    equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>,
    signedBy: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.createEquipment(
        equipmentData,
        equipmentData.currentHolder,
        equipmentData.currentHolderId,
        signedBy,
        TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error adding equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const transferEquipment = useCallback(async (
    equipmentId: string,
    newHolder: string,
    newHolderId: string,
    updatedBy: string,
    updatedByName: string,
    newUnit?: string,
    newLocation?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const approvalDetails = {
        approvedBy: updatedBy,
        approvedAt: serverTimestamp() as Timestamp,
        approvalType: ApprovalType.NO_APPROVAL_REQUIRED
      };
      const result = await EquipmentService.Items.transferEquipment(
        equipmentId, newHolder, newHolderId, updatedBy, updatedByName,
        approvalDetails, newUnit, newLocation, notes
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error transferring equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const updateEquipmentStatus = useCallback(async (
    equipmentId: string, newStatus: EquipmentStatus, updatedBy: string, updatedByName: string, notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId, { status: newStatus }, updatedBy, updatedByName, EquipmentAction.STATUS_UPDATE, notes
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error updating status:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const updateEquipmentCondition = useCallback(async (
    equipmentId: string, newCondition: EquipmentCondition, updatedBy: string, updatedByName: string, notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId, { condition: newCondition }, updatedBy, updatedByName, EquipmentAction.CONDITION_UPDATE, notes
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error updating condition:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const performDailyCheck = useCallback(async (
    equipmentId: string, checkedBy: string, checkedByName: string, notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId,
        { lastReportUpdate: serverTimestamp() as Timestamp },
        checkedBy, checkedByName, EquipmentAction.DAILY_CHECK_IN,
        notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.DAILY_CHECK
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error performing daily check:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const reportEquipment = useCallback(async (
    equipmentId: string, photoUrl: string | null, condition: EquipmentCondition, note?: string
  ): Promise<boolean> => {
    const identity = buildActorIdentity();
    if (!identity) { setError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR); return false; }
    try {
      const result = await EquipmentService.Items.reportEquipment(
        equipmentId, photoUrl, identity.displayName, condition, note
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error reporting equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [buildActorIdentity]);

  const retireEquipment = useCallback(async (
    equipmentId: string, reason: string
  ): Promise<{ success: boolean; kind?: 'immediate' | 'request'; error?: string }> => {
    const identity = buildActorIdentity();
    if (!identity) return { success: false, error: TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR };
    try {
      const result = await EquipmentService.Items.retireEquipment(
        equipmentId, identity.displayName, reason
      );
      if (result.success) {
        const kind = (result.data as { kind?: 'immediate' | 'request' } | undefined)?.kind;
        return { success: true, kind };
      }
      return { success: false, error: result.message };
    } catch (err) {
      console.error('Error retiring equipment:', err);
      return { success: false, error: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR };
    }
  }, [buildActorIdentity]);

  const createEquipmentBatch = useCallback(async (
    items: Array<Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>>,
    notes?: string
  ): Promise<boolean> => {
    const identity = buildActorIdentity();
    if (!identity) { setError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR); return false; }
    try {
      const result = await EquipmentService.Items.createEquipmentBatch(
        items, identity.displayName, identity.uid, identity.displayName, identity.uid, notes
      );
      if (result.success) return true;
      setError(result.message);
      return false;
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [buildActorIdentity]);

  const addEquipmentType = useCallback(async (
    equipmentTypeData: Omit<EquipmentType, 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Types.createEquipmentType(equipmentTypeData);
      if (result.success) return true;
      setTypesError(result.message);
      return false;
    } catch (err) {
      console.error('Error adding equipment type:', err);
      setTypesError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, []);

  const getEquipmentById = useCallback((equipmentId: string) => equipment.find((i) => i.id === equipmentId), [equipment]);
  const getEquipmentByStatus = useCallback((status: EquipmentStatus) => equipment.filter((i) => i.status === status), [equipment]);
  const getEquipmentByCondition = useCallback((condition: EquipmentCondition) => equipment.filter((i) => i.condition === condition), [equipment]);
  const getEquipmentByHolder = useCallback((holder: string) => equipment.filter((i) => i.currentHolder === holder), [equipment]);
  const getEquipmentByTeam = useCallback((teamId: string) => equipment.filter((i) => i.holderTeamId === teamId || i.signerTeamId === teamId), [equipment]);
  const getEquipmentTypeById = useCallback((typeId: string) => equipmentTypes.find((t) => t.id === typeId), [equipmentTypes]);

  // Subscribe to live snapshots while authenticated. Listener pattern replaces
  // the previous fetch-on-mount + refetch-after-mutation churn: persistent IndexedDB
  // cache paints initial state synchronously, and server deltas keep it current
  // across tabs and other writers without per-mutation full-collection scans.
  useEffect(() => {
    let unsubEquipment: (() => void) | null = null;
    let unsubTypes: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubEquipment?.(); unsubTypes?.();
      unsubEquipment = null; unsubTypes = null;

      if (!user) {
        setRawEquipment([]);
        setEquipmentTypes([]);
        return;
      }

      setLoading(true);
      setError(null);
      unsubEquipment = EquipmentService.Items.subscribeEquipmentList((result) => {
        if (result.success) {
          setRawEquipment(result.equipments);
        } else {
          setError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
        }
        setLoading(false);
      });

      setTypesLoading(true);
      setTypesError(null);
      unsubTypes = EquipmentService.Types.subscribeEquipmentTypes((result) => {
        if (result.success) {
          setEquipmentTypes(result.equipmentTypes);
        } else {
          setTypesError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
        }
        setTypesLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubEquipment?.();
      unsubTypes?.();
    };
  }, []);

  return {
    equipment,
    archivedEquipment,
    loading,
    error,
    equipmentTypes,
    typesLoading,
    typesError,
    scope,
    setScope,
    refreshEquipment,
    addEquipment,
    transferEquipment,
    updateEquipmentStatus,
    updateEquipmentCondition,
    performDailyCheck,
    reportEquipment,
    retireEquipment,
    createEquipmentBatch,
    refreshEquipmentTypes,
    addEquipmentType,
    getEquipmentById,
    getEquipmentByStatus,
    getEquipmentByCondition,
    getEquipmentByHolder,
    getEquipmentByTeam,
    getEquipmentTypeById,
  };
}
