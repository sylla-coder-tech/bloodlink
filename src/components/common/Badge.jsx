import styles from './Badge.module.css'

export default function Badge({ variant = 'gray', children, className = '' }) {
  return <span className={`${styles.badge} ${styles[`badge-${variant}`]} ${className}`}>{children}</span>
}
