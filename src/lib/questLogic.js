import { workoutPools } from '../content/workoutPools'
import { runProgression } from '../content/runProgression'
import { restDayQuests } from '../content/restDayQuests'
import { mealSidePools } from '../content/mealSidePools'

function parseUTCDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

// Mon=0 .. Sun=6, matching the free_days encoding used by Onboarding.
function weekdayIndex(dateStr) {
  const jsDay = parseUTCDate(dateStr).getUTCDay() // 0=Sun..6=Sat
  return (jsDay + 6) % 7
}

export function isTrainingDay(dateStr, freeDays) {
  return freeDays.includes(weekdayIndex(dateStr))
}

export function isRunDay(dateStr, runDay) {
  return weekdayIndex(dateStr) === runDay
}

// Which week of the 12-week run program `dateStr` falls in, given the user's start_date.
export function weekIndexFromStart(startDate, dateStr) {
  const MS_PER_DAY = 86400000
  const diffDays = Math.round((parseUTCDate(dateStr) - parseUTCDate(startDate)) / MS_PER_DAY)
  return Math.floor(Math.max(0, diffDays) / 7)
}

// Whole days between two YYYY-MM-DD dates.
export function daysSince(fromDateStr, toDateStr) {
  const MS_PER_DAY = 86400000
  return Math.round((parseUTCDate(toDateStr) - parseUTCDate(fromDateStr)) / MS_PER_DAY)
}

export function dailyHash(dateStr, salt) {
  const str = `${dateStr}:${salt}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// Seeded PRNG (mulberry32) so a shuffle is fully determined by its seed number.
function mulberry32(seed) {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle(array, seed) {
  const result = [...array]
  const rand = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Picks one entry per day from `pool`, cycling through a shuffled order of the
// whole pool before reshuffling — so no entry repeats until every other entry
// has been shown once. The shuffle is deterministic per (seedKey, cycle), so
// reloading the page on the same day always returns the same pick.
function pickFromCyclingPool(pool, dateStr, seedKey) {
  const dayIndex = Math.floor(parseUTCDate(dateStr).getTime() / 86400000)
  const cycle = Math.floor(dayIndex / pool.length)
  const positionInCycle = dayIndex % pool.length
  const seed = dailyHash(seedKey, `cycle${cycle}`)
  return seededShuffle(pool, seed)[positionInCycle]
}

export function getWorkoutQuest(dateStr, tier, isRunDay, weekIndex, userId) {
  if (isRunDay) {
    const idx = Math.min(weekIndex, runProgression.length - 1)
    return runProgression[idx]
  }
  const pool = workoutPools[tier]
  return pickFromCyclingPool(pool, dateStr, `workout:${userId}:${tier}`)
}

export function getRestQuest(dateStr, userId) {
  return pickFromCyclingPool(restDayQuests, dateStr, `rest:${userId}`)
}

export function getMealSideQuest(dateStr, tier, userId) {
  const pool = mealSidePools[tier]
  return pickFromCyclingPool(pool, dateStr, `meal:${userId}:${tier}`)
}
