import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export function useUnreadMessages(intervalMs = 30000) {
  const [unread, setUnread] = useState(0)

  const fetch = async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations')
      const conversations = data.conversations || []
      const total = conversations.reduce((sum, c) => sum + (c.non_lus || 0), 0)
      setUnread(total)
    } catch {
      // silencieux
    }
  }

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, intervalMs)
    window.addEventListener('messages:read', fetch)
    return () => {
      clearInterval(id)
      window.removeEventListener('messages:read', fetch)
    }
  }, [])

  return unread
}
