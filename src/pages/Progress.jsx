import { useCallback, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { todayISODate } from '../lib/onboarding'

const SERIES_COLOR = '#3b82f6' // matches the app's existing blue-500 accent
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

const CELL_CLASSES = {
  filled: 'bg-blue-500',
  half: 'bg-blue-500/40',
  miss: 'bg-slate-700',
  future: 'border border-slate-600',
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded border border-slate-700 bg-slate-800 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES_COLOR }} />
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
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center text-red-300">
        {error}
      </div>
    )
  }

  if (logs === undefined || gridLogsByDate === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
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
    <div className="min-h-screen bg-slate-900 px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Progress</h1>

        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">No weigh-ins logged yet — log one on Today to start your chart.</p>
        ) : (
          <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
            <p className="text-sm text-slate-300">Weight — 3-day moving average (kg)</p>
            <div ref={chartRef} className="mt-2" style={{ height: CHART_HEIGHT }}>
              {chartWidth > 0 && (
                <LineChart
                  width={chartWidth}
                  height={CHART_HEIGHT}
                  data={smoothed}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke="#334155" strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#334155"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#334155"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={SERIES_COLOR}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 5, fill: SERIES_COLOR, stroke: '#1e293b', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-800 p-4 shadow-lg">
          <p className="text-sm text-slate-300">12-Week Grid</p>
          <div className="mt-3 space-y-1">
            {gridWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {week.map((dateStr) => {
                  const level = dayCompletionLevel(gridLogsByDate[dateStr], dateStr > today)
                  return (
                    <div
                      key={dateStr}
                      title={dateStr}
                      className={`h-5 w-5 rounded-sm ${CELL_CLASSES[level]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${CELL_CLASSES.filled}`} /> Both done
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${CELL_CLASSES.half}`} /> One done
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${CELL_CLASSES.miss}`} /> Missed
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${CELL_CLASSES.future}`} /> Upcoming
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
