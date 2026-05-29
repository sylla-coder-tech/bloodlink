import styles from './Card.module.css'

export default function Card({ children, className = '', onClick, ...props }) {
  return <div className={`${styles.card} ${className}`} onClick={onClick} {...props}>{children}</div>
}
