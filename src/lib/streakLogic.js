import { supabase } from './supabaseClient'
import { todayISODate } from './onboarding'

function parseUTCDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatUTCDate(date) {
  return date.toISOString().slice(0, 10)
}

function isDayComplete(row) {
  if (!row) return false
  return row.is_training_day ? row.workout_done && row.meal_quest_done : row.meal_quest_done
}

// Walks backward day by day from today through daily_logs, counting consecutive
// complete days. Stops at the first incomplete day. Today doesn't break the
// streak if it isn't complete yet — it's just not counted until it is.
const MAX_LOOKBACK_DAYS = 3650 // safety cap, ~10 years

export async function computeStreak(userId, todayStr = todayISODate()) {
  let streak = 0
  let cursor = parseUTCDate(todayStr)
  let isToday = true

  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const dateStr = formatUTCDate(cursor)
    const { data: row, error } = await supabase
      .from('daily_logs')
      .select('is_training_day, workout_done, meal_quest_done')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .maybeSingle()
    if (error) throw error

    const complete = isDayComplete(row)
    if (complete) {
      streak += 1
    } else if (!isToday) {
      break
    }

    cursor = new Date(cursor.getTime() - 86400000)
    isToday = false
  }

  return streak
}

export function computeMultiplier(streak) {
  return Math.min(0.5, streak * 0.02)
}
