import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Rôles autorisés par préfixe de route
const ROUTE_ROLES = {
  '/donneur': 'donneur',
  '/structure': 'structure',
  '/admin': 'admin'
}

export default function PrivateRoute({ children }) {
  const { isLoggedIn, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Chargement...</div>
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Vérifier que le rôle correspond à la route demandée
  const requiredRole = Object.entries(ROUTE_ROLES).find(([prefix]) =>
    location.pathname.startsWith(prefix)
  )?.[1]

  if (requiredRole && role !== requiredRole) {
    // Rediriger vers le bon dashboard selon le rôle réel
    const redirectMap = { donneur: '/donneur', structure: '/structure', admin: '/admin' }
    return <Navigate to={redirectMap[role] || '/login'} replace />
  }

  return children
}
