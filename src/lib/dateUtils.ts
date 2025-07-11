export const formatReportDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    timeZone: 'Asia/Jerusalem'
  };
  return date.toLocaleDateString('he-IL', options);
};

export const formatReportTime = (date: Date): string => {
  return date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Jerusalem'
  });
};

export const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const timeString = date.toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Jerusalem'
  });
  
  if (isToday) {
    return `היום ${timeString}`;
  } else {
    const dateString = date.toLocaleDateString('he-IL', { 
      day: 'numeric', 
      month: 'numeric',
      timeZone: 'Asia/Jerusalem'
    });
    return `${dateString} ${timeString}`;
  }
};

export const formatCacheErrorDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('he-IL');
}; 