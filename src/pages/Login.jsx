import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../data/seed'
import { getInstitute } from '../data/db'
import { GraduationIcon, ShieldIcon, UsersIcon } from '../components/Icons'

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

  const submit = (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const result = login(loginId, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(`/${result.user.role}`, { replace: true })
  }

  const useDemo = (account) => {
    setLoginId(account.loginId)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="safe-top safe-bottom flex min-h-full flex-col justify-center bg-gradient-to-b from-brand-700 via-brand-600 to-brand-800 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <GraduationIcon className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">EduBridge</h1>
          <p className="mt-1 text-sm text-white/75">
            {institute.name} · {institute.tagline}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
          <p className="mb-5 mt-0.5 text-sm text-slate-500">Use the phone number registered with the institute.</p>

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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-white/60">
            Demo accounts — tap to fill
          </p>
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const meta = roleMeta[account.role]
              const Icon = meta.icon
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => useDemo(account)}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.99]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{account.label}</span>
                    <span className="block truncate text-xs text-white/70">{meta.blurb}</span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] font-mono text-white/70">
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
