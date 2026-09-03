import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')

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
      return
    }
    // Success: App.jsx's onAuthStateChange listener picks up the new session.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm rounded-lg bg-slate-800 px-8 py-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Quest Log</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with a magic link — no password needed.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 space-y-4">
            <p className="rounded bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              Check your email for the login link or the 6-digit code.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <label className="block text-sm text-slate-300">
                Enter code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-center text-lg tracking-widest text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </label>
              {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}
              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
              >
                {verifying ? 'Verifying…' : 'Verify code'}
              </button>
            </form>

            <button
              onClick={() => {
                setStatus('idle')
                setCode('')
                setVerifyError('')
              }}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
