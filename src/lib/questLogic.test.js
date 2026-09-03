import { describe, it, expect } from 'vitest'
import {
  isTrainingDay,
  isRunDay,
  weekIndexFromStart,
  daysSince,
  dailyHash,
  getWorkoutQuest,
  getRestQuest,
  getMealSideQuest,
} from './questLogic'
import { workoutPools } from '../content/workoutPools'
import { mealSidePools } from '../content/mealSidePools'
import { restDayQuests } from '../content/restDayQuests'
import { runProgression } from '../content/runProgression'

describe('isTrainingDay', () => {
  it('matches days present in free_days (Mon=0..Sun=6)', () => {
    const freeDays = [0, 1] // Mon, Tue
    expect(isTrainingDay('2024-01-01', freeDays)).toBe(true) // Mon
    expect(isTrainingDay('2024-01-02', freeDays)).toBe(true) // Tue
    expect(isTrainingDay('2024-01-06', freeDays)).toBe(false) // Sat
    expect(isTrainingDay('2024-01-07', freeDays)).toBe(false) // Sun
  })

  it('returns false when free_days is empty', () => {
    expect(isTrainingDay('2024-01-01', [])).toBe(false)
  })
})

describe('isRunDay', () => {
  it('matches only when the weekday equals run_day', () => {
    expect(isRunDay('2024-01-01', 0)).toBe(true) // Mon, run_day=0
    expect(isRunDay('2024-01-01', 1)).toBe(false)
  })
})

describe('weekIndexFromStart', () => {
  it('is 0 during the first week and increments every 7 days', () => {
    expect(weekIndexFromStart('2024-01-01', '2024-01-01')).toBe(0)
    expect(weekIndexFromStart('2024-01-01', '2024-01-07')).toBe(0)
    expect(weekIndexFromStart('2024-01-01', '2024-01-08')).toBe(1)
    expect(weekIndexFromStart('2024-01-01', '2024-03-18')).toBe(11)
  })
})

describe('daysSince', () => {
  it('counts whole days between two dates', () => {
    expect(daysSince('2024-01-01', '2024-01-01')).toBe(0)
    expect(daysSince('2024-01-01', '2024-01-08')).toBe(7)
    expect(daysSince('2024-01-01', '2024-02-01')).toBe(31)
  })
})

describe('dailyHash', () => {
  it('is deterministic for the same date and salt', () => {
    expect(dailyHash('2024-01-01', 'workout')).toBe(dailyHash('2024-01-01', 'workout'))
  })

  it('is a non-negative number', () => {
    expect(dailyHash('2024-01-01', 'workout')).toBeGreaterThanOrEqual(0)
  })
})

const USER_A = 'user-aaa'
const USER_B = 'user-bbb'

function consecutiveDates(startDateStr, count) {
  const [y, m, d] = startDateStr.split('-').map(Number)
  const dates = []
  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i))
    dates.push(dt.toISOString().slice(0, 10))
  }
  return dates
}

// The cycle boundary depends on pool length, not the calendar date — find the
// first date of a fresh cycle so a `poolLength`-day window is guaranteed to
// land entirely within one cycle (only within-cycle is guaranteed repeat-free).
function startOfNextCycle(dateStr, poolLength) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dayIndex = Math.floor(Date.UTC(y, m - 1, d) / 86400000)
  const nextBoundary = Math.ceil(dayIndex / poolLength) * poolLength
  return new Date(nextBoundary * 86400000).toISOString().slice(0, 10)
}

describe('getWorkoutQuest', () => {
  it('returns the same quest for the same date, tier, and user', () => {
    const a = getWorkoutQuest('2024-01-01', 0, false, 0, USER_A)
    const b = getWorkoutQuest('2024-01-01', 0, false, 0, USER_A)
    expect(a).toEqual(b)
  })

  it('picks from the matching tier pool, and different tiers pull from different pools', () => {
    const tier0Quest = getWorkoutQuest('2024-01-01', 0, false, 0, USER_A)
    const tier5Quest = getWorkoutQuest('2024-01-01', 5, false, 0, USER_A)
    expect(workoutPools[0]).toContainEqual(tier0Quest)
    expect(workoutPools[5]).toContainEqual(tier5Quest)
    expect(tier0Quest.key).not.toBe(tier5Quest.key)
  })

  it('returns the matching runProgression entry on a run day', () => {
    expect(getWorkoutQuest('2024-01-01', 0, true, 0, USER_A)).toEqual(runProgression[0])
    expect(getWorkoutQuest('2024-01-01', 0, true, 11, USER_A)).toEqual(runProgression[11])
  })

  it('clamps weekIndex beyond the 12-week program to the final week', () => {
    expect(getWorkoutQuest('2024-01-01', 0, true, 20, USER_A)).toEqual(runProgression[11])
  })

  it('cycles through the whole tier pool with no repeats before reshuffling', () => {
    const tier = 2
    const pool = workoutPools[tier]
    const start = startOfNextCycle('2026-01-01', pool.length)
    const dates = consecutiveDates(start, pool.length)
    const picks = dates.map((d) => getWorkoutQuest(d, tier, false, 0, USER_A).key)
    expect(new Set(picks).size).toBe(pool.length) // every entry shown exactly once
  })

  it('different users get independently shuffled orders', () => {
    const dates = consecutiveDates('2026-01-01', 5)
    const picksA = dates.map((d) => getWorkoutQuest(d, 3, false, 0, USER_A).key)
    const picksB = dates.map((d) => getWorkoutQuest(d, 3, false, 0, USER_B).key)
    expect(picksA).not.toEqual(picksB)
  })
})

describe('getRestQuest', () => {
  it('returns the same quest for the same date and user', () => {
    expect(getRestQuest('2024-01-01', USER_A)).toEqual(getRestQuest('2024-01-01', USER_A))
  })

  it('picks a quest from restDayQuests', () => {
    expect(restDayQuests).toContainEqual(getRestQuest('2024-01-01', USER_A))
  })

  it('cycles through the whole pool with no repeats before reshuffling', () => {
    const start = startOfNextCycle('2026-01-01', restDayQuests.length)
    const dates = consecutiveDates(start, restDayQuests.length)
    const picks = dates.map((d) => getRestQuest(d, USER_A).key)
    expect(new Set(picks).size).toBe(restDayQuests.length)
  })
})

describe('getMealSideQuest', () => {
  it('returns the same challenge for the same date, tier, and user', () => {
    const a = getMealSideQuest('2024-01-01', 0, USER_A)
    const b = getMealSideQuest('2024-01-01', 0, USER_A)
    expect(a).toBe(b)
  })

  it('picks from the matching tier pool, and different tiers pull from different pools', () => {
    const tier0 = getMealSideQuest('2024-01-01', 0, USER_A)
    const tier5 = getMealSideQuest('2024-01-01', 5, USER_A)
    expect(mealSidePools[0]).toContainEqual(tier0)
    expect(mealSidePools[5]).toContainEqual(tier5)
  })

  it('every entry is either a measurable number target or a boolean fact', () => {
    for (const pool of mealSidePools) {
      for (const entry of pool) {
        expect(['number', 'boolean']).toContain(entry.type)
        if (entry.type === 'number') {
          expect(typeof entry.target).toBe('number')
          expect(['gte', 'lte']).toContain(entry.comparison)
        }
      }
    }
  })

  it('every tier pool has at least 12 entries', () => {
    for (const pool of mealSidePools) {
      expect(pool.length).toBeGreaterThanOrEqual(12)
    }
  })

  it('cycles through the whole tier pool with no repeats before reshuffling', () => {
    const tier = 4
    const pool = mealSidePools[tier]
    const start = startOfNextCycle('2026-01-01', pool.length)
    const dates = consecutiveDates(start, pool.length)
    const picks = dates.map((d) => getMealSideQuest(d, tier, USER_A).key)
    expect(new Set(picks).size).toBe(pool.length)
  })
})

describe('workoutPools', () => {
  it('every tier has at least 12 entries', () => {
    for (const pool of workoutPools) {
      expect(pool.length).toBeGreaterThanOrEqual(12)
    }
  })
})
