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
  isRegistered: boolean;
  /** Raw phone string from the roster join; formatted for display in the table. */
  phoneNumber?: string;
}
