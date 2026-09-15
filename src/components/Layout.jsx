import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInstitute, unreadCount } from '../data/db'
import { LogoutIcon } from './Icons'
import { LogoMark } from './Logo'
import InstallPrompt from './InstallPrompt'
import AnimatedBackground from './AnimatedBackground'

const roleLabel = {
  student: 'Student',
  parent: 'Parent',
  admin: 'Administration',
}

export default function Layout({ nav }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const institute = getInstitute()
  const unread = unreadCount(user)

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200">
      <AnimatedBackground />

      <header className="safe-top sticky top-0 z-30 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <LogoMark size={34} className="shrink-0 drop-shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">
              {roleLabel[user.role]} · {institute.name}
            </p>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
        <div className="accent-rule h-[2px] w-full" />
      </header>

      {/* Keying on the path replays the entrance animation on every navigation. */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>

      <InstallPrompt />

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-900/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 2}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 px-1 pb-2.5 pt-3 text-[11px] font-semibold transition-all duration-200 ${
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* active pill behind the icon */}
                  <span
                    className={`absolute inset-x-2 top-1.5 -z-10 h-9 rounded-xl bg-brand-50 transition-all duration-300 ${
                      isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                    }`}
                  />
                  <span className="relative">
                    <Icon
                      className={`h-[22px] w-[22px] transition-transform duration-300 ${
                        isActive ? '-translate-y-0.5 scale-110 stroke-[2.2]' : ''
                      }`}
                    />
                    {badge === 'notifications' && unread > 0 && (
                      <span className="animate-pop absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
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
