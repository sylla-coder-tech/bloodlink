import styles from './Input.module.css'

export default function Input({
  label,
  error,
  hint,
  type = 'text',
  required = false,
  ...props
}) {
  return (
    <div className={styles['form-group']}>
      {label && (
        <label className={styles['form-label']}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        type={type}
        className={`${styles['form-input']} ${error ? styles.error : ''}`}
        {...props}
      />
      {error && <div className={styles['form-error']}>{error}</div>}
      {hint && <div className={styles['form-hint']}>{hint}</div>}
    </div>
  )
}
