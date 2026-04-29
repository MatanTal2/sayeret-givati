/**
 * Template Request Service — client facade.
 * Reads via client SDK; writes via /api/equipment-templates/{propose,approve,reject}.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  EquipmentType,
  TemplateStatus,
} from '@/types/equipment';

interface ProposeTemplateArgs {
  proposerUserName: string;
  name: string;
  category: string;
  subcategory: string;
  requiresSerialNumber: boolean;
  requiresDailyStatusCheck: boolean;
  defaultCatalogNumber?: string;
  description?: string;
  notes?: string;
  draftPayload?: {
    serialNumber?: string;
    photoUrl?: string;
    catalogNumber?: string;
    notes?: string;
  };
}

export async function proposeTemplate(
  args: ProposeTemplateArgs
): Promise<{ templateId: string; draftId?: string }> {
  const response = await apiFetch('/api/equipment-templates/propose', {
    method: 'POST',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to propose template');
  return { templateId: result.templateId, draftId: result.draftId };
}

interface ApproveTemplateArgs {
  templateId: string;
  approverUserName: string;
  edits?: Partial<{
    name: string;
    category: string;
    subcategory: string;
    requiresSerialNumber: boolean;
    requiresDailyStatusCheck: boolean;
    defaultCatalogNumber: string;
    description: string;
    notes: string;
  }>;
}

export async function approveTemplateRequest(args: ApproveTemplateArgs): Promise<void> {
  const response = await apiFetch('/api/equipment-templates/approve', {
    method: 'POST',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to approve template');
}

interface RejectTemplateArgs {
  templateId: string;
  rejectorUserName: string;
  reason?: string;
}

export async function rejectTemplateRequest(args: RejectTemplateArgs): Promise<void> {
  const response = await apiFetch('/api/equipment-templates/reject', {
    method: 'POST',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to reject template');
}

export async function getTemplatesByStatus(
  status: TemplateStatus
): Promise<EquipmentType[]> {
  const q = query(
    collection(db, COLLECTIONS.EQUIPMENT_TEMPLATES),
    where('status', '==', status),
    orderBy('proposedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EquipmentType));
}

export async function getMyPendingTemplateRequests(
  userId: string
): Promise<EquipmentType[]> {
  const q = query(
    collection(db, COLLECTIONS.EQUIPMENT_TEMPLATES),
    where('proposedByUserId', '==', userId),
    where('status', 'in', [
      TemplateStatus.PROPOSED,
      TemplateStatus.PENDING_REQUEST,
    ]),
    orderBy('proposedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EquipmentType));
}
