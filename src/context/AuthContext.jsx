import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { initDb, login as apiLogin, logout as apiLogout, subscribe } from '../data/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  // Bumped on every DB write so consumers re-render with fresh data.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      // Restores the session from the saved token, if it is still valid.
      const saved = await initDb()
      if (cancelled) return
      if (saved) setUser(saved)
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
      async login(loginId, password) {
        try {
          const found = await apiLogin(loginId, password)
          setUser(found)
          return { ok: true, user: found }
        } catch (err) {
          return { ok: false, error: err.message }
        }
      },
      logout() {
        setUser(null)
        apiLogout()
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

