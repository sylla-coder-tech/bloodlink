import { useState, useEffect, useRef } from 'react'
import { useMessages } from '../../hooks/useMessages'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import styles from './Messages.module.css'

export default function DonneurMessages() {
  const [adminId, setAdminId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const { messages, conversations, loading, sendMessage, fetchConversations } = useMessages(adminId)

  // Sélectionner automatiquement la conv admin existante
  useEffect(() => {
    if (!adminId && conversations.length > 0) {
      const adminConv = conversations.find(c => c.interlocuteur_type === 'admin')
      if (adminConv) setAdminId(adminConv.interlocuteur_id)
    }
  }, [conversations, adminId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    const text = newMessage
    setNewMessage('')
    try {
      await sendMessage({
        destinataireId: adminId !== 'new' ? adminId : null,
        destinataireType: 'admin',
        contenu: text
      })
      // Après le premier envoi, récupérer l'ID admin réel
      if (!adminId || adminId === 'new') {
        const convs = await fetchConversations()
        const adminConv = convs.find(c => c.interlocuteur_type === 'admin')
        if (adminConv) setAdminId(adminConv.interlocuteur_id)
      }
    } catch {
      setNewMessage(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className={styles['page-header']}>
        <h1>Messagerie CNTS 💬</h1>
        <p>Communication directe avec le Centre National de Transfusion Sanguine</p>
      </div>

      <div className={`${styles['messages-container']} ${adminId ? styles['chat-open'] : ''}`}>
        <div className={styles['conversations-list']}>
          <h3>Conversations</h3>
          {loading ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Chargement...</p>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Aucune conversation</p>
              <Button variant="primary" size="sm" style={{ marginTop: '8px' }} onClick={() => setAdminId('new')}>
                💬 Contacter le CNTS
              </Button>
            </div>
          ) : (
            conversations.map(conv => (
              <Card
                key={conv.interlocuteur_id}
                className={styles['conversation-card']}
                onClick={() => setAdminId(conv.interlocuteur_id)}
                style={{
                  cursor: 'pointer',
                  background: adminId === conv.interlocuteur_id ? 'var(--bg2)' : 'var(--bg1)',
                  border: adminId === conv.interlocuteur_id ? '2px solid var(--red)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🏥</span>
                    <div>
                      <strong style={{ fontSize: '13px' }}>CNTS</strong>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text3)' }}>Centre National de Transfusion Sanguine</p>
                    </div>
                  </div>
                  {conv.non_lus > 0 && (
                    <span style={{ background: 'var(--red)', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '11px' }}>
                      {conv.non_lus}
                    </span>
                  )}
                </div>
                {conv.dernier_message && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text3)' }}>
                    {conv.dernier_message.substring(0, 55)}{conv.dernier_message.length > 55 ? '...' : ''}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>

        <div className={styles['chat-area']}>
          {adminId ? (
            <>
              <div className={styles['chat-header']}>
                <button className={styles['mobile-back']} onClick={() => setAdminId(null)}>← Retour</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🏥</span>
                  <div>
                    <h3 style={{ margin: 0 }}>CNTS</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>Centre National de Transfusion Sanguine</p>
                  </div>
                </div>
              </div>

              <div className={styles['messages-list']}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                    <p>Aucun message. Commencez la conversation.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.expediteur_type !== 'admin'
                    const senderName = msg.expediteur_type === 'admin'
                      ? (msg.expediteur_nom || 'CNTS')
                      : `${msg.expediteur_prenom || ''} ${msg.expediteur_nom || ''}`.trim() || 'Moi'
                    return (
                      <div
                        key={msg.id}
                        className={`${styles['message']} ${isMine ? styles['message-sent'] : styles['message-received']}`}
                        style={msg._pending ? { opacity: 0.6 } : {}}
                      >
                        <div className={styles['message-content']}>
                          <span style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '3px', opacity: 0.8 }}>
                            {senderName}
                          </span>
                          <p>{msg.contenu}</p>
                          <span className={styles['message-time']}>
                            {msg._pending ? 'Envoi...' : new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className={styles['message-form']}>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message au CNTS..."
                  disabled={sending}
                />
                <Button type="submit" variant="primary" disabled={sending || !newMessage.trim()}>
                  {sending ? 'Envoi...' : 'Envoyer'}
                </Button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <div style={{ fontSize: '48px' }}>💬</div>
              <p style={{ color: 'var(--text3)' }}>Sélectionnez une conversation ou contactez le CNTS</p>
              <Button variant="primary" onClick={() => setAdminId('new')}>💬 Contacter le CNTS</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
