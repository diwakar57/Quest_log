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
    <div className="min-h-screen bg-slate-900 px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>

        {error && <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
          <p className="text-sm text-slate-300">Which days are you free to train?</p>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {DAYS.map((day, index) => (
              <label
                key={day}
                className="flex flex-col items-center gap-1 rounded border border-slate-600 py-2 text-xs text-slate-300"
              >
                <span>{day}</span>
                <input type="checkbox" checked={freeDays.includes(index)} onChange={() => toggleDay(index)} />
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm text-slate-300">
            Protein target (g)
            <input
              type="number"
              min="1"
              value={proteinTarget}
              onChange={(e) => {
                setProteinTarget(e.target.value)
                setSaved(false)
              }}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          {saved && <p className="mt-3 text-sm text-green-400">Saved</p>}
          <button
            onClick={saveSettings}
            disabled={submitting === 'save'}
            className="mt-3 w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {submitting === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <div className="rounded-lg border border-red-500/40 bg-slate-800 p-4 shadow-lg">
          <h2 className="font-semibold text-red-300">Danger Zone</h2>
          <p className="mt-1 text-sm text-slate-300">
            Permanently clears your quest history, weigh-ins, trials, and achievements, and resets your tier and XP.
            Your profile stays.
          </p>

          {resetDone ? (
            <p className="mt-3 text-sm text-green-400">All data reset.</p>
          ) : resetConfirming ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-red-300">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={resetAllData}
                  disabled={submitting === 'reset'}
                  className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {submitting === 'reset' ? 'Resetting…' : 'Yes, reset everything'}
                </button>
                <button
                  onClick={() => setResetConfirming(false)}
                  disabled={submitting === 'reset'}
                  className="flex-1 rounded bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirming(true)}
              className="mt-3 w-full rounded bg-red-600/80 px-4 py-2 font-medium text-white hover:bg-red-500"
            >
              Reset all data
            </button>
          )}
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full rounded bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
