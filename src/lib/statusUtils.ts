export interface StatusMapping {
  status: string;
  customStatus?: string;
}

export const mapRawStatusToStructured = (rawStatus: string): StatusMapping => {
  if (rawStatus === 'בית' || rawStatus === 'משמר') {
    return {
      status: rawStatus,
      customStatus: undefined
    };
  } else {
    return {
      status: 'אחר',
      customStatus: rawStatus
    };
  }
};

export const mapStructuredStatusToRaw = (status: string, customStatus?: string): string => {
  if (status === 'אחר') {
    return customStatus ?? 'אחר';
  }
  return status;
};

export const getAvailableStatuses = (): string[] => {
  return ['בית', 'משמר', 'אחר'];
}; 