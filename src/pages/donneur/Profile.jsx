import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { DonneurService } from '../../services'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Alert from '../../components/common/Alert'
import styles from './Profile.module.css'

export default function DonneurProfile() {
  const { user, login, token, role } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    groupe_sanguin: user?.groupe_sanguin || 'O+',
    commune: user?.commune || '',
    quartier: user?.quartier || '',
    disponibilite: user?.disponibilite !== false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        commune: formData.commune,
        quartier: formData.quartier,
        disponibilite: formData.disponibilite
      }
      const { data } = await DonneurService.updateProfile(payload)
      // Mettre à jour le contexte sans recharger la page
      const updatedUser = data.donneur || data.user || { ...user, ...payload }
      login(updatedUser, token, role)
      setAlert({ type: 'success', message: '✅ Profil mis à jour avec succès!' })
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur:', err)
      setAlert({ type: 'error', message: err.response?.data?.message || '❌ Erreur lors de la mise à jour' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose duration={3000} />
      )}

      <div className={styles['page-header']}>
        <h1>Mon profil 👤</h1>
        <p>Gère tes informations personnelles</p>
      </div>

      <div className={styles['profile-grid']}>
        <Card className={styles['profile-card']}>
          <div className={styles['profile-header']}>
            <div className={styles.avatar}>{user?.prenom?.[0]}</div>
            <div>
              <h3>{user?.prenom} {user?.nom}</h3>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className={styles['profile-stats']}>
            <div>
              <span className={styles.value}>{formData.groupe_sanguin}</span>
              <span className={styles.label}>Groupe</span>
            </div>
            <div>
              <span className={styles.value}>{formData.disponibilite ? '✅' : '⏸️'}</span>
              <span className={styles.label}>Statut</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </Card>

        {isEditing ? (
          <Card className={styles['edit-card']}>
            <h3>Modifier mes informations</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles['form-row']}>
                <Input label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} required />
                <Input label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
              </div>

              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} disabled />
              <Input label="Téléphone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} />

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label>Type de sang</label>
                  <select name="groupe_sanguin" value={formData.groupe_sanguin} onChange={handleChange} className={styles['form-select']}>
                    {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input label="Commune" name="commune" value={formData.commune} onChange={handleChange} />
              <Input label="Quartier" name="quartier" value={formData.quartier} onChange={handleChange} />

              <div className={styles['form-group']}>
                <label>
                  <input type="checkbox" name="disponibilite" checked={formData.disponibilite} onChange={handleChange} />
                  {' '}Je suis disponible pour donner du sang
                </label>
              </div>

              <Button variant="primary" block type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className={styles['info-card']}>
            <h3>Informations</h3>
            <div className={styles['info-row']}>
              <span className={styles.label}>Téléphone:</span>
              <span>{formData.telephone || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Type de sang:</span>
              <span>{formData.groupe_sanguin}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Quartier:</span>
              <span>{formData.quartier || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Commune:</span>
              <span>{formData.commune || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Statut:</span>
              <span className={styles.status}>{formData.disponibilite ? '✅ Disponible' : '⏸️ Indisponible'}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
