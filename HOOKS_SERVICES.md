# Custom Hooks Documentation

## useAuth()

Hook personnalisé pour accéder au contexte d'authentification.

### Utilisation

```jsx
import { useAuth } from '@/hooks/useAuth'

export default function MonComposant() {
  const { user, token, role, loading, isLoggedIn, login, logout } = useAuth()

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Bienvenue, {user?.firstName}!</p>
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <p>Pas connecté</p>
      )}
    </div>
  )
}
```

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `user` | Object \| null | Données utilisateur |
| `token` | String \| null | JWT token |
| `role` | String \| null | Rôle (donneur, structure, admin) |
| `loading` | Boolean | En cours de chargement? |
| `isLoggedIn` | Boolean | Utilisateur connecté? |
| `login` | Function | Connexion |
| `logout` | Function | Déconnexion |

### Exemple complet

```jsx
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <h1>Bienvenue, {user?.firstName}</h1>
      <p>Rôle: {role}</p>
      <button onClick={handleLogout}>Déconnexion</button>
    </div>
  )
}
```

## Services API

### AuthService

```jsx
import { AuthService } from '@/services'

// Login
const { data } = await AuthService.login(email, password)

// Register
const { data } = await AuthService.register(userData)

// Logout
AuthService.logout()
```

### DonneurService

```jsx
import { DonneurService } from '@/services'

// Get profile
const { data } = await DonneurService.getProfile()

// Update profile
const { data } = await DonneurService.updateProfile(profileData)

// Get requests
const { data } = await DonneurService.getRequests()

// Respond to request
const { data } = await DonneurService.respondRequest(requestId, status)
```

### StructureService

```jsx
import { StructureService } from '@/services'

// Get profile
const { data } = await StructureService.getProfile()

// Get demands
const { data } = await StructureService.getDemands()

// Create demand
const { data } = await StructureService.createDemand(demandData)

// Update demand
const { data } = await StructureService.updateDemand(id, demandData)
```

### DemandService

```jsx
import { DemandService } from '@/services'

// Get all
const { data } = await DemandService.getAll(filters)

// Get by ID
const { data } = await DemandService.getById(id)

// Create
const { data } = await DemandService.create(demandData)

// Update
const { data } = await DemandService.update(id, demandData)

// Delete
await DemandService.delete(id)

// Respond
const { data } = await DemandService.respond(demandId, responseData)
```

### AdminService

```jsx
import { AdminService } from '@/services'

// Get stats
const { data } = await AdminService.getStats()

// Get users
const { data } = await AdminService.getUsers()

// Block user
await AdminService.blockUser(userId)

// Unblock user
await AdminService.unblockUser(userId)
```

## Exemple d'utilisation complète

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DonneurService } from '@/services'

export default function MonRequetes() {
  const { user, isLoggedIn } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) return

    const loadRequests = async () => {
      try {
        setLoading(true)
        const { data } = await DonneurService.getRequests()
        setRequests(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [isLoggedIn])

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      <h1>Mes requêtes</h1>
      {requests.map((req) => (
        <div key={req.id}>
          <h3>{req.typeBlood}</h3>
          <p>{req.description}</p>
        </div>
      ))}
    </div>
  )
}
```

## Gestion des erreurs

```jsx
try {
  const { data } = await DonneurService.getProfile()
} catch (error) {
  if (error.response?.status === 401) {
    // Token expiré - redirection automatique vers login
    console.log('Session expirée')
  } else if (error.response?.status === 404) {
    console.log('Ressource non trouvée')
  } else {
    console.log('Erreur:', error.message)
  }
}
```

---

**Dernière mise à jour**: 9 mai 2026
