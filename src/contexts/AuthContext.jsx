import { createContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurer la session au démarrage via le cookie HttpOnly
  useEffect(() => {
    apiClient.get('/auth/me')
      .then(({ data }) => {
        if (data.success) {
          setUser(data.user)
          setRole(data.role)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, _token, userRole) => {
    // Le token JWT est dans un cookie HttpOnly — plus de localStorage
    setUser(userData)
    setRole(userRole)
  }

  const logout = async () => {
    try { await apiClient.post('/auth/logout') } catch (_) {}
    setUser(null)
    setRole(null)
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
