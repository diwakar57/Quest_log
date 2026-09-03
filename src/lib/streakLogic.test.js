import { describe, it, expect } from 'vitest'
import { computeMultiplier } from './streakLogic'

describe('computeMultiplier', () => {
  it('is 0 with no streak', () => {
    expect(computeMultiplier(0)).toBe(0)
  })

  it('scales linearly at 2% per day', () => {
    expect(computeMultiplier(5)).toBeCloseTo(0.1)
    expect(computeMultiplier(10)).toBeCloseTo(0.2)
  })

  it('caps at 0.5 (50%)', () => {
    expect(computeMultiplier(25)).toBe(0.5)
    expect(computeMultiplier(100)).toBe(0.5)
  })
})
