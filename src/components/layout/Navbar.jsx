import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { NotificationService } from '../../services'
import styles from './Navbar.module.css'

export default function Navbar({ onMenuClick }) {
  const { user, logout, role } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [nonLues, setNonLues] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    if (role !== 'donneur') return
    loadNotifications()
    // Polling toutes les 60s
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [role])

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifications = async () => {
    try {
      const { data } = await NotificationService.getAll()
      setNotifications(data.notifications || [])
      setNonLues(data.nonLues || 0)
    } catch {
      // silencieux — pas critique
    }
  }

  const handleOpenNotifs = async () => {
    setShowNotifs(o => !o)
    if (!showNotifs && nonLues > 0) {
      try {
        await NotificationService.marquerLues()
        setNonLues(0)
        setNotifications(prev => prev.map(n => ({ ...n, lue: true })))
      } catch { /* silencieux */ }
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <button className={styles.burger} onClick={onMenuClick}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={styles.logo} onClick={() => window.location.href = '/'}>
          <div className={styles['logo-icon']}>🩸</div>
          <span>BloodLink</span>
        </div>
      </div>

      <div className={styles.right}>
        {role === 'donneur' && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={handleOpenNotifs} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', position: 'relative', padding: '4px'
            }}>
              🔔
              {nonLues > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'var(--red)', color: 'white',
                  borderRadius: '50%', width: '16px', height: '16px',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {nonLues > 9 ? '9+' : nonLues}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: '40px',
                width: '320px', background: 'white',
                border: '1px solid var(--border)', borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
                maxHeight: '360px', overflowY: 'auto'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px' }}>
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                    Aucune notification
                  </p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: n.lue ? 'white' : '#FFF5F5',
                      fontSize: '13px'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>{n.titre}</strong>
                      <span style={{ color: 'var(--text2)' }}>{n.contenu}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles['user-menu']}>
          <div className={styles.avatar}>{(user?.prenom || user?.nom)?.[0]}</div>
          <span className={styles['user-name']}>{user?.prenom || user?.nom}</span>
        </div>
        <button className={styles['btn-logout']} onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
