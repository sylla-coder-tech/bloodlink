import styles from './Button.module.css'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  block = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${block ? styles.block : ''}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
