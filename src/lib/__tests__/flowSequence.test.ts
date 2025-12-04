import { describe, it, expect } from 'vitest'
import {
  getNextElements,
  getDefaultNext,
  cycleAlternative,
  canCreateBranch,
  getBranchType,
  toStickyType,
  fromStickyType,
  isFlowElement,
} from '../flowSequence'

describe('flowSequence', () => {
  describe('getNextElements', () => {
    it('returns all forward options for event (has alternatives)', () => {
      expect(getNextElements('event', 'forward')).toEqual(['policy', 'readmodel', 'event'])
    })

    it('returns all backward options for command (has alternatives)', () => {
      expect(getNextElements('command', 'backward')).toEqual(['person', 'policy'])
    })

    it('returns single option for person forward', () => {
      expect(getNextElements('person', 'forward')).toEqual(['command'])
    })
  })

  describe('getDefaultNext', () => {
    describe('forward flow', () => {
      it('person -> command', () => {
        expect(getDefaultNext('person', 'forward')).toBe('command')
      })

      it('readmodel -> person', () => {
        expect(getDefaultNext('readmodel', 'forward')).toBe('person')
      })

      it('command -> system', () => {
        expect(getDefaultNext('command', 'forward')).toBe('system')
      })

      it('system -> event', () => {
        expect(getDefaultNext('system', 'forward')).toBe('event')
      })

      it('event -> policy (default)', () => {
        expect(getDefaultNext('event', 'forward')).toBe('policy')
      })

      it('policy -> command', () => {
        expect(getDefaultNext('policy', 'forward')).toBe('command')
      })
    })

    describe('backward flow', () => {
      it('command -> person (default)', () => {
        expect(getDefaultNext('command', 'backward')).toBe('person')
      })

      it('system -> command', () => {
        expect(getDefaultNext('system', 'backward')).toBe('command')
      })

      it('event -> system', () => {
        expect(getDefaultNext('event', 'backward')).toBe('system')
      })

      it('policy -> event', () => {
        expect(getDefaultNext('policy', 'backward')).toBe('event')
      })

      it('readmodel -> event', () => {
        expect(getDefaultNext('readmodel', 'backward')).toBe('event')
      })

      it('person -> readmodel', () => {
        expect(getDefaultNext('person', 'backward')).toBe('readmodel')
      })
    })
  })

  describe('cycleAlternative', () => {
    describe('forward from event (policy, readmodel, event)', () => {
      it('cycles down: policy -> readmodel', () => {
        const result = cycleAlternative('event', 'forward', 0, 'down')
        expect(result?.newType).toBe('readmodel')
        expect(result?.newIndex).toBe(1)
      })

      it('cycles down: readmodel -> event', () => {
        const result = cycleAlternative('event', 'forward', 1, 'down')
        expect(result?.newType).toBe('event')
        expect(result?.newIndex).toBe(2)
      })

      it('cycles down: event -> policy (wraps)', () => {
        const result = cycleAlternative('event', 'forward', 2, 'down')
        expect(result?.newType).toBe('policy')
        expect(result?.newIndex).toBe(0)
      })

      it('cycles up: policy -> event (wraps)', () => {
        const result = cycleAlternative('event', 'forward', 0, 'up')
        expect(result?.newType).toBe('event')
        expect(result?.newIndex).toBe(2)
      })

      it('cycles up: readmodel -> policy', () => {
        const result = cycleAlternative('event', 'forward', 1, 'up')
        expect(result?.newType).toBe('policy')
        expect(result?.newIndex).toBe(0)
      })
    })

    describe('backward from command (person, policy)', () => {
      it('cycles down: person -> policy', () => {
        const result = cycleAlternative('command', 'backward', 0, 'down')
        expect(result?.newType).toBe('policy')
        expect(result?.newIndex).toBe(1)
      })

      it('cycles down: policy -> person (wraps)', () => {
        const result = cycleAlternative('command', 'backward', 1, 'down')
        expect(result?.newType).toBe('person')
        expect(result?.newIndex).toBe(0)
      })
    })

    describe('no alternatives', () => {
      it('returns null for person forward (only one option)', () => {
        expect(cycleAlternative('person', 'forward', 0, 'down')).toBeNull()
      })

      it('returns null for system forward (only one option)', () => {
        expect(cycleAlternative('system', 'forward', 0, 'down')).toBeNull()
      })
    })
  })

  describe('branching', () => {
    it('allows branch from command', () => {
      expect(canCreateBranch('command')).toBe(true)
    })

    it('returns command as branch type for command', () => {
      expect(getBranchType('command')).toBe('command')
    })

    it('does not allow branch from other elements', () => {
      expect(canCreateBranch('event')).toBe(false)
      expect(canCreateBranch('policy')).toBe(false)
      expect(canCreateBranch('person')).toBe(false)
    })

    it('returns null for non-command branch type', () => {
      expect(getBranchType('event')).toBeNull()
      expect(getBranchType('policy')).toBeNull()
    })
  })

  describe('type conversion', () => {
    describe('toStickyType', () => {
      it('converts person to person-sticky', () => {
        expect(toStickyType('person')).toBe('person-sticky')
      })

      it('converts command to command-sticky', () => {
        expect(toStickyType('command')).toBe('command-sticky')
      })

      it('converts readmodel to readmodel-sticky', () => {
        expect(toStickyType('readmodel')).toBe('readmodel-sticky')
      })
    })

    describe('fromStickyType', () => {
      it('converts person-sticky to person', () => {
        expect(fromStickyType('person-sticky')).toBe('person')
      })

      it('converts readmodel-sticky to readmodel', () => {
        expect(fromStickyType('readmodel-sticky')).toBe('readmodel')
      })

      it('returns null for non-flow sticky types', () => {
        expect(fromStickyType('hotspot-sticky')).toBeNull()
        expect(fromStickyType('opportunity-sticky')).toBeNull()
      })

      it('returns null for invalid strings', () => {
        expect(fromStickyType('invalid')).toBeNull()
        expect(fromStickyType('')).toBeNull()
      })
    })

    describe('isFlowElement', () => {
      it('returns true for flow elements', () => {
        expect(isFlowElement('person')).toBe(true)
        expect(isFlowElement('command')).toBe(true)
        expect(isFlowElement('system')).toBe(true)
        expect(isFlowElement('event')).toBe(true)
        expect(isFlowElement('policy')).toBe(true)
        expect(isFlowElement('readmodel')).toBe(true)
      })

      it('returns false for non-flow elements', () => {
        expect(isFlowElement('hotspot')).toBe(false)
        expect(isFlowElement('opportunity')).toBe(false)
        expect(isFlowElement('glossary')).toBe(false)
      })
    })
  })
})
