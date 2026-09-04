import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DAYS, todayISODate } from '../lib/onboarding'

export default function Settings({ session, userRow, onUserRowChange }) {
  const userId = session.user.id
  const [freeDays, setFreeDays] = useState(userRow.free_days)
  const [proteinTarget, setProteinTarget] = useState(userRow.protein_target)
  const [saved, setSaved] = useState(false)
  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState('') // '' | 'save' | 'reset'

  function toggleDay(index) {
    setSaved(false)
    setFreeDays((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]))
  }

  async function saveSettings() {
    if (freeDays.length === 0) {
      setError('Pick at least one day you’re free to train.')
      return
    }
    if (proteinTarget === '' || Number.isNaN(Number(proteinTarget))) {
      setError('Enter a valid protein target.')
      return
    }
    setSubmitting('save')
    setError('')
    try {
      const updates = { free_days: freeDays, protein_target: Number(proteinTarget) }
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      if (updateError) throw updateError
      onUserRowChange(data)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  async function resetAllData() {
    setSubmitting('reset')
    setError('')
    try {
      const deletes = await Promise.all([
        supabase.from('daily_logs').delete().eq('user_id', userId),
        supabase.from('weight_logs').delete().eq('user_id', userId),
        supabase.from('trials').delete().eq('user_id', userId),
        supabase.from('achievements').delete().eq('user_id', userId),
      ])
      const deleteError = deletes.find((r) => r.error)?.error
      if (deleteError) throw deleteError

      const { error: tierError } = await supabase
        .from('tiers')
        .update({ current_tier: 0, tier_started_at: todayISODate() })
        .eq('user_id', userId)
      if (tierError) throw tierError

      const { error: xpError } = await supabase
        .from('xp_stats')
        .update({ strength_xp: 0, endurance_xp: 0, discipline_xp: 0, nutrition_xp: 0 })
        .eq('user_id', userId)
      if (xpError) throw xpError

      const { error: bestError } = await supabase.from('users').update({ best_streak: 0 }).eq('id', userId)
      if (bestError) throw bestError

      setResetConfirming(false)
      setResetDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting('')
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-md space-y-4">
        <p className="eyebrow">Hunter Config</p>
        <h1 className="page-title mb-2">Settings</h1>

        {error && <p className="status-error">{error}</p>}

        <div className="bracket-panel">
          <div className="bl" /><div className="br" />
          <div className="divider" style={{ margin: '0 0 10px' }}><span>Free Days</span></div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day, index) => (
              <label key={day} className={`day-toggle ${freeDays.includes(index) ? 'is-active' : ''}`}>
                <span>{day}</span>
                <input type="checkbox" checked={freeDays.includes(index)} onChange={() => toggleDay(index)} />
              </label>
            ))}
          </div>

          <label className="field-label mt-4 block">
            Protein target (g)
            <input
              type="number"
              min="1"
              value={proteinTarget}
              onChange={(e) => {
                setProteinTarget(e.target.value)
                setSaved(false)
              }}
              className="field-input mt-1"
            />
          </label>

          {saved && <p className="status-ok mt-3">Saved</p>}
          <button onClick={saveSettings} disabled={submitting === 'save'} className="quest-btn mt-3">
            {submitting === 'save' ? '[ Saving… ]' : '[ Save changes ]'}
          </button>
        </div>

        <div className="bracket-panel" style={{ borderColor: 'var(--error)' }}>
          <div className="bl" style={{ borderColor: 'var(--error)' }} /><div className="br" style={{ borderColor: 'var(--error)' }} />
          <div className="divider" style={{ margin: '0 0 10px' }}>
            <span style={{ color: 'var(--error)' }}>Danger Zone</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Permanently clears your quest history, weigh-ins, trials, and achievements, and resets your tier and XP.
            Your profile stays.
          </p>

          {resetDone ? (
            <p className="status-ok mt-3">All data reset.</p>
          ) : resetConfirming ? (
            <div className="mt-3 space-y-2">
              <p className="status-error">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={resetAllData}
                  disabled={submitting === 'reset'}
                  className="quest-btn is-danger flex-1"
                >
                  {submitting === 'reset' ? '[ Resetting… ]' : '[ Yes, reset everything ]'}
                </button>
                <button
                  onClick={() => setResetConfirming(false)}
                  disabled={submitting === 'reset'}
                  className="quest-btn is-quiet flex-1"
                >
                  [ Cancel ]
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setResetConfirming(true)} className="quest-btn is-danger mt-3">
              [ Reset all data ]
            </button>
          )}
        </div>

        <button onClick={() => supabase.auth.signOut()} className="quest-btn is-quiet">
          [ Sign out ]
        </button>
      </div>
    </div>
  )
}
