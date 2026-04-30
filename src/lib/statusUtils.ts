export const mapStructuredStatusToRaw = (status: string, customStatus?: string): string => {
  if (status === 'אחר') {
    return customStatus ?? 'אחר';
  }
  return status;
};

export const getAvailableStatuses = (): string[] => {
  return ['בית', 'משמר', 'אחר'];
};
