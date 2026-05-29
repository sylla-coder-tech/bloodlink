import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthService } from '../services'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'
import styles from './Register.module.css'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    structureName: '',
    email: '',
    password: '',
    confirmPassword: '',
    bloodType: 'O+',
    role: 'donneur',
    phone: '',
    commune: '',
    quartier: '',
    sexe: 'Masculin',
    responsable: '',
    structureType: 'Hôpital national'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const response = await AuthService.register(formData)
      const { data } = response
      
      // Le backend retourne: { success, message, token, donneur/structure }
      const user = data.donneur || data.structure
      const role = data.donneur ? 'donneur' : 'structure'
      
      if (!user || !data.token) {
        // Inscription réussie mais pas d'auto-login (ex: validation email requise)
        navigate('/login')
        return
      }
      
      login(user, data.token, role)
      
      if (role === 'donneur') {
        navigate('/donneur')
      } else if (role === 'structure') {
        navigate('/structure')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles['card-header']}>
          <h2>S'inscrire</h2>
          <p>Créez votre compte BloodLink</p>
        </div>

        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {formData.role === 'structure' ? (
            <Input
              label="Nom de la structure"
              placeholder="Clinique Centrale de Conakry"
              name="structureName"
              value={formData.structureName}
              onChange={handleChange}
              required
            />
          ) : (
            <div className={styles['form-row']}>
              <Input
                label="Prénom"
                placeholder="Jean"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="vous@example.com"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Téléphone"
            type="tel"
            placeholder="+224..."
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label className={styles['form-label']}>Commune</label>
              <select
                name="commune"
                value={formData.commune}
                onChange={handleChange}
                className={styles['form-select']}
                required
              >
                <option value="">Sélectionner une commune</option>
                <option value="Kaloum">Kaloum</option>
                <option value="Dixinn">Dixinn</option>
                <option value="Matam">Matam</option>
                <option value="Ratoma">Ratoma</option>
                <option value="Matoto">Matoto</option>
              </select>
            </div>
            <Input
              label="Quartier"
              placeholder="Centre"
              name="quartier"
              value={formData.quartier}
              onChange={handleChange}
            />
          </div>

          <div className={styles['form-row']}>
            {formData.role === 'donneur' && (
              <>
                <div className={styles['form-group']}>
                  <label className={styles['form-label']}>Sexe</label>
                  <select
                    name="sexe"
                    value={formData.sexe}
                    onChange={handleChange}
                    className={styles['form-select']}
                  >
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>

                <div className={styles['form-group']}>
                  <label className={styles['form-label']}>Type de sang</label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className={styles['form-select']}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </>
            )}

            <div className={styles['form-group']}>
              <label className={styles['form-label']}>Je suis...</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={styles['form-select']}
              >
                <option value="donneur">Donneur</option>
                <option value="structure">Structure médicale</option>
              </select>
            </div>
          </div>

          {formData.role === 'structure' && (
            <>
              <div className={styles['form-group']}>
                <label className={styles['form-label']}>Type de structure</label>
                <select
                  name="structureType"
                  value={formData.structureType}
                  onChange={handleChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="Hôpital national">Hôpital national</option>
                  <option value="Hôpital préfectoral">Hôpital préfectoral</option>
                  <option value="Clinique privée">Clinique privée</option>
                  <option value="Centre de santé communautaire">Centre de santé communautaire</option>
                  <option value="Banque de sang (CNTS)">Banque de sang (CNTS)</option>
                  <option value="Maternité">Maternité</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <Input
                label="Responsable"
                placeholder="Nom du responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
              />
            </>
          )}

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button variant="primary" size="lg" block disabled={loading} type="submit">
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </form>

        <p className={styles.footer}>
          Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </Card>
    </div>
  )
}
