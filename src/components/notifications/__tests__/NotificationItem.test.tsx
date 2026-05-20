import { resolveNotificationTarget } from '../NotificationItem';
import { NotificationType, type NotificationDisplayData } from '@/types/notifications';

function makeNotification(overrides: Partial<NotificationDisplayData> & { type: string }): NotificationDisplayData {
  return {
    id: 'n1',
    title: 'title',
    message: 'message',
    type: overrides.type as unknown as NotificationType,
    isRead: false,
    createdAt: new Date(),
    timeAgo: 'now',
    icon: '🔔',
    color: 'text-gray-500',
    ...overrides,
  };
}

describe('resolveNotificationTarget', () => {
  describe('management notifications', () => {
    // Bug 2 regression: management notifications must include ?tab=template-management
    // so the management page lands on the equipment-template tab, not the default user tab.
    const managementTypes = [
      'template_proposed_for_review',
      'new_template_request_for_review',
      'template_request_rejected',
    ];

    test.each(managementTypes)('%s routes to template-management tab', (type) => {
      const target = resolveNotificationTarget(makeNotification({ type }));
      expect(target).toBe('/management?tab=template-management');
    });
  });

  describe('equipment notifications', () => {
    test('template_request_approved with relatedEquipmentDocId routes to /equipment?resumeTemplate=<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({ type: 'template_request_approved', relatedEquipmentDocId: 'tmpl-123' }),
      );
      expect(target).toBe('/equipment?resumeTemplate=tmpl-123');
    });

    test('template_request_approved without relatedEquipmentDocId falls back to /equipment', () => {
      const target = resolveNotificationTarget(makeNotification({ type: 'template_request_approved' }));
      expect(target).toBe('/equipment');
    });

    test.each([
      'transfer_request',
      'transfer_approved',
      'transfer_rejected',
      'equipment_status_change',
      'retirement_approved',
      'report_requested',
    ])('%s routes to /equipment', (type) => {
      expect(resolveNotificationTarget(makeNotification({ type }))).toBe('/equipment');
    });
  });

  describe('ammunition notifications', () => {
    test('ammo_report_submitted routes to /ammunition', () => {
      expect(resolveNotificationTarget(makeNotification({ type: 'ammo_report_submitted' }))).toBe('/ammunition');
    });

    test('ammo_report_requested with relatedEquipmentDocId routes to /ammunition?requestId=<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({ type: 'ammo_report_requested', relatedEquipmentDocId: 'req-7' }),
      );
      expect(target).toBe('/ammunition?requestId=req-7');
    });
  });

  describe('guard schedule notifications', () => {
    test('guard_schedule_shared with id routes to /guard-scheduler/<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({ type: 'guard_schedule_shared', relatedGuardScheduleId: 'sched-9' }),
      );
      expect(target).toBe('/guard-scheduler/sched-9');
    });

    test('guard_schedule_shared without id falls back to /guard-scheduler', () => {
      expect(resolveNotificationTarget(makeNotification({ type: 'guard_schedule_shared' }))).toBe(
        '/guard-scheduler',
      );
    });
  });

  describe('unknown types', () => {
    test('returns null so no navigation happens', () => {
      expect(resolveNotificationTarget(makeNotification({ type: 'unknown_future_type' }))).toBeNull();
    });
  });
});
