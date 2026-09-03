export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Picks the selected day closest to the midpoint of the selected days' spread.
// Ties go to the earlier (lower-index) day.
export function pickRunDay(selectedDays) {
  if (selectedDays.length === 0) return null
  const sorted = [...selectedDays].sort((a, b) => a - b)
  const mid = (sorted[0] + sorted[sorted.length - 1]) / 2
  let best = sorted[0]
  let bestDist = Math.abs(sorted[0] - mid)
  for (const day of sorted) {
    const dist = Math.abs(day - mid)
    if (dist < bestDist) {
      bestDist = dist
      best = day
    }
  }
  return best
}

// Dev-only "today" override for testing date-dependent logic (quests, streaks,
// trials) without touching the system clock or waiting for real midnight.
// Usage: http://localhost:5173/?debugDate=2026-09-04 — persists in localStorage
// across reloads/navigation. Clear with ?debugDate=clear (or an empty value).
// import.meta.env.DEV is a build-time constant, so this whole block — the
// override AND its ability to ever change "today" — is dead-code-eliminated
// from production builds, not just runtime-disabled.
const DEBUG_DATE_KEY = 'questlog:debugDate'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  if (params.has('debugDate')) {
    const value = params.get('debugDate')
    if (!value || value === 'clear') {
      window.localStorage.removeItem(DEBUG_DATE_KEY)
    } else if (DATE_RE.test(value)) {
      window.localStorage.setItem(DEBUG_DATE_KEY, value)
    } else {
      console.warn(`[debugDate] ignoring invalid value "${value}", expected YYYY-MM-DD`)
    }
  }
}

export function activeDebugDate() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(DEBUG_DATE_KEY)
  return stored && DATE_RE.test(stored) ? stored : null
}

// Local calendar date, not UTC — new Date().toISOString() uses UTC, which drifts
// from the user's actual day for hours around midnight in any non-UTC timezone.
export function todayISODate() {
  const override = activeDebugDate()
  if (override) return override

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
