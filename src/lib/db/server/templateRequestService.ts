/**
 * Server-side Template Request Service (firebase-admin).
 * Handles propose / approve / reject flows for equipmentTemplates that are
 * NOT canonical (i.e. status is PROPOSED or PENDING_REQUEST). Canonical-
 * template creation stays in equipmentTemplatesService.
 */
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { FieldValue } from 'firebase-admin/firestore';
import { serverCreateActionLog } from './actionsLogService';
import {
  serverCreateNotification,
  serverCreateBatchNotifications,
} from './notificationService';
import {
  ActionType,
  TemplateStatus,
} from '@/types/equipment';
import { UserType } from '@/types/user';
import { serverPromoteDraftsForTemplate } from './equipmentDraftService';

interface ProposeTemplateInput {
  proposerUserId: string;
  proposerUserName: string;
  proposerUserType: UserType;
  name: string;
  category: string;
  subcategory: string;
  requiresSerialNumber: boolean;
  requiresDailyStatusCheck: boolean;
  defaultCatalogNumber?: string;
  description?: string;
  notes?: string;
  // When a regular user submits via "not in list" flow, a draft is created
  // alongside the template. The draft holds the already-captured S/N + photo.
  draftPayload?: {
    serialNumber?: string;
    photoUrl?: string;
    catalogNumber?: string;
    notes?: string;
  };
}

export async function serverProposeTemplate(
  input: ProposeTemplateInput
): Promise<{ templateId: string; draftId?: string; status: TemplateStatus }> {
  const db = getAdminDb();

  // Admins / system managers are themselves the approval authority — make their
  // submission canonical immediately so they don't get a misleading "wait for
  // approval" message and a doc nobody else can review.
  const isAutoCanonical =
    input.proposerUserType === UserType.ADMIN ||
    input.proposerUserType === UserType.SYSTEM_MANAGER;
  const isRegularUser = input.proposerUserType === UserType.USER;
  const status: TemplateStatus = isAutoCanonical
    ? TemplateStatus.CANONICAL
    : isRegularUser
      ? TemplateStatus.PENDING_REQUEST
      : TemplateStatus.PROPOSED;

  const templateRef = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc();
  const data: Record<string, unknown> = {
    id: templateRef.id,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory,
    requiresSerialNumber: input.requiresSerialNumber,
    requiresDailyStatusCheck: input.requiresDailyStatusCheck,
    isActive: isAutoCanonical,
    templateCreatorId: input.proposerUserId,
    status,
    proposedByUserId: input.proposerUserId,
    proposedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (isAutoCanonical) {
    data.reviewedByUserId = input.proposerUserId;
    data.reviewedAt = FieldValue.serverTimestamp();
  }
  if (input.defaultCatalogNumber) data.defaultCatalogNumber = input.defaultCatalogNumber;
  if (input.description) data.description = input.description;
  if (input.notes) data.notes = input.notes;

  let draftId: string | undefined;

  if (input.draftPayload) {
    const draftRef = db.collection(COLLECTIONS.EQUIPMENT_DRAFTS).doc();
    const draftData: Record<string, unknown> = {
      userId: input.proposerUserId,
      templateRequestId: templateRef.id,
      status: 'awaiting_template',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (input.draftPayload.serialNumber) draftData.serialNumber = input.draftPayload.serialNumber;
    if (input.draftPayload.photoUrl) draftData.photoUrl = input.draftPayload.photoUrl;
    if (input.draftPayload.catalogNumber) draftData.catalogNumber = input.draftPayload.catalogNumber;
    if (input.draftPayload.notes) draftData.notes = input.draftPayload.notes;

    const batch = db.batch();
    batch.set(templateRef, data);
    batch.set(draftRef, draftData);
    await batch.commit();
    draftId = draftRef.id;
  } else {
    await templateRef.set(data);
  }

  // Post-write side effects (non-critical)
  try {
    const actionType = isAutoCanonical
      ? ActionType.TEMPLATE_APPROVED
      : isRegularUser
        ? ActionType.TEMPLATE_REQUESTED
        : ActionType.TEMPLATE_PROPOSED;
    await serverCreateActionLog({
      actionType,
      equipmentId: '',
      equipmentDocId: templateRef.id,
      equipmentName: input.name,
      actorId: input.proposerUserId,
      actorName: input.proposerUserName,
    });

    // Auto-canonical submissions don't need reviewer notifications — there's
    // nothing to review.
    if (!isAutoCanonical) {
      const db2 = getAdminDb();
      const managersSnapshot = await db2
        .collection(COLLECTIONS.USERS)
        .where('userType', 'in', [UserType.ADMIN, UserType.SYSTEM_MANAGER, UserType.MANAGER])
        .get();

      if (!managersSnapshot.empty) {
        const notificationType = isRegularUser
          ? 'new_template_request_for_review'
          : 'template_proposed_for_review';
        const title = isRegularUser
          ? 'בקשת תבנית חדשה מחייל'
          : 'הצעת תבנית ממפקד צוות';
        const message = `${input.proposerUserName} ביקש תבנית חדשה: ${input.name}`;

        await serverCreateBatchNotifications(
          managersSnapshot.docs.map((d) => ({
            userId: d.id,
            type: notificationType,
            title,
            message,
            relatedEquipmentDocId: templateRef.id,
            equipmentName: input.name,
          }))
        );
      }
    }
  } catch (e) {
    console.error('[Server] Template propose side effects failed:', e);
  }

  return { templateId: templateRef.id, draftId, status };
}

interface ApproveTemplateInput {
  templateId: string;
  approverUserId: string;
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

export async function serverApproveTemplateRequest(
  input: ApproveTemplateInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(input.templateId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('Template not found');
  const template = snap.data()!;

  if (template.status !== TemplateStatus.PROPOSED && template.status !== TemplateStatus.PENDING_REQUEST) {
    throw new Error('Template is not in a pending state');
  }

  const updates: Record<string, unknown> = {
    status: TemplateStatus.CANONICAL,
    isActive: true,
    reviewedByUserId: input.approverUserId,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.edits) {
    for (const [k, v] of Object.entries(input.edits)) {
      if (v !== undefined) updates[k] = v;
    }
  }

  await ref.update(updates);

  // Promote any drafts tied to this template so users can resume sign-up.
  let draftOwnerIds: string[] = [];
  try {
    draftOwnerIds = await serverPromoteDraftsForTemplate(input.templateId);
  } catch (e) {
    console.error('[Server] Draft promotion failed:', e);
  }

  // Post-approval side effects
  try {
    await serverCreateActionLog({
      actionType: ActionType.TEMPLATE_APPROVED,
      equipmentId: '',
      equipmentDocId: input.templateId,
      equipmentName: (input.edits?.name ?? template.name) as string,
      actorId: input.approverUserId,
      actorName: input.approverUserName,
      targetId: template.proposedByUserId,
    });

    // Notify the proposer. For user-requested templates there may be a draft;
    // the notification message points them back to the wizard.
    if (template.proposedByUserId) {
      const isUserRequest = template.status === TemplateStatus.PENDING_REQUEST;
      await serverCreateNotification({
        userId: template.proposedByUserId,
        type: 'template_request_approved',
        title: 'תבנית אושרה',
        message: isUserRequest
          ? `התבנית "${template.name}" אושרה. ניתן להשלים את ההרשמה לציוד.`
          : `הצעתך לתבנית "${template.name}" אושרה`,
        relatedEquipmentDocId: input.templateId,
        equipmentName: template.name,
      });
    }

    // Additional users who have drafts tied to this template (edge case: multiple users drafted the same template)
    const extraIds = draftOwnerIds.filter((id) => id !== template.proposedByUserId);
    if (extraIds.length > 0) {
      await serverCreateBatchNotifications(
        extraIds.map((uid) => ({
          userId: uid,
          type: 'template_request_approved',
          title: 'תבנית אושרה',
          message: `התבנית "${template.name}" אושרה. ניתן להשלים את ההרשמה לציוד.`,
          relatedEquipmentDocId: input.templateId,
          equipmentName: template.name,
        }))
      );
    }
  } catch (e) {
    console.error('[Server] Template approve side effects failed:', e);
  }
}

interface RejectTemplateInput {
  templateId: string;
  rejectorUserId: string;
  rejectorUserName: string;
  reason?: string;
}

export async function serverRejectTemplateRequest(
  input: RejectTemplateInput
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.EQUIPMENT_TEMPLATES).doc(input.templateId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error('Template not found');
  const template = snap.data()!;

  if (template.status !== TemplateStatus.PROPOSED && template.status !== TemplateStatus.PENDING_REQUEST) {
    throw new Error('Template is not in a pending state');
  }

  await ref.update({
    status: TemplateStatus.REJECTED,
    isActive: false,
    reviewedByUserId: input.rejectorUserId,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(input.reason ? { rejectedReason: input.reason } : {}),
  });

  try {
    await serverCreateActionLog({
      actionType: ActionType.TEMPLATE_REJECTED,
      equipmentId: '',
      equipmentDocId: input.templateId,
      equipmentName: template.name,
      actorId: input.rejectorUserId,
      actorName: input.rejectorUserName,
      targetId: template.proposedByUserId,
      ...(input.reason ? { note: input.reason } : {}),
    });

    if (template.proposedByUserId) {
      await serverCreateNotification({
        userId: template.proposedByUserId,
        type: 'template_request_rejected',
        title: 'בקשת תבנית נדחתה',
        message: `הבקשה לתבנית "${template.name}" נדחתה${input.reason ? ': ' + input.reason : ''}`,
        relatedEquipmentDocId: input.templateId,
        equipmentName: template.name,
      });
    }
  } catch (e) {
    console.error('[Server] Template reject side effects failed:', e);
  }
}
