import { createContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export const AuthContext = createContext()

const CACHE_KEY = 'bl_session'

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const cached = readCache()
  const [user, setUser]       = useState(cached?.user || null)
  const [role, setRole]       = useState(cached?.role || null)
  const [loading, setLoading] = useState(!cached) // pas de loading si cache présent

  // Vérifier la session en arrière-plan (silencieux si cache présent)
  useEffect(() => {
    apiClient.get('/auth/me')
      .then(({ data }) => {
        if (data.success) {
          setUser(data.user)
          setRole(data.role)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ user: data.user, role: data.role }))
        } else {
          setUser(null)
          setRole(null)
          localStorage.removeItem(CACHE_KEY)
        }
      })
      .catch(() => {
        // Si pas de cache, on n'est pas connecté
        if (!cached) { setUser(null); setRole(null) }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, _token, userRole) => {
    setUser(userData)
    setRole(userRole)
    localStorage.setItem(CACHE_KEY, JSON.stringify({ user: userData, role: userRole }))
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
