import { useState, useRef, useEffect } from 'react'
import { IAService } from '../../services'
import styles from './AIAssistant.module.css'

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Bonjour ! Je suis l\'assistant BloodLink. Comment puis-je vous aider ?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      // Envoyer l'historique complet (sauf le message de bienvenue initial)
      const historique = newMessages.slice(1)
      const { data } = await IAService.chat(msg, historique)
      setMessages(prev => [...prev, { role: 'assistant', text: data.reponse || 'Je ne peux pas répondre pour le moment.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'L\'assistant est momentanément indisponible. Réessayez dans quelques instants.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.dot} />
              <span>Assistant BloodLink 🤖</span>
            </div>
            <button className={styles.close} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.bot}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className={`${styles.msg} ${styles.bot}`}>
                <span className={styles.typing}>●●●</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Posez votre question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button className={styles.send} onClick={send} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button className={styles.fab} onClick={() => setOpen(o => !o)} title="Assistant IA">
        {open ? '✕' : '🤖'}
      </button>
    </div>
  )
}
