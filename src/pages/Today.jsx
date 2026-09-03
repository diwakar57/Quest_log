import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { todayISODate } from '../lib/onboarding'
import {
  isTrainingDay,
  isRunDay as computeIsRunDay,
  weekIndexFromStart,
  daysSince,
  getWorkoutQuest,
  getRestQuest,
  getMealSideQuest,
} from '../lib/questLogic'
import { computeStreak, computeMultiplier } from '../lib/streakLogic'
import { checkAchievements } from '../lib/achievementLogic'
import { workoutPools } from '../content/workoutPools'
import { trials } from '../content/trials'

// mealSidePools has no per-item xp (it's a target to hit, not a fixed-xp task),
// so completing the meal quest (protein + side-quest both done) awards a flat amount.
const MEAL_QUEST_XP = 15

function deriveQuests(userRow, tier, today, userId) {
  const trainingToday = isTrainingDay(today, userRow.free_days)
  const runToday = trainingToday && userRow.run_day != null && computeIsRunDay(today, userRow.run_day)
  const weekIndex = weekIndexFromStart(userRow.start_date, today)
  return {
    trainingToday,
    runToday,
    workoutQuest: trainingToday ? getWorkoutQuest(today, tier, runToday, weekIndex, userId) : null,
    restQuest: !trainingToday ? getRestQuest(today, userId) : null,
    mealSideQuest: getMealSideQuest(today, tier, userId),
  }
}

// Returns the pending trial for this tier, creating one if the user has been
// in this tier >=14 days (or >=7 days since their last "Not yet") and none
// is already pending. Multiple historical rows can exist per tier (one per
// attempt cycle) — ordered by created_at to find the most recent.
async function resolvePendingTrial(userId, tier, tierStartedAt, today) {
  const { data: pending, error: pendingError } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)
    .eq('tier_number', tier)
    .eq('status', 'pending')
    .maybeSingle()
  if (pendingError) throw pendingError
  if (pending) return pending

  const { data: lastTrial, error: lastError } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)
    .eq('tier_number', tier)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastError) throw lastError

  let eligible
  if (!lastTrial) {
    eligible = daysSince(tierStartedAt, today) >= 14
  } else if (lastTrial.status === 'retry') {
    eligible = Boolean(lastTrial.retried_at) && daysSince(lastTrial.retried_at, today) >= 7
  } else {
    eligible = false // 'cleared' for this tier_number already — don't regenerate
  }
  if (!eligible) return null

  const trialContent = trials.find((t) => t.tier === tier)
  if (!trialContent) return null // no trial defined past the max tier

  const { data: inserted, error: insertError } = await supabase
    .from('trials')
    .insert({ user_id: userId, tier_number: tier, status: 'pending' })
    .select()
    .single()
  if (insertError) throw insertError
  return inserted
}

function meetsTarget(value, mealSideQuest) {
  return mealSideQuest.comparison === 'gte' ? value >= mealSideQuest.target : value <= mealSideQuest.target
}

function QuestCard({ title, desc, xp, done, submitting, onComplete, badge }) {
  return (
    <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        {badge && <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{badge}</span>}
      </div>
      <p className="mt-1 text-sm text-slate-300">{desc}</p>
      <p className="mt-1 text-xs text-blue-300">{xp} XP</p>
      {done ? (
        <p className="mt-3 text-sm text-green-400">Completed</p>
      ) : (
        <button
          onClick={onComplete}
          disabled={submitting}
          className="mt-3 w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Mark complete'}
        </button>
      )}
    </div>
  )
}

export default function Today({ session, userRow }) {
  const userId = session.user.id
  const today = todayISODate()

  const [dailyLog, setDailyLog] = useState(undefined) // undefined = loading
  const [tier, setTier] = useState(undefined)
  const [xpStats, setXpStats] = useState(undefined)
  const [streak, setStreak] = useState(undefined)
  const [bestStreak, setBestStreak] = useState(undefined)
  const [proteinInput, setProteinInput] = useState('')
  const [mealSideInput, setMealSideInput] = useState('')
  const [lastWeightLog, setLastWeightLog] = useState(undefined) // undefined = loading, null = none yet
  const [weightInput, setWeightInput] = useState('')
  const [pendingTrial, setPendingTrial] = useState(undefined) // undefined = loading, null = none pending
  const [achievementToast, setAchievementToast] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState('') // '' | 'workout' | 'rest' | 'protein' | 'mealSide' | 'weight' | 'trial'

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [
        { data: tiersRow, error: tiersError },
        { data: xp, error: xpError },
        { data: userRowFresh, error: userError },
        { data: weightRow, error: weightError },
      ] = await Promise.all([
        supabase.from('tiers').select('current_tier, tier_started_at').eq('user_id', userId).maybeSingle(),
        supabase.from('xp_stats').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('users').select('best_streak').eq('id', userId).maybeSingle(),
        supabase
          .from('weight_logs')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (cancelled) return
      if (tiersError || xpError || userError || weightError) {
        setError((tiersError || xpError || userError || weightError).message)
        return
      }

      const tierValue = tiersRow?.current_tier ?? 0
      setTier(tierValue)
      setXpStats(xp)
      setBestStreak(userRowFresh?.best_streak ?? 0)
      setLastWeightLog(weightRow ?? null)

      try {
        const trial = await resolvePendingTrial(userId, tierValue, tiersRow?.tier_started_at, today)
        if (cancelled) return
        setPendingTrial(trial)
      } catch (trialErr) {
        if (cancelled) return
        setError(trialErr.message)
        return
      }

      const { data: existingLog, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()
      if (cancelled) return
      if (logError) {
        setError(logError.message)
        return
      }

      if (existingLog) {
        setDailyLog(existingLog)
        setProteinInput(existingLog.meal_protein_logged ?? '')
        setMealSideInput(existingLog.meal_side_value ?? '')
        return
      }

      const quests = deriveQuests(userRow, tierValue, today, userId)
      const newLog = {
        user_id: userId,
        date: today,
        is_training_day: quests.trainingToday,
        workout_quest_key: quests.trainingToday
          ? (quests.runToday ? quests.workoutQuest.name : quests.workoutQuest.key)
          : null,
        workout_done: false,
        rest_quest_key: quests.trainingToday ? null : quests.restQuest.key,
        rest_quest_done: false,
        meal_protein_logged: null,
        meal_quest_done: false,
        meal_side_quest_key: quests.mealSideQuest.key,
        meal_side_value: null,
        meal_side_done: false,
      }

      // upsert + ignoreDuplicates (not plain insert): if this fires twice for the
      // same day — e.g. React StrictMode's dev double-effect — the unique index
      // on (user_id, date) makes the second call a no-op instead of erroring or
      // creating a duplicate row. Either way, re-fetch to get the canonical row.
      const { error: upsertError } = await supabase
        .from('daily_logs')
        .upsert(newLog, { onConflict: 'user_id,date', ignoreDuplicates: true })
      if (cancelled) return
      if (upsertError) {
        setError(upsertError.message)
        return
      }

      const { data: finalLog, error: fetchError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()
      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setDailyLog(finalLog)
      setProteinInput(finalLog.meal_protein_logged ?? '')
      setMealSideInput(finalLog.meal_side_value ?? '')
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, today, userRow])

  async function addXp(field, baseAmount) {
    const multiplier = computeMultiplier(streak ?? 0)
    const amount = Math.round(baseAmount * (1 + multiplier))
    const newValue = (xpStats?.[field] ?? 0) + amount
    const { error: xpError } = await supabase.from('xp_stats').update({ [field]: newValue }).eq('user_id', userId)
    if (xpError) throw xpError
    setXpStats((prev) => ({ ...prev, [field]: newValue }))
  }

  // Runs after every completion action. Never lets an achievement-check
  // failure surface as a user-facing error — it's a bonus layer on top of an
  // action that already succeeded.
  async function runAchievementCheck() {
    try {
      const unlocked = await checkAchievements(userId)
      if (unlocked.length > 0) {
        setAchievementToast(unlocked.map((a) => a.name).join(', '))
        setTimeout(() => setAchievementToast(null), 4000)
      }
    } catch (err) {
      console.error('Achievement check failed:', err)
    }
  }

  // Recompute the streak whenever a completion flag changes (including today's,
  // so completing the last quest of the day bumps the streak immediately).
  useEffect(() => {
    if (!dailyLog) return
    let cancelled = false

    async function refreshStreak() {
      const value = await computeStreak(userId, today)
      if (cancelled) return
      setStreak(value)

      if (bestStreak !== undefined && value > bestStreak) {
        const { error: bestError } = await supabase.from('users').update({ best_streak: value }).eq('id', userId)
        if (!cancelled && !bestError) setBestStreak(value)
      }
    }

    refreshStreak()
    return () => {
      cancelled = true
    }
  }, [dailyLog?.workout_done, dailyLog?.rest_quest_done, dailyLog?.meal_quest_done])

  async function completeWorkout(workoutQuest, runToday) {
    setSubmitting('workout')
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({ workout_done: true })
        .eq('id', dailyLog.id)
      if (updateError) throw updateError
      await addXp(runToday ? 'endurance_xp' : 'strength_xp', workoutQuest.xp)
      setDailyLog((prev) => ({ ...prev, workout_done: true }))
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function completeRest(restQuest) {
    setSubmitting('rest')
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({ rest_quest_done: true })
        .eq('id', dailyLog.id)
      if (updateError) throw updateError
      await addXp('discipline_xp', restQuest.xp)
      setDailyLog((prev) => ({ ...prev, rest_quest_done: true }))
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  // Award nutrition_xp exactly once, at the moment the SECOND half (protein or
  // side-quest) becomes done — whichever finishes first just sets its own flag.
  async function maybeAwardMealXp(otherHalfAlreadyDone) {
    if (otherHalfAlreadyDone) {
      await addXp('nutrition_xp', MEAL_QUEST_XP)
    }
  }

  async function commitProtein() {
    if (!dailyLog || dailyLog.meal_quest_done) return
    if (proteinInput === '' || Number.isNaN(Number(proteinInput))) return
    const value = Number(proteinInput)
    const nowDone = value >= userRow.protein_target
    setSubmitting('protein')
    setError('')
    try {
      const updates = { meal_protein_logged: value }
      if (nowDone) updates.meal_quest_done = true
      const { error: updateError } = await supabase.from('daily_logs').update(updates).eq('id', dailyLog.id)
      if (updateError) throw updateError
      if (nowDone) await maybeAwardMealXp(dailyLog.meal_side_done)
      setDailyLog((prev) => ({ ...prev, ...updates }))
      if (nowDone) await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function commitMealSideNumber(mealSideQuest) {
    if (!dailyLog || dailyLog.meal_side_done) return
    if (mealSideInput === '' || Number.isNaN(Number(mealSideInput))) return
    const value = Number(mealSideInput)
    const nowDone = meetsTarget(value, mealSideQuest)
    setSubmitting('mealSide')
    setError('')
    try {
      const updates = { meal_side_value: value }
      if (nowDone) updates.meal_side_done = true
      const { error: updateError } = await supabase.from('daily_logs').update(updates).eq('id', dailyLog.id)
      if (updateError) throw updateError
      if (nowDone) await maybeAwardMealXp(dailyLog.meal_quest_done)
      setDailyLog((prev) => ({ ...prev, ...updates }))
      if (nowDone) await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function completeMealSideBoolean() {
    if (!dailyLog || dailyLog.meal_side_done) return
    setSubmitting('mealSide')
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({ meal_side_done: true })
        .eq('id', dailyLog.id)
      if (updateError) throw updateError
      await maybeAwardMealXp(dailyLog.meal_quest_done)
      setDailyLog((prev) => ({ ...prev, meal_side_done: true }))
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function logWeight() {
    if (weightInput === '' || Number.isNaN(Number(weightInput))) {
      setError('Enter a weight first.')
      return
    }
    setSubmitting('weight')
    setError('')
    const value = Number(weightInput)
    try {
      const { error: insertError } = await supabase
        .from('weight_logs')
        .insert({ user_id: userId, date: today, weight: value })
      if (insertError) throw insertError
      setLastWeightLog({ date: today })
      setWeightInput('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function clearTrial(trial) {
    setSubmitting('trial')
    setError('')
    try {
      const maxTier = workoutPools.length - 1
      const newTier = Math.min(tier + 1, maxTier)
      const { error: trialErr } = await supabase
        .from('trials')
        .update({ status: 'cleared', cleared_at: today })
        .eq('id', trial.id)
      if (trialErr) throw trialErr
      const { error: tierErr } = await supabase
        .from('tiers')
        .update({ current_tier: newTier, tier_started_at: today })
        .eq('user_id', userId)
      if (tierErr) throw tierErr
      setTier(newTier)
      setPendingTrial(null)
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function retryTrial(trial) {
    setSubmitting('trial')
    setError('')
    try {
      const { error: trialErr } = await supabase
        .from('trials')
        .update({ status: 'retry', retried_at: today })
        .eq('id', trial.id)
      if (trialErr) throw trialErr
      setPendingTrial(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  if (error && (dailyLog === undefined || tier === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center text-red-300">
        {error}
      </div>
    )
  }

  if (dailyLog === undefined || tier === undefined || lastWeightLog === undefined || pendingTrial === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
    )
  }

  const quests = deriveQuests(userRow, tier, today, userId)
  const showWeighIn = !lastWeightLog || daysSince(lastWeightLog.date, today) >= 7
  const trialContent = pendingTrial ? trials.find((t) => t.tier === pendingTrial.tier_number) : null

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 pb-24 text-white">
      {achievementToast && (
        <div
          className="fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-lg bg-yellow-500 px-4 py-2 text-center text-sm font-semibold text-black shadow-lg"
          style={{ top: 'calc(5rem + env(safe-area-inset-top))' }}
        >
          🏆 Unlocked: {achievementToast}
        </div>
      )}
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Today</h1>

        {error && <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-sm shadow-lg">
          <span className="text-slate-300">
            🔥 Streak: <span className="font-semibold text-white">{streak ?? '…'}</span>
            {' '}· Best: <span className="font-semibold text-white">{bestStreak ?? '…'}</span>
          </span>
          <span className="font-semibold text-blue-300">
            +{Math.round(computeMultiplier(streak ?? 0) * 100)}% XP
          </span>
        </div>

        {pendingTrial && trialContent && (
          <div className="rounded-lg border border-yellow-500/50 bg-slate-800 p-4 shadow-lg">
            <h2 className="font-semibold text-yellow-300">⚔️ Trial: {trialContent.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{trialContent.criteria}</p>
            <p className="mt-1 text-xs text-blue-300">{trialContent.xpReward} XP</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => clearTrial(pendingTrial)}
                disabled={submitting === 'trial'}
                className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                Clear it
              </button>
              <button
                onClick={() => retryTrial(pendingTrial)}
                disabled={submitting === 'trial'}
                className="flex-1 rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Not yet
              </button>
            </div>
          </div>
        )}

        {showWeighIn && (
          <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
            <h2 className="font-semibold text-white">Weigh In</h2>
            <p className="mt-1 text-sm text-slate-300">
              {lastWeightLog ? "It's been a week — log your weight today." : 'Log your weight to start tracking progress.'}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="kg"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={logWeight}
                disabled={submitting === 'weight'}
                className="shrink-0 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
              >
                {submitting === 'weight' ? 'Saving…' : 'Log weight'}
              </button>
            </div>
          </div>
        )}

        {quests.trainingToday ? (
          <QuestCard
            title={quests.workoutQuest.name}
            desc={quests.workoutQuest.desc}
            xp={quests.workoutQuest.xp}
            done={dailyLog.workout_done}
            submitting={submitting === 'workout'}
            onComplete={() => completeWorkout(quests.workoutQuest, quests.runToday)}
          />
        ) : (
          <QuestCard
            title={quests.restQuest.name}
            desc={quests.restQuest.desc}
            xp={quests.restQuest.xp}
            done={dailyLog.rest_quest_done}
            submitting={submitting === 'rest'}
            onComplete={() => completeRest(quests.restQuest)}
            badge="Optional"
          />
        )}

        <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
          <h2 className="font-semibold text-white">Meal Quest</h2>

          <label className="mt-3 block text-sm text-slate-300">
            Protein (g) — target {userRow.protein_target}g
            <input
              type="number"
              min="0"
              value={proteinInput}
              onChange={(e) => setProteinInput(e.target.value)}
              onBlur={commitProtein}
              disabled={dailyLog.meal_quest_done}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-60"
            />
          </label>
          {dailyLog.meal_quest_done && <p className="mt-1 text-sm text-green-400">Protein target hit</p>}

          <div className="mt-4 border-t border-slate-700 pt-3">
            <p className="text-sm text-slate-300">{quests.mealSideQuest.text}</p>

            {quests.mealSideQuest.type === 'number' ? (
              <>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={quests.mealSideQuest.unit}
                  value={mealSideInput}
                  onChange={(e) => setMealSideInput(e.target.value)}
                  onBlur={() => commitMealSideNumber(quests.mealSideQuest)}
                  disabled={dailyLog.meal_side_done}
                  className="mt-2 w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-60"
                />
                {dailyLog.meal_side_done && <p className="mt-1 text-sm text-green-400">Completed</p>}
              </>
            ) : dailyLog.meal_side_done ? (
              <p className="mt-2 text-sm text-green-400">Completed</p>
            ) : (
              <button
                onClick={completeMealSideBoolean}
                disabled={submitting === 'mealSide'}
                className="mt-2 w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
              >
                {submitting === 'mealSide' ? 'Saving…' : 'Mark complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
