import { useCallback, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { todayISODate } from '../lib/onboarding'

const SERIES_COLOR = '#3FA9E0' // --cyan
const CHART_HEIGHT = 240
const GRID_WEEKS = 12
const GRID_DAYS = GRID_WEEKS * 7

// Recharts' ResponsiveContainer sizes itself via ResizeObserver, which can miss
// its first measurement under React StrictMode's double-mount in dev, leaving
// the chart permanently 0x0 with no error. Measuring the container ourselves
// avoids that — and it must be a CALLBACK ref, not a plain ref + effect with []
// deps: the chart div doesn't exist on Progress's first render (data is still
// loading), so an effect that only runs once on mount would find `ref.current`
// null and never set up the observer at all. A callback ref fires whenever the
// node actually appears, however many renders later that is.
function useContainerWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(0)
  const ref = useCallback((el) => setNode(el), [])

  useEffect(() => {
    if (!node) return
    setWidth(node.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setWidth(w)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [ref, width]
}

function movingAverage(points, windowSize) {
  return points.map((point, i) => {
    const start = Math.max(0, i - windowSize + 1)
    const windowSlice = points.slice(start, i + 1)
    const avg = windowSlice.reduce((sum, p) => sum + p.weight, 0) / windowSlice.length
    return { date: point.date, weight: Math.round(avg * 10) / 10 }
  })
}

function dateRangeFrom(startDate, count) {
  const [y, m, d] = startDate.split('-').map(Number)
  const dates = []
  for (let i = 0; i < count; i++) {
    dates.push(new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10))
  }
  return dates
}

// Each day has 2 trackable quest flags: (workout_done or rest_quest_done,
// depending on day type) + meal_quest_done. This mirrors, but is separate
// from, streakLogic's isDayComplete (which only requires meal_quest_done on
// a rest day) — here both flags count so a rest day can show "half" too.
function dayCompletionLevel(row, isFuture) {
  if (isFuture) return 'future'
  if (!row) return 'miss'
  const flagA = row.is_training_day ? row.workout_done : row.rest_quest_done
  const doneCount = (flagA ? 1 : 0) + (row.meal_quest_done ? 1 : 0)
  if (doneCount === 2) return 'filled'
  if (doneCount === 1) return 'half'
  return 'miss'
}

const CELL_STYLE = {
  filled: { background: 'var(--cyan)' },
  half: { background: 'var(--cyan-dim)' },
  miss: { background: 'var(--line)' },
  future: { border: '1px solid var(--line)' },
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="mono border px-3 py-2" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>
        <span className="inline-block h-0.5 w-3" style={{ backgroundColor: SERIES_COLOR }} />
        {payload[0].value} kg
      </p>
    </div>
  )
}

export default function Progress({ session, userRow }) {
  const userId = session.user.id
  const [logs, setLogs] = useState(undefined) // undefined = loading
  const [gridLogsByDate, setGridLogsByDate] = useState(undefined)
  const [error, setError] = useState('')
  const [chartRef, chartWidth] = useContainerWidth()

  useEffect(() => {
    let cancelled = false
    supabase
      .from('weight_logs')
      .select('date, weight')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        setLogs(data)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    const gridDates = dateRangeFrom(userRow.start_date, GRID_DAYS)
    const endDate = gridDates[gridDates.length - 1]

    supabase
      .from('daily_logs')
      .select('date, is_training_day, workout_done, rest_quest_done, meal_quest_done')
      .eq('user_id', userId)
      .gte('date', userRow.start_date)
      .lte('date', endDate)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        const byDate = {}
        for (const row of data) byDate[row.date] = row
        setGridLogsByDate(byDate)
      })
    return () => {
      cancelled = true
    }
  }, [userId, userRow.start_date])

  if (error) {
    return (
      <div className="status-error flex min-h-screen items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        {error}
      </div>
    )
  }

  if (logs === undefined || gridLogsByDate === undefined) {
    return (
      <div className="mono flex min-h-screen items-center justify-center text-sm" style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>
        Loading…
      </div>
    )
  }

  const smoothed = movingAverage(logs, 3)
  const today = todayISODate()
  const gridDates = dateRangeFrom(userRow.start_date, GRID_DAYS)
  const gridWeeks = []
  for (let w = 0; w < GRID_WEEKS; w++) {
    gridWeeks.push(gridDates.slice(w * 7, w * 7 + 7))
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Hunter Log</p>
        <h1 className="page-title mb-4">Progress</h1>

        {logs.length === 0 ? (
          <p className="mono mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            No weigh-ins logged yet — log one on Today to start your chart.
          </p>
        ) : (
          <div className="bracket-panel mb-4">
            <div className="bl" /><div className="br" />
            <div className="divider" style={{ margin: '0 0 10px' }}><span>Weight — 3-day avg (kg)</span></div>
            <div ref={chartRef} style={{ height: CHART_HEIGHT }}>
              {chartWidth > 0 && (
                <LineChart
                  width={chartWidth}
                  height={CHART_HEIGHT}
                  data={smoothed}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke="#1C2733" strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#1C2733"
                    tick={{ fontSize: 11, fill: '#5C6B7A' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#1C2733"
                    tick={{ fontSize: 11, fill: '#5C6B7A' }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3FA9E0', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={SERIES_COLOR}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 5, fill: SERIES_COLOR, stroke: '#0D1117', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </div>
          </div>
        )}

        <div className="bracket-panel">
          <div className="bl" /><div className="br" />
          <div className="divider" style={{ margin: '0 0 10px' }}><span>12-Week Grid</span></div>
          <div className="space-y-1">
            {gridWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {week.map((dateStr) => {
                  const level = dayCompletionLevel(gridLogsByDate[dateStr], dateStr > today)
                  return <div key={dateStr} title={dateStr} className="h-5 w-5" style={CELL_STYLE[level]} />
                })}
              </div>
            ))}
          </div>
          <div className="mono mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3" style={CELL_STYLE.filled} /> Both done</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3" style={CELL_STYLE.half} /> One done</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3" style={CELL_STYLE.miss} /> Missed</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3" style={CELL_STYLE.future} /> Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  )
}
