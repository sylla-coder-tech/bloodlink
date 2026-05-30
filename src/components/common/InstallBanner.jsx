import { useState, useEffect, useRef } from 'react'
import styles from './InstallBanner.module.css'

const DISMISSED_KEY = 'bl_install_dismissed'

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const promptRef = useRef(null)

  useEffect(() => {
    // Ne pas afficher si déjà installé en mode standalone
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isInstalled) return

    // Ne pas afficher si déjà fermé
    if (localStorage.getItem(DISMISSED_KEY)) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Capturer le prompt natif Android/Chrome
    const handler = (e) => {
      e.preventDefault()
      promptRef.current = e
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setVisible(false))

    // Afficher sur mobile directement, sur desktop attendre le prompt
    if (isMobile || ios) {
      setVisible(true)
    } else {
      // Desktop : afficher seulement si le prompt natif arrive
      const desktopHandler = (e) => {
        e.preventDefault()
        promptRef.current = e
        setVisible(true)
      }
      window.addEventListener('beforeinstallprompt', desktopHandler)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        window.removeEventListener('beforeinstallprompt', desktopHandler)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (promptRef.current) {
      promptRef.current.prompt()
      const { outcome } = await promptRef.current.userChoice
      promptRef.current = null
      if (outcome === 'accepted') setVisible(false)
    } else {
      setVisible(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="banner">
      <div className={styles.icon}>🩸</div>
      <div className={styles.text}>
        <strong>Installer BloodLink</strong>
        <span>
          {isIOS
            ? 'Appuyez sur ⎙ puis "Sur l\'écran d\'accueil"'
            : 'Installez l\'app pour un accès rapide'}
        </span>
      </div>
      {!isIOS && (
        <button className={styles.btnInstall} onClick={handleInstall}>
          Installer
        </button>
      )}
      <button className={styles.btnClose} onClick={handleDismiss} aria-label="Fermer">✕</button>
    </div>
  )
}
