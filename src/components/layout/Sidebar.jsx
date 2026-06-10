import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'
import styles from './Sidebar.module.css'

export default function Sidebar({ isOpen, onClose, items }) {
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}></div>
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {items.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <div className={styles['sidebar-section']}>{section.label}</div>
            )}
            {section.items.map((item) => {
              const isActive = item.path === '/donneur' || item.path === '/structure' || item.path === '/admin'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles['sidebar-item']} ${isActive ? styles.active : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={styles.badge}>{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Bouton déconnexion visible uniquement sur mobile */}
        <div className={styles['logout-mobile']}>
          <button className={styles['btn-logout']} onClick={handleLogout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
