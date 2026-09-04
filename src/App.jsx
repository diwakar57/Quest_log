import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { activeDebugDate } from './lib/onboarding'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Today from './pages/Today'
import Character from './pages/Character'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

function DebugDateBanner() {
  const debugDate = activeDebugDate()
  if (!debugDate) return null

  return (
    <div
      className="mono fixed right-2 z-50 border px-3 py-1.5 text-xs"
      style={{
        top: 'calc(0.5rem + env(safe-area-inset-top))',
        background: 'var(--panel)',
        borderColor: 'var(--cyan)',
        color: 'var(--cyan)',
      }}
    >
      DEBUG DATE: {debugDate} — CLEAR WITH ?debugDate=clear
    </div>
  )
}

function BottomNav({ view, onChange }) {
  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'character', label: 'Character' },
    { key: 'progress', label: 'Progress' },
    { key: 'settings', label: 'Settings' },
  ]
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex"
      style={{ borderTop: '1px solid var(--line)', background: 'var(--panel)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="mono flex-1 py-3 text-xs tracking-widest uppercase"
          style={{ color: view === tab.key ? 'var(--cyan)' : 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span className="mono text-sm" style={{ color: 'var(--text-dim)' }}>Loading…</span>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out
  const [userRow, setUserRow] = useState(undefined) // undefined = loading, null = no row yet
  const [view, setView] = useState('today')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      setUserRow(null)
      return
    }

    setUserRow(undefined)
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setUserRow(data))
  }, [session])

  let content
  let showNav = false
  if (session === undefined) {
    content = <LoadingScreen />
  } else if (!session) {
    content = <Login />
  } else if (userRow === undefined) {
    content = <LoadingScreen />
  } else if (!userRow) {
    content = <Onboarding session={session} onComplete={setUserRow} />
  } else {
    showNav = true
    if (view === 'character') {
      content = <Character session={session} />
    } else if (view === 'progress') {
      content = <Progress session={session} userRow={userRow} />
    } else if (view === 'settings') {
      content = <Settings session={session} userRow={userRow} onUserRowChange={setUserRow} />
    } else {
      content = <Today session={session} userRow={userRow} />
    }
  }

  return (
    <>
      {content}
      {showNav && <BottomNav view={view} onChange={setView} />}
      <DebugDateBanner />
    </>
  )
}

export default App
