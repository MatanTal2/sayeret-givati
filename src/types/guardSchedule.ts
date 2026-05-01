/**
 * Guard Schedule (מחולל שמירות) — domain types.
 *
 * The algorithm and types live separately so the algorithm module stays pure
 * and dependency-free (it is also bundled into the standalone offline HTML tool).
 */

/** Local datetime stamp without timezone, format `YYYY-MM-DDTHH:mm`. */
export type ISODateTime = string;

export type ScheduleAlgorithm =
  | 'round_robin'
  | 'random_fair'
  | 'constraint_aware';

export interface HeadcountWindow {
  /** Inclusive start hour, 0–23. */
  startHour: number;
  /** Exclusive end hour, 1–24 (24 represents end-of-day). */
  endHour: number;
  headcount: number;
}

export interface GuardPost {
  id: string;
  name: string;
  defaultHeadcount: number;
  /** Sorted, non-overlapping. Empty array means defaultHeadcount applies everywhere. */
  headcountWindows: HeadcountWindow[];
  notes?: string;
}

export type RosterPersonSource = 'firestore' | 'free_text';

export interface BlackoutInterval {
  start: ISODateTime;
  end: ISODateTime;
}

export interface RosterPerson {
  /** uid for `firestore` source, slug(name) for `free_text`. */
  id: string;
  source: RosterPersonSource;
  displayName: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  blackoutHours?: BlackoutInterval[];
}

export interface Shift {
  id: string;
  postId: string;
  postName: string;
  start: ISODateTime;
  end: ISODateTime;
  requiredHeadcount: number;
}

export interface ShiftAssignment {
  shiftId: string;
  personIds: string[];
  locked: boolean;
  manuallyEditedAt?: number;
  manuallyEditedBy?: string;
}

export interface ScheduleConfig {
  startAt: ISODateTime;
  endAt: ISODateTime;
  /** Half-hour granularity, range 0.5–12. */
  shiftDurationHours: number;
  algorithm: ScheduleAlgorithm;
  /** Optional seed for deterministic random output. Defaults to a fresh random seed at generation time. */
  seed?: string;
}

export interface PersonStat {
  personId: string;
  shiftsAssigned: number;
  totalHours: number;
}

export type ScheduleWarningCode =
  | 'roster_too_small'
  | 'cannot_meet_headcount'
  | 'blackout_overrun';

export interface ScheduleWarning {
  code: ScheduleWarningCode;
  message: string;
  shiftId?: string;
  personId?: string;
}

export interface GenerationInput {
  posts: GuardPost[];
  roster: RosterPerson[];
  config: ScheduleConfig;
  /** Existing assignments. Locked entries are preserved; unlocked are recomputed. */
  existingAssignments?: ShiftAssignment[];
}

export interface GenerationResult {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  stats: PersonStat[];
  /** max(shiftsAssigned) − min(shiftsAssigned) across the roster. */
  fairnessScore: number;
  warnings: ScheduleWarning[];
}

export interface GuardSchedule {
  id: string;
  title: string;
  createdBy: string;
  createdByName: string;
  /** Epoch millis. */
  createdAt: number;
  updatedAt: number;
  config: ScheduleConfig;
  posts: GuardPost[];
  roster: RosterPerson[];
  shifts: Shift[];
  assignments: ShiftAssignment[];
  stats: PersonStat[];
  warnings: ScheduleWarning[];
  /** Set on a copy created via share-clone, pointing to the original schedule id. */
  sourceScheduleId?: string;
  /** Soft-delete marker. */
  deletedAt?: number;
}

export interface CreateGuardScheduleInput {
  actorUid: string;
  actorName: string;
  title: string;
  config: ScheduleConfig;
  posts: GuardPost[];
  roster: RosterPerson[];
  /** Optional pre-edited assignments (e.g. preview-then-save). */
  initialAssignments?: ShiftAssignment[];
}

export interface UpdateGuardSchedulePatch {
  actorUid: string;
  actorName: string;
  title?: string;
  assignments?: ShiftAssignment[];
}

export interface ShareGuardScheduleInput {
  sourceId: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
}

export interface ShareGuardScheduleResult {
  newId: string;
}
