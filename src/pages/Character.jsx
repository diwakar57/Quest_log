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
  { field: 'strength_xp', label: 'Strength' },
  { field: 'endurance_xp', label: 'Endurance' },
  { field: 'discipline_xp', label: 'Discipline' },
  { field: 'nutrition_xp', label: 'Nutrition' },
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
      <div className="status-error flex min-h-screen items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        {error}
      </div>
    )
  }

  if (xpStats === undefined || unlockedKeys === undefined) {
    return (
      <div className="mono flex min-h-screen items-center justify-center text-sm" style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>
        Loading…
      </div>
    )
  }

  const totalXp = STATS.reduce((sum, s) => sum + (xpStats?.[s.field] ?? 0), 0)
  const level = levelForXp(totalXp)
  const rank = rankForLevel(level)
  const currentThreshold = level === 0 ? 0 : xpForLevel(level)
  const nextThreshold = xpForLevel(level + 1)
  const progress = Math.min(1, (totalXp - currentThreshold) / (nextThreshold - currentThreshold))

  return (
    <div className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Hunter Data</p>
        <h1 className="page-title mb-4">Character</h1>

        <div className="bracket-panel">
          <div className="bl" /><div className="br" />
          <div className="status-head">
            <span className="status-title">Status</span>
            <span className="rank-tag">Rank <b>{rank}</b></span>
          </div>

          <div className="stat-line"><span className="k">LEVEL</span><span className="v mono">{String(level).padStart(2, '0')}</span></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          <div className="bar-caption">
            <span>{totalXp - currentThreshold} / {nextThreshold - currentThreshold} XP</span>
            <span>NEXT: LV {String(level + 1).padStart(2, '0')}</span>
          </div>

          <div className="divider"><span>Attributes</span></div>
          <div className="stat-grid">
            {STATS.map((s) => (
              <div key={s.field} className="stat-cell">
                <div className="lbl">{s.label}</div>
                <div className="num">{xpStats?.[s.field] ?? 0}</div>
              </div>
            ))}
          </div>

          <div className="divider"><span>Achievements</span></div>
          {unlockedKeys.size === 0 ? (
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              None unlocked yet — complete quests to earn your first one.
            </p>
          ) : (
            <ul className="space-y-2">
              {achievements
                .filter((a) => unlockedKeys.has(a.key))
                .map((a) => (
                  <li key={a.key} className="flex items-start justify-between gap-3 text-xs">
                    <span className="mono">
                      <span style={{ color: 'var(--cyan)' }}>{a.name}</span>
                      <span style={{ color: 'var(--text-dim)' }}> — {a.condition}</span>
                    </span>
                    <span className="mono shrink-0" style={{ color: 'var(--text-dim)' }}>{unlockedKeys.get(a.key)}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
