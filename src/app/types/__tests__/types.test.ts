/// <reference types="jest" />
import { Soldier } from '../../types'

describe('Type Definitions', () => {
  describe('Soldier interface', () => {
    it('should accept valid soldier objects', () => {
      const validSoldier: Soldier = {
        id: '123456',
        firstName: 'ישראל',
        lastName: 'ישראלי',
        name: 'ישראל ישראלי',
        platoon: 'מסייעת',
        status: 'בית',
        isSelected: false,
      }

      expect(validSoldier).toBeDefined()
      expect(validSoldier.id).toBe('123456')
      expect(validSoldier.firstName).toBe('ישראל')
      expect(validSoldier.lastName).toBe('ישראלי')
      expect(validSoldier.name).toBe('ישראל ישראלי')
      expect(validSoldier.platoon).toBe('מסייעת')
      expect(validSoldier.status).toBe('בית')
      expect(validSoldier.isSelected).toBe(false)
    })

    it('should accept soldier with optional customStatus', () => {
      const soldierWithCustomStatus: Soldier = {
        id: '123457',
        firstName: 'דוד',
        lastName: 'כהן',
        name: 'דוד כהן',
        platoon: 'מסייעת',
        status: 'אחר',
        customStatus: 'חופש',
        isSelected: true,
      }

      expect(soldierWithCustomStatus.customStatus).toBe('חופש')
      expect(soldierWithCustomStatus.isSelected).toBe(true)
    })

    it('should accept soldier with optional notes', () => {
      const soldierWithNotes: Soldier = {
        id: '123458',
        firstName: 'משה',
        lastName: 'לוי',
        name: 'משה לוי',
        platoon: 'מסייעת',
        status: 'משמר',
        notes: 'הערה מיוחדת',
        isSelected: false,
      }

      expect(soldierWithNotes.notes).toBe('הערה מיוחדת')
    })

    it('should accept soldier with optional isManuallyAdded flag', () => {
      const manuallyAddedSoldier: Soldier = {
        id: '123459',
        firstName: 'אבי',
        lastName: 'שמח',
        name: 'אבי שמח',
        platoon: 'מסייעת',
        status: 'בית',
        isSelected: false,
        isManuallyAdded: true,
      }

      expect(manuallyAddedSoldier.isManuallyAdded).toBe(true)
    })

    it('should accept soldier with all optional fields', () => {
      const fullSoldier: Soldier = {
        id: '123460',
        firstName: 'יוסי',
        lastName: 'אברהם',
        name: 'יוסי אברהם',
        platoon: 'מסייעת',
        status: 'אחר',
        customStatus: 'מחלה',
        notes: 'מחלה קלה - 2 ימים',
        isSelected: true,
        isManuallyAdded: true,
      }

      expect(fullSoldier.customStatus).toBe('מחלה')
      expect(fullSoldier.notes).toBe('מחלה קלה - 2 ימים')
      expect(fullSoldier.isSelected).toBe(true)
      expect(fullSoldier.isManuallyAdded).toBe(true)
    })

    it('should work with arrays of soldiers', () => {
      const soldiers: Soldier[] = [
        {
          id: '123461',
          firstName: 'אמיר',
          lastName: 'דוד',
          name: 'אמיר דוד',
          platoon: 'מסייעת',
          status: 'בית',
          isSelected: false,
        },
        {
          id: '123462',
          firstName: 'רון',
          lastName: 'משה',
          name: 'רון משה',
          platoon: 'מסייעת',
          status: 'משמר',
          isSelected: true,
        },
      ]

      expect(soldiers).toHaveLength(2)
      expect(soldiers[0].name).toBe('אמיר דוד')
      expect(soldiers[1].status).toBe('משמר')
    })

    it('should handle different status values', () => {
      const statusTests: Array<{ status: string; customStatus?: string }> = [
        { status: 'בית' },
        { status: 'משמר' },
        { status: 'אחר', customStatus: 'חופש' },
        { status: 'אחר', customStatus: 'מחלה' },
      ]

      statusTests.forEach(({ status, customStatus }) => {
        const soldier: Soldier = {
          id: '123463',
          firstName: 'טסט',
          lastName: 'טסט',
          name: 'טסט טסט',
          platoon: 'מסייעת',
          status,
          customStatus,
          isSelected: false,
        }

        expect(soldier.status).toBe(status)
        expect(soldier.customStatus).toBe(customStatus)
      })
    })

    it('should handle different platoon values', () => {
      const platoons = ['מסייעת', 'כיתה א', 'כיתה ב', 'כיתה ג']

      platoons.forEach(platoon => {
        const soldier: Soldier = {
          id: '123464',
          firstName: 'טסט',
          lastName: 'טסט',
          name: 'טסט טסט',
          platoon,
          status: 'בית',
          isSelected: false,
        }

        expect(soldier.platoon).toBe(platoon)
      })
    })

    it('should handle edge cases for names', () => {
      const nameTests = [
        {
          firstName: 'א',
          lastName: 'ב',
          name: 'א ב',
        },
        {
          firstName: 'שם-כפול',
          lastName: 'משפחה-כפולה',
          name: 'שם-כפול משפחה-כפולה',
        },
        {
          firstName: 'שם',
          lastName: '',
          name: 'שם',
        },
      ]

      nameTests.forEach(({ firstName, lastName, name }) => {
        const soldier: Soldier = {
          id: '123465',
          firstName,
          lastName,
          name,
          platoon: 'מסייעת',
          status: 'בית',
          isSelected: false,
        }

        expect(soldier.firstName).toBe(firstName)
        expect(soldier.lastName).toBe(lastName)
        expect(soldier.name).toBe(name)
      })
    })
  })
}) 