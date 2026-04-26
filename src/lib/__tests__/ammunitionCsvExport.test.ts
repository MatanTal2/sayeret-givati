/**
 * Phase 5 — CSV serializer round-trip.
 */
import { reportsToCsv } from '@/lib/ammunition/csvExport';
import type { AmmunitionReport, AmmunitionType } from '@/types/ammunition';

const fakeTimestamp = (d: Date) => ({
  toDate: () => d,
  seconds: Math.floor(d.getTime() / 1000),
  nanoseconds: 0,
});

const t1: AmmunitionType = {
  id: 't1',
  name: '5.56 לבן',
  subcategory: 'BULLETS',
  allocation: 'TEAM',
  trackingMode: 'BRUCE',
  securityLevel: 'EXPLOSIVE',
  bulletsPerCardboard: 30,
  cardboardsPerBruce: 33,
  totalBulletsPerBruce: 990,
  status: 'CANONICAL',
  createdAt: undefined as unknown as never,
  updatedAt: undefined as unknown as never,
  createdBy: 'admin',
};

const t2: AmmunitionType = {
  id: 't2',
  name: 'רימון עשן',
  subcategory: 'GRENADES',
  allocation: 'BOTH',
  trackingMode: 'LOOSE_COUNT',
  securityLevel: 'GRABBABLE',
  status: 'CANONICAL',
  createdAt: undefined as unknown as never,
  updatedAt: undefined as unknown as never,
  createdBy: 'admin',
};

describe('reportsToCsv', () => {
  it('emits BOM + header row + data rows', () => {
    const reports: AmmunitionReport[] = [
      {
        id: 'r1',
        reporterId: 'u1',
        reporterName: 'מתן',
        teamId: 'team-a',
        templateId: 't1',
        templateName: '5.56 לבן',
        trackingMode: 'BRUCE',
        brucesConsumed: 1,
        cardboardsConsumed: 5,
        bulletsConsumed: 12,
        finalOpenBruceState: 'LESS_THAN_HALF',
        reason: 'אימון',
        usedAt: fakeTimestamp(new Date('2026-04-26T10:00:00Z')) as unknown as never,
        createdAt: fakeTimestamp(new Date('2026-04-26T10:30:00Z')) as unknown as never,
      },
    ];
    const csv = reportsToCsv(reports, [t1, t2]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('תאריך שימוש');
    expect(lines[1]).toContain('מתן');
    expect(lines[1]).toContain('5.56 לבן');
    expect(lines[1]).toContain('1 ברוסים');
  });

  it('quotes commas, quotes, and newlines', () => {
    const reports: AmmunitionReport[] = [
      {
        id: 'r1',
        reporterId: 'u1',
        reporterName: 'a, b',
        teamId: 'team',
        templateId: 't2',
        templateName: 'רימון עשן',
        trackingMode: 'LOOSE_COUNT',
        quantityConsumed: 2,
        reason: 'קו "ציטוט"',
        usedAt: fakeTimestamp(new Date('2026-04-26T10:00:00Z')) as unknown as never,
        createdAt: fakeTimestamp(new Date('2026-04-26T10:30:00Z')) as unknown as never,
      },
    ];
    const csv = reportsToCsv(reports, [t1, t2]);
    expect(csv).toContain('"a, b"');
    expect(csv).toContain('"קו ""ציטוט"""');
  });

  it('renders SERIAL serials as a comma-joined cell', () => {
    const reports: AmmunitionReport[] = [
      {
        id: 'r1',
        reporterId: 'u1',
        reporterName: 'מ',
        teamId: '',
        templateId: 't3',
        templateName: 'יתד',
        trackingMode: 'SERIAL',
        itemSerials: ['12345', '67890'],
        reason: 'תרגיל',
        usedAt: fakeTimestamp(new Date('2026-04-26T10:00:00Z')) as unknown as never,
        createdAt: fakeTimestamp(new Date('2026-04-26T10:30:00Z')) as unknown as never,
      },
    ];
    const csv = reportsToCsv(reports, [t1, t2]);
    expect(csv).toContain('"צ-12345, צ-67890"');
  });
});
