/**
 * Single source of truth for equipment-action permissions.
 *
 * Every UI action (button visibility, menu item enablement) and every server
 * endpoint routes through the functions here. If the matrix changes, only
 * this file + its test should change.
 *
 * Role abbreviations used below:
 *   USER    — regular soldier
 *   TL      — team leader
 *   MGR     — manager (MANAGER / SYSTEM_MANAGER)
 *   ADMIN   — admin
 *
 * Self/team semantics:
 *   isSelf      — user is the signer OR the current holder of the item
 *   isInTeam    — user's teamId equals holder's or signer's teamId
 *   isAll       — manager/admin level; item scope is irrelevant
 */

import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { UserType } from '@/types/user';

export interface EquipmentActionContext {
  user: EnhancedAuthUser;
  equipment: Equipment;
}

// ---------- Role classifiers ----------

export function isAdmin(user: EnhancedAuthUser): boolean {
  return user.userType === UserType.ADMIN;
}

export function isManagerOrAbove(user: EnhancedAuthUser): boolean {
  return (
    user.userType === UserType.ADMIN ||
    user.userType === UserType.SYSTEM_MANAGER ||
    user.userType === UserType.MANAGER
  );
}

export function isTeamLeaderOrAbove(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user) || user.userType === UserType.TEAM_LEADER;
}

// ---------- Scope helpers ----------

export function isSigner(ctx: EquipmentActionContext): boolean {
  return !!ctx.user.uid && ctx.user.uid === ctx.equipment.signedById;
}

export function isHolder(ctx: EquipmentActionContext): boolean {
  return !!ctx.user.uid && ctx.user.uid === ctx.equipment.currentHolderId;
}

export function isSelf(ctx: EquipmentActionContext): boolean {
  return isSigner(ctx) || isHolder(ctx);
}

export function isInTeam(ctx: EquipmentActionContext): boolean {
  if (!ctx.user.teamId) return false;
  return (
    ctx.user.teamId === ctx.equipment.holderTeamId ||
    ctx.user.teamId === ctx.equipment.signerTeamId
  );
}

// ---------- Visibility ----------

/**
 * Can the user see this item at all?
 *  - Manager+ sees everything.
 *  - TL + user see items in their team or their own (signer or holder).
 */
export function canView(ctx: EquipmentActionContext): boolean {
  if (isManagerOrAbove(ctx.user)) return true;
  if (isSelf(ctx)) return true;
  if (isInTeam(ctx)) return true;
  return false;
}

// ---------- Sign-up ----------

/** Anyone authenticated can sign up new equipment (subject to template availability). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAddEquipment(_user: EnhancedAuthUser): boolean {
  return true;
}

// ---------- Report (possession check) ----------

/**
 * Who can submit a report on this item?
 *  - The signer or holder always.
 *  - Manager+ on any item.
 *  - TL on items in their team.
 */
export function canReport(ctx: EquipmentActionContext): boolean {
  if (isManagerOrAbove(ctx.user)) return true;
  if (isSelf(ctx)) return true;
  if (user_isTeamLeader(ctx.user) && isInTeam(ctx)) return true;
  return false;
}

/** Only privileged users can skip the photo during report. */
export function canReportWithoutPhoto(user: EnhancedAuthUser): boolean {
  return isTeamLeaderOrAbove(user);
}

// ---------- Retirement ----------

/**
 * Only the signer may initiate retirement of an item. If signer also holds it,
 * the retire is immediate. Otherwise a RetirementRequest is created and the
 * current holder must approve.
 *
 * Non-signer holders cannot retire.
 */
export function canRetire(ctx: EquipmentActionContext): boolean {
  return isSigner(ctx);
}

/** Immediate retirement requires signer AND holder to be the same user. */
export function canRetireImmediately(ctx: EquipmentActionContext): boolean {
  return isSigner(ctx) && isHolder(ctx);
}

// ---------- Transfer ----------

/**
 * User-initiated transfer. Only the current holder can request a transfer —
 * the signer-but-not-holder case goes through a retirement request instead,
 * because transfer would imply "give it to someone else to hold" which the
 * signer doesn't physically control.
 *
 * Force-transfer (manager path) uses canForceTransfer, not this.
 */
export function canTransfer(ctx: EquipmentActionContext): boolean {
  return isHolder(ctx);
}

/**
 * Force-transfer bypasses approval. Only TL within team, or manager+ anywhere.
 */
export function canForceTransfer(ctx: EquipmentActionContext): boolean {
  if (isManagerOrAbove(ctx.user)) return true;
  if (user_isTeamLeader(ctx.user) && isInTeam(ctx)) return true;
  return false;
}

// ---------- Bulk / management operations ----------

/** Bulk ops (bulk force ops, bulk report, bulk retirement audit) are manager+. */
export function canBulkOps(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

/** Approving someone else's retirement-to-army request — manager+ oversight only.
 *  (The primary approver is still the current holder via notification; managers can monitor.) */
export function canApproveRetirementOversight(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

// ---------- Templates ----------

/** Managers can create canonical templates directly. */
export function canCreateCanonicalTemplate(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

/** Team leaders can propose templates (require manager approval to become canonical). */
export function canProposeTemplate(user: EnhancedAuthUser): boolean {
  return isTeamLeaderOrAbove(user);
}

/** Anyone authenticated can request a template they can't find in the list. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canRequestTemplate(_user: EnhancedAuthUser): boolean {
  return true;
}

/** Only managers review & approve pending templates (whether from TL or a regular user). */
export function canReviewTemplate(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

// ---------- Internal helpers ----------

function user_isTeamLeader(user: EnhancedAuthUser): boolean {
  return user.userType === UserType.TEAM_LEADER;
}
