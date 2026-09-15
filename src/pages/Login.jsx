import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../data/seed'
import { getInstitute } from '../data/db'
import { GraduationIcon, ShieldIcon, UsersIcon } from '../components/Icons'
import Mascot from '../components/Mascot'
import { LogoMark } from '../components/Logo'

const roleMeta = {
  student: { icon: GraduationIcon, blurb: 'Notes, quizzes & notifications' },
  parent: { icon: UsersIcon, blurb: 'Attendance, progress & fees' },
  admin: { icon: ShieldIcon, blurb: 'Run the whole institute' },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const institute = getInstitute()

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(null)

  // The mascot reflects what is happening on the form, and rests otherwise.
  const mood = busy ? 'cheer' : error ? 'think' : focused === 'password' ? 'sleep' : 'idle'
  const line = busy
    ? 'Here we go!'
    : error
      ? 'Hmm, that did not work.'
      : focused === 'password'
        ? 'Eyes closed, promise.'
        : `Welcome to ${institute.name}!`

  const submit = (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const result = login(loginId, password)
    if (!result.ok) {
      setBusy(false)
      setError(result.error)
      return
    }
    // Let the celebrate animation land before routing away.
    setTimeout(() => navigate(`/${result.user.role}`, { replace: true }), 550)
  }

  const useDemo = (account) => {
    setLoginId(account.loginId)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="safe-top safe-bottom relative flex min-h-full flex-col justify-center overflow-hidden bg-gradient-to-b from-brand-700 via-brand-600 to-brand-900 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="halo absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />
        <div
          className="halo absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
          style={{ animationDelay: '1.4s' }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="animate-slide-up mb-2 flex flex-col items-center">
          <LogoMark size={64} className="drop-shadow-xl" />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Edu<span className="text-brand-200">Bridge</span>
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {institute.tagline}
          </p>
        </div>

        {/* mascot greeter */}
        <div className="animate-slide-up mb-1 flex items-end justify-center gap-1" style={{ animationDelay: '0.1s' }}>
          <Mascot size={104} mood={mood} lookAt interactive greet />
          <div className="bubble-bob animate-pop mb-6 max-w-[190px] rounded-2xl bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur">
            {line}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="animate-slide-up rounded-3xl bg-white p-6 shadow-2xl shadow-brand-950/30"
          style={{ animationDelay: '0.18s' }}
        >
          <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
          <p className="mb-5 mt-0.5 text-sm text-slate-500">
            Use the phone number registered with the institute.
          </p>

          <div className="mb-4">
            <label className="label" htmlFor="loginId">
              Phone number
            </label>
            <input
              id="loginId"
              className="input"
              inputMode="numeric"
              autoComplete="username"
              placeholder="9000000010"
              value={loginId}
              onFocus={() => setFocused('loginId')}
              onBlur={() => setFocused(null)}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="animate-pop mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="animate-slide-up mt-6" style={{ animationDelay: '0.26s' }}>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-white/55">
            Demo accounts — tap to fill
          </p>
          <div className="stagger grid gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const meta = roleMeta[account.role]
              const Icon = meta.icon
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => useDemo(account)}
                  className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{account.label}</span>
                    <span className="block truncate text-xs text-white/70">{meta.blurb}</span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-[11px] text-white/70">
                    {account.loginId}
                    <br />
                    {account.password}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
