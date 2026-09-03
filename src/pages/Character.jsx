import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { achievements } from '../content/achievements'

// level N requires round(50 * N^1.6) cumulative XP — fast growth early, sharply
// slower at higher levels (see Claude_Code_Build_Tasks.md TASK 8).
function xpForLevel(n) {
  return Math.round(50 * Math.pow(n, 1.6))
}

function levelForXp(totalXp) {
  let level = 0
  while (xpForLevel(level + 1) <= totalXp) {
    level++
  }
  return level
}

function rankForLevel(level) {
  if (level >= 50) return 'S'
  if (level >= 40) return 'A'
  if (level >= 30) return 'B'
  if (level >= 20) return 'C'
  if (level >= 10) return 'D'
  return 'E'
}

const STATS = [
  { field: 'strength_xp', label: 'Strength', color: 'bg-red-500' },
  { field: 'endurance_xp', label: 'Endurance', color: 'bg-green-500' },
  { field: 'discipline_xp', label: 'Discipline', color: 'bg-blue-500' },
  { field: 'nutrition_xp', label: 'Nutrition', color: 'bg-yellow-500' },
]

export default function Character({ session }) {
  const userId = session.user.id
  const [xpStats, setXpStats] = useState(undefined) // undefined = loading
  const [unlockedKeys, setUnlockedKeys] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('xp_stats').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('achievements').select('key, unlocked_at').eq('user_id', userId),
    ]).then(([{ data: xp, error: xpError }, { data: unlocked, error: achError }]) => {
      if (cancelled) return
      if (xpError || achError) {
        setError((xpError || achError).message)
        return
      }
      setXpStats(xp)
      setUnlockedKeys(new Map(unlocked.map((a) => [a.key, a.unlocked_at])))
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center text-red-300">
        {error}
      </div>
    )
  }

  if (xpStats === undefined || unlockedKeys === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
    )
  }

  const totalXp = STATS.reduce((sum, s) => sum + (xpStats?.[s.field] ?? 0), 0)
  const level = levelForXp(totalXp)
  const rank = rankForLevel(level)
  const currentThreshold = level === 0 ? 0 : xpForLevel(level)
  const nextThreshold = xpForLevel(level + 1)
  const progress = Math.min(1, (totalXp - currentThreshold) / (nextThreshold - currentThreshold))

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Character</h1>

        <div className="rounded-lg bg-slate-800 p-6 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold">
            {rank}
          </div>
          <p className="mt-3 text-lg font-semibold">Level {level}</p>
          <p className="text-sm text-slate-400">{totalXp} XP total</p>

          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full bg-blue-500" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {totalXp - currentThreshold} / {nextThreshold - currentThreshold} XP to level {level + 1}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {STATS.map((s) => {
            const value = xpStats?.[s.field] ?? 0
            const width = totalXp > 0 ? Math.round((value / totalXp) * 100) : 0
            return (
              <div key={s.field} className="rounded-lg bg-slate-800 p-4 shadow-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-slate-400">{value} XP</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div className={`h-full ${s.color}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
          <h2 className="font-semibold text-white">Achievements</h2>
          {unlockedKeys.size === 0 ? (
            <p className="mt-2 text-sm text-slate-400">None unlocked yet — complete quests to earn your first one.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {achievements
                .filter((a) => unlockedKeys.has(a.key))
                .map((a) => (
                  <li key={a.key} className="flex items-center justify-between text-sm">
                    <span>
                      🏆 <span className="font-medium text-white">{a.name}</span>
                      <span className="ml-1 text-slate-400">— {a.condition}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{unlockedKeys.get(a.key)}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
