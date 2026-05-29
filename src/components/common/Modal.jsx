import styles from './Modal.module.css'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={`${styles.modal} ${styles[`modal-${size}`]}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <h2>{title}</h2>
          <button className={styles['modal-close']} onClick={onClose}>✕</button>
        </div>
        <div className={styles['modal-body']}>
          {children}
        </div>
      </div>
    </div>
  )
}
