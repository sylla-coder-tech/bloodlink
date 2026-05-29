import { useState, useEffect } from 'react'
import styles from './Alert.module.css'

export default function Alert({ 
  type = 'info', 
  message, 
  onClose,
  autoClose = true,
  duration = 4000,
  icon = null
}) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`${styles.alert} ${styles[`alert-${type}`]}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{message}</span>
      {!autoClose && (
        <button 
          className={styles.close}
          onClick={() => {
            setIsVisible(false)
            onClose?.()
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
