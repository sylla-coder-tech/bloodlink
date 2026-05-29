import { useState, useEffect, useRef, useCallback } from 'react'
import apiClient from '../services/apiClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function useMessages(interlocuteurId) {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const sseRef = useRef(null)
  const pollRef = useRef(null)
  const sseOkRef = useRef(false)

  const fetchMessages = useCallback(async (id = interlocuteurId) => {
    if (!id || id === 'new' || id === 'cnts') return
    try {
      const { data } = await apiClient.get(`/messages/${id}`)
      setMessages(data.messages || [])
      window.dispatchEvent(new Event('messages:read'))
    } catch { /* silencieux */ }
  }, [interlocuteurId])

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations')
      setConversations(data.conversations || [])
      return data.conversations || []
    } catch { return [] }
  }, [])

  // SSE avec fallback polling 3s
  useEffect(() => {
    if (!interlocuteurId || interlocuteurId === 'new' || interlocuteurId === 'cnts') return

    const token = localStorage.getItem('bl_token')

    // Tentative SSE
    try {
      const es = new EventSource(`${API_URL}/messages/stream?token=${token}`)
      sseRef.current = es
      sseOkRef.current = false

      es.onopen = () => { sseOkRef.current = true }

      es.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse(e.data)
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          fetchConversations()
          window.dispatchEvent(new Event('messages:read'))
        } catch { /* ignore */ }
      })

      es.onerror = () => {
        es.close()
        sseOkRef.current = false
        // Fallback polling 3s
        if (!pollRef.current) {
          pollRef.current = setInterval(() => {
            fetchMessages()
            fetchConversations()
          }, 3000)
        }
      }
    } catch {
      // SSE non supporté → polling direct
      pollRef.current = setInterval(() => {
        fetchMessages()
        fetchConversations()
      }, 3000)
    }

    return () => {
      sseRef.current?.close()
      sseRef.current = null
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [interlocuteurId, fetchMessages, fetchConversations])

  // Chargement initial
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchConversations(), fetchMessages()])
      setLoading(false)
    }
    init()
  }, [interlocuteurId])

  const sendMessage = useCallback(async ({ destinataireId, destinataireType, contenu }) => {
    if (!contenu.trim()) return

    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id: tempId,
      contenu,
      created_at: new Date().toISOString(),
      expediteur_type: destinataireType === 'admin' ? 'user' : 'structure',
      _pending: true
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await apiClient.post('/messages', {
        ...(destinataireId ? { destinataire_id: destinataireId } : {}),
        destinataire_type: destinataireType,
        contenu
      })
      // Remplacer l'optimistic par les vrais messages
      await fetchMessages()
      await fetchConversations()
    } catch (err) {
      // Annuler l'optimistic en cas d'erreur
      setMessages(prev => prev.filter(m => m.id !== tempId))
      throw err
    }
  }, [fetchMessages, fetchConversations])

  return { messages, conversations, loading, sendMessage, fetchMessages, fetchConversations }
}
