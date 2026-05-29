import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)

  // Initialiser depuis localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('bl_token')
    const storedRole = localStorage.getItem('bl_role')
    const storedUser = localStorage.getItem('bl_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setRole(storedRole)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, authToken, userRole) => {
    localStorage.setItem('bl_token', authToken)
    localStorage.setItem('bl_role', userRole)
    localStorage.setItem('bl_user', JSON.stringify(userData))
    
    setToken(authToken)
    setRole(userRole)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('bl_token')
    localStorage.removeItem('bl_role')
    localStorage.removeItem('bl_user')
    
    setToken(null)
    setRole(null)
    setUser(null)
  }

  const isLoggedIn = !!token
  
  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      loading,
      isLoggedIn,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
