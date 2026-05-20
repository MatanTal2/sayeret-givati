import { resolveNotificationTarget } from '../NotificationItem';
import { NotificationType, type NotificationDisplayData } from '@/types/notifications';

function makeNotification(
  overrides: { type: NotificationType } & Partial<NotificationDisplayData>,
): NotificationDisplayData {
  return {
    id: 'n1',
    title: 'title',
    message: 'message',
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
    // Bug regression: management notifications must include ?tab=template-management
    // so the management page lands on the equipment-template tab, not the default user tab.
    const managementTypes: NotificationType[] = [
      NotificationType.TEMPLATE_PROPOSED_FOR_REVIEW,
      NotificationType.NEW_TEMPLATE_REQUEST_FOR_REVIEW,
      NotificationType.TEMPLATE_REQUEST_REJECTED,
    ];

    test.each(managementTypes)('%s routes to template-management tab', (type) => {
      const target = resolveNotificationTarget(makeNotification({ type }));
      expect(target).toBe('/management?tab=template-management');
    });
  });

  describe('equipment notifications', () => {
    test('TEMPLATE_REQUEST_APPROVED with relatedEquipmentDocId routes to /equipment?resumeTemplate=<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({
          type: NotificationType.TEMPLATE_REQUEST_APPROVED,
          relatedEquipmentDocId: 'tmpl-123',
        }),
      );
      expect(target).toBe('/equipment?resumeTemplate=tmpl-123');
    });

    test('TEMPLATE_REQUEST_APPROVED without relatedEquipmentDocId falls back to /equipment', () => {
      const target = resolveNotificationTarget(
        makeNotification({ type: NotificationType.TEMPLATE_REQUEST_APPROVED }),
      );
      expect(target).toBe('/equipment');
    });

    test.each<NotificationType>([
      NotificationType.TRANSFER_REQUEST,
      NotificationType.TRANSFER_APPROVED,
      NotificationType.TRANSFER_REJECTED,
      NotificationType.TRANSFER_COMPLETED,
      NotificationType.EQUIPMENT_STATUS_CHANGE,
      NotificationType.RETIREMENT_REQUEST_APPROVAL,
      NotificationType.RETIREMENT_APPROVED,
      NotificationType.RETIREMENT_REJECTED,
      NotificationType.REPORT_REQUESTED,
      NotificationType.FORCE_TRANSFER_EXECUTED,
      NotificationType.FORCE_SIGNER_CHANGED,
      NotificationType.EXCHANGE_REQUEST_APPROVAL,
      NotificationType.EXCHANGE_APPROVED,
      NotificationType.EXCHANGE_REJECTED,
      NotificationType.EXCHANGE_COMPLETED,
    ])('%s routes to /equipment', (type) => {
      expect(resolveNotificationTarget(makeNotification({ type }))).toBe('/equipment');
    });
  });

  describe('ammunition notifications', () => {
    test('AMMO_REPORT_SUBMITTED routes to /ammunition', () => {
      expect(
        resolveNotificationTarget(makeNotification({ type: NotificationType.AMMO_REPORT_SUBMITTED })),
      ).toBe('/ammunition');
    });

    test('AMMO_REPORT_REQUESTED with relatedEquipmentDocId routes to /ammunition?requestId=<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({
          type: NotificationType.AMMO_REPORT_REQUESTED,
          relatedEquipmentDocId: 'req-7',
        }),
      );
      expect(target).toBe('/ammunition?requestId=req-7');
    });
  });

  describe('guard schedule notifications', () => {
    test('GUARD_SCHEDULE_SHARED with id routes to /guard-scheduler/<id>', () => {
      const target = resolveNotificationTarget(
        makeNotification({
          type: NotificationType.GUARD_SCHEDULE_SHARED,
          relatedGuardScheduleId: 'sched-9',
        }),
      );
      expect(target).toBe('/guard-scheduler/sched-9');
    });

    test('GUARD_SCHEDULE_SHARED without id falls back to /guard-scheduler', () => {
      expect(
        resolveNotificationTarget(makeNotification({ type: NotificationType.GUARD_SCHEDULE_SHARED })),
      ).toBe('/guard-scheduler');
    });
  });

  describe('unrouted types', () => {
    // These notification types exist in the enum (have real producers) but
    // currently have no route in resolveNotificationTarget. PR-B will wire
    // them up; this test pins the current state.
    test.each<NotificationType>([
      NotificationType.TRAINING_PLAN_SUBMITTED,
      NotificationType.TRAINING_PLAN_APPROVED,
      NotificationType.TRAINING_PLAN_REJECTED,
      NotificationType.AMMO_RESTOCK_REQUEST,
      NotificationType.AMMO_ASSIGNED_FROM_CENTRAL,
      NotificationType.SYSTEM_MESSAGE,
    ])('%s returns null (route not yet wired)', (type) => {
      expect(resolveNotificationTarget(makeNotification({ type }))).toBeNull();
    });
  });
});

describe('NotificationType enum sanity', () => {
  test('no duplicate string values across enum members', () => {
    const values = Object.values(NotificationType) as string[];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  test('every value is snake_case', () => {
    for (const value of Object.values(NotificationType) as string[]) {
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});
