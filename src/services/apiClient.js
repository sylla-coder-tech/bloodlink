import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // envoie le cookie HttpOnly automatiquement
})

// Intercepteur 401 — rediriger vers login (sauf pour /auth/me et /auth/login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const is401 = error.response?.status === 401
    const isAuthRoute = url.includes('/auth/me') || url.includes('/auth/login')

    if (is401 && !isAuthRoute && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
