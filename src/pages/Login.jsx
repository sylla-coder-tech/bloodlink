import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthService } from '../services'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await AuthService.login(email, password)
      const { data } = response
      
      // Le backend retourne: { success, role, token, user }
      // Pas { user: { role } }
      login(data.user, data.token, data.role)

      if (data.role === 'donneur') {
        navigate('/donneur')
      } else if (data.role === 'structure') {
        if (data.user?.statut_validation === 'en_attente') {
          setError('⏳ Votre compte est en attente de validation par l\'administrateur. Vous pouvez accéder à l\'application mais certaines fonctionnalités seront limitées.')
        }
        navigate('/structure')
      } else if (data.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      const code = err.response?.data?.code
      if (code === 'COMPTE_REJETE') {
        setError('❌ Votre inscription a été rejetée par le CNTS. Contactez-nous pour plus d\'informations.')
      } else if (code === 'COMPTE_SUSPENDU') {
        setError('⏸️ Votre compte a été suspendu par le CNTS. Contactez-nous pour régulariser votre situation.')
      } else {
        setError(err.response?.data?.message || 'Erreur de connexion')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles['logo-icon']}>🩸</div>
          <h1>BloodLink</h1>
        </div>
        <p>Partager du sang, c'est partager la vie</p>
      </div>

      <div className={styles.right}>
        <Card className={styles.card}>
          <div className={styles['card-header']}>
            <h2>Connexion</h2>
            <p>Connectez-vous à votre compte</p>
          </div>

          {error && <div className={styles.alert}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="vous@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button variant="primary" size="lg" block disabled={loading} type="submit">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className={styles.divider}>ou</div>

          <p className={styles.footer}>
            Pas de compte ? <Link to="/register">S'inscrire</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
