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
 *   isInTeam    — user's teamId equals holder's or signer's teamId, OR an
 *                 active permission grant scope-matches one of those teams
 *   isAll       — manager/admin level; item scope is irrelevant
 *
 * Time-limited grants:
 *   A grant says "user X has role R within scope S until date D". The role
 *   classifiers below honor active grants when a relevant scope is provided.
 *   A scope='all' grant counts everywhere; a scope='team' grant counts only
 *   when the action's team scope matches.
 */

import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { UserType } from '@/types/user';
import type { ActiveGrant } from '@/types/permissionGrant';

export interface EquipmentActionContext {
  user: EnhancedAuthUser;
  equipment: Equipment;
}

// ---------- Internal: rank + grant scope ----------

const ROLE_RANK: Record<UserType, number> = {
  [UserType.USER]: 1,
  [UserType.TEAM_LEADER]: 2,
  [UserType.MANAGER]: 3,
  [UserType.SYSTEM_MANAGER]: 3,
  [UserType.ADMIN]: 4,
};

export function roleRank(role: UserType | null | undefined): number {
  if (!role) return 0;
  return ROLE_RANK[role] ?? 0;
}

function asTeamList(scope: string | string[] | undefined): string[] | undefined {
  if (scope === undefined) return undefined;
  return Array.isArray(scope) ? scope : [scope];
}

export function grantCoversScope(grant: ActiveGrant, scopeTeamIds?: string[]): boolean {
  if (grant.scope === 'all') return true;
  if (!scopeTeamIds || scopeTeamIds.length === 0) return false;
  return !!grant.scopeTeamId && scopeTeamIds.includes(grant.scopeTeamId);
}

function hasGrantOfRank(
  user: EnhancedAuthUser,
  minRank: number,
  scopeTeamIds?: string[]
): boolean {
  return (user.grants ?? []).some(
    (g) => roleRank(g.grantedRole) >= minRank && grantCoversScope(g, scopeTeamIds)
  );
}

// ---------- Role classifiers ----------

export function isAdmin(user: EnhancedAuthUser): boolean {
  return user.userType === UserType.ADMIN;
}

export function isManagerOrAbove(
  user: EnhancedAuthUser,
  scopeTeamId?: string | string[]
): boolean {
  if (roleRank(user.userType) >= roleRank(UserType.MANAGER)) return true;
  return hasGrantOfRank(user, roleRank(UserType.MANAGER), asTeamList(scopeTeamId));
}

export function isTeamLeaderOrAbove(
  user: EnhancedAuthUser,
  scopeTeamId?: string | string[]
): boolean {
  if (roleRank(user.userType) >= roleRank(UserType.TEAM_LEADER)) return true;
  return hasGrantOfRank(user, roleRank(UserType.TEAM_LEADER), asTeamList(scopeTeamId));
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

/**
 * True if the user's base teamId matches the equipment's holder or signer
 * team, OR if an active permission grant scope-matches one of those teams.
 */
export function isInTeam(ctx: EquipmentActionContext): boolean {
  const equipmentTeams = [ctx.equipment.holderTeamId, ctx.equipment.signerTeamId].filter(
    (t): t is string => !!t
  );
  if (ctx.user.teamId && equipmentTeams.includes(ctx.user.teamId)) return true;
  return (ctx.user.grants ?? []).some((g) => grantCoversScope(g, equipmentTeams));
}

// ---------- Visibility ----------

export function canView(ctx: EquipmentActionContext): boolean {
  const equipmentTeams = [ctx.equipment.holderTeamId, ctx.equipment.signerTeamId].filter(
    (t): t is string => !!t
  );
  if (isManagerOrAbove(ctx.user, equipmentTeams)) return true;
  if (isSelf(ctx)) return true;
  if (isInTeam(ctx)) return true;
  return false;
}

// ---------- Sign-up ----------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAddEquipment(_user: EnhancedAuthUser): boolean {
  return true;
}

// ---------- Report (possession check) ----------

export function canReport(ctx: EquipmentActionContext): boolean {
  const equipmentTeams = [ctx.equipment.holderTeamId, ctx.equipment.signerTeamId].filter(
    (t): t is string => !!t
  );
  if (isManagerOrAbove(ctx.user, equipmentTeams)) return true;
  if (isSelf(ctx)) return true;
  if (isTeamLeaderOrAbove(ctx.user, equipmentTeams) && isInTeam(ctx)) return true;
  return false;
}

export function canReportWithoutPhoto(user: EnhancedAuthUser): boolean {
  return isTeamLeaderOrAbove(user);
}

// ---------- Retirement ----------

export function canRetire(ctx: EquipmentActionContext): boolean {
  return isSigner(ctx);
}

export function canRetireImmediately(ctx: EquipmentActionContext): boolean {
  return isSigner(ctx) && isHolder(ctx);
}

// ---------- Transfer ----------

export function canTransfer(ctx: EquipmentActionContext): boolean {
  return isHolder(ctx);
}

export function canForceTransfer(ctx: EquipmentActionContext): boolean {
  const equipmentTeams = [ctx.equipment.holderTeamId, ctx.equipment.signerTeamId].filter(
    (t): t is string => !!t
  );
  if (isManagerOrAbove(ctx.user, equipmentTeams)) return true;
  if (isTeamLeaderOrAbove(ctx.user, equipmentTeams) && isInTeam(ctx)) return true;
  return false;
}

// ---------- Bulk / management operations ----------

export function canBulkOps(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

export function canApproveRetirementOversight(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

// ---------- Templates ----------

export function canCreateCanonicalTemplate(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}

export function canProposeTemplate(user: EnhancedAuthUser): boolean {
  return isTeamLeaderOrAbove(user);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canRequestTemplate(_user: EnhancedAuthUser): boolean {
  return true;
}

export function canReviewTemplate(user: EnhancedAuthUser): boolean {
  return isManagerOrAbove(user);
}
