import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DAYS, pickRunDay, todayISODate } from '../lib/onboarding'

export default function Onboarding({ session, onComplete }) {
  const [heightCm, setHeightCm] = useState('')
  const [startingWeight, setStartingWeight] = useState('')
  const [age, setAge] = useState('')
  const [freeDays, setFreeDays] = useState([])
  const [proteinTarget, setProteinTarget] = useState(160)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleDay(index) {
    setFreeDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (freeDays.length === 0) {
      setError('Pick at least one day you’re free to train.')
      return
    }

    setSubmitting(true)

    const userId = session.user.id
    const startDate = todayISODate()
    const runDay = pickRunDay(freeDays)

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        start_date: startDate,
        protein_target: Number(proteinTarget),
        height_cm: Number(heightCm),
        starting_weight: Number(startingWeight),
        age: Number(age),
        free_days: freeDays,
        run_day: runDay,
      })
      .select()
      .single()

    if (userError) {
      setError(userError.message)
      setSubmitting(false)
      return
    }

    const { error: tiersError } = await supabase.from('tiers').insert({
      user_id: userId,
      current_tier: 0,
      tier_started_at: startDate,
    })

    if (tiersError) {
      setError(tiersError.message)
      setSubmitting(false)
      return
    }

    const { error: xpError } = await supabase.from('xp_stats').insert({
      user_id: userId,
      strength_xp: 0,
      endurance_xp: 0,
      discipline_xp: 0,
      nutrition_xp: 0,
    })

    if (xpError) {
      setError(xpError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onComplete(userRow)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: 'var(--bg)' }}>
      <form onSubmit={handleSubmit} className="bracket-panel w-full max-w-md space-y-6">
        <div className="bl" /><div className="br" />
        <div>
          <p className="eyebrow">New Hunter</p>
          <h1 className="page-title">Set up your profile</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>This only takes a minute.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="field-label">
            Height (cm)
            <input
              type="number"
              required
              min="1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="field-input mt-1"
            />
          </label>
          <label className="field-label">
            Weight (kg)
            <input
              type="number"
              required
              min="1"
              step="0.1"
              value={startingWeight}
              onChange={(e) => setStartingWeight(e.target.value)}
              className="field-input mt-1"
            />
          </label>
          <label className="field-label">
            Age
            <input
              type="number"
              required
              min="1"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="field-input mt-1"
            />
          </label>
        </div>

        <div className="divider"><span>Which days are you free to train?</span></div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, index) => (
            <label key={day} className={`day-toggle ${freeDays.includes(index) ? 'is-active' : ''}`}>
              <span>{day}</span>
              <input type="checkbox" checked={freeDays.includes(index)} onChange={() => toggleDay(index)} />
            </label>
          ))}
        </div>

        <label className="field-label">
          Protein target (g)
          <input
            type="number"
            required
            min="1"
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            className="field-input mt-1"
          />
        </label>

        {error && <p className="status-error">{error}</p>}

        <button type="submit" disabled={submitting} className="quest-btn">
          {submitting ? '[ Saving… ]' : '[ Start ]'}
        </button>
      </form>
    </div>
  )
}
