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

    // Ne pas afficher si fermé dans cette session
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Capturer le prompt natif si disponible (Chrome/Edge/Android)
    const handler = (e) => {
      e.preventDefault()
      promptRef.current = e
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setVisible(false))

    // Afficher la bannière immédiatement (pas besoin d'attendre l'événement)
    setVisible(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (promptRef.current) {
      // Prompt natif disponible → déclencher l'installation directe
      promptRef.current.prompt()
      const { outcome } = await promptRef.current.userChoice
      promptRef.current = null
      if (outcome === 'accepted') setVisible(false)
    } else {
      // Pas de prompt natif → ouvrir le menu du navigateur (instruction)
      setVisible(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1')
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
