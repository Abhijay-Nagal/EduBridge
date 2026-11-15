import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_ACCOUNTS } from '../data/seed'
import { getInstitute, requestPasswordReset, resetPassword } from '../data/db'
import { GraduationIcon, ShieldIcon, UsersIcon } from '../components/Icons'
import Logo from '../components/Logo'

const roleMeta = {
  student: { icon: GraduationIcon },
  parent: { icon: UsersIcon },
  admin: { icon: ShieldIcon },
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
  const [forgot, setForgot] = useState(false)
  const [notice, setNotice] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const result = await login(loginId, password)
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
    <div className="safe-top safe-bottom relative flex min-h-full flex-col justify-center overflow-hidden bg-brand-300 px-4 py-10">
      <div className="relative mx-auto w-full max-w-md">
        <div className="animate-slide-up mb-6 flex justify-center">
          <Logo size={52} />
        </div>

        {forgot ? (
          <ForgotPassword
            initialLoginId={loginId}
            onCancel={() => setForgot(false)}
            onDone={(id) => {
              setForgot(false)
              setLoginId(id)
              setPassword('')
              setError('')
              setNotice('Password updated. Sign in with your new password.')
            }}
          />
        ) : (
        <form
          onSubmit={submit}
          className="animate-slide-up rounded-lg border-2 border-ink bg-cream p-6 shadow-pop"
          style={{ animationDelay: '0.18s' }}
        >
          <h2 className="font-display text-3xl font-extrabold text-ink">Sign in</h2>
          <p className="mb-5 mt-1 text-sm text-ink/65">
            Use your registered phone number.
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
            <p className="animate-pop mb-4 rounded-md border-2 border-ink bg-bubble px-3 py-2.5 text-sm font-bold text-ink">
              {error}
            </p>
          )}

          {notice && !error && (
            <p className="animate-pop mb-4 rounded-md border-2 border-ink bg-lime px-3 py-2.5 text-sm font-bold text-ink">
              {notice}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <button
            type="button"
            className="mt-3 w-full text-center text-sm font-semibold text-ink underline decoration-2 underline-offset-4 hover:bg-lime"
            onClick={() => {
              setError('')
              setNotice('')
              setForgot(true)
            }}
          >
            Forgot password?
          </button>
        </form>
        )}

        <div className="animate-slide-up mt-8" style={{ animationDelay: '0.26s' }}>
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
            Demo accounts
          </p>
          <div className="stagger grid gap-3">
            {DEMO_ACCOUNTS.map((account, i) => {
              const meta = roleMeta[account.role]
              const Icon = meta.icon
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => useDemo(account)}
                  className={`group flex items-center gap-3 rounded-lg border-2 border-ink p-3 text-left text-ink shadow-pop-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop active:translate-x-px active:translate-y-px ${
                    ['bg-lime', 'bg-bubble', 'bg-white'][i % 3]
                  }`}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="min-w-0 flex-1 font-display text-lg font-extrabold">{account.label}</span>
                  <span className="shrink-0 text-right font-mono text-[11px] font-medium">
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

// Two steps: ask for a reset code, then enter it with a new password. The code
// goes to the institute admin, who passes it on — there is no SMS gateway.
function ForgotPassword({ initialLoginId, onCancel, onDone }) {
  const [step, setStep] = useState('request')
  const [loginId, setLoginId] = useState(initialLoginId)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (step === 'request') {
      run(async () => {
        await requestPasswordReset(loginId.trim())
        setStep('reset')
      })
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    run(async () => {
      await resetPassword(loginId.trim(), code, password)
      onDone(loginId.trim())
    })
  }

  return (
    <form onSubmit={submit} className="animate-slide-up rounded-lg border-2 border-ink bg-cream p-6 shadow-pop">
      <h2 className="font-display text-3xl font-extrabold text-ink">Reset password</h2>
      <p className="mb-5 mt-1 text-sm text-ink/65">
        {step === 'request'
          ? 'Enter your registered phone number to request a 6-digit reset code.'
          : 'Request sent. Ask the institute admin for your reset code — it is valid for 15 minutes.'}
      </p>

      <div className="mb-4">
        <label className="label" htmlFor="resetLoginId">
          Phone number
        </label>
        <input
          id="resetLoginId"
          className="input"
          inputMode="numeric"
          autoComplete="username"
          placeholder="9000000010"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          disabled={step === 'reset'}
          required
        />
      </div>

      {step === 'reset' && (
        <>
          <div className="mb-4">
            <label className="label" htmlFor="resetCode">
              Reset code
            </label>
            <input
              id="resetCode"
              className="input font-mono tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </>
      )}

      {error && (
        <p className="animate-pop mb-4 rounded-md border-2 border-ink bg-bubble px-3 py-2.5 text-sm font-bold text-ink">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={busy}>
        {busy ? 'Please wait…' : step === 'request' ? 'Request reset code' : 'Set new password'}
      </button>

      <div className="mt-3 flex justify-between text-sm font-semibold">
        <button type="button" className="text-ink/70 hover:text-ink" onClick={onCancel}>
          Back to sign in
        </button>
        {step === 'reset' && (
          <button
            type="button"
            className="text-ink underline decoration-2 underline-offset-4 hover:bg-lime"
            disabled={busy}
            onClick={() => run(() => requestPasswordReset(loginId.trim()))}
          >
            Send a new code
          </button>
        )}
      </div>
    </form>
  )
}
