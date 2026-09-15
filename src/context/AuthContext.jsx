import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authenticate, initDb, refreshOverdueFees, subscribe } from '../data/db'

const SESSION_KEY = 'edubridge-session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  // Bumped on every DB write so consumers re-render with fresh data.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      await initDb()
      await refreshOverdueFees()
      if (cancelled) return

      try {
        const saved = sessionStorageSafe.get(SESSION_KEY)
        if (saved) setUser(JSON.parse(saved))
      } catch {
        // Corrupt or blocked storage — start logged out.
      }
      setReady(true)
    }

    boot()
    const unsubscribe = subscribe(() => setRevision((r) => r + 1))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      ready,
      user,
      revision,
      login(loginId, password) {
        const found = authenticate(loginId, password)
        if (!found) return { ok: false, error: 'Incorrect phone number or password.' }
        setUser(found)
        sessionStorageSafe.set(SESSION_KEY, JSON.stringify(found))
        return { ok: true, user: found }
      },
      logout() {
        setUser(null)
        sessionStorageSafe.remove(SESSION_KEY)
      },
      refresh() {
        setRevision((r) => r + 1)
      },
    }),
    [ready, user, revision],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// localStorage can throw in private windows or when site data is blocked.
const sessionStorageSafe = {
  get(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}
