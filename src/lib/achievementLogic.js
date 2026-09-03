import { supabase } from './supabaseClient'
import { achievements } from '../content/achievements'
import { runProgression } from '../content/runProgression'
import { todayISODate } from './onboarding'

// Run-day quests store the runProgression week's `name` in workout_quest_key
// (they have no `key`, unlike workoutPools entries) — see Today.jsx. That set
// never overlaps workoutPools keys, so it doubles as a reliable "was this a
// run quest" check without needing a schema change.
const RUN_QUEST_NAMES = new Set(runProgression.map((w) => w.name))

function shiftDate(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().slice(0, 10)
}

async function countRows(table, filters) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function countRunQuestsCompleted(userId) {
  const { count, error } = await supabase
    .from('daily_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('workout_done', true)
    .in('workout_quest_key', [...RUN_QUEST_NAMES])
  if (error) throw error
  return count ?? 0
}

async function getCurrentTier(userId) {
  const { data, error } = await supabase.from('tiers').select('current_tier').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.current_tier ?? 0
}

async function getBestStreak(userId) {
  const { data, error } = await supabase.from('users').select('best_streak').eq('id', userId).maybeSingle()
  if (error) throw error
  return data?.best_streak ?? 0
}

// A stricter, separate check from streakLogic's streak: requires BOTH flags
// per day (including the optional rest_quest_done), for 7 consecutive days
// ending today — same "filled" rule as the Progress page's 12-week grid.
async function hasPerfectWeek(userId) {
  let cursor = todayISODate()
  for (let i = 0; i < 7; i++) {
    const { data: row, error } = await supabase
      .from('daily_logs')
      .select('is_training_day, workout_done, rest_quest_done, meal_quest_done')
      .eq('user_id', userId)
      .eq('date', cursor)
      .maybeSingle()
    if (error) throw error
    const flagA = row ? (row.is_training_day ? row.workout_done : row.rest_quest_done) : false
    const filled = Boolean(row) && flagA && row.meal_quest_done
    if (!filled) return false
    cursor = shiftDate(cursor, -1)
  }
  return true
}

async function checkCondition(key, userId) {
  switch (key) {
    case 'first_workout':
      return (await countRows('daily_logs', { user_id: userId, workout_done: true })) >= 1
    case 'ten_workouts':
      return (await countRows('daily_logs', { user_id: userId, workout_done: true })) >= 10
    case 'first_rest':
      return (await countRows('daily_logs', { user_id: userId, rest_quest_done: true })) >= 1
    case 'first_meal':
      return (await countRows('daily_logs', { user_id: userId, meal_quest_done: true })) >= 1
    case 'first_run':
      return (await countRunQuestsCompleted(userId)) >= 1
    case 'first_trial_cleared':
      return (await countRows('trials', { user_id: userId, status: 'cleared' })) >= 1
    case 'tier_5_reached':
      return (await getCurrentTier(userId)) >= 5
    case 'streak_7':
      return (await getBestStreak(userId)) >= 7
    case 'streak_30':
      return (await getBestStreak(userId)) >= 30
    case 'perfect_week':
      return await hasPerfectWeek(userId)
    default:
      return false
  }
}

// Checks every not-yet-unlocked achievement, inserts newly met ones, and
// returns just the newly unlocked ones (for a toast) — already-unlocked
// achievements are skipped entirely, so this stays cheap once most are done.
export async function checkAchievements(userId) {
  const { data: unlockedRows, error: unlockedError } = await supabase
    .from('achievements')
    .select('key')
    .eq('user_id', userId)
  if (unlockedError) throw unlockedError
  const unlockedKeys = new Set(unlockedRows.map((r) => r.key))

  const candidates = achievements.filter((a) => !unlockedKeys.has(a.key))
  if (candidates.length === 0) return []

  const newlyUnlocked = []
  for (const achievement of candidates) {
    if (await checkCondition(achievement.key, userId)) {
      newlyUnlocked.push(achievement)
    }
  }
  if (newlyUnlocked.length === 0) return []

  const rows = newlyUnlocked.map((a) => ({ user_id: userId, key: a.key, unlocked_at: todayISODate() }))
  const { error: insertError } = await supabase
    .from('achievements')
    .upsert(rows, { onConflict: 'user_id,key', ignoreDuplicates: true })
  if (insertError) throw insertError

  return newlyUnlocked
}
