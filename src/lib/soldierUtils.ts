import { Soldier } from '../types';
import { formatReportDate, formatReportTime } from './dateUtils';
import { mapStructuredStatusToRaw } from './statusUtils';

export function generateReport(
  selectedSoldiers: Soldier[], 
  isMultiPlatoonReport: boolean, 
  includeIdInReport: boolean
): string {
  if (selectedSoldiers.length === 0) {
    throw new Error('לא נבחרו חיילים לדוח');
  }

  const now = new Date();
  const hebrewDate = formatReportDate(now);
  const time = formatReportTime(now);

  // Group by platoon
  const groupedByPlatoon = selectedSoldiers.reduce((acc, soldier) => {
    const platoonKey = soldier.platoon || 'מסייעת';
    if (!acc[platoonKey]) {
      acc[platoonKey] = [];
    }
    acc[platoonKey].push(soldier);
    return acc;
  }, {} as Record<string, Soldier[]>);

  let report = `דוח שבצ״ק מסייעת - סיירת גבעתי\n`;
  report += `${hebrewDate}\n`;
  report += `שעה: ${time}\n`;
  report += `נבחרו: ${selectedSoldiers.length} חיילים\n\n`;

  // Sort platoons for consistent order
  const sortedPlatoons = Object.keys(groupedByPlatoon).sort();
  
  sortedPlatoons.forEach(platoon => {
    const platoonSoldiers = groupedByPlatoon[platoon];
    report += `צוות ${platoon}:\n`;
    platoonSoldiers.forEach((soldier, index) => {
      const status = mapStructuredStatusToRaw(soldier.status, soldier.customStatus);
      const notes = soldier.notes ? ` - ${soldier.notes}` : '';
      const idText = includeIdInReport && soldier.id ? ` (${soldier.id})` : '';
      report += `${index + 1}. ${soldier.name}${idText} - ${status}${notes}\n`;
    });
    report += '\n';
  });

  // Add total count
  report += `סה"כ: ${selectedSoldiers.length} חיילים\n`;

  return report;
}

export function validateSoldierForm(
  soldier: { id: string; name: string; platoon: string }, 
  existingSoldiers: Soldier[]
) {
  const errors = { name: '', id: '', platoon: '' };

  // Validate name
  if (!soldier.name.trim()) {
    errors.name = 'שם החייל חובה';
  } else {
    const namePattern = /^[\u05D0-\u05EA\s]+$/;
    if (!namePattern.test(soldier.name.trim())) {
      errors.name = 'השם חייב להכיל רק אותיות עבריות';
    }
  }

  // Validate ID
  if (!soldier.id.trim()) {
    errors.id = 'מספר אישי חובה';
  } else {
    const idPattern = /^\d{5,7}$/;
    if (!idPattern.test(soldier.id.trim())) {
      errors.id = 'מספר אישי חייב להכיל בין 5-7 ספרות ורק ספרות';
    } else {
      if (existingSoldiers.some(s => s.id && s.id.trim() === soldier.id.trim())) {
        errors.id = 'מספר אישי זה כבר קיים במערכת';
      }
    }
  }

  // Validate platoon
  if (!soldier.platoon) {
    errors.platoon = 'בחירת צוות חובה';
  }

  return {
    errors,
    isValid: !errors.name && !errors.id && !errors.platoon
  };
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
} 