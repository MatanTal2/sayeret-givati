import type { Timestamp } from 'firebase/firestore';

export type TrainingPlanStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'COMPLETED';

export interface TrainingAmmoLine {
  templateId: string;
  templateName: string;
  qty: number;
}

export interface TrainingPlan {
  id: string;
  teamId: string;
  startAt: Timestamp;
  endAt: Timestamp;
  rangeLocation: string;
  contactName: string;
  contactPhone: string;
  radioFrequency: string;
  headcount: number;
  ammoLines: TrainingAmmoLine[];
  notes?: string;
  status: TrainingPlanStatus;
  rejectionReason?: string;
  plannedBy: string;
  plannedByName: string;
  approverUserId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTrainingPlanInput {
  teamId: string;
  startAtMs: number;
  endAtMs: number;
  rangeLocation: string;
  contactName: string;
  contactPhone: string;
  radioFrequency: string;
  headcount: number;
  ammoLines: TrainingAmmoLine[];
  notes?: string;
}

export type TrainingPlanAction =
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'complete';
