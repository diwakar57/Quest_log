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
import { levelForXp, totalXpFrom } from '../lib/levelLogic'
import { playClick, playComplete, playLevelUp, playError } from '../lib/sound'
import { workoutPools } from '../content/workoutPools'
import { trials } from '../content/trials'
import TrialClearedOverlay from '../components/TrialClearedOverlay'

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

function QuestCard({ tag, icon, title, desc, xp, done, submitting, onComplete, optional }) {
  return (
    <div className="quest-panel">
      <div className="bl" /><div className="br" />
      <div className="quest-head">
        <span className="quest-tag">
          <i className={`ti ${icon}`} />
          {tag}
          {optional ? ' (Optional)' : ''}
        </span>
        <span className="quest-xp">+{xp} XP</span>
      </div>
      <div className="quest-body">
        <p className="quest-name">{title}</p>
        <p className="quest-desc">{desc}</p>
        {done ? (
          <p className="status-ok">Completed</p>
        ) : (
          <button onClick={onComplete} disabled={submitting} className="quest-btn">
            {submitting ? '[ Saving… ]' : '[ Complete quest ]'}
          </button>
        )}
      </div>
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
  const [clearedTrialResult, setClearedTrialResult] = useState(null) // { beforeTier, afterTier, trialContent } while the takeover overlay is showing
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
    const totalBefore = totalXpFrom(xpStats)
    const newValue = (xpStats?.[field] ?? 0) + amount
    const { error: xpError } = await supabase.from('xp_stats').update({ [field]: newValue }).eq('user_id', userId)
    if (xpError) throw xpError
    setXpStats((prev) => ({ ...prev, [field]: newValue }))
    if (levelForXp(totalBefore + amount) > levelForXp(totalBefore)) {
      playLevelUp()
    }
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
      playComplete()
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
      playError()
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
      playComplete()
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
      playError()
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
      if (nowDone) {
        playComplete()
        await runAchievementCheck()
      }
    } catch (err) {
      setError(err.message)
      playError()
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
      if (nowDone) {
        playComplete()
        await runAchievementCheck()
      }
    } catch (err) {
      setError(err.message)
      playError()
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
      playComplete()
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
      playError()
    } finally {
      setSubmitting('')
    }
  }

  async function logWeight() {
    if (weightInput === '' || Number.isNaN(Number(weightInput))) {
      setError('Enter a weight first.')
      playError()
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
      playClick()
    } catch (err) {
      setError(err.message)
      playError()
    } finally {
      setSubmitting('')
    }
  }

  async function clearTrial(trial) {
    setSubmitting('trial')
    setError('')
    try {
      const beforeTier = tier
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
      setClearedTrialResult({
        beforeTier,
        afterTier: newTier,
        trialContent: trials.find((t) => t.tier === trial.tier_number),
      })
      await runAchievementCheck()
    } catch (err) {
      setError(err.message)
      playError()
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
      playClick()
    } catch (err) {
      setError(err.message)
      playError()
    } finally {
      setSubmitting('')
    }
  }

  if (error && (dailyLog === undefined || tier === undefined)) {
    return (
      <div className="status-error flex min-h-screen items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        {error}
      </div>
    )
  }

  if (dailyLog === undefined || tier === undefined || lastWeightLog === undefined || pendingTrial === undefined) {
    return (
      <div className="mono flex min-h-screen items-center justify-center text-sm" style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>
        Loading…
      </div>
    )
  }

  const quests = deriveQuests(userRow, tier, today, userId)
  const showWeighIn = !lastWeightLog || daysSince(lastWeightLog.date, today) >= 7
  const trialContent = pendingTrial ? trials.find((t) => t.tier === pendingTrial.tier_number) : null

  return (
    <div className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {clearedTrialResult && (
        <TrialClearedOverlay
          beforeTier={clearedTrialResult.beforeTier}
          afterTier={clearedTrialResult.afterTier}
          trialContent={clearedTrialResult.trialContent}
          onContinue={() => setClearedTrialResult(null)}
        />
      )}
      {achievementToast && (
        <div
          className="mono fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 border px-4 py-2 text-center text-xs uppercase tracking-wide"
          style={{ top: 'calc(5rem + env(safe-area-inset-top))', background: 'var(--panel)', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
        >
          Unlocked: {achievementToast}
        </div>
      )}
      <div className="mx-auto max-w-md space-y-4">
        <p className="eyebrow">Daily Log</p>
        <h1 className="page-title mb-2">Today</h1>

        {error && <p className="status-error">{error}</p>}

        <div className="bracket-panel">
          <div className="bl" /><div className="br" />
          <div className="stat-line"><span className="k">STREAK</span><span className="v mono">{streak ?? '…'} DAYS</span></div>
          <div className="stat-line"><span className="k">BEST</span><span className="v mono">{bestStreak ?? '…'} DAYS</span></div>
          <div className="stat-line">
            <span className="k">XP BOOST</span>
            <span className="v mono" style={{ color: 'var(--cyan)' }}>+{Math.round(computeMultiplier(streak ?? 0) * 100)}%</span>
          </div>
        </div>

        {pendingTrial && trialContent && (
          <div className="quest-panel">
            <div className="bl" /><div className="br" />
            <div className="quest-head">
              <span className="quest-tag"><i className="ti ti-sword" />Trial</span>
              <span className="quest-xp">+{trialContent.xpReward} XP</span>
            </div>
            <div className="quest-body">
              <p className="quest-name">{trialContent.name}</p>
              <p className="quest-desc">{trialContent.criteria}</p>
              <div className="flex gap-2">
                <button onClick={() => clearTrial(pendingTrial)} disabled={submitting === 'trial'} className="quest-btn flex-1">
                  [ Clear it ]
                </button>
                <button onClick={() => retryTrial(pendingTrial)} disabled={submitting === 'trial'} className="quest-btn is-quiet flex-1">
                  [ Not yet ]
                </button>
              </div>
            </div>
          </div>
        )}

        {showWeighIn && (
          <div className="bracket-panel">
            <div className="bl" /><div className="br" />
            <div className="divider" style={{ margin: '0 0 10px' }}><span>Weigh In</span></div>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
              {lastWeightLog ? "It's been a week — log your weight today." : 'Log your weight to start tracking progress.'}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="kg"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="field-input"
              />
              <button onClick={logWeight} disabled={submitting === 'weight'} className="quest-btn shrink-0" style={{ width: 'auto', padding: '10px 16px' }}>
                {submitting === 'weight' ? '[ Saving… ]' : '[ Log ]'}
              </button>
            </div>
          </div>
        )}

        {quests.trainingToday ? (
          <QuestCard
            tag="Workout Quest"
            icon="ti-barbell"
            title={quests.workoutQuest.name}
            desc={quests.workoutQuest.desc}
            xp={quests.workoutQuest.xp}
            done={dailyLog.workout_done}
            submitting={submitting === 'workout'}
            onComplete={() => completeWorkout(quests.workoutQuest, quests.runToday)}
          />
        ) : (
          <QuestCard
            tag="Rest Quest"
            icon="ti-moon"
            title={quests.restQuest.name}
            desc={quests.restQuest.desc}
            xp={quests.restQuest.xp}
            done={dailyLog.rest_quest_done}
            submitting={submitting === 'rest'}
            onComplete={() => completeRest(quests.restQuest)}
            optional
          />
        )}

        <div className="quest-panel">
          <div className="bl" /><div className="br" />
          <div className="quest-head">
            <span className="quest-tag"><i className="ti ti-meat" />Meal Quest</span>
          </div>
          <div className="quest-body">
            <div className="input-line">
              <span>PROTEIN (G) — TARGET {userRow.protein_target}</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={proteinInput}
                onChange={(e) => setProteinInput(e.target.value)}
                onBlur={commitProtein}
                disabled={dailyLog.meal_quest_done}
              />
            </div>
            {dailyLog.meal_quest_done && <p className="status-ok mb-3">Protein target hit</p>}

            <p className="quest-desc">{quests.mealSideQuest.text}</p>

            {quests.mealSideQuest.type === 'number' ? (
              <>
                <div className="input-line">
                  <span>{quests.mealSideQuest.unit.toUpperCase()}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={mealSideInput}
                    onChange={(e) => setMealSideInput(e.target.value)}
                    onBlur={() => commitMealSideNumber(quests.mealSideQuest)}
                    disabled={dailyLog.meal_side_done}
                  />
                </div>
                {dailyLog.meal_side_done && <p className="status-ok">Completed</p>}
              </>
            ) : dailyLog.meal_side_done ? (
              <p className="status-ok">Completed</p>
            ) : (
              <button onClick={completeMealSideBoolean} disabled={submitting === 'mealSide'} className="quest-btn">
                {submitting === 'mealSide' ? '[ Saving… ]' : '[ Complete quest ]'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
