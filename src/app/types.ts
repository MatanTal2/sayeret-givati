export interface Soldier {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Combined full name for UI
  platoon: string;
  status: string;
  customStatus?: string;
  notes?: string;
  isSelected: boolean;
  isManuallyAdded?: boolean; // Flag to identify manually added soldiers
} 