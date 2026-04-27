import { EquipmentCondition, type EquipmentType } from '@/types/equipment';

export type WizardMode = 'single' | 'bulk';
export type WizardStep = 'mode' | 'template' | 'details' | 'review';

export interface WizardItemDraft {
  uid: string;
  serialNumber: string;
  catalogNumber: string;
  photoBlob: Blob | null;
  photoUrl: string | null;
  notes: string;
  location: string;
  condition: EquipmentCondition;
}

export interface WizardState {
  step: WizardStep;
  mode: WizardMode;
  categoryId: string | null;
  subcategoryId: string | null;
  template: EquipmentType | null;
  items: WizardItemDraft[];
  showRequestFlow: boolean;
}

export function createEmptyItem(defaults?: Partial<WizardItemDraft>): WizardItemDraft {
  return {
    uid: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `item-${Math.random()}`,
    serialNumber: '',
    catalogNumber: '',
    photoBlob: null,
    photoUrl: null,
    notes: '',
    location: '',
    condition: EquipmentCondition.GOOD,
    ...defaults,
  };
}
