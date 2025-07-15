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

export interface FormErrors {
  name: string;
  id: string;
  platoon: string;
}

export interface NewSoldierForm {
  id: string;
  name: string;
  platoon: string;
  status: string;
  customStatus: string;
  notes: string;
}

export interface ReportSettings {
  isMultiPlatoonReport: boolean;
  includeIdInReport: boolean;
}

export interface FilterState {
  nameFilter: string;
  selectedTeams: string[];
  selectedStatuses: string[];
  showTeamFilter: boolean;
  showStatusFilter: boolean;
} 