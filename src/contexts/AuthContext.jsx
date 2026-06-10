import { createContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export const AuthContext = createContext()

const CACHE_KEY = 'bl_session'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && Date.now() - c.ts < CACHE_TTL) return c
    return null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const cached = readCache()
  const [user, setUser]       = useState(cached?.user || null)
  const [role, setRole]       = useState(cached?.role || null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    // Si cache valide (<5 min), pas besoin de revalider côté serveur
    if (cached) { setLoading(false); return }

    apiClient.get('/auth/me')
      .then(({ data }) => {
        if (data.success) {
          setUser(data.user)
          setRole(data.role)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ user: data.user, role: data.role, ts: Date.now() }))
        } else {
          localStorage.removeItem(CACHE_KEY)
        }
      })
      .catch(() => {
        localStorage.removeItem(CACHE_KEY)
        setUser(null)
        setRole(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, _token, userRole) => {
    setUser(userData)
    setRole(userRole)
    localStorage.setItem(CACHE_KEY, JSON.stringify({ user: userData, role: userRole, ts: Date.now() }))
  }

  const logout = async () => {
    try { await apiClient.post('/auth/logout') } catch (_) {}
    setUser(null)
    setRole(null)
    localStorage.removeItem(CACHE_KEY)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token: null,  // plus exposé en JS
      role,
      loading,
      isLoggedIn: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
