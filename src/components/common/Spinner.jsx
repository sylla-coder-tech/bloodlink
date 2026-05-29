import styles from './Spinner.module.css'

export default function Spinner({ size = 'md', color = 'red' }) {
  return <div className={`${styles.spinner} ${styles[`spinner-${size}`]} ${styles[`spinner-${color}`]}`}></div>
}
