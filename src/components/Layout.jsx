import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInstitute, unreadCount } from '../data/db'
import { LogoutIcon } from './Icons'
import InstallPrompt from './InstallPrompt'

const roleLabel = {
  student: 'Student',
  parent: 'Parent',
  admin: 'Administration',
}

export default function Layout({ nav }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const institute = getInstitute()
  const unread = unreadCount(user)

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-full flex-col bg-slate-100">
      <header className="safe-top sticky top-0 z-30 border-b border-slate-900/5 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">
              {roleLabel[user.role]} · {institute.name}
            </p>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28">
        <Outlet />
      </main>

      <InstallPrompt />

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-900/5 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition ${
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={`h-[22px] w-[22px] ${isActive ? 'stroke-[2.1]' : ''}`} />
                    {badge === 'notifications' && unread > 0 && (
                      <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
