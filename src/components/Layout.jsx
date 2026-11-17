import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInstitute, unreadCount } from '../data/db'
import { LogoutIcon } from './Icons'
import Logo from './Logo'
import InstallPrompt from './InstallPrompt'
import Tour, { tourKey } from './Tour'

const roleLabel = {
  student: 'Student',
  parent: 'Parent',
  admin: 'Admin',
}

function Badge({ n }) {
  if (!n) return null
  return (
    <span className="animate-pop absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-ink bg-bubble px-1 font-mono text-[9px] font-bold leading-none text-ink">
      {n > 9 ? '9+' : n}
    </span>
  )
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

  const [touring, setTouring] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(tourKey(user))) {
        const t = setTimeout(() => setTouring(true), 500)
        return () => clearTimeout(t)
      }
    } catch {
      /* storage unavailable: skip the automatic tour */
    }
  }, [user])
  const closeTour = () => {
    try {
      localStorage.setItem(tourKey(user), new Date().toISOString())
    } catch {
      /* ignore */
    }
    setTouring(false)
  }

  const end = (to) => to.split('/').length <= 2

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-full flex-col bg-cream">
      <header className="safe-top sticky top-0 z-30 border-b-2 border-ink bg-cream">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <span className="md:hidden">
            <Logo size={34} />
          </span>
          <span className="hidden md:block">
            <Logo size={38} />
          </span>

          {/* desktop links */}
          <nav className="ml-4 hidden flex-1 items-center gap-1.5 md:flex" aria-label="Main">
            {nav.map(({ to, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                data-tour={to}
                end={end(to)}
                className={({ isActive }) =>
                  `relative rounded-md border-2 px-3.5 py-1.5 text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'border-ink bg-lime text-ink shadow-pop-sm'
                      : 'border-transparent text-ink/70 hover:border-ink hover:bg-white hover:text-ink'
                  }`
                }
              >
                {label}
                {badge === 'notifications' && <Badge n={unread} />}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <div className="hidden min-w-0 text-right leading-tight sm:block">
              <p className="truncate text-sm font-bold text-ink">{user.name}</p>
              <p className="truncate font-mono text-[10px] font-medium uppercase tracking-wider text-ink/60">
                {roleLabel[user.role]} / {institute.name}
              </p>
            </div>
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md border-2 border-ink bg-bubble font-display text-sm font-extrabold text-ink shadow-pop-sm"
              title={`${user.name} (${roleLabel[user.role]})`}
            >
              {initials}
            </div>
            <button
              onClick={() => setTouring(true)}
              data-tour="tour-help"
              className="grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-white font-display text-lg font-extrabold text-ink transition hover:bg-lime active:translate-x-px active:translate-y-px"
              aria-label="Show app tour"
              title="App tour"
            >
              ?
            </button>
            <button
              onClick={signOut}
              className="grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-white text-ink transition hover:bg-lime active:translate-x-px active:translate-y-px"
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Keying on the path replays the entrance animation on every navigation. */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-32 md:pb-12">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>

      <InstallPrompt />
      {touring && <Tour role={user.role} onClose={closeTour} />}

      {/* mobile tab bar */}
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-cream md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-2">
          {nav.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              data-tour={to}
              end={end(to)}
              className={({ isActive }) =>
                `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md border-2 px-1 py-1.5 text-[10.5px] font-bold transition-all duration-150 ${
                  isActive
                    ? 'border-ink bg-lime text-ink shadow-pop-sm'
                    : 'border-transparent text-ink/65 active:bg-white'
                }`
              }
            >
              <span className="relative">
                <Icon className="h-[21px] w-[21px]" />
                {badge === 'notifications' && <Badge n={unread} />}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
