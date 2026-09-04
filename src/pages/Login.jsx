import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { playClick, playError } from '../lib/sound'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    // Redirects the whole page to Google, then back through Supabase's OAuth
    // callback — no local session handling needed here on success.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
      playError()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setError(error.message)
      setStatus('error')
      playError()
      return
    }

    setStatus('sent')
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setVerifying(true)
    setVerifyError('')

    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })

    if (error) {
      setVerifyError(error.message)
      setVerifying(false)
      playError()
      return
    }
    // Success: App.jsx's onAuthStateChange listener picks up the new session.
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="bracket-panel w-full max-w-sm">
        <div className="bl" /><div className="br" />
        <p className="eyebrow">Access</p>
        <h1 className="page-title">Quest Log</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-dim)' }}>
          Sign in with a magic link — no password needed.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 space-y-4">
            <p className="mono border px-4 py-3 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}>
              Check your email for the login link or the 6-digit code.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <label className="field-label">
                Enter code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="field-input mt-1 text-center tracking-widest"
                />
              </label>
              {verifyError && <p className="status-error">{verifyError}</p>}
              <button type="submit" disabled={verifying} className="quest-btn">
                {verifying ? '[ Verifying… ]' : '[ Verify code ]'}
              </button>
            </form>

            <button
              onClick={() => {
                playClick()
                setStatus('idle')
                setCode('')
                setVerifyError('')
              }}
              className="text-btn w-full text-center"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2 border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: '#fff', color: '#1f1f1f', borderColor: 'var(--line)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="divider"><span>Or</span></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field-input"
              />
              {error && <p className="status-error">{error}</p>}
              <button type="submit" disabled={status === 'sending'} className="quest-btn">
                {status === 'sending' ? '[ Sending… ]' : '[ Send magic link ]'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
